from datetime import datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.modules.battle.adaptive_selection import (
    calibrated_difficulty,
    novelty_score,
    score_question,
)
from app.modules.battle.question_engine import question_engine
from app.modules.battle.service import battle_service


def candidate(category: str = "graphs", difficulty: str = "medium"):
    return SimpleNamespace(
        id=1,
        title="A sample question",
        description="A valid question description",
        skill_category=category,
        question_type="mcq",
        difficulty=difficulty,
        is_active=True,
        is_validated=True,
        options=[{"key": "A", "text": "First"}, {"key": "B", "text": "Second"}],
        correct_option="A",
        hidden_test_cases=[],
        examples=[],
        company_tags=[],
        constraints="",
        buggy_code="",
        fixed_code_reference="",
        rubric={},
        explanation="",
        topic_tags=[],
    )


class FakeResult:
    def __init__(self, rows):
        self.rows = rows

    def scalars(self):
        return self

    def all(self):
        return self.rows

    def scalar_one_or_none(self):
        return self.rows[0] if self.rows else None


def test_weak_skill_is_ranked_above_strong_skill():
    now = datetime.utcnow()
    weak = score_question(
        candidate(),
        skill_accuracy=0.3,
        type_accuracy=None,
        last_seen_at=None,
        exposure_count=0,
        last_question_correct=None,
        requested_difficulty="medium",
        now=now,
        selected_categories={},
        selected_types={},
    )
    strong = score_question(
        candidate(),
        skill_accuracy=0.9,
        type_accuracy=None,
        last_seen_at=None,
        exposure_count=0,
        last_question_correct=None,
        requested_difficulty="medium",
        now=now,
        selected_categories={},
        selected_types={},
    )
    assert weak > strong


def test_recent_exposure_receives_a_novelty_penalty_and_decays():
    now = datetime.utcnow()
    unseen = novelty_score(None, 0, now)
    recent = novelty_score(now - timedelta(hours=1), 1, now)
    older = novelty_score(now - timedelta(days=60), 1, now)
    assert unseen > recent
    assert older > recent


def test_repeated_exposure_is_penalized_more_than_a_single_exposure():
    now = datetime.utcnow()
    once = novelty_score(now, 1, now)
    repeated = novelty_score(now, 4, now)
    assert once > repeated


def test_difficulty_calibration_uses_observed_skill_accuracy():
    assert calibrated_difficulty("medium", 0.3) == 0
    assert calibrated_difficulty("medium", 0.6) == 1
    assert calibrated_difficulty("medium", 0.9) == 2
    assert calibrated_difficulty("hard", 0.9) == 2


def test_diversity_penalizes_repeated_topics_and_types():
    now = datetime.utcnow()
    fresh = score_question(
        candidate(),
        skill_accuracy=None,
        type_accuracy=None,
        last_seen_at=None,
        exposure_count=0,
        last_question_correct=None,
        requested_difficulty="medium",
        now=now,
        selected_categories={},
        selected_types={},
    )
    repeated = score_question(
        candidate(),
        skill_accuracy=None,
        type_accuracy=None,
        last_seen_at=None,
        exposure_count=0,
        last_question_correct=None,
        requested_difficulty="medium",
        now=now,
        selected_categories={"graphs": 1},
        selected_types={"mcq": 1},
    )
    assert fresh > repeated


def test_coding_question_validation_requires_real_test_cases():
    assert not question_engine.validate_question_data({
        "title": "Sum values",
        "description": "Read two values and return their sum.",
        "question_type": "coding",
    })
    assert question_engine.validate_question_data({
        "title": "Sum values",
        "description": "Read two values and return their sum.",
        "question_type": "coding",
        "hidden_test_cases": [{"input": "1 2", "output": "3"}],
    })


def test_sql_and_aptitude_questions_use_canonical_validation_rules():
    sql_question = {
        "title": "Select top employees",
        "description": "Write the SQL query to fetch top employees by salary.",
        "question_type": "sql",
        "difficulty": "medium",
        "expected_output": "SELECT * FROM employees ORDER BY salary DESC LIMIT 5;",
    }
    aptitude_question = {
        "title": "Percentage puzzle",
        "description": "A student scores 80% in quiz and 60% in project.",
        "question_type": "aptitude",
        "difficulty": "easy",
        "options": [{"key": "A", "text": "70%"}, {"key": "B", "text": "72%"}],
        "correct_option": "A",
    }
    assert question_engine.validate_question_data(sql_question)
    assert question_engine.validate_question_data(aptitude_question)


def test_adaptive_aptitude_question_uses_choice_validation():
    aptitude_question = candidate()
    aptitude_question.question_type = "aptitude"
    assert question_engine._is_adaptively_eligible(aptitude_question)


def test_running_battle_sanitization_hides_answer_bearing_fields():
    question_payload = {
        "id": 1,
        "correct_option": "A",
        "fixed_code_reference": "print('answer')",
        "hidden_test_cases": [{"input": "secret", "output": "secret"}],
        "rubric": {"key_concepts": ["secret answer"]},
        "explanation": "The correct answer is A.",
        "buggy_code": "print('bug')",
    }
    sections = [{"section_index": 0, "question_type": "technical", "questions": [question_payload]}]

    sanitized = question_engine.sanitize_sections_for_client(sections, is_completed=False)
    assert sanitized[0]["questions"][0] == {"id": 1, "buggy_code": "print('bug')"}

    completed = question_engine.sanitize_sections_for_client(sections, is_completed=True)
    assert completed[0]["questions"][0]["correct_option"] == "A"


def test_default_assessment_sections_follow_canonical_question_mix():
    sections = question_engine.get_default_assessment_sections("practice")
    assert sections
    question_types = {section["question_type"] for section in sections}
    assert {"coding", "mcq", "technical"}.issubset(question_types)


async def test_adaptive_selection_uses_persisted_weak_skill_evidence():
    weak_question = candidate("graphs")
    strong_question = candidate("arrays")
    strong_question.id = 2
    db = AsyncMock()
    db.execute.side_effect = [
        FakeResult([strong_question, weak_question]),
        FakeResult([
            SimpleNamespace(subject="graphs", correct_attempts=1, total_attempts=10),
            SimpleNamespace(subject="arrays", correct_attempts=9, total_attempts=10),
        ]),
        FakeResult([]),
        FakeResult([]),
        FakeResult([]),
    ]

    sections = await question_engine.get_adaptive_questions_for_user(
        db,
        "student-id",
        [{"title": "Knowledge", "question_type": "mcq", "question_count": 1}],
    )

    assert sections[0]["questions"][0]["id"] == weak_question.id


async def test_adaptive_selection_avoids_duplicate_ids_and_diversifies_topics():
    first_topic = candidate("arrays")
    second_topic = candidate("graphs")
    second_topic.id = 2
    third_question = candidate("arrays")
    third_question.id = 3
    db = AsyncMock()
    db.execute.side_effect = [
        FakeResult([first_topic, second_topic, third_question]),
        FakeResult([]),
        FakeResult([]),
        FakeResult([]),
        FakeResult([]),
    ]

    sections = await question_engine.get_adaptive_questions_for_user(
        db,
        "student-id",
        [{"title": "Knowledge", "question_type": "mcq", "question_count": 2}],
    )
    selected_ids = [question["id"] for question in sections[0]["questions"]]
    assert len(selected_ids) == len(set(selected_ids))
    assert {question["skill_category"] for question in sections[0]["questions"]} == {"arrays", "graphs"}


async def test_insufficient_adaptive_questions_fail_with_a_clear_message():
    db = AsyncMock()
    db.execute.side_effect = [
        FakeResult([candidate()]),
        FakeResult([]),
        FakeResult([]),
        FakeResult([]),
        FakeResult([]),
    ]
    try:
        await question_engine.get_adaptive_questions_for_user(
            db,
            "student-id",
            [{"title": "Knowledge", "question_type": "mcq", "question_count": 2}],
        )
    except ValueError as error:
        assert "Not enough validated mcq questions" in str(error)
    else:
        raise AssertionError("Insufficient questions should not be replaced with synthetic content.")


async def test_resolve_questions_for_sections_rejects_shortage_instead_of_generating_fallback():
    db = AsyncMock()
    db.execute.return_value = FakeResult([candidate()])

    with pytest.raises(ValueError, match="required 2, available 1"):
        await question_engine.resolve_questions_for_sections(
            db,
            [{"title": "Knowledge", "question_type": "mcq", "question_count": 2}],
            difficulty="medium",
        )

    db.add.assert_not_called()
    db.commit.assert_not_awaited()


async def test_coding_fallback_never_creates_an_untestable_question():
    db = AsyncMock()
    db.execute.return_value = FakeResult([])

    with pytest.raises(ValueError, match="executable test cases"):
        await question_engine._get_fallback_question(db, "coding")

    db.add.assert_not_called()
    db.commit.assert_not_awaited()


async def test_daily_battle_reuses_the_existing_battle_for_the_day():
    existing = SimpleNamespace(id="existing-battle")
    db = AsyncMock()
    db.execute.return_value = FakeResult([existing])

    battle = await battle_service.get_or_create_daily_battle(
        db,
        SimpleNamespace(id="student-id"),
    )

    assert battle is existing
    db.commit.assert_not_awaited()
