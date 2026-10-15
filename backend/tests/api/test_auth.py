import pytest
from uuid import uuid4
from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.models.refresh_token import RefreshToken
from app.models.user import User


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

