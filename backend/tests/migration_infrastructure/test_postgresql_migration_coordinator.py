from __future__ import annotations

import os
import shutil
import subprocess
import sys
import importlib.util
import uuid
from pathlib import Path

import pytest
from alembic.autogenerate import compare_metadata
from alembic import command
from alembic.config import Config
from alembic.migration import MigrationContext
from alembic.script import ScriptDirectory
from alembic.operations import Operations
from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    JSON,
    MetaData,
    String,
    Table,
    create_engine,
    event,
    inspect,
    text,
)
from sqlalchemy.engine import make_url
from sqlalchemy.pool import NullPool

from app.database import database as database_module
from app.core.config import settings
from app.database.migration_infrastructure.migration_coordinator import (
    MigrationCoordinationError,
    acquire_postgresql_migration_ownership,
)
from app.database.migration_infrastructure.epoch_control import (
    EpochTransition,
    EpochTransitionState,
    create_epoch_control_schema,
    record_epoch_transition,
    validate_epoch_audit,
)
from app.database.migration_preflight import (
    _compare_server_default,
    compare_model_schema,
)
from app.database.migration_state import MigrationStateError
from app.database.migration_infrastructure.schema_manifest import (
    build_schema_manifest,
)
import run_migrations


BACKEND_ROOT = Path(__file__).resolve().parents[2]
_POSTGRESQL_TEST_URL = os.environ.get("QUBIRA_TEST_POSTGRESQL_URL", "")
_POSTGRESQL_TEST_URL_OBJ = (
    make_url(_POSTGRESQL_TEST_URL) if _POSTGRESQL_TEST_URL else None
)
_SAFE_TEST_TARGET = (
    _POSTGRESQL_TEST_URL_OBJ is not None
    and _POSTGRESQL_TEST_URL_OBJ.host in {"127.0.0.1", "localhost", "::1"}
    and (_POSTGRESQL_TEST_URL_OBJ.database or "").startswith("qubira_test_")
)

pytestmark = pytest.mark.skipif(
    not _SAFE_TEST_TARGET,
    reason=(
        "Set QUBIRA_TEST_POSTGRESQL_URL to a disposable loopback database "
        "whose name starts with qubira_test_."
    ),
)


def test_postgresql_lock_excludes_competitor_and_releases_after_success() -> None:
    assert _POSTGRESQL_TEST_URL_OBJ is not None
    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        assert owner.is_active
        assert isinstance(owner.connection.engine.pool, NullPool)
        owner.assert_connection(owner.connection)
        with pytest.raises(MigrationCoordinationError, match="already held"):
            with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ):
                pytest.fail("A competing process must not acquire the migration lock.")

    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        assert owner.is_active


def test_postgresql_ownership_verifies_database_identity_and_backend_pid() -> None:
    assert _POSTGRESQL_TEST_URL_OBJ is not None
    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        database_name, user_name, backend_pid = owner.connection.execute(
            text("SELECT current_database(), current_user, pg_backend_pid()")
        ).one()
        assert database_name == owner.database_identity[2]
        assert user_name == owner.database_identity[3]
        assert backend_pid == owner.backend_pid

        identity = owner.database_identity
        owner.database_identity = (
            identity[0],
            identity[1],
            "qubira_test_wrong_identity",
            identity[3],
        )
        with pytest.raises(MigrationCoordinationError, match="different database identity"):
            owner.assert_connection(owner.connection)
        owner.database_identity = identity

        pid = owner.backend_pid
        owner.backend_pid = pid + 1
        with pytest.raises(MigrationCoordinationError, match="changed its server session"):
            owner.assert_connection(owner.connection)
        owner.backend_pid = pid
        owner.assert_connection(owner.connection)


def test_postgresql_lock_releases_after_migration_exception() -> None:
    assert _POSTGRESQL_TEST_URL_OBJ is not None
    with pytest.raises(RuntimeError, match="synthetic migration failure"):
        with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ):
            raise RuntimeError("synthetic migration failure")

    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ):
        pass


def test_postgresql_ownership_rejects_a_different_sqlalchemy_connection() -> None:
    assert _POSTGRESQL_TEST_URL_OBJ is not None
    other_engine = create_engine(
        _POSTGRESQL_TEST_URL_OBJ,
        poolclass=NullPool,
    )
    try:
        with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
            with other_engine.connect() as other_connection:
                with pytest.raises(
                    MigrationCoordinationError,
                    match="not using its active ownership connection",
                ):
                    owner.assert_connection(other_connection)
    finally:
        other_engine.dispose()


def test_alembic_uses_the_owned_postgresql_connection(
    tmp_path: Path,
    monkeypatch,
) -> None:
    assert _POSTGRESQL_TEST_URL_OBJ is not None
    script_dir = tmp_path / "synthetic_alembic"
    versions_dir = script_dir / "versions"
    versions_dir.mkdir(parents=True)
    shutil.copyfile(
        BACKEND_ROOT / "alembic" / "env.py",
        script_dir / "env.py",
    )
    (versions_dir / "phase32e_probe.py").write_text(
        """
from alembic import op
import sqlalchemy as sa

revision = "phase32e_probe"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    connection = op.get_bind()
    backend_pid = connection.execute(sa.text("SELECT pg_backend_pid()")).scalar_one()
    op.create_table(
        "phase32e_connection_probe",
        sa.Column("backend_pid", sa.Integer(), primary_key=True),
    )
    connection.execute(
        sa.text("INSERT INTO phase32e_connection_probe (backend_pid) VALUES (:pid)"),
        {"pid": backend_pid},
    )

def downgrade():
    raise RuntimeError("The disposable connection probe is forward-only.")
""",
        encoding="utf-8",
    )

    config = Config()
    config.set_main_option("script_location", str(script_dir).replace("%", "%%"))
    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        monkeypatch.setattr(database_module, "engine", owner.connection.engine)
        monkeypatch.setattr(settings, "DATABASE_URL", str(_POSTGRESQL_TEST_URL_OBJ))
        monkeypatch.setattr(
            settings,
            "MIGRATION_DATABASE_URL",
            str(_POSTGRESQL_TEST_URL_OBJ),
        )
        config.attributes["connection"] = owner.connection
        config.attributes["migration_ownership"] = owner
        migration_connections = []

        def capture_migration_connection(
            connection,
            _cursor,
            statement,
            _parameters,
            _context,
            _executemany,
        ):
            if "create table phase32e_connection_probe" in statement.lower():
                migration_connections.append(connection)

        event.listen(
            owner.connection.engine,
            "before_cursor_execute",
            capture_migration_connection,
        )
        try:
            command.upgrade(config, "phase32e_probe")
        finally:
            event.remove(
                owner.connection.engine,
                "before_cursor_execute",
                capture_migration_connection,
            )

        assert migration_connections == [owner.connection]
        stored_backend_pid = owner.connection.execute(
            text("SELECT backend_pid FROM phase32e_connection_probe")
        ).scalar_one()
        assert stored_backend_pid == owner.backend_pid
        owner.connection.commit()
        owner.assert_connection(owner.connection)
        owner.connection.commit()


def test_schema_preflight_uses_the_owned_postgresql_connection() -> None:
    assert _POSTGRESQL_TEST_URL_OBJ is not None
    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        used_connections = []

        def capture_connection(connection, *_args):
            used_connections.append(connection)

        event.listen(
            owner.connection.engine,
            "before_cursor_execute",
            capture_connection,
        )
        try:
            compare_model_schema(owner.connection)
        finally:
            event.remove(
                owner.connection.engine,
                "before_cursor_execute",
                capture_connection,
            )

        assert used_connections
        assert all(connection is owner.connection for connection in used_connections)
        owner.assert_connection(owner.connection)
        owner.connection.commit()


def test_empty_postgresql_legacy_database_refuses_without_bootstrap() -> None:
    assert _POSTGRESQL_TEST_URL_OBJ is not None
    schema_name = f"qubira_test_empty_{uuid.uuid4().hex}"
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    script = ScriptDirectory.from_config(config)
    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        owner.connection.execute(
            text(f'CREATE SCHEMA "{schema_name}"')
        )
        owner.connection.commit()
        owner.connection.execute(text(f'SET search_path TO "{schema_name}"'))
        owner.connection.commit()
        statements: list[str] = []

        def capture_sql(
            _connection,
            _cursor,
            statement,
            _parameters,
            _context,
            _executemany,
        ):
            statements.append(statement.strip().lower())

        event.listen(owner.connection.engine, "before_cursor_execute", capture_sql)
        try:
            with pytest.raises(
                MigrationStateError,
                match="no supported fresh-install baseline",
            ):
                run_migrations._run_migrations_on_connection(
                    owner.connection,
                    config,
                    script,
                    owner,
                    {},
                )
        finally:
            event.remove(
                owner.connection.engine,
                "before_cursor_execute",
                capture_sql,
            )
            if owner.connection.in_transaction():
                owner.connection.rollback()
            owner.connection.execute(text("SET search_path TO public"))
            owner.connection.execute(text(f'DROP SCHEMA "{schema_name}" CASCADE'))
            owner.connection.commit()

        assert not any(
            statement.startswith("create table")
            or statement.startswith("insert into alembic_version")
            for statement in statements
        )


def test_json_comparison_and_index_adoption_are_non_destructive() -> None:
    assert _POSTGRESQL_TEST_URL_OBJ is not None
    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        connection = owner.connection
        connection.exec_driver_sql(
            "CREATE TABLE assessment_question_submissions ("
            "id varchar(36) PRIMARY KEY, user_id varchar(36), "
            "created_at timestamp without time zone)"
        )
        connection.exec_driver_sql(
            "CREATE INDEX ix_assessment_q_sub_user_created "
            "ON assessment_question_submissions (user_id, created_at)"
        )
        connection.exec_driver_sql(
            "CREATE TABLE phase32e_json_probe ("
            "id integer PRIMARY KEY, payload json NOT NULL DEFAULT '{}'::json)"
        )
        connection.commit()

        metadata = MetaData()
        Table(
            "assessment_question_submissions",
            metadata,
            Column("id", String(36), primary_key=True),
            Column("user_id", String(36)),
            Column("created_at", DateTime),
        )
        Table(
            "phase32e_json_probe",
            metadata,
            Column("id", Integer, primary_key=True),
            Column("payload", JSON, nullable=False, server_default=text("'{}'")),
        )
        executed_statements: list[str] = []

        def capture_sql(
            _connection,
            _cursor,
            statement,
            _parameters,
            _context,
            _executemany,
        ):
            executed_statements.append(statement.lower())

        event.listen(connection.engine, "before_cursor_execute", capture_sql)
        try:
            differences = compare_metadata(
                MigrationContext.configure(
                    connection,
                    opts={"compare_server_default": _compare_server_default},
                ),
                metadata,
            )
        finally:
            event.remove(connection.engine, "before_cursor_execute", capture_sql)

        assert not any("json = " in statement for statement in executed_statements)
        assert any(
            difference[0] == "remove_index"
            and getattr(difference[1], "name", None)
            == "ix_assessment_q_sub_user_created"
            for difference in differences
        )
        assert not any("drop index" in statement for statement in executed_statements)

        revision_path = (
            BACKEND_ROOT
            / "alembic"
            / "versions"
            / "c9b0f2d5a713_adopt_assessment_submission_index.py"
        )
        spec = importlib.util.spec_from_file_location(
            "phase32e_index_migration",
            revision_path,
        )
        assert spec is not None and spec.loader is not None
        migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration)
        with Operations.context(MigrationContext.configure(connection)):
            migration.upgrade()
        index_names = {
            index["name"]
            for index in inspect(connection).get_indexes(
                "assessment_question_submissions"
            )
        }
        assert "ix_assessment_q_sub_user_created" in index_names
        with Operations.context(MigrationContext.configure(connection)):
            migration.downgrade()
        index_names_after_downgrade = {
            index["name"]
            for index in inspect(connection).get_indexes(
                "assessment_question_submissions"
            )
        }
        assert "ix_assessment_q_sub_user_created" in index_names_after_downgrade
        connection.rollback()


def test_postgresql_manifest_captures_catalog_objects_and_is_stable() -> None:
    assert _POSTGRESQL_TEST_URL_OBJ is not None
    schema_name = f"qubira_test_manifest_{uuid.uuid4().hex}"
    reference_table = f"phase32k_reference_{uuid.uuid4().hex}"
    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        connection = owner.connection
        connection.execute(text(f'CREATE SCHEMA "{schema_name}"'))
        connection.execute(
            text(f'CREATE TABLE public."{reference_table}" (id integer PRIMARY KEY)')
        )
        connection.execute(
            text(f'CREATE TYPE "{schema_name}".mood AS ENUM (\'ready\', \'running\')')
        )
        connection.execute(
            text(
                f'CREATE DOMAIN "{schema_name}".positive_int AS integer '
                "CHECK (VALUE > 0)"
            )
        )
        connection.execute(
            text(
                f'CREATE TABLE "{schema_name}".catalog_items ('
                f'id integer PRIMARY KEY, '
                f'metric "{schema_name}".positive_int NOT NULL, '
                f'mood "{schema_name}".mood NOT NULL, title text)'
            )
        )
        connection.execute(
            text(
                f'CREATE INDEX ix_phase32k_catalog_title ON "{schema_name}".catalog_items '
                '(lower(title)) WHERE title IS NOT NULL'
            )
        )
        connection.execute(
            text(
                f'ALTER TABLE "{schema_name}".catalog_items ENABLE ROW LEVEL SECURITY'
            )
        )
        connection.execute(
            text(
                f'CREATE POLICY catalog_positive ON "{schema_name}".catalog_items '
                'USING (metric > 0) WITH CHECK (metric > 0)'
            )
        )
        connection.execute(
            text(
                f'CREATE MATERIALIZED VIEW "{schema_name}".catalog_summary AS '
                f'SELECT mood, count(*) AS item_count '
                f'FROM "{schema_name}".catalog_items GROUP BY mood'
            )
        )
        connection.execute(
            text(
                f'CREATE UNIQUE INDEX ix_phase32k_catalog_summary '
                f'ON "{schema_name}".catalog_summary (mood)'
            )
        )
        connection.execute(
            text(
                f'CREATE TABLE "{schema_name}".partitioned_items ('
                'id integer NOT NULL, payload text) PARTITION BY RANGE (id)'
            )
        )
        connection.execute(
            text(
                f'CREATE TABLE "{schema_name}".partitioned_items_low '
                f'PARTITION OF "{schema_name}".partitioned_items '
                'FOR VALUES FROM (0) TO (100)'
            )
        )
        connection.execute(
            text(f'CREATE TABLE "{schema_name}".inheritance_parent (id integer)')
        )
        connection.execute(
            text(
                f'CREATE TABLE "{schema_name}".inheritance_child () '
                f'INHERITS ("{schema_name}".inheritance_parent)'
            )
        )
        connection.execute(
            text(
                f'CREATE TABLE "{schema_name}".external_refs ('
                f'id integer PRIMARY KEY, external_id integer REFERENCES '
                f'public."{reference_table}" (id))'
            )
        )
        connection.execute(
            text(f'CREATE SEQUENCE "{schema_name}".catalog_sequence')
        )
        connection.execute(
            text(
                f'ALTER SEQUENCE "{schema_name}".catalog_sequence '
                f'OWNED BY "{schema_name}".catalog_items.id'
            )
        )
        connection.execute(
            text(
                f"CREATE FUNCTION \"{schema_name}\".manifest_probe() "
                "RETURNS integer LANGUAGE sql IMMUTABLE AS 'SELECT 1'"
            )
        )
        connection.execute(
            text(
                f"CREATE FUNCTION \"{schema_name}\".manifest_trigger() "
                "RETURNS trigger LANGUAGE plpgsql AS "
                "'BEGIN RETURN NEW; END'"
            )
        )
        connection.execute(
            text(
                f'CREATE TRIGGER phase32k_catalog_trigger BEFORE UPDATE '
                f'ON "{schema_name}".catalog_items FOR EACH ROW '
                f'EXECUTE FUNCTION "{schema_name}".manifest_trigger()'
            )
        )
        connection.execute(
            text(
                f'GRANT SELECT ON "{schema_name}".catalog_items TO PUBLIC'
            )
        )
        connection.execute(
            text(
                f'ALTER DEFAULT PRIVILEGES IN SCHEMA "{schema_name}" '
                'GRANT SELECT ON TABLES TO PUBLIC'
            )
        )
        connection.commit()

        try:
            first = build_schema_manifest(connection, schema=schema_name)
            second = build_schema_manifest(connection, schema=schema_name)

            assert first["sha256"] == second["sha256"]
            assert first["schema"] == schema_name
            assert first["types"]
            positive_domain = next(
                item for item in first["types"] if item["name"] == "positive_int"
            )
            assert positive_domain["kind"] == "d"
            assert positive_domain["domain_constraints"]
            mood = next(item for item in first["types"] if item["name"] == "mood")
            assert mood["enum_labels"] == ["ready", "running"]
            assert any("manifest_probe()" in item["name"] for item in first["routines"])
            assert any(
                item["name"] == "catalog_items.catalog_positive"
                for item in first["policies"]
            )
            assert {
                (item["enabled"], item["forced"])
                for item in first["row_security"]
                if item["name"] == "catalog_items"
            } == {(True, False)}
            assert any(
                item["table"] == "catalog_items"
                and item["name"] == "phase32k_catalog_trigger"
                for item in first["triggers"]
            )
            assert any(
                item["name"] == "catalog_summary.ix_phase32k_catalog_summary"
                and item["is_unique"]
                for item in first["materialized_view_indexes"]
            )
            assert any(
                item["name"] == "partitioned_items"
                for item in first["partitioned_tables"]
            )
            assert any(
                item["name"] == "partitioned_items_low"
                for item in first["partitions"]
            )
            assert not any(
                item["parent"] == "inheritance_parent"
                for item in first["partitions"]
            )
            assert any(
                item["owned_by_table"] == "catalog_items"
                and item["owned_by_column"] == "id"
                for item in first["sequences"]
            )
            assert any(
                item["grantee"] == "PUBLIC"
                and item["privilege_type"] == "SELECT"
                for item in first["privileges"]
            )
            assert any(
                item["schema"] == schema_name
                and item["object_kind"] == "relation"
                and item["grantee"] == "PUBLIC"
                and item["privilege_type"] == "SELECT"
                for item in first["default_privileges"]
            )
            assert any(
                item["referred_schema"] == "public"
                for item in first["cross_schema_foreign_keys"]
            )
            expression_index = next(
                item
                for table in first["tables"]
                if table["name"] == "catalog_items"
                for item in table["indexes"]
                if item["name"] == "ix_phase32k_catalog_title"
            )
            assert any("lower" in expression for expression in expression_index["expressions"])
            assert "postgresql_where" in expression_index["dialect_options"]
        finally:
            if connection.in_transaction():
                connection.rollback()
            connection.execute(text(f'DROP SCHEMA "{schema_name}" CASCADE'))
            connection.execute(text(f'DROP TABLE public."{reference_table}"'))
            connection.commit()


def test_postgresql_session_termination_releases_advisory_lock() -> None:
    assert _POSTGRESQL_TEST_URL
    process_code = """
import os
import sys
from app.database.migration_infrastructure.migration_coordinator import acquire_postgresql_migration_ownership
with acquire_postgresql_migration_ownership(os.environ["QUBIRA_TEST_POSTGRESQL_URL"]) as owner:
    print(f"READY {owner.backend_pid}", flush=True)
    sys.stdin.readline()
"""
    environment = os.environ.copy()
    environment["ENVIRONMENT"] = "staging"
    environment["DATABASE_URL"] = _POSTGRESQL_TEST_URL
    environment["ASYNC_DATABASE_URL"] = _POSTGRESQL_TEST_URL
    process = subprocess.Popen(
        [sys.executable, "-u", "-c", process_code],
        cwd=BACKEND_ROOT,
        env=environment,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    try:
        assert process.stdout is not None
        ready = process.stdout.readline().strip()
        assert ready.startswith("READY "), ready
        assert _POSTGRESQL_TEST_URL_OBJ is not None
        with pytest.raises(MigrationCoordinationError, match="already held"):
            with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ):
                pytest.fail("The parent acquired a lock held by the child.")

        process.terminate()
        process.wait(timeout=10)
        with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ):
            pass
    finally:
        if process.poll() is None:
            process.kill()
            process.wait(timeout=10)
        if process.stdin is not None:
            process.stdin.close()
        if process.stdout is not None:
            process.stdout.close()
        if process.stderr is not None:
            process.stderr.close()


def test_postgresql_epoch_control_ddl_and_durable_state_use_owned_connection() -> None:
    assert _POSTGRESQL_TEST_URL_OBJ is not None
    schema_name = f"qubira_epoch_test_{uuid.uuid4().hex}"
    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        owner.assert_connection(owner.connection)
        owner.connection.execute(text(f'CREATE SCHEMA "{schema_name}"'))
        owner.connection.execute(text(f'SET search_path TO "{schema_name}"'))
        owner.connection.commit()
        try:
            create_epoch_control_schema(owner.connection)
            owner.connection.commit()
            record_epoch_transition(
                owner.connection,
                EpochTransitionState.UNCLASSIFIED,
                EpochTransition(
                    to_state=EpochTransitionState.FRESH_PREFLIGHT,
                    idempotency_key="pg-preflight-1",
                    actor_role="test_operator",
                ),
            )
            owner.connection.commit()
            record_epoch_transition(
                owner.connection,
                EpochTransitionState.FRESH_PREFLIGHT,
                EpochTransition(
                    to_state=EpochTransitionState.STARTED,
                    idempotency_key="pg-start-1",
                    actor_role="test_operator",
                    plan_digest="a" * 64,
                    target_fingerprint_digest="b" * 64,
                    database_identity_digest="c" * 64,
                ),
            )
            owner.connection.commit()
            assert validate_epoch_audit(owner.connection) is EpochTransitionState.STARTED
            assert owner.connection.execute(
                text("SELECT COUNT(*) FROM qubira_epoch_audit")
            ).scalar_one() == 2
            owner.assert_connection(owner.connection)
            owner.connection.commit()
        finally:
            if owner.connection.in_transaction():
                owner.connection.rollback()
            owner.connection.execute(text("RESET search_path"))
            owner.connection.execute(text(f'DROP SCHEMA "{schema_name}" CASCADE'))
            owner.connection.commit()
