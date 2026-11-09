from __future__ import annotations

import json

from sqlalchemy import create_engine, text
from sqlalchemy import event

from app.database.migration_infrastructure.schema_manifest import (
    build_schema_manifest,
    canonical_manifest_json,
    compare_schema_manifests,
    manifest_fingerprint,
)


def _create_disposable_schema(engine) -> None:
    with engine.begin() as connection:
        connection.execute(text("PRAGMA foreign_keys = ON"))
        connection.execute(
            text(
                "CREATE TABLE accounts ("
                "id INTEGER PRIMARY KEY, "
                "email VARCHAR(120) NOT NULL UNIQUE, "
                "created_at DATETIME DEFAULT CURRENT_TIMESTAMP, "
                "CHECK (length(email) > 0)"
                ")"
            )
        )
        connection.execute(
            text(
                "CREATE TABLE entries ("
                "id INTEGER PRIMARY KEY, "
                "account_id INTEGER NOT NULL, "
                "value TEXT NOT NULL, "
                "FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE"
                ")"
            )
        )
        connection.execute(
            text("CREATE INDEX ix_entries_account ON entries(account_id)")
        )
        connection.execute(
            text(
                "CREATE VIEW account_entries AS "
                "SELECT accounts.id, entries.value FROM accounts "
                "JOIN entries ON entries.account_id = accounts.id"
            )
        )
        connection.execute(
            text(
                "CREATE TRIGGER entries_value_insert "
                "BEFORE INSERT ON entries "
                "WHEN NEW.value = '' BEGIN "
                "SELECT RAISE(ABORT, 'value cannot be empty'); END"
            )
        )


def test_manifest_captures_schema_objects_and_stable_fingerprint(tmp_path) -> None:
    database_path = tmp_path / "manifest.db"
    engine = create_engine(f"sqlite:///{database_path}")
    try:
        _create_disposable_schema(engine)
        first = build_schema_manifest(engine)
        second = build_schema_manifest(engine)

        assert first["format_version"] == 2
        assert first["sha256"] == manifest_fingerprint(first)
        assert first["sha256"] == second["sha256"]
        assert canonical_manifest_json(first) == canonical_manifest_json(second)

        accounts = next(table for table in first["tables"] if table["name"] == "accounts")
        assert [column["name"] for column in accounts["columns"]] == [
            "id",
            "email",
            "created_at",
        ]
        assert accounts["primary_key"]["columns"] == ["id"]
        assert accounts["unique_constraints"]
        assert accounts["check_constraints"]

        entries = next(table for table in first["tables"] if table["name"] == "entries")
        assert entries["foreign_keys"][0]["options"]["ondelete"] == "CASCADE"
        assert entries["indexes"][0]["name"] == "ix_entries_account"
        assert first["views"][0]["name"] == "account_entries"
        assert first["triggers"][0]["name"] == "entries_value_insert"
        assert first["engine"]["sqlite"]["foreign_keys"] == 1
        assert first["types"] == []
        assert first["routines"] == []
        assert first["policies"] == []
        assert first["row_security"] == []
        assert first["materialized_view_indexes"] == []
        assert first["partitions"] == []
    finally:
        engine.dispose()


def test_manifest_uses_an_already_owned_connection_without_reconnecting(
    tmp_path,
) -> None:
    engine = create_engine(f"sqlite:///{tmp_path / 'owned-connection.db'}")
    connection_events = []
    try:
        with engine.connect() as connection:
            event.listen(
                engine,
                "connect",
                lambda *_args: connection_events.append("opened"),
            )
            manifest = build_schema_manifest(connection)
            assert manifest["engine"]["dialect"] == "sqlite"
            assert connection_events == []
    finally:
        engine.dispose()


def test_manifest_canonical_json_ignores_fingerprint_field() -> None:
    manifest = {"format_version": 1, "tables": [], "sha256": "stale"}
    assert json.loads(canonical_manifest_json(manifest)) == {
        "format_version": 1,
        "tables": [],
    }


def test_manifest_comparison_classifies_missing_extra_and_conflicting_objects(
    tmp_path,
) -> None:
    engine = create_engine(f"sqlite:///{tmp_path / 'compare.db'}")
    try:
        _create_disposable_schema(engine)
        expected = build_schema_manifest(engine)
        actual = json.loads(canonical_manifest_json(expected))
        accounts = next(table for table in actual["tables"] if table["name"] == "accounts")
        accounts["columns"][1]["type"] = "TEXT"
        actual["tables"].append(
            {
                "name": "unexpected",
                "columns": [],
                "primary_key": {"name": None, "columns": []},
                "foreign_keys": [],
                "unique_constraints": [],
                "check_constraints": [],
                "indexes": [],
            }
        )
        actual["views"] = []
        actual["policies"] = [
            {
                "schema": "main",
                "table": "entries",
                "name": "entries.policy",
                "permissive": "PERMISSIVE",
                "roles": ["test"],
                "command": "SELECT",
                "using_expression": None,
                "check_expression": None,
            }
        ]

        comparison = compare_schema_manifests(expected, actual)
        assert not comparison["compatible"]
        classifications = {
            item["classification"] for item in comparison["differences"]
        }
        assert classifications == {"conflict", "extra", "missing"}
    finally:
        engine.dispose()


def test_manifest_comparison_rejects_missing_or_unknown_sections(tmp_path) -> None:
    engine = create_engine(f"sqlite:///{tmp_path / 'incomplete.db'}")
    try:
        _create_disposable_schema(engine)
        expected = build_schema_manifest(engine)
        incomplete = json.loads(canonical_manifest_json(expected))
        del incomplete["policies"]
        incomplete["untracked_objects"] = []

        comparison = compare_schema_manifests(expected, incomplete)

        assert not comparison["compatible"]
        assert {
            item["path"] for item in comparison["differences"]
        } >= {"actual.policies", "actual.untracked_objects"}
    finally:
        engine.dispose()
