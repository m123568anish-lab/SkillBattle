from uuid import uuid4

import pytest

from app.database.session import AsyncSessionLocal
from app.models.challenge import Challenge
from app.models.problem import Problem


async def _headers(client) -> dict[str, str]:
    key = uuid4().hex[:8]
    registration = await client.post("/auth/register", json={
        "username": f"practice_{key}", "email": f"practice_{key}@example.com",
        "full_name": "Practice User", "password": "StrongPass#123",
    })
    assert registration.status_code == 201
    login = await client.post("/auth/login", json={"email": f"practice_{key}@example.com", "password": "StrongPass#123"})
    return {"Authorization": f"Bearer {login.json()['tokens']['access_token']}"}


@pytest.mark.asyncio
async def test_practice_catalogue_and_daily_session_are_persisted(client):
    headers = await _headers(client)
    key = uuid4().hex[:8]
    async with AsyncSessionLocal() as db:
        problem = Problem(
            title=f"Daily arrays {key}", slug=f"daily-arrays-{key}", difficulty="Easy", category="Arrays",
            description="Return a value.", input_format="integer", output_format="integer", constraints="n > 0",
            xp_reward=100, is_active=True,
        )
        db.add(problem)
        db.add(Challenge(title=f"Arrays challenge {key}", difficulty="Easy", category="Arrays", xp_reward=50))
        await db.commit()

    catalogue = await client.get("/api/v1/practice/problems", headers=headers)
    assert catalogue.status_code == 200
    assert any(item["slug"] == f"daily-arrays-{key}" for item in catalogue.json()["items"])

    started = await client.post("/api/v1/practice/daily/start", headers=headers)
    assert started.status_code == 200
    session_id = started.json()["session"]["id"]
    assert started.json()["session"]["status"] == "IN_PROGRESS"

    repeated = await client.post("/api/v1/practice/daily/start", headers=headers)
    assert repeated.status_code == 200
    assert repeated.json()["session"]["id"] == session_id


@pytest.mark.asyncio
async def test_inactive_problem_is_not_exposed_in_public_catalogue(client):
    key = uuid4().hex[:8]
    async with AsyncSessionLocal() as db:
        inactive = Problem(
            title=f"Inactive generated problem {key}",
            slug=f"inactive-generated-{key}",
            difficulty="Easy",
            category="Arrays",
            description="Inactive content should not be exposed.",
            input_format="",
            output_format="",
            constraints="",
            is_active=False,
        )
        db.add(inactive)
        await db.commit()
        inactive_id = inactive.id

    headers = await _headers(client)
    catalogue = await client.get("/api/v1/practice/problems", headers=headers)
    assert catalogue.status_code == 200
    assert all(problem["slug"] != f"inactive-generated-{key}" for problem in catalogue.json()["items"])

    from app.modules.problem.repository import problem_repository

    async with AsyncSessionLocal() as db:
        assert await problem_repository.get_problem(db, inactive_id) is None
        assert all(problem.slug != f"inactive-generated-{key}" for problem in await problem_repository.list_problems(db))
