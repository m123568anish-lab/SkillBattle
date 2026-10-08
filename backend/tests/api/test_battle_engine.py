import pytest
from uuid import uuid4
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_advanced_battle_engine_workflow(client: AsyncClient):
    unique_id = uuid4().hex[:6].lower()
    email = f"student_{unique_id}@example.com"
    username = f"battle_user_{unique_id}"

    # Register & Login
    reg_resp = await client.post(
        "/auth/register",
        json={
            "username": username,
            "email": email,
            "full_name": "Placement Aspirant",
            "password": "StrongPass#123",
        },
    )
    assert reg_resp.status_code == 201, reg_resp.text

    login_resp = await client.post(
        "/auth/login",
        json={"email": email, "password": "StrongPass#123"},
    )
    assert login_resp.status_code == 200, login_resp.text
    token = login_resp.json()["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch Battle Types
    types_resp = await client.get("/battle/types")
    assert types_resp.status_code == 200
    types_list = types_resp.json()["types"]
    assert any(t["id"] == "placement" for t in types_list)

    # 2. Create Battle Configuration for Placement Battle
    config_resp = await client.post(
        "/battle/config",
        headers=headers,
        json={
            "title": "Full Placement Assessment",
            "description": "MCQs, DSA Coding, Debugging & Technical Qs",
            "battle_type": "placement",
            "difficulty": "medium",
            "duration_minutes": 60,
            "question_count": 4,
            "negative_marking": True,
            "sections": [
                {
                    "title": "MCQ Fundamentals",
                    "question_type": "mcq",
                    "question_count": 2,
                    "weight": 0.25,
                    "duration_minutes": 15,
                    "negative_marking": True,
                },
                {
                    "title": "DSA Coding",
                    "question_type": "coding",
                    "question_count": 1,
                    "weight": 0.50,
                    "duration_minutes": 30,
                    "negative_marking": False,
                },
                {
                    "title": "Code Debugging",
                    "question_type": "debugging",
                    "question_count": 1,
                    "weight": 0.25,
                    "duration_minutes": 15,
                    "negative_marking": False,
                },
            ],
            "allowed_languages": ["python", "javascript", "cpp"],
        },
    )
    assert config_resp.status_code == 200, config_resp.text
    config_data = config_resp.json()
    config_id = config_data["id"]

    # 3. Create Battle Room using Placement Config
    battle_resp = await client.post(
        "/battle/create",
        headers=headers,
        json={
            "title": "Placement Assessment Room",
            "difficulty": "medium",
            "problem_id": 1,
            "config_id": config_id,
            "battle_type": "placement",
            "max_players": 2,
        },
    )
    assert battle_resp.status_code == 200, battle_resp.text
    battle_data = battle_resp.json()
    battle_id = battle_data["id"]

    # 4. Fetch Battle Details & verify sanitized question payload
    details_resp = await client.get(f"/battle/{battle_id}")
    assert details_resp.status_code == 200
    sections = details_resp.json()["questions_data"]
    assert len(sections) > 0
    mcq_question_id = sections[0]["questions"][0]["id"]
    coding_question_id = sections[1]["questions"][0]["id"]

    # 5. Submit MCQ Answer
    mcq_sub_resp = await client.post(
        "/battle/submit-answer",
        headers=headers,
        json={
            "battle_id": battle_id,
            "question_id": mcq_question_id,
            "section_index": 0,
            "question_type": "mcq",
            "mcq_option": "B",
            "time_taken_seconds": 12,
        },
    )
    assert mcq_sub_resp.status_code == 200, mcq_sub_resp.text

    # 6. Submit Coding Answer
    coding_sub_resp = await client.post(
        "/battle/submit-answer",
        headers=headers,
        json={
            "battle_id": battle_id,
            "question_id": coding_question_id,
            "section_index": 1,
            "question_type": "coding",
            "source_code": "def solution(a, b):\n    return a + b",
            "language": "python",
            "time_taken_seconds": 120,
        },
    )
    assert coding_sub_resp.status_code == 200, coding_sub_resp.text

    # 7. Record Anti-Cheat Event
    anticheat_resp = await client.post(
        f"/battle/{battle_id}/anti-cheat?event_type=tab_switch",
        headers=headers,
        json={"focus_lost_count": 1},
    )
    assert anticheat_resp.status_code == 200

    # 8. Finish Battle and receive Placement Readiness Report
    finish_resp = await client.post(f"/battle/{battle_id}/finish", headers=headers)
    assert finish_resp.status_code == 200, finish_resp.text
    finish_data = finish_resp.json()
    assert "placement_readiness" in finish_data
    assert "skill_breakdown" in finish_data
    assert "section_scores" in finish_data

    # 9. Get Battle Result endpoint
    result_resp = await client.get(f"/battle/{battle_id}/result", headers=headers)
    assert result_resp.status_code == 200
    res_payload = result_resp.json()
    assert res_payload["battle_type"] == "placement"
    assert "overall_status" in res_payload["placement_readiness"]
