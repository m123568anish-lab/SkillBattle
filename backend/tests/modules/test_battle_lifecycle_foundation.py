import uuid
import pytest


@pytest.mark.asyncio
async def test_battle_creation_sets_mode_and_server_authoritative_defaults(client, battle_question_bank):
    unique = f"btlc1_{uuid.uuid4().hex[:8]}"
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
async def test_battle_mode_persists_for_solo_and_multiplayer_and_aliases(client, battle_question_bank):
    unique = f"btlc3_{uuid.uuid4().hex[:8]}"
    email = f"{unique}@example.com"
    register = await client.post(
        "/auth/register",
        json={
            "username": unique,
            "email": email,
            "full_name": "Mode Persistence Tester",
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

    solo = await client.post(
        "/battle/create",
        headers=headers,
        json={
            "title": "Solo mode battle",
            "difficulty": "easy",
            "problem_id": 1,
            "battle_type": "general",
            "battle_mode": "solo",
            "max_players": 1,
        },
    )
    assert solo.status_code == 200, solo.text
    assert solo.json()["mode"] == "solo"

    multiplayer = await client.post(
        "/battle/create",
        headers=headers,
        json={
            "title": "Multiplayer mode battle",
            "difficulty": "medium",
            "problem_id": 1,
            "battle_type": "general",
            "battle_mode": "multiplayer",
            "max_players": 2,
        },
    )
    assert multiplayer.status_code == 200, multiplayer.text
    assert multiplayer.json()["mode"] == "duo"


@pytest.mark.asyncio
async def test_battle_mode_and_player_count_are_validated_for_supported_shapes(client, battle_question_bank):
    unique = f"btlc4_{uuid.uuid4().hex[:8]}"
    email = f"{unique}@example.com"
    register = await client.post(
        "/auth/register",
        json={
            "username": unique,
            "email": email,
            "full_name": "Mode Validation Tester",
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

    solo_ok = await client.post(
        "/battle/create",
        headers=headers,
        json={
            "title": "Solo validation ok",
            "difficulty": "easy",
            "problem_id": 1,
            "battle_type": "general",
            "battle_mode": "solo",
            "max_players": 1,
        },
    )
    assert solo_ok.status_code == 200, solo_ok.text

    solo_bad = await client.post(
        "/battle/create",
        headers=headers,
        json={
            "title": "Solo validation bad",
            "difficulty": "easy",
            "problem_id": 1,
            "battle_type": "general",
            "battle_mode": "solo",
            "max_players": 2,
        },
    )
    assert solo_bad.status_code == 400, solo_bad.text

    duo_ok = await client.post(
        "/battle/create",
        headers=headers,
        json={
            "title": "Duo validation ok",
            "difficulty": "medium",
            "problem_id": 1,
            "battle_type": "general",
            "battle_mode": "duo",
            "max_players": 2,
        },
    )
    assert duo_ok.status_code == 200, duo_ok.text
    assert duo_ok.json()["mode"] == "duo"

    duo_bad = await client.post(
        "/battle/create",
        headers=headers,
        json={
            "title": "Duo validation bad",
            "difficulty": "medium",
            "problem_id": 1,
            "battle_type": "general",
            "battle_mode": "duo",
            "max_players": 1,
        },
    )
    assert duo_bad.status_code == 400, duo_bad.text


@pytest.mark.asyncio
async def test_create_battle_keeps_question_types_distinct_per_section(client, battle_question_bank):
    unique = f"btlc5_{uuid.uuid4().hex[:8]}"
    email = f"{unique}@example.com"
    register = await client.post(
        "/auth/register",
        json={
            "username": unique,
            "email": email,
            "full_name": "Question Type Tester",
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

    response = await client.post(
        "/battle/create",
        headers=headers,
        json={
            "title": "Section type check",
            "difficulty": "medium",
            "problem_id": 1,
            "battle_type": "general",
            "battle_mode": "solo",
            "max_players": 1,
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    types = {section["question_type"] for section in payload["questions_data"]}
    assert "mcq" in types
    assert "coding" in types


@pytest.mark.asyncio
async def test_server_start_and_round_transition_protects_invalid_state(client, battle_question_bank):
    unique = f"btlc2_{uuid.uuid4().hex[:8]}"
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

    invalid_resp = await client.post(f"/battle/{battle_id}/advance-round", headers=headers, json={"target_round": "knowledge"})
    assert invalid_resp.status_code == 400

    ready_resp = await client.post(f"/battle/{battle_id}/advance-round", headers=headers)
    assert ready_resp.status_code == 200, ready_resp.text
    assert ready_resp.json()["status"] == "ready"

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
