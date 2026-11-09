from __future__ import annotations

from datetime import datetime

import pytest
from sqlalchemy import Boolean, Column, DateTime, JSON, MetaData, Table

from scripts.import_sqlite_to_postgres import (
    ImportValidationError,
    _adapt_value,
    _target_engine_from_environment,
)


def _column(column_type: object) -> Column[object]:
    return Table("sample", MetaData(), Column("value", column_type)).c.value


def test_importer_converts_sqlite_json_datetime_and_boolean_values() -> None:
    assert _adapt_value('{"enabled": true}', _column(JSON())) == {"enabled": True}
    assert _adapt_value(
        "2026-01-02 03:04:05",
        _column(DateTime()),
    ) == datetime(2026, 1, 2, 3, 4, 5)
    assert _adapt_value(1, _column(Boolean())) is True


def test_importer_rejects_invalid_json_without_echoing_source_value() -> None:
    with pytest.raises(ImportValidationError, match="Invalid JSON in sample.value"):
        _adapt_value("private payload", _column(JSON()))


def test_importer_requires_a_direct_postgresql_target(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv(
        "MIGRATION_DATABASE_URL",
        "postgresql+psycopg://user:password@example-pooler.neon.tech/neondb",
    )
    with pytest.raises(ImportValidationError, match="direct, unpooled"):
        _target_engine_from_environment()

    monkeypatch.setenv(
        "MIGRATION_DATABASE_URL",
        "postgresql+psycopg://user:password@example.neon.tech/neondb",
    )
    engine = _target_engine_from_environment()
    try:
        assert engine.dialect.name == "postgresql"
    finally:
        engine.dispose()
