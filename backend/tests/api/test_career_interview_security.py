from uuid import uuid4

import pytest


async def _register_and_login(client, prefix: str) -> dict[str, str]:
    identifier = uuid4().hex[:8]
    email = f"{prefix}_{identifier}@example.com"
    password = "StrongPass#123"
    registration = await client.post(
        "/auth/register",
        json={
            "username": f"{prefix}_{identifier}",
            "email": email,
            "full_name": f"{prefix} user",
            "password": password,
        },
    )
    assert registration.status_code == 201

    login = await client.post("/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['tokens']['access_token']}"}


@pytest.mark.asyncio
async def test_interview_answers_are_owned_once_and_do_not_expose_the_rubric(client):
    owner_headers = await _register_and_login(client, "interview_owner")
    other_headers = await _register_and_login(client, "interview_other")

    started = await client.post(
        "/career/interview/start",
        headers=owner_headers,
        json={"company": "Google", "role": "Backend Engineer", "difficulty": "Medium"},
    )
    assert started.status_code == 200
    session = started.json()
    question_id = session["questions"][0]["id"]
    assert "expected_topics" not in session["questions"][0]

    answer = "I would start with a token bucket and explain its time complexity, distributed locking trade-offs, and overflow edge cases."
    unauthorized = await client.post(
        "/career/interview/answer",
        headers=other_headers,
        json={"question_id": question_id, "answer": answer},
    )
    assert unauthorized.status_code == 404

    submitted = await client.post(
        "/career/interview/answer",
        headers=owner_headers,
        json={"question_id": question_id, "answer": answer},
    )
    assert submitted.status_code == 200
    assert submitted.json()["xp_earned"] == 50

    replay = await client.post(
        "/career/interview/answer",
        headers=owner_headers,
        json={"question_id": question_id, "answer": answer},
    )
    assert replay.status_code == 409

    xp_history = await client.get("/xp/history", headers=owner_headers)
    assert xp_history.status_code == 200
    interview_awards = [entry for entry in xp_history.json() if entry["source"] == "interview_question"]
    assert len(interview_awards) == 1
    assert interview_awards[0]["amount"] == 50

    history = await client.get("/career/interview/user", headers=owner_headers)
    assert history.status_code == 200
    stored_question = history.json()[0]["questions"][0]
    assert "expected_topics" not in stored_question
    assert len(stored_question["answers"]) == 1
