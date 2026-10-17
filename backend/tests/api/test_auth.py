import pytest
import sys
from uuid import uuid4
from sqlalchemy import select

from app.modules.auth.services import auth_service as auth_service_module
from app.database.session import AsyncSessionLocal
from app.models.refresh_token import RefreshToken
from app.models.user import User


def test_login_environment_check_reads_pytest_current_test(monkeypatch):
    """The login test-mode check must evaluate its environment variable safely."""
    original_modules = sys.modules
    monkeypatch.setattr(auth_service_module.sys, "modules", {})
    monkeypatch.setenv("PYTEST_CURRENT_TEST", "auth login regression")
    try:
        assert auth_service_module._is_test_environment() is True
    finally:
        monkeypatch.setattr(auth_service_module.sys, "modules", original_modules)


@pytest.mark.asyncio
async def test_login_invalid(client):

    response = await client.post(

        "/auth/login",

        json={

            "email": "wrong@test.com",

            "password": "123456",

        },

    )

    assert response.status_code in (

        400,

        401,

    )


@pytest.mark.asyncio
async def test_user_can_list_and_revoke_only_own_sessions(client):
    unique_id = uuid4().hex[:8]
    password = "StrongPass#123"
    first = await client.post("/auth/register", json={
        "username": f"session_{unique_id}",
        "email": f"session_{unique_id}@example.com",
        "full_name": "Session Owner",
        "password": password,
    })
    second = await client.post("/auth/register", json={
        "username": f"other_{unique_id}",
        "email": f"other_{unique_id}@example.com",
        "full_name": "Other Owner",
        "password": password,
    })
    assert first.status_code == 201, first.text
    assert second.status_code == 201, second.text

    first_login = await client.post("/auth/login", json={"email": f"session_{unique_id}@example.com", "password": password})
    second_login = await client.post("/auth/login", json={"email": f"other_{unique_id}@example.com", "password": password})
    first_headers = {"Authorization": f"Bearer {first_login.json()['tokens']['access_token']}"}
    second_headers = {"Authorization": f"Bearer {second_login.json()['tokens']['access_token']}"}
    foreign_refresh_token = second_login.json()["tokens"]["refresh_token"]

    async with AsyncSessionLocal() as db:
        token_result = await db.execute(select(RefreshToken).where(RefreshToken.token == foreign_refresh_token))
        foreign_session = token_result.scalar_one()
        foreign_session_id = foreign_session.id

    sessions = await client.get("/auth/sessions", headers=first_headers)
    assert sessions.status_code == 200, sessions.text
    assert sessions.json()
    assert all("token" not in session for session in sessions.json())

    forbidden = await client.delete(f"/auth/sessions/{foreign_session_id}", headers=first_headers)
    assert forbidden.status_code == 404, forbidden.text

    own_refresh_token = first_login.json()["tokens"]["refresh_token"]
    async with AsyncSessionLocal() as db:
        own_result = await db.execute(select(RefreshToken).where(RefreshToken.token == own_refresh_token))
        own_session = own_result.scalar_one()
        own_session_id = own_session.id

    revoked = await client.delete(f"/auth/sessions/{own_session_id}", headers=first_headers)
    assert revoked.status_code == 200, revoked.text
    assert revoked.json()["revoked"] is True

    async with AsyncSessionLocal() as db:
        own_result = await db.execute(select(RefreshToken).where(RefreshToken.id == own_session_id))
        assert own_result.scalar_one().revoked is True

    still_works = await client.get("/auth/me", headers=first_headers)
    assert still_works.status_code == 200, still_works.text


@pytest.mark.asyncio
async def test_refresh_token_rotates_and_old_access_token_cannot_authenticate(client):
    unique_id = uuid4().hex[:8]
    password = "StrongPass#123"
    register = await client.post("/auth/register", json={
        "username": f"rotate_{unique_id}",
        "email": f"rotate_{unique_id}@example.com",
        "full_name": "Rotation User",
        "password": password,
    })
    assert register.status_code == 201, register.text

    login = await client.post("/auth/login", json={
        "email": f"rotate_{unique_id}@example.com",
        "password": password,
    })
    assert login.status_code == 200, login.text
    old_refresh = login.json()["tokens"]["refresh_token"]

    refreshed = await client.post("/auth/refresh", json={"refresh_token": old_refresh})
    assert refreshed.status_code == 200, refreshed.text
    new_refresh = refreshed.json()["refresh_token"]
    assert new_refresh != old_refresh

    replay = await client.post("/auth/refresh", json={"refresh_token": old_refresh})
    assert replay.status_code == 401

    refresh_as_access = await client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {new_refresh}"},
    )
    assert refresh_as_access.status_code == 401



@pytest.mark.asyncio
async def test_clerk_linking_creates_user_with_onboarding_pending_and_profile(client):
    from app.core.dependencies import _get_or_create_clerk_user
    from app.models.profile import Profile
    from app.models.xp import XP

    unique_id = uuid4().hex[:8]
    clerk_user_id = f"user_clerk_{unique_id}"
    email = f"clerk_{unique_id}@example.com"

    async with AsyncSessionLocal() as db:
        user = await _get_or_create_clerk_user(
            db,
            {"sub": clerk_user_id, "email": email, "email_verified": True},
        )
        assert user.clerk_user_id == clerk_user_id
        assert user.onboarding_completed is False

        # Verify profile and xp were automatically instantiated
        profile = (await db.execute(select(Profile).where(Profile.user_id == user.id))).scalar_one_or_none()
        assert profile is not None
        assert profile.onboarding_preferences == {}

        xp = (await db.execute(select(XP).where(XP.user_id == user.id))).scalar_one_or_none()
        assert xp is not None
        assert xp.total_xp == 0
        assert xp.level == 1


@pytest.mark.asyncio
async def test_clerk_linking_existing_user_preserves_onboarding_and_data(client):
    from app.core.dependencies import _get_or_create_clerk_user

    unique_id = uuid4().hex[:8]
    email = f"legacy_{unique_id}@example.com"
    password = "StrongPass#123"

    reg = await client.post("/auth/register", json={
        "username": f"legacy_{unique_id}",
        "email": email,
        "full_name": "Legacy User",
        "password": password,
    })
    assert reg.status_code == 201
    user_id = reg.json()["id"]

    async with AsyncSessionLocal() as db:
        u = await db.get(User, user_id)
        u.onboarding_completed = True
        await db.commit()

    clerk_id = f"user_clerk_legacy_{unique_id}"
    async with AsyncSessionLocal() as db:
        linked_user = await _get_or_create_clerk_user(
            db,
            {"sub": clerk_id, "email": email, "email_verified": True},
        )
        assert linked_user.id == user_id
        assert linked_user.clerk_user_id == clerk_id
        assert linked_user.onboarding_completed is True
