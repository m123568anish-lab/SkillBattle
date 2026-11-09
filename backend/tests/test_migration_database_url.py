from __future__ import annotations

import pytest

from app.core.config import settings
from app.database.migration_infrastructure.migration_coordinator import (
    MigrationCoordinationError,
)
from run_migrations import _migration_database_url


def test_direct_migration_url_overrides_pooled_runtime_url(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        settings,
        "DATABASE_URL",
        "postgresql+psycopg://user:password@example-pooler.neon.tech/neondb",
    )
    monkeypatch.setattr(
        settings,
        "MIGRATION_DATABASE_URL",
        "postgresql://user:password@example.neon.tech/neondb",
    )

    url = _migration_database_url()

    assert url.drivername == "postgresql+psycopg"
    assert url.host == "example.neon.tech"


def test_migration_runner_rejects_pooled_runtime_url_without_direct_url(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        settings,
        "DATABASE_URL",
        "postgresql+psycopg://user:password@example-pooler.neon.tech/neondb",
    )
    monkeypatch.setattr(settings, "MIGRATION_DATABASE_URL", "")

    with pytest.raises(MigrationCoordinationError, match="direct PostgreSQL connection"):
        _migration_database_url()
