from __future__ import annotations

from types import SimpleNamespace

from sqlalchemy import JSON, Column, MetaData, Table, text

from app.database.migration_preflight import _compare_server_default


def _column(column_type: object) -> Column[object]:
    return Table("sample", MetaData(), Column("payload", column_type)).c.payload


def test_postgresql_json_defaults_compare_json_values_without_database_equality() -> None:
    column = _column(JSON())
    context = SimpleNamespace(dialect=SimpleNamespace(name="postgresql"))

    equal = _compare_server_default(
        context,
        column,
        column,
        "'{}'::json",
        text("'{}'"),
        "'{}'",
    )
    different = _compare_server_default(
        context,
        column,
        column,
        "'{}'::json",
        text("'[]'"),
        "'[]'",
    )

    assert equal is False
    assert different is True


def test_unsupported_json_default_expression_fails_closed() -> None:
    column = _column(JSON())
    context = SimpleNamespace(dialect=SimpleNamespace(name="postgresql"))

    result = _compare_server_default(
        context,
        column,
        column,
        "json_build_object('key', 'value')",
        text("json_build_object('key', 'other')"),
        "json_build_object('key', 'other')",
    )

    assert result is True


def test_non_postgresql_json_default_uses_dialect_comparison() -> None:
    column = _column(JSON())
    context = SimpleNamespace(dialect=SimpleNamespace(name="sqlite"))

    result = _compare_server_default(
        context,
        column,
        column,
        "'{}'",
        text("'[]'"),
        "'[]'",
    )

    assert result is None
