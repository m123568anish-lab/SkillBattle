import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.database.init_db  # noqa: F401
from app.database.base import Base
from app.models.question import Question, UserSubmission
from app.models.streak import Streak
from app.models.user import User
from app.models.user_skill_stat import UserSkillStat
from app.models.xp import XP, XPLedger
from app.modules.practice.router import (
    MCQAnswerRequest,
    list_mcq_questions,
    submit_mcq_answer,
)


@pytest.mark.asyncio
async def test_mcq_completion_persists_and_isolated_with_idempotent_xp():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as session:
        learner = User(
            username="mcq-learner",
            full_name="MCQ Learner",
            email="mcq-learner@example.test",
            password_hash="test-hash",
        )
        other = User(
            username="mcq-other",
            full_name="Other Learner",
            email="mcq-other@example.test",
            password_hash="test-hash",
        )
        question = Question(
            title="Persisted MCQ",
            slug="persisted-mcq",
            description="Choose the correct option.",
            difficulty="easy",
            question_type="mcq",
            options=["Correct option", "Incorrect option"],
            correct_option="A",
            skill_category="Arrays",
            is_active=True,
        )
        session.add_all([learner, other, question])
        await session.commit()

        available = await list_mcq_questions(
            count=5,
            difficulty=None,
            topic="all",
            db=session,
            current_user=learner,
        )
        assert len(available["questions"]) == 1
        assert available["questions"][0]["options"] == ["Correct option", "Incorrect option"]
        assert "correct_option" not in available["questions"][0]

        result = await submit_mcq_answer(
            MCQAnswerRequest(question_id=question.id, selected_index=0),
            db=session,
            current_user=learner,
        )
        assert result["correct"] is True
        assert result["xp_earned"] == 25
        question_id = question.id
        learner_id = learner.id
        other_id = other.id

        duplicate = await submit_mcq_answer(
            MCQAnswerRequest(question_id=question_id, selected_index=0),
            db=session,
            current_user=learner,
        )
        assert duplicate["already_solved"] is True
        assert duplicate["xp_earned"] == 0

        other_available = await list_mcq_questions(
            count=5,
            difficulty=None,
            topic="all",
            db=session,
            current_user=other,
        )
        assert [item["id"] for item in other_available["questions"]] == [question_id]

        wrong = await submit_mcq_answer(
            MCQAnswerRequest(question_id=question_id, selected_index=1),
            db=session,
            current_user=other,
        )
        assert wrong["correct"] is False
        assert wrong["xp_earned"] == 0

    async with session_factory() as verification:
        learner_submission = (
            await verification.execute(
                select(UserSubmission).where(
                    UserSubmission.user_id == learner_id,
                    UserSubmission.question_id == question_id,
                )
            )
        ).scalar_one()
        other_submission = (
            await verification.execute(
                select(UserSubmission).where(
                    UserSubmission.user_id == other_id,
                    UserSubmission.question_id == question_id,
                )
            )
        ).scalar_one()
        learner_xp = (
            await verification.execute(select(XP).where(XP.user_id == learner_id))
        ).scalar_one()
        other_xp = (
            await verification.execute(select(XP).where(XP.user_id == other_id))
        ).scalar_one_or_none()
        ledger = (
            await verification.execute(
                select(XPLedger).where(
                    XPLedger.user_id == learner_id,
                    XPLedger.source == "mcq_correct",
                    XPLedger.reference_id == str(question_id),
                )
            )
        ).scalar_one()
        learner_streak = (
            await verification.execute(select(Streak).where(Streak.user_id == learner_id))
        ).scalar_one()
        learner_skill_stat = (
            await verification.execute(
                select(UserSkillStat).where(
                    UserSkillStat.user_id == learner_id,
                    UserSkillStat.subject == "Arrays",
                )
            )
        ).scalar_one()
        other_streak = (
            await verification.execute(select(Streak).where(Streak.user_id == other_id))
        ).scalar_one_or_none()

        assert learner_submission.solved is True
        assert learner_submission.total_tests == 2
        assert learner_submission.passed_tests == 2
        assert other_submission.solved is False
        assert learner_xp.total_xp == 25
        assert other_xp is None
        assert ledger.amount == 25
        assert learner_streak.current_streak == 1
        assert learner_skill_stat.total_attempts == 2
        assert learner_skill_stat.correct_attempts == 2
        assert other_streak is None

    await engine.dispose()
