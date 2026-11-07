from pathlib import Path

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.schema import DefaultClause

from app.database.migration_preflight import (
    _format_schema_difference,
    _read_only_engine,
    build_preflight_report,
)


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
        assert report["repository_head"] == "47292a2a50d2"
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
