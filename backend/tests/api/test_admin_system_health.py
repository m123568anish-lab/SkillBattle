from types import SimpleNamespace

import pytest

from app.core.dependencies import get_current_user
from app.main import app


@pytest.mark.asyncio
async def test_system_health_is_platform_admin_only_and_uses_database(client):
    previous_overrides = app.dependency_overrides.copy()
    user = SimpleNamespace(id="health-user", role="student", is_superuser=False)

    async def override_current_user():
        return user

    app.dependency_overrides[get_current_user] = override_current_user
    try:
        forbidden = await client.get("/api/v1/admin/system-health")
        assert forbidden.status_code == 403

        user.is_superuser = True
        response = await client.get("/api/v1/admin/system-health")
        assert response.status_code == 200
        data = response.json()
        assert data["api"] == "healthy"
        assert data["database"] == "healthy"
        assert data["migration_version"] == "a4d5b6c7e8f9"
        assert isinstance(data["active_users"], int)
        assert data["notification_queue"] == "not_configured"
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(previous_overrides)