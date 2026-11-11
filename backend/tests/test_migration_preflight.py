from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.schema import DefaultClause

from app.database.migration_preflight import (
    _apply_schema_compatibility_rules,
    _compare_model_schema,
    _format_schema_difference,
    _read_only_engine,
    build_preflight_report,
)
from app.database import migration_preflight
from app.models import Base
from app.models.assessment_engine import AssessmentQuestionSubmission
from app.modules.audit.model import AuditLog


def test_assessment_submission_composite_index_is_in_model_metadata():
    index = next(
        index
        for index in AssessmentQuestionSubmission.__table__.indexes
        if index.name == "ix_assessment_q_sub_user_created"
    )

    assert [column.name for column in index.columns] == ["user_id", "created_at"]
    assert index.unique is False


def test_audit_organization_index_matches_migration_definition():
    index = next(
        index
        for index in AuditLog.__table__.indexes
        if index.name == "ix_audit_logs_organization_id"
    )

    assert [column.name for column in index.columns] == [
        "organization_type",
        "organization_id",
    ]


def test_model_created_schema_matches_without_compatibility_exceptions():
    source_engine = create_engine("sqlite:///:memory:")
    try:
        Base.metadata.create_all(source_engine)
        with source_engine.connect() as connection:
            differences, compatibility_exceptions = _compare_model_schema(connection)

        assert differences == []
        assert compatibility_exceptions == []
    finally:
        source_engine.dispose()


def test_legacy_audit_organization_index_is_narrowly_allowlisted():
    source_engine = create_engine("sqlite:///:memory:")
    try:
        Base.metadata.create_all(source_engine)
        with source_engine.begin() as connection:
            connection.execute(text("DROP INDEX ix_audit_logs_organization_id"))
            connection.execute(
                text(
                    "CREATE INDEX ix_audit_logs_organization_id "
                    "ON audit_logs (organization_id)"
                )
            )

        with source_engine.connect() as connection:
            differences, compatibility_exceptions = _compare_model_schema(connection)

        assert differences == []
        assert compatibility_exceptions == [
            {
                "rule_id": "legacy_audit_organization_id_index",
                "schema": "public",
                "table": "audit_logs",
                "name": "ix_audit_logs_organization_id",
                "actual_columns": ["organization_id"],
                "model_columns": ["organization_type", "organization_id"],
                "reason": (
                    "The index layout does not change query results; the existing "
                    "organization_id index remains usable for the organization-scoped "
                    "lookup. This exception does not claim equivalent composite-index "
                    "performance."
                ),
            }
        ]
    finally:
        source_engine.dispose()


def test_unexpected_index_definition_remains_a_blocking_schema_difference():
    source_engine = create_engine("sqlite:///:memory:")
    try:
        Base.metadata.create_all(source_engine)
        with source_engine.begin() as connection:
            connection.execute(text("DROP INDEX ix_audit_logs_organization_id"))
            connection.execute(
                text(
                    "CREATE UNIQUE INDEX ix_audit_logs_organization_id "
                    "ON audit_logs (organization_id)"
                )
            )

        with source_engine.connect() as connection:
            differences, compatibility_exceptions = _compare_model_schema(connection)

        assert differences
        assert compatibility_exceptions == []
    finally:
        source_engine.dispose()


def test_invalid_postgresql_legacy_audit_index_remains_blocking(monkeypatch):
    monkeypatch.setattr(
        migration_preflight,
        "inspect",
        lambda _connection: SimpleNamespace(
            get_indexes=lambda _table, schema=None: [
                {
                    "name": "ix_audit_logs_organization_id",
                    "column_names": ["organization_id"],
                    "unique": False,
                    "dialect_options": {"postgresql_using": "btree"},
                }
            ]
        ),
    )
    connection = SimpleNamespace(
        dialect=SimpleNamespace(name="postgresql"),
        execute=Mock(
            return_value=SimpleNamespace(scalar_one_or_none=lambda: False)
        ),
    )
    differences = [
        {
            "operation": "remove_index",
            "table": "audit_logs",
            "name": "ix_audit_logs_organization_id",
            "columns": ["organization_id"],
        },
        {
            "operation": "add_index",
            "table": "audit_logs",
            "name": "ix_audit_logs_organization_id",
            "columns": ["organization_type", "organization_id"],
        },
    ]

    remaining, compatibility_exceptions = _apply_schema_compatibility_rules(
        connection, differences
    )

    assert remaining == differences
    assert compatibility_exceptions == []
    validity_query = str(connection.execute.call_args.args[0])
    assert "indisvalid" in validity_query
    assert "indisready" in validity_query
    assert "indislive" in validity_query
    assert "table_schema.nspname = :schema_name" in validity_query
    assert connection.execute.call_args.args[1]["schema_name"] == "public"


def test_valid_public_postgresql_legacy_audit_index_is_allowlisted(monkeypatch):
    observed_schemas = []
    monkeypatch.setattr(
        migration_preflight,
        "inspect",
        lambda _connection: SimpleNamespace(
            get_indexes=lambda table, schema=None: (
                observed_schemas.append((table, schema))
                or [
                    {
                        "name": "ix_audit_logs_organization_id",
                        "column_names": ["organization_id"],
                        "unique": False,
                        "dialect_options": {"postgresql_using": "btree"},
                    }
                ]
            )
        ),
    )
    connection = SimpleNamespace(
        dialect=SimpleNamespace(name="postgresql"),
        execute=Mock(
            return_value=SimpleNamespace(scalar_one_or_none=lambda: True)
        ),
    )
    differences = [
        {
            "operation": "remove_index",
            "table": "audit_logs",
            "name": "ix_audit_logs_organization_id",
            "columns": ["organization_id"],
        },
        {
            "operation": "add_index",
            "table": "audit_logs",
            "name": "ix_audit_logs_organization_id",
            "columns": ["organization_type", "organization_id"],
        },
    ]

    remaining, compatibility_exceptions = _apply_schema_compatibility_rules(
        connection, differences
    )

    assert remaining == []
    assert observed_schemas == [("audit_logs", "public")]
    assert compatibility_exceptions[0]["rule_id"] == (
        "legacy_audit_organization_id_index"
    )
    assert compatibility_exceptions[0]["schema"] == "public"


def test_legacy_named_index_outside_public_schema_remains_blocking(monkeypatch):
    legacy_index = {
        "name": "ix_audit_logs_organization_id",
        "column_names": ["organization_id"],
        "unique": False,
        "dialect_options": {"postgresql_using": "btree"},
    }
    inspector = SimpleNamespace(
        get_indexes=lambda _table, schema=None: (
            [legacy_index] if schema == "private" else []
        )
    )
    monkeypatch.setattr(migration_preflight, "inspect", lambda _connection: inspector)
    connection = SimpleNamespace(dialect=SimpleNamespace(name="postgresql"))
    differences = [
        {
            "operation": "remove_index",
            "table": "audit_logs",
            "name": "ix_audit_logs_organization_id",
            "columns": ["organization_id"],
        },
        {
            "operation": "add_index",
            "table": "audit_logs",
            "name": "ix_audit_logs_organization_id",
            "columns": ["organization_type", "organization_id"],
        },
    ]

    remaining, compatibility_exceptions = _apply_schema_compatibility_rules(
        connection, differences
    )

    assert remaining == differences
    assert compatibility_exceptions == []


def test_missing_required_audit_column_remains_blocking():
    source_engine = create_engine("sqlite:///:memory:")
    try:
        Base.metadata.create_all(source_engine)
        with source_engine.begin() as connection:
            connection.execute(text("DROP INDEX ix_audit_logs_organization_id"))
            connection.execute(
                text("ALTER TABLE audit_logs DROP COLUMN organization_type")
            )

        with source_engine.connect() as connection:
            differences, compatibility_exceptions = _compare_model_schema(connection)

        assert any(
            difference.get("operation") == "add_column"
            and difference.get("table") == "audit_logs"
            and difference.get("column") == "organization_type"
            for difference in differences
        )
        assert compatibility_exceptions == []
    finally:
        source_engine.dispose()


def test_full_preflight_accepts_legacy_index_without_writing_database(tmp_path: Path):
    database_path = tmp_path / "preflight-legacy-audit-index.db"
    source_engine = create_engine(f"sqlite:///{database_path.as_posix()}")
    try:
        Base.metadata.create_all(source_engine)
        with source_engine.begin() as connection:
            connection.execute(
                text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)")
            )
            connection.execute(
                text(
                    "INSERT INTO alembic_version (version_num) "
                    "VALUES ('d1f5a8e7c2b4')"
                )
            )
            connection.execute(text("DROP INDEX ix_audit_logs_organization_id"))
            connection.execute(
                text(
                    "CREATE INDEX ix_audit_logs_organization_id "
                    "ON audit_logs (organization_id)"
                )
            )

        before = database_path.read_bytes()
        report = build_preflight_report(source_engine)
        after = database_path.read_bytes()

        assert report["eligible_for_migration"] is True
        assert report["schema_difference_count"] == 0
        assert report["schema_differences"] == []
        assert report["schema_compatibility_exceptions"][0]["rule_id"] == (
            "legacy_audit_organization_id_index"
        )
        assert before == after
    finally:
        source_engine.dispose()


def test_preflight_still_rejects_an_unknown_revision(tmp_path: Path):
    database_path = tmp_path / "preflight-unknown-revision.db"
    source_engine = create_engine(f"sqlite:///{database_path.as_posix()}")
    try:
        Base.metadata.create_all(source_engine)
        with source_engine.begin() as connection:
            connection.execute(
                text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)")
            )
            connection.execute(
                text(
                    "INSERT INTO alembic_version (version_num) "
                    "VALUES ('unknown-revision')"
                )
            )

        report = build_preflight_report(source_engine)

        assert report["eligible_for_migration"] is False
        assert any(
            "not in the repository" in error
            for error in report["state_errors"]
        )
    finally:
        source_engine.dispose()


def test_sqlite_read_only_engine_rejects_writes(tmp_path: Path):
    database_path = tmp_path / "preflight-readonly.db"
    setup_engine = create_engine(f"sqlite:///{database_path.as_posix()}")
    try:
        with setup_engine.begin() as connection:
            connection.execute(text("CREATE TABLE sample (id INTEGER PRIMARY KEY)"))
    finally:
        setup_engine.dispose()

    source_engine = create_engine(f"sqlite:///{database_path.as_posix()}")
    readonly_engine = _read_only_engine(source_engine)
    try:
        with pytest.raises(OperationalError):
            with readonly_engine.begin() as connection:
                connection.execute(text("CREATE TABLE forbidden (id INTEGER PRIMARY KEY)"))
    finally:
        readonly_engine.dispose()
        source_engine.dispose()

    verify_engine = create_engine(f"sqlite:///{database_path.as_posix()}")
    try:
        with verify_engine.connect() as connection:
            table_names = set(connection.execute(
                text("SELECT name FROM sqlite_master WHERE type='table'")
            ).scalars())
        assert table_names == {"sample"}
    finally:
        verify_engine.dispose()


def test_schema_difference_formatter_preserves_current_and_desired_values():
    nullable = _format_schema_difference(
        ("modify_nullable", None, "sample", "enabled", {}, True, False)
    )
    column_type = _format_schema_difference(
        ("modify_type", None, "sample", "identifier", {}, "VARCHAR(36)", "INTEGER")
    )
    default = _format_schema_difference(
        (
            "modify_default",
            None,
            "sample",
            "category",
            {},
            DefaultClause(text("'internal'")),
            None,
        )
    )

    assert nullable == {
        "operation": "modify_nullable",
        "schema": None,
        "table": "sample",
        "column": "enabled",
        "current": True,
        "desired": False,
    }
    assert column_type["current"] == "VARCHAR(36)"
    assert column_type["desired"] == "INTEGER"
    assert default["current"] == "'internal'"
    assert default["desired"] is None


def test_preflight_reports_schema_differences_without_modifying_database(tmp_path: Path):
    database_path = tmp_path / "preflight-diff.db"
    source_engine = create_engine(f"sqlite:///{database_path.as_posix()}")
    try:
        with source_engine.begin() as connection:
            connection.execute(
                text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)")
            )
            connection.execute(
                text(
                    "INSERT INTO alembic_version (version_num) "
                    "VALUES ('47292a2a50d2')"
                )
            )
            connection.execute(text("CREATE TABLE users (id INTEGER PRIMARY KEY)"))

        before = database_path.read_bytes()
        report = build_preflight_report(source_engine)
        after = database_path.read_bytes()

        assert report["current_revision"] == "47292a2a50d2"
        assert report["repository_head"] == ScriptDirectory(
            str(Path(__file__).resolve().parents[1] / "alembic")
        ).get_heads()[0]
        assert report["schema_difference_count"] > 0
        assert all(
            isinstance(difference, dict) and "operation" in difference
            for difference in report["schema_differences"]
        )
        assert "object at 0x" not in repr(report["schema_differences"])
        assert report["eligible_for_migration"] is False
        assert before == after
    finally:
        source_engine.dispose()


def test_existing_placement_schema_is_reported_as_conflict_without_changes(tmp_path: Path):
    database_path = tmp_path / "preflight-placement.db"
    source_engine = create_engine(f"sqlite:///{database_path.as_posix()}")
    try:
        with source_engine.begin() as connection:
            connection.execute(
                text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)")
            )
            connection.execute(
                text(
                    "INSERT INTO alembic_version (version_num) "
                    "VALUES ('b8f2d4e6a901')"
                )
            )
            connection.execute(
                text(
                    "CREATE TABLE placement_companies "
                    "(id VARCHAR(36) PRIMARY KEY, name VARCHAR(160) NOT NULL)"
                )
            )
            connection.execute(
                text(
                    "INSERT INTO placement_companies (id, name) "
                    "VALUES ('fixture-company', 'Synthetic Fixture')"
                )
            )

        before = database_path.read_bytes()
        report = build_preflight_report(source_engine)
        after = database_path.read_bytes()

        assert report["current_revision"] == "b8f2d4e6a901"
        assert any(
            "create_table('placement_companies')" in conflict
            for conflict in report["pending_table_conflicts"]
        )
        assert report["eligible_for_migration"] is False
        assert before == after
    finally:
        source_engine.dispose()


def test_epoch_objects_block_legacy_preflight_without_database_changes(
    tmp_path: Path,
):
    database_path = tmp_path / "preflight-epoch-state.db"
    source_engine = create_engine(f"sqlite:///{database_path.as_posix()}")
    try:
        with source_engine.begin() as connection:
            connection.execute(
                text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)")
            )
            connection.execute(
                text(
                    "INSERT INTO alembic_version (version_num) "
                    "VALUES ('d1f5a8e7c2b4')"
                )
            )
            connection.execute(
                text("CREATE TABLE qubira_epoch_control (id INTEGER PRIMARY KEY)")
            )
            connection.execute(
                text("CREATE TABLE qubira_epoch_audit (id INTEGER PRIMARY KEY)")
            )
            connection.execute(
                text(
                    "CREATE TABLE alembic_version_epoch "
                    "(version_num VARCHAR(32) NOT NULL)"
                )
            )
            connection.execute(
                text(
                    "INSERT INTO alembic_version_epoch (version_num) "
                    "VALUES ('unverified-epoch-revision')"
                )
            )

        before = database_path.read_bytes()
        report = build_preflight_report(source_engine)
        after = database_path.read_bytes()

        assert any("epoch transition objects exist" in error for error in report["state_errors"])
        assert report["eligible_for_migration"] is False
        assert before == after
    finally:
        source_engine.dispose()
