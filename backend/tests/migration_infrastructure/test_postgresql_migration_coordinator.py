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
from app.database.migration_preflight import (
    _compare_server_default,
    compare_model_schema,
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


def test_fresh_postgresql_schema_bootstrap_stamps_current_head(
    monkeypatch,
) -> None:
    assert _POSTGRESQL_TEST_URL_OBJ is not None
    schema_name = f"qubira_bootstrap_{uuid.uuid4().hex}"
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    script = ScriptDirectory.from_config(config)
    with acquire_postgresql_migration_ownership(_POSTGRESQL_TEST_URL_OBJ) as owner:
        monkeypatch.setattr(database_module, "engine", owner.connection.engine)
        monkeypatch.setattr(run_migrations, "engine", owner.connection.engine)
        monkeypatch.setattr(settings, "DATABASE_URL", str(_POSTGRESQL_TEST_URL_OBJ))
        monkeypatch.setattr(
            settings,
            "MIGRATION_DATABASE_URL",
            str(_POSTGRESQL_TEST_URL_OBJ),
        )
        owner.connection.execute(
            text(f'CREATE SCHEMA "{schema_name}"')
        )
        owner.connection.commit()
        owner.connection.execute(text(f'SET search_path TO "{schema_name}"'))
        owner.connection.commit()
        try:
            run_migrations._bootstrap_empty_postgresql_database(
                owner.connection,
                script,
                owner,
            )
            revision = owner.connection.execute(
                text("SELECT version_num FROM alembic_version")
            ).scalar_one()
            assert revision == script.get_current_head()
            assert compare_model_schema(owner.connection) == []
            owner.connection.commit()
        finally:
            if owner.connection.in_transaction():
                owner.connection.rollback()
            owner.connection.execute(text("SET search_path TO public"))
            owner.connection.execute(text(f'DROP SCHEMA "{schema_name}" CASCADE'))
            owner.connection.commit()


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
