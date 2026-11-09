import json
from pathlib import Path

import pytest
from alembic.config import Config
from alembic.script import ScriptDirectory

from app.core.monitoring import health
from app.core.monitoring.health import db_health


def expected_revisions():
    backend_dir = Path(__file__).resolve().parents[2]
    script = ScriptDirectory.from_config(
        Config(str(backend_dir / "alembic.ini"))
    )
    return sorted(script.get_heads())


@pytest.mark.asyncio
async def test_database_health_reports_current_migration_readiness(monkeypatch):
    head = expected_revisions()[0]
    monkeypatch.setattr(
        health,
        "build_preflight_report",
        lambda: {
            "eligible_for_migration": True,
            "current_revision": head,
            "repository_head": head,
            "schema_difference_count": 0,
            "state_errors": [],
        },
    )

    response = await db_health()

    assert response.status_code == 200
    payload = json.loads(response.body)
    assert payload == {
        "status": "ok",
        "database": "connected",
        "migration_status": "current",
        "connection_ready": True,
        "current_revision": head,
        "repository_head": head,
        "schema_difference_count": 0,
        "state_error_count": 0,
    }


@pytest.mark.asyncio
async def test_database_health_marks_outdated_migrations_not_ready(monkeypatch):
    head = expected_revisions()[0]
    monkeypatch.setattr(
        health,
        "build_preflight_report",
        lambda: {
            "eligible_for_migration": False,
            "current_revision": "legacy-revision",
            "repository_head": head,
            "schema_difference_count": 0,
            "state_errors": [],
        },
    )

    response = await db_health()

    assert response.status_code == 503
    assert b'"database":"connected"' in response.body
    assert b'"migration_status":"pending"' in response.body
    assert b'"connection_ready":false' in response.body
