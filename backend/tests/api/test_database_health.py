import json
from pathlib import Path
from types import SimpleNamespace

import pytest
from alembic.config import Config
from alembic.script import ScriptDirectory

from app.core.monitoring.health import db_health


class FakeResult:
    def __init__(self, value=None, values=None):
        self.value = value
        self.values = values or []

    def scalar(self):
        return self.value

    def scalars(self):
        return self

    def all(self):
        return self.values


class FakeDatabaseSession:
    def __init__(self, revisions):
        self.revisions = revisions
        self.bind = SimpleNamespace(
            dialect=SimpleNamespace(name="postgresql")
        )

    def get_bind(self):
        return self.bind

    async def execute(self, statement):
        if "SELECT 1" in str(statement):
            return FakeResult(value=1)
        if "alembic_version" in str(statement):
            return FakeResult(values=self.revisions)
        raise AssertionError(f"Unexpected health query: {statement}")


def expected_revisions():
    backend_dir = Path(__file__).resolve().parents[2]
    script = ScriptDirectory.from_config(
        Config(str(backend_dir / "alembic.ini"))
    )
    return sorted(script.get_heads())


@pytest.mark.asyncio
async def test_database_health_reports_connection_type_and_current_migrations():
    response = await db_health(FakeDatabaseSession(expected_revisions()))

    assert response.status_code == 200
    payload = json.loads(response.body)
    assert payload == {
        "status": "ok",
        "database": "connected",
        "database_type": "postgresql",
        "migration_status": "current",
        "connection_ready": True,
    }


@pytest.mark.asyncio
async def test_database_health_marks_outdated_migrations_not_ready():
    response = await db_health(FakeDatabaseSession([]))

    assert response.status_code == 503
    assert b'"database":"connected"' in response.body
    assert b'"migration_status":"pending"' in response.body
    assert b'"connection_ready":false' in response.body
