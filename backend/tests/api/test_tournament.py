from datetime import datetime, timedelta
from uuid import uuid4

import pytest
from app.database.session import AsyncSessionLocal
from app.models.tournament import Tournament


@pytest.mark.asyncio
async def test_tournament_health(

    client,

):

    response = await client.get(

        "/tournament/health",

    )

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_tournament_registration_uses_authenticated_persisted_state(client):
    unique = uuid4().hex[:8]
    email = f"tournament_{unique}@example.com"
    password = "StrongPass#123"

    registration = await client.post(
        "/auth/register",
        json={
            "username": f"tournament_{unique}",
            "email": email,
            "full_name": "Tournament Test",
            "password": password,
        },
    )
    assert registration.status_code == 201, registration.text

    login = await client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['tokens']['access_token']}"}

    async with AsyncSessionLocal() as db:
        tournament = Tournament(
            title=f"Integration Tournament {unique}",
            description="Test registration uses persisted participant data.",
            difficulty="Medium",
            tournament_type="single_elimination",
            max_players=4,
            status="registration",
            registration_end=datetime.utcnow() + timedelta(days=1),
            starts_at=datetime.utcnow() + timedelta(days=2),
        )
        db.add(tournament)
        await db.commit()
        tournament_id = tournament.id

    assert (await client.get("/tournament")).status_code == 401
    forbidden_create = await client.post(
        "/tournament/create",
        headers=headers,
        json={
            "title": "Student-created event",
            "description": "Should not be accepted",
            "max_players": 4,
            "registration_end": (datetime.utcnow() + timedelta(days=1)).isoformat(),
            "starts_at": (datetime.utcnow() + timedelta(days=2)).isoformat(),
        },
    )
    assert forbidden_create.status_code == 403, forbidden_create.text

    before = await client.get("/tournament", headers=headers)
    assert before.status_code == 200
    listed = next(item for item in before.json() if item["id"] == tournament_id)
    assert listed["registered_players"] == 0
    assert listed["is_registered"] is False

    joined = await client.post(
        "/tournament/join",
        headers=headers,
        json={"tournament_id": tournament_id},
    )
    assert joined.status_code == 200

    duplicate_join = await client.post(
        "/tournament/join",
        headers=headers,
        json={"tournament_id": tournament_id},
    )
    assert duplicate_join.status_code == 200

    after = await client.get("/tournament", headers=headers)
    listed_after_join = next(item for item in after.json() if item["id"] == tournament_id)
    assert listed_after_join["registered_players"] == 1
    assert listed_after_join["is_registered"] is True