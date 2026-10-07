import pytest


@pytest.mark.asyncio
async def test_battle_creation_sets_mode_and_server_authoritative_defaults(client):
    unique = "btlifecycle1"
    email = f"{unique}@example.com"
    register = await client.post(
        "/auth/register",
        json={
            "username": unique,
            "email": email,
            "full_name": "Lifecycle Tester",
            "password": "StrongPass#123",
        },
    )
    assert register.status_code == 201, register.text

    login = await client.post(
        "/auth/login",
        json={"email": email, "password": "StrongPass#123"},
    )
    assert login.status_code == 200, login.text
    headers = {"Authorization": f"Bearer {login.json()['tokens']['access_token']}"}

    resp = await client.post(
        "/battle/create",
        headers=headers,
        json={
            "title": "Lifecycle Foundation Battle",
            "difficulty": "medium",
            "problem_id": 1,
            "battle_type": "general",
            "battle_mode": "solo",
            "max_players": 1,
        },
    )
    assert resp.status_code == 200, resp.text
    payload = resp.json()
    assert payload["id"]
    assert payload["mode"] == "solo"
    assert payload["type"] == "general"
    assert payload["status"] in {"created", "waiting", "ready"}
    assert payload["current_round"] == 1
    assert payload["round_state"] in {"created", "waiting", "ready"}


@pytest.mark.asyncio
async def test_server_start_and_round_transition_protects_invalid_state(client):
    unique = "btlifecycle2"
    email = f"{unique}@example.com"
    register = await client.post(
        "/auth/register",
        json={
            "username": unique,
            "email": email,
            "full_name": "Lifecycle Start Tester",
            "password": "StrongPass#123",
        },
    )
    assert register.status_code == 201, register.text

    login = await client.post(
        "/auth/login",
        json={"email": email, "password": "StrongPass#123"},
    )
    assert login.status_code == 200, login.text
    headers = {"Authorization": f"Bearer {login.json()['tokens']['access_token']}"}

    created = await client.post(
        "/battle/create",
        headers=headers,
        json={
            "title": "Lifecycle Start Battle",
            "difficulty": "medium",
            "problem_id": 1,
            "battle_type": "general",
            "battle_mode": "solo",
            "max_players": 1,
        },
    )
    assert created.status_code == 200, created.text
    battle_id = created.json()["id"]

    start_resp = await client.post(f"/battle/{battle_id}/start", headers=headers)
    assert start_resp.status_code == 200, start_resp.text
    started = start_resp.json()
    assert started["status"] == "ready"
    assert started["started_at"] is not None
    assert started["expires_at"] is not None

    invalid_resp = await client.post(f"/battle/{battle_id}/advance-round", headers=headers, json={"target_round": "knowledge"})
    assert invalid_resp.status_code == 400

    countdown_resp = await client.post(f"/battle/{battle_id}/advance-round", headers=headers)
    assert countdown_resp.status_code == 200, countdown_resp.text
    countdown_payload = countdown_resp.json()
    assert countdown_payload["status"] == "countdown"
    assert countdown_payload["current_round"] == 1

    knowledge_resp = await client.post(f"/battle/{battle_id}/advance-round", headers=headers)
    assert knowledge_resp.status_code == 200, knowledge_resp.text
    knowledge_payload = knowledge_resp.json()
    assert knowledge_payload["status"] == "knowledge_round"
    assert knowledge_payload["current_round"] == 1

    invalid_direct = await client.post(f"/battle/{battle_id}/advance-round", headers=headers, json={"target_round": "finalized"})
    assert invalid_direct.status_code == 400
