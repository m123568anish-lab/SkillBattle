"""
=========================================================

SkillBattle

Pytest Fixtures

=========================================================
"""

import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database.init_db import init_db

@pytest_asyncio.fixture
async def client():
    init_db()
    transport = ASGITransport(app=app)

    async with AsyncClient(
        transport=transport,
        base_url="http://test",
    ) as client:
        yield client