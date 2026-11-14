import uuid

import pytest
from sqlalchemy import func, select


async def _authenticated_user(client):
    unique = uuid.uuid4().hex[:12]
    email = f"battle-flow-{unique}@example.com"
    password = "StrongPass#123"
    registered = await client.post(
        "/auth/register",
        json={
            "username": f"battle_{unique}",
            "email": email,
            "full_name": "Battle Flow Tester",
            "password": password,
        },
    )
    assert registered.status_code == 201, registered.text
    login = await client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200, login.text
    token = login.json()["tokens"]["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_battle_selects_only_the_requested_question_type(
    client, battle_question_bank
):
    headers = await _authenticated_user(client)
    response = await client.post(
        "/battle/create",
        headers=headers,
        json={
            "title": "MCQ lifecycle",
            "difficulty": "medium",
            "battle_type": "general",
            "battle_mode": "solo",
            "max_players": 1,
            "question_type": "mcq",
            "question_count": 1,
        },
    )

    assert response.status_code == 200, response.text
    sections = response.json()["questions_data"]
    assert len(sections) == 1
    assert sections[0]["question_type"] == "mcq"
    assert len(sections[0]["questions"]) == 1


@pytest.mark.asyncio
async def test_battle_creation_is_idempotent_and_rejects_key_reuse_with_new_payload(
    client, battle_question_bank
):
    headers = await _authenticated_user(client)
    request = {
        "title": "Idempotent MCQ lifecycle",
        "difficulty": "medium",
        "battle_type": "general",
        "battle_mode": "solo",
        "max_players": 1,
        "question_type": "mcq",
        "question_count": 1,
        "idempotency_key": f"battle-create-{uuid.uuid4().hex}",
    }

    first = await client.post("/battle/create", headers=headers, json=request)
    second = await client.post("/battle/create", headers=headers, json=request)

    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    assert second.json()["id"] == first.json()["id"]

    conflict = await client.post(
        "/battle/create",
        headers=headers,
        json={**request, "title": "Different payload"},
    )
    assert conflict.status_code == 409


@pytest.mark.asyncio
async def test_battle_question_engine_matches_alias_skill_categories():
    from app.database.session import AsyncSessionLocal
    from app.models.question import Question
    from app.modules.battle.question_engine import question_engine

    assert question_engine.category_matches("Algorithms & Data Structures", "Algorithms") is True
    assert question_engine.category_matches("SQL & Database Internals", "SQL") is True
    assert question_engine.category_matches("Web & JavaScript Core", "JavaScript") is True
    assert question_engine.category_matches("Algorithms & Data Structures", "System Design") is False
    assert question_engine.category_matches("Algorithms & Data Structures", "Networking") is False

    async with AsyncSessionLocal() as db:
        question = Question(
            title="Alias skill question",
            slug=f"alias-skill-question-{uuid.uuid4().hex[:8]}",
            description="Question for skill alias matching.",
            difficulty="medium",
            question_type="mcq",
            options=[{"key": "A", "text": "Option A"}, {"key": "B", "text": "Option B"}],
            correct_option="A",
            skill_category="Algorithms",
            is_active=True,
            is_validated=True,
        )
        db.add(question)
        await db.commit()
        await db.refresh(question)

        sections = await question_engine.resolve_questions_for_sections(
            db,
            [{
                "title": "Algorithms & Data Structures",
                "question_type": "mcq",
                "skill_category": "Algorithms & Data Structures",
                "question_count": 1,
                "weight": 1.0,
                "duration_minutes": 10,
                "negative_marking": False,
            }],
            difficulty="medium",
        )

        assert len(sections) == 1
        assert len(sections[0]["questions"]) == 1
        selected_id = sections[0]["questions"][0]["id"]
        assert selected_id in {question.id, *[q.id for q in (await db.execute(select(Question).where(
            Question.question_type == "mcq",
            Question.is_active.is_(True),
            Question.is_validated.is_(True),
            Question.skill_category == "Algorithms",
        ))).scalars().all()]}


@pytest.mark.asyncio
async def test_question_resolution_enforces_difficulty_completeness_and_unique_assignment():
    from app.database.session import AsyncSessionLocal
    from app.models.question import Question
    from app.modules.battle.question_engine import question_engine

    suffix = uuid.uuid4().hex[:8]
    easy_category = f"Difficulty-{suffix}"
    invalid_category = f"Incomplete-{suffix}"
    duplicate_category = f"Duplicate-{suffix}"

    async with AsyncSessionLocal() as db:
        easy_question = Question(
            title=f"Easy question {suffix}",
            slug=f"easy-question-{suffix}",
            description="A complete question for the easy difficulty.",
            difficulty="easy",
            question_type="mcq",
            options=[{"key": "A", "text": "Option A"}, {"key": "B", "text": "Option B"}],
            correct_option="A",
            skill_category=easy_category,
            is_active=True,
            is_validated=True,
        )
        medium_question = Question(
            title=f"Medium question {suffix}",
            slug=f"medium-question-{suffix}",
            description="A complete question for the medium difficulty.",
            difficulty="medium",
            question_type="mcq",
            options=[{"key": "A", "text": "Option A"}, {"key": "B", "text": "Option B"}],
            correct_option="A",
            skill_category=easy_category,
            is_active=True,
            is_validated=True,
        )
        incomplete_question = Question(
            title=f"Incomplete question {suffix}",
            slug=f"incomplete-question-{suffix}",
            description="A question with an invalid correct answer.",
            difficulty="easy",
            question_type="mcq",
            options=[{"key": "A", "text": "Option A"}, {"key": "B", "text": "Option B"}],
            correct_option="C",
            skill_category=invalid_category,
            is_active=True,
            is_validated=True,
        )
        duplicate_question = Question(
            title=f"Single assignment question {suffix}",
            slug=f"single-assignment-question-{suffix}",
            description="A complete question that can be assigned only once.",
            difficulty="easy",
            question_type="mcq",
            options=[{"key": "A", "text": "Option A"}, {"key": "B", "text": "Option B"}],
            correct_option="A",
            skill_category=duplicate_category,
            is_active=True,
            is_validated=True,
        )
        db.add_all([easy_question, medium_question, incomplete_question, duplicate_question])
        await db.commit()
        await db.refresh(easy_question)
        await db.refresh(medium_question)

        selected = await question_engine.resolve_questions_for_sections(
            db,
            [{
                "title": "Requested easy question",
                "question_type": "mcq",
                "skill_category": easy_category,
                "question_count": 1,
            }],
            difficulty="easy",
        )
        assert [item["id"] for item in selected[0]["questions"]] == [easy_question.id]

        with pytest.raises(ValueError, match="available 0"):
            await question_engine.resolve_questions_for_sections(
                db,
                [{
                    "title": "Incomplete MCQ",
                    "question_type": "mcq",
                    "skill_category": invalid_category,
                    "question_count": 1,
                }],
                difficulty="easy",
            )

        with pytest.raises(ValueError, match="available 0"):
            await question_engine.resolve_questions_for_sections(
                db,
                [
                    {
                        "title": "First section",
                        "question_type": "mcq",
                        "skill_category": duplicate_category,
                        "question_count": 1,
                    },
                    {
                        "title": "Second section",
                        "question_type": "mcq",
                        "skill_category": duplicate_category,
                        "question_count": 1,
                    },
                ],
                difficulty="easy",
            )


@pytest.mark.asyncio
async def test_battle_judge_compares_output_against_hidden_test_cases():
    from app.modules.battle.judge import battle_judge

    result = await battle_judge.evaluate(
        "python",
        "print(999)",
        test_cases=[{"input": "2\n", "output": "4\n"}],
    )

    assert result["verdict"] == "Wrong Answer"
    assert result["passed_tests"] == 0
    assert result["total_tests"] == 1


@pytest.mark.asyncio
async def test_all_four_battle_lifecycles_persist_submissions_results_and_xp(
    client, battle_question_bank
):
    from app.database.session import AsyncSessionLocal
    from app.models.battle import BattleParticipant, BattleResult, BattleSubmission
    from app.models.xp import XPLedger

    async def create_account(label):
        unique = uuid.uuid4().hex[:12]
        email = f"{label}-{unique}@example.com"
        registered = await client.post(
            "/auth/register",
            json={
                "username": f"{label}_{unique}",
                "email": email,
                "full_name": f"{label} Tester",
                "password": "StrongPass#123",
            },
        )
        assert registered.status_code == 201, registered.text
        login = await client.post(
            "/auth/login",
            json={"email": email, "password": "StrongPass#123"},
        )
        assert login.status_code == 200, login.text
        return {
            "id": login.json()["user"]["id"],
            "headers": {
                "Authorization": f"Bearer {login.json()['tokens']['access_token']}"
            },
        }

    async def create_room(account, question_type, mode):
        created = await client.post(
            "/battle/create",
            headers=account["headers"],
            json={
                "title": f"{mode} {question_type} lifecycle",
                "difficulty": "medium",
                "battle_type": "general",
                "battle_mode": mode,
                "max_players": 1 if mode == "solo" else 2,
                "question_type": question_type,
                "question_count": 1,
            },
        )
        assert created.status_code == 200, created.text
        data = created.json()
        assert data["mode"] == mode
        assert len(data["questions_data"]) == 1
        assert data["questions_data"][0]["question_type"] == question_type
        question = data["questions_data"][0]["questions"][0]
        assert "correct_option" not in question
        assert "hidden_test_cases" not in question
        started = None
        return data, question, started

    async def start_solo(account, battle_id):
        response = await client.post(
            f"/battle/{battle_id}/start",
            headers=account["headers"],
        )
        assert response.status_code == 200, response.text
        assert response.json()["status"] == "running"

    async def submit(account, battle_id, question, question_type, answer):
        response = await client.post(
            "/battle/submit-answer",
            headers=account["headers"],
            json={
                "battle_id": battle_id,
                "question_id": question["id"],
                "section_index": 0,
                "question_type": question_type,
                **answer,
            },
        )
        assert response.status_code == 200, response.text
        return response.json()

    async def finish(account, battle_id):
        response = await client.post(
            f"/battle/{battle_id}/finish",
            headers=account["headers"],
        )
        assert response.status_code == 200, response.text
        result = await client.get(
            f"/battle/{battle_id}/result",
            headers=account["headers"],
        )
        assert result.status_code == 200, result.text
        return result.json()

    solo_mcq = await create_account("solo_mcq")
    mcq_room, mcq_question, _ = await create_room(solo_mcq, "mcq", "solo")
    await start_solo(solo_mcq, mcq_room["id"])
    mcq_payload = {
        "battle_id": mcq_room["id"],
        "question_id": mcq_question["id"],
        "section_index": 0,
        "question_type": "mcq",
        "mcq_option": "A",
    }
    mcq_submission = await submit(
        solo_mcq, mcq_room["id"], mcq_question, "mcq", {"mcq_option": "A"}
    )
    assert mcq_submission["verdict"] == "Correct"
    verified = await client.post(
        f"/battle/{mcq_room['id']}/submission/{mcq_question['id']}/verify",
        headers=solo_mcq["headers"],
        json={"question_type": "mcq", "mcq_option": "A"},
    )
    assert verified.status_code == 200, verified.text
    assert verified.json()["verified"] is True
    mismatched = await client.post(
        f"/battle/{mcq_room['id']}/submission/{mcq_question['id']}/verify",
        headers=solo_mcq["headers"],
        json={"question_type": "mcq", "mcq_option": "B"},
    )
    assert mismatched.status_code == 200, mismatched.text
    assert mismatched.json()["verified"] is False
    participant_before_duplicate = await client.get(
        f"/battle/{mcq_room['id']}/participants",
        headers=solo_mcq["headers"],
    )
    assert participant_before_duplicate.status_code == 200
    score_before_duplicate = participant_before_duplicate.json()[0]["score"]

    duplicate = await client.post(
        "/battle/submit-answer",
        headers=solo_mcq["headers"],
        json=mcq_payload,
    )
    assert duplicate.status_code == 400
    assert duplicate.json()["detail"] == "This question has already been submitted."

    conflicting = await client.post(
        "/battle/submit-answer",
        headers=solo_mcq["headers"],
        json={**mcq_payload, "mcq_option": "B"},
    )
    assert conflicting.status_code == 400
    assert conflicting.json()["detail"] == "This question has already been submitted."

    participant_after_duplicate = await client.get(
        f"/battle/{mcq_room['id']}/participants",
        headers=solo_mcq["headers"],
    )
    assert participant_after_duplicate.status_code == 200
    assert participant_after_duplicate.json()[0]["score"] == score_before_duplicate

    async with AsyncSessionLocal() as db:
        saved_submissions = list((await db.execute(
            select(BattleSubmission).where(
                BattleSubmission.battle_id == mcq_room["id"],
                BattleSubmission.user_id == solo_mcq["id"],
                BattleSubmission.question_id == mcq_question["id"],
            )
        )).scalars().all())
        assert len(saved_submissions) == 1
        assert saved_submissions[0].mcq_option == "A"
        assert saved_submissions[0].id == mcq_submission["id"]

    await finish(solo_mcq, mcq_room["id"])
    result_response = await client.get(
        f"/battle/{mcq_room['id']}/result",
        headers=solo_mcq["headers"],
    )
    assert result_response.status_code == 200
    assert result_response.json()["battle_id"] == mcq_room["id"]
    history_response = await client.get("/battle/history", headers=solo_mcq["headers"])
    assert history_response.status_code == 200
    assert any(
        entry["battle_id"] == mcq_room["id"]
        for entry in history_response.json()["history"]
    )

    unrelated_user = await create_account("unrelated_battle_viewer")
    unauthorized_result = await client.get(
        f"/battle/{mcq_room['id']}/result",
        headers=unrelated_user["headers"],
    )
    assert unauthorized_result.status_code == 403

    solo_coding = await create_account("solo_code")
    coding_room, coding_question, _ = await create_room(
        solo_coding, "coding", "solo"
    )
    await start_solo(solo_coding, coding_room["id"])
    coding_submission = await submit(
        solo_coding,
        coding_room["id"],
        coding_question,
        "coding",
        {"source_code": "print(1)", "language": "python"},
    )
    assert coding_submission["verdict"] == "Accepted"
    await finish(solo_coding, coding_room["id"])

    for question_type, answer in (
        ("mcq", {"mcq_option": "A"}),
        ("coding", {"source_code": "print(1)", "language": "python"}),
    ):
        host = await create_account(f"duo_{question_type}_host")
        peer = await create_account(f"duo_{question_type}_peer")
        room, question, _ = await create_room(host, question_type, "duo")
        joined = await client.post(
            "/battle/join",
            headers=peer["headers"],
            json={"battle_id": room["id"]},
        )
        assert joined.status_code == 200, joined.text
        assert joined.json()["status"] == "ready"
        participants = await client.get(
            f"/battle/{room['id']}/participants",
            headers=peer["headers"],
        )
        assert participants.status_code == 200, participants.text
        assert len(participants.json()) == 2
        await start_solo(host, room["id"])
        await submit(host, room["id"], question, question_type, answer)

        premature_finish = await client.post(
            f"/battle/{room['id']}/finish",
            headers=host["headers"],
        )
        assert premature_finish.status_code == 409

        await submit(peer, room["id"], question, question_type, answer)
        result = await finish(host, room["id"])
        peer_result = await client.get(
            f"/battle/{room['id']}/result",
            headers=peer["headers"],
        )
        assert peer_result.status_code == 200, peer_result.text
        assert result["total_players"] == 2
        assert peer_result.json()["battle_id"] == room["id"]

        repeated_finish = await client.post(
            f"/battle/{room['id']}/finish",
            headers=host["headers"],
        )
        assert repeated_finish.status_code == 200, repeated_finish.text

        async with AsyncSessionLocal() as db:
            submission_count = await db.scalar(
                select(func.count(BattleSubmission.id)).where(
                    BattleSubmission.battle_id == room["id"]
                )
            )
            participant_count = await db.scalar(
                select(func.count(BattleParticipant.id)).where(
                    BattleParticipant.battle_id == room["id"]
                )
            )
            result_count = await db.scalar(
                select(func.count(BattleResult.id)).where(
                    BattleResult.battle_id == room["id"]
                )
            )
            host_awards = await db.scalar(
                select(func.count(XPLedger.id)).where(
                    XPLedger.user_id == host["id"],
                    XPLedger.source == "battle",
                    XPLedger.reference_id == room["id"],
                )
            )
            peer_awards = await db.scalar(
                select(func.count(XPLedger.id)).where(
                    XPLedger.user_id == peer["id"],
                    XPLedger.source == "battle",
                    XPLedger.reference_id == room["id"],
                )
            )

        assert submission_count == 2
        assert participant_count == 2
        assert result_count == 1
        assert host_awards == 1
        assert peer_awards == 1
