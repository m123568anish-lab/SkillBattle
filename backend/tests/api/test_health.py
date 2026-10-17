import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_get(client: AsyncClient):
    """GET /health returns 200 with JSON payload without authentication."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "SkillBattle API"
    assert data["version"] == "2.0.0"


@pytest.mark.asyncio
async def test_health_head(client: AsyncClient):
    """HEAD /health returns 200 without body and without authentication (UptimeRobot)."""
    response = await client.head("/health")
    assert response.status_code == 200
    assert len(response.content) == 0


@pytest.mark.asyncio
async def test_health_unauthenticated(client: AsyncClient):
    """Health check endpoint must not require user authentication or DB access."""
    # Ensure no auth headers are set
    response = await client.get("/health")
    assert response.status_code == 200