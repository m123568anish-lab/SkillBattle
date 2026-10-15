import pytest
from uuid import uuid4
from sqlalchemy import select

from app.database.session import AsyncSessionLocal
from app.models.user import User
from app.models.xp import XP, XPLedger
from app.modules.xp.service import xp_service


@pytest.mark.asyncio
async def test_xp_requires_auth(client):
    response = await client.get("/xp")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_client_cannot_arbitrarily_award_xp(client):
    unique_id = uuid4().hex[:8]
    email = f"xp_{unique_id}@example.com"
    password = "StrongPass#123"

    reg = await client.post("/auth/register", json={
        "username": f"xp_{unique_id}",
        "email": email,
        "full_name": "XP Test User",
        "password": password,
    })
    assert reg.status_code == 201

    login = await client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    token = login.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Client-side /add must be forbidden to preserve server-authoritative progression
    resp = await client.post("/xp/add", headers=headers, json={"amount": 1000, "reason": "Client hack"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_server_xp_award_idempotency_and_ledger(client):
    unique_id = uuid4().hex[:8]
    email = f"ledger_{unique_id}@example.com"
    password = "StrongPass#123"

    reg = await client.post("/auth/register", json={
        "username": f"ledger_{unique_id}",
        "email": email,
        "full_name": "Ledger User",
        "password": password,
    })
    assert reg.status_code == 201
    user_id = reg.json()["id"]

    login = await client.post("/auth/login", json={"email": email, "password": password})
    token = login.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    battle_id = f"battle_test_{unique_id}"

    async with AsyncSessionLocal() as db:
        user = await db.get(User, user_id)
        # First award
        xp1 = await xp_service.add_xp(
            db,
            user,
            150,
            commit=True,
            source="battle",
            reference_id=battle_id,
            description="Battle win",
        )
        assert xp1.total_xp == 150
        assert xp1.level == 1

        # Duplicate award with same source and reference_id must NOT increment XP
        xp2 = await xp_service.add_xp(
            db,
            user,
            150,
            commit=True,
            source="battle",
            reference_id=battle_id,
            description="Battle win replay",
        )
        assert xp2.total_xp == 150

        # Different reference_id awards cleanly
        xp3 = await xp_service.add_xp(
            db,
            user,
            400,
            commit=True,
            source="battle",
            reference_id=f"{battle_id}_2",
            description="Second battle win",
        )
        assert xp3.total_xp == 550
        assert xp3.level == 2  # 550 // 500 + 1 == 2

    # Verify history endpoint returns ledger entries
    hist_resp = await client.get("/xp/history", headers=headers)
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert len(history) == 2
    assert history[0]["reference_id"] == f"{battle_id}_2"
    assert history[0]["amount"] == 400
    assert history[1]["reference_id"] == battle_id
    assert history[1]["amount"] == 150

    # Verify reconcile endpoint keeps total in sync
    rec_resp = await client.post("/xp/reconcile", headers=headers)
    assert rec_resp.status_code == 200
    assert rec_resp.json()["total_xp"] == 550
    assert rec_resp.json()["level"] == 2