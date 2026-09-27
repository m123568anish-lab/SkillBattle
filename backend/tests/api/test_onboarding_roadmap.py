import json

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import selectinload
from httpx import ASGITransport, AsyncClient

import app.database.init_db  # noqa: F401 - register all models
from app.main import app
from app.database.base import Base
from app.models.profile import Profile
from app.models.roadmap import Roadmap, RoadmapTask, RoadmapWeek
from app.models.user import User
from app.modules.career.ai.llm_client import llm_client
from app.modules.career.api.roadmap import (
    OnboardingRoadmapRequest,
    complete_task,
    create_onboarding_roadmap,
)


def make_ai_roadmap() -> str:
    return json.dumps({
        "weeks": [
            {
                "week_number": week_number,
                "title": f"Week {week_number}: Python interview foundations",
                "objective": "Practice Python problem-solving for the selected target companies.",
                "tasks": [
                    {
                        "day": 1,
                        "topic": f"Python arrays practice {week_number}",
                        "difficulty": "Easy",
                        "estimated_minutes": 45,
                        "reward_xp": 50,
                    }
                ],
            }
            for week_number in (1, 2)
        ]
    })


async def create_test_user(session) -> User:
    user = User(
        username="onboarding_test_user",
        full_name="Onboarding Test User",
        email="onboarding-test@example.com",
        password_hash="not-used-by-this-test",
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


def onboarding_payload() -> OnboardingRoadmapRequest:
    return OnboardingRoadmapRequest(
        languages=["Python", "JavaScript"],
        companies=["Google", "Microsoft"],
        level="Intermediate",
        confidence=65,
        placement_goal="20+ LPA",
        graduation_year=2027,
        goals=["Data Structures", "Interview Preparation"],
        daily_hours=10,
    )


@pytest.mark.asyncio
async def test_onboarding_persists_preferences_generates_once_and_tracks_progress(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    responses = iter(["not json", make_ai_roadmap()])
    prompts = []

    async def fake_generate(prompt: str, temperature: float = 0.2) -> str:
        prompts.append(prompt)
        return next(responses)

    monkeypatch.setattr(llm_client, "generate", fake_generate)

    async with session_factory() as session:
        user = await create_test_user(session)
        result = await create_onboarding_roadmap(onboarding_payload(), session, user)

        assert result.generation_status == "ready"
        assert result.preferences_saved is True
        assert result.roadmap is not None
        assert result.roadmap.target_company == "Google"
        assert len(result.roadmap.weeks) == 2
        assert len(prompts) == 2
        assert '"languages": ["Python", "JavaScript"]' in prompts[0]

        profile = (await session.execute(select(Profile).where(Profile.user_id == user.id))).scalar_one()
        assert profile.graduation_year == 2027
        assert profile.target_company == "Google"
        assert profile.onboarding_preferences["companies"] == ["Google", "Microsoft"]
        assert profile.onboarding_preferences["daily_hours"] == 10

        first_roadmap_id = result.roadmap.id
        repeated = await create_onboarding_roadmap(onboarding_payload(), session, user)
        assert repeated.roadmap is not None
        assert repeated.roadmap.id == first_roadmap_id
        assert len(prompts) == 2

        task = result.roadmap.weeks[0].tasks[0]
        completion = await complete_task(task.id, session, user)
        assert completion["completed"] is True
        assert completion["newly_completed"] is True
        assert completion["reward_xp"] == 50

        saved_roadmap = (
            await session.execute(
                select(Roadmap)
                .where(Roadmap.id == first_roadmap_id)
                .options(selectinload(Roadmap.weeks).selectinload(RoadmapWeek.tasks))
            )
        ).scalar_one()
        assert saved_roadmap.progress == 50
        assert saved_roadmap.weeks[0].completion == 100
        assert saved_roadmap.weeks[0].tasks[0].completed is True

        repeated_completion = await complete_task(task.id, session, user)
        assert repeated_completion["newly_completed"] is False
        assert repeated_completion["reward_xp"] == 0

    await engine.dispose()


@pytest.mark.asyncio
async def test_ai_failure_keeps_preferences_and_later_retry_generates_roadmap(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        user = await create_test_user(session)
        user_id = user.id

        async def unavailable(*args, **kwargs) -> str:
            raise TimeoutError("AI provider unavailable")

        monkeypatch.setattr(llm_client, "generate", unavailable)
        pending = await create_onboarding_roadmap(onboarding_payload(), session, user)
        assert pending.preferences_saved is True
        assert pending.generation_status == "pending"
        assert pending.roadmap is None

        profile = (await session.execute(select(Profile).where(Profile.user_id == user_id))).scalar_one()
        assert profile.onboarding_preferences["level"] == "Intermediate"

        async def available(*args, **kwargs) -> str:
            return make_ai_roadmap()

        monkeypatch.setattr(llm_client, "generate", available)
        user = (await session.execute(select(User).where(User.id == user_id))).scalar_one()
        retry = await create_onboarding_roadmap(onboarding_payload(), session, user)
        assert retry.generation_status == "ready"
        assert retry.roadmap is not None

        roadmaps = (await session.execute(select(Roadmap).where(Roadmap.user_id == user_id))).scalars().all()
        assert len(roadmaps) == 1

    await engine.dispose()


@pytest.mark.asyncio
async def test_onboarding_endpoint_requires_authentication(client):
    response = await client.post(
        "/api/v1/career/roadmap/onboarding",
        json=onboarding_payload().model_dump(),
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_onboarding_http_flow_persists_and_returns_pending_on_empty_ai(monkeypatch):
    from app.database import session as database_session

    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async def override_database():
        async with session_factory() as session:
            yield session

    async def empty_ai(*args, **kwargs) -> str:
        return ""

    from app.database.session import get_db
    app.dependency_overrides[get_db] = override_database
    monkeypatch.setattr(llm_client, "generate", empty_ai)

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            registration = await client.post(
                "/api/v1/auth/register",
                json={
                    "username": "onboarding_http_user",
                    "full_name": "Onboarding HTTP User",
                    "email": "onboarding-http@example.com",
                    "password": "Onboarding123",
                },
            )
            assert registration.status_code == 201
            assert registration.json()["onboarding_completed"] is False

            login = await client.post(
                "/api/v1/auth/login",
                json={"email": "onboarding-http@example.com", "password": "Onboarding123"},
            )
            assert login.status_code == 200
            assert login.json()["user"]["onboarding_completed"] is False

            token = login.json()["tokens"]["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            saved = await client.post(
                "/api/v1/career/roadmap/onboarding",
                json=onboarding_payload().model_dump(),
                headers=headers,
            )
            assert saved.status_code == 200
            assert saved.json()["preferences_saved"] is True
            assert saved.json()["generation_status"] == "pending"

            profile = await client.get("/api/v1/profile/me", headers=headers)
            assert profile.status_code == 200
            assert profile.json()["onboarding_preferences"]["languages"] == ["Python", "JavaScript"]
            assert profile.json()["onboarding_completed"] is True

            refreshed_login = await client.post(
                "/api/v1/auth/login",
                json={"email": "onboarding-http@example.com", "password": "Onboarding123"},
            )
            assert refreshed_login.json()["user"]["onboarding_completed"] is True
            refreshed_headers = {
                "Authorization": f"Bearer {refreshed_login.json()['tokens']['access_token']}"
            }
            refreshed_profile = await client.get("/api/v1/profile/me", headers=refreshed_headers)
            assert refreshed_profile.json()["onboarding_preferences"] == profile.json()["onboarding_preferences"]
            assert refreshed_profile.json()["onboarding_completed"] is True
    finally:
        app.dependency_overrides.pop(get_db, None)
        await engine.dispose()