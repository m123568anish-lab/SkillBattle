from datetime import datetime

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.database.base import Base
from app.models import CampaignAttempt, Problem, Question, User
from app.modules.campaign.service import campaign_service


@pytest.mark.asyncio
async def test_campaign_selects_small_subset_from_large_pool():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as db:
        user = User(
            username="campaign-user",
            full_name="Campaign User",
            email="campaign-user@example.com",
            password_hash="hash",
        )
        db.add(user)
        await db.commit()

        for index in range(20):
            db.add(
                Question(
                    title=f"MCQ {index}",
                    slug=f"mcq-{index}",
                    description=f"Question {index} description for campaign selection.",
                    difficulty="easy" if index < 10 else "medium",
                    question_type="mcq",
                    options=["A", "B", "C", "D"],
                    correct_option="A",
                    skill_category="Arrays",
                    is_active=True,
                    is_validated=True,
                    created_at=datetime.utcnow(),
                )
            )

        for index in range(8):
            db.add(
                Problem(
                    title=f"Problem {index}",
                    slug=f"problem-{index}",
                    description=f"Coding problem {index} for campaign selection.",
                    difficulty="easy" if index < 4 else "medium",
                    category="Arrays",
                    input_format="input",
                    output_format="output",
                    constraints="1 <= n <= 10^5",
                    explanation="solve it",
                    xp_reward=50,
                    time_limit=2,
                    memory_limit=256,
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
            )

        await db.commit()

        level = await campaign_service.get_level(db, user.id, "dsa", 1)

        assert len(level.questions) == 5
        assert len(level.coding_problems) == 2
        assert len({q.id for q in level.questions}) == 5
        assert len({p.id for p in level.coding_problems}) == 2

    await engine.dispose()


@pytest.mark.asyncio
async def test_campaign_keeps_fixed_challenge_after_start():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as db:
        user = User(
            username="campaign-user-2",
            full_name="Campaign User 2",
            email="campaign-user-2@example.com",
            password_hash="hash",
        )
        db.add(user)
        await db.commit()

        for index in range(12):
            db.add(
                Question(
                    title=f"MCQ fixed {index}",
                    slug=f"mcq-fixed-{index}",
                    description=f"Fixed challenge question {index}.",
                    difficulty="easy",
                    question_type="mcq",
                    options=["A", "B", "C", "D"],
                    correct_option="A",
                    skill_category="Arrays",
                    is_active=True,
                    is_validated=True,
                    created_at=datetime.utcnow(),
                )
            )

        for index in range(6):
            db.add(
                Problem(
                    title=f"Fixed problem {index}",
                    slug=f"fixed-problem-{index}",
                    description=f"Fixed coding challenge {index}.",
                    difficulty="easy",
                    category="Arrays",
                    input_format="input",
                    output_format="output",
                    constraints="1 <= n <= 10^5",
                    explanation="solve it",
                    xp_reward=50,
                    time_limit=2,
                    memory_limit=256,
                    is_active=True,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
            )

        await db.commit()

        first = await campaign_service.get_level(db, user.id, "dsa", 1)
        second = await campaign_service.get_level(db, user.id, "dsa", 1)

        assert [q.id for q in first.questions] == [q.id for q in second.questions]
        assert [p.id for p in first.coding_problems] == [p.id for p in second.coding_problems]

    await engine.dispose()


@pytest.mark.asyncio
async def test_campaign_rejects_insufficient_content():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as db:
        user = User(
            username="campaign-user-3",
            full_name="Campaign User 3",
            email="campaign-user-3@example.com",
            password_hash="hash",
        )
        db.add(user)
        await db.commit()

        for index in range(3):
            db.add(
                Question(
                    title=f"Short pool {index}",
                    slug=f"short-pool-{index}",
                    description=f"Low supply question {index}.",
                    difficulty="easy",
                    question_type="mcq",
                    options=["A", "B", "C", "D"],
                    correct_option="A",
                    skill_category="Arrays",
                    is_active=True,
                    is_validated=True,
                    created_at=datetime.utcnow(),
                )
            )

        db.add(
            Problem(
                title="One coding problem",
                slug="one-coding-problem",
                description="Only one coding problem exists.",
                difficulty="easy",
                category="Arrays",
                input_format="input",
                output_format="output",
                constraints="1 <= n <= 10^5",
                explanation="solve it",
                xp_reward=50,
                time_limit=2,
                memory_limit=256,
                is_active=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
        )
        await db.commit()

        with pytest.raises(ValueError, match="CAMPAIGN_LEVEL_UNAVAILABLE"):
            await campaign_service.get_level(db, user.id, "dsa", 1)

    await engine.dispose()
