from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.models import Base, BattleRoom, QuestProgress, Question, User
from app.modules.battle.service import battle_service
from app.modules.battle.repository import battle_repository
from app.modules.quest_map.catalog import get_level_catalog
from app.modules.quest_map.scoring import stars_for_accuracy
from app.modules.quest_map.service import quest_map_service
from app.modules.skill_intelligence.service import CANONICAL_SKILL_TREE


def test_quest_catalog_uses_canonical_skills_and_server_prerequisites():
    levels = get_level_catalog()
    canonical_skills = {skill for skills in CANONICAL_SKILL_TREE.values() for skill in skills}
    level_ids = {level["id"] for level in levels}

    assert len(levels) == 9
    assert all(level["skill_category"] in canonical_skills for level in levels)
    assert all(set(level["prerequisite_level_ids"]) <= level_ids for level in levels)
    assert next(level for level in levels if level["id"] == "placement-checkpoint")["is_milestone"]


@pytest.mark.parametrize(
    ("accuracy", "expected_stars"),
    [(0, 1), (69.99, 1), (70, 2), (89.99, 2), (90, 3), (100, 3)],
)
def test_quest_stars_are_deterministic(accuracy, expected_stars):
    assert stars_for_accuracy(accuracy) == expected_stars


@pytest.mark.asyncio
async def test_locked_level_cannot_start_a_battle(monkeypatch):
    level = SimpleNamespace(
        id="sql-join-skill",
        is_active=True,
        prerequisite_level_ids=["sql-select-skill"],
    )
    prerequisite = SimpleNamespace(id="sql-select-skill", title="SQL Selection")
    monkeypatch.setattr(
        quest_map_service,
        "ensure_catalog",
        AsyncMock(return_value=[level, prerequisite]),
    )
    db = AsyncMock()
    db.scalar = AsyncMock(return_value=None)
    db.scalars = AsyncMock(return_value=SimpleNamespace(all=lambda: []))
    create_battle = AsyncMock()
    monkeypatch.setattr(battle_service, "create_battle", create_battle)

    with pytest.raises(ValueError, match="Locked.*SQL Selection"):
        await quest_map_service.start_level(db, SimpleNamespace(id="student-a"), level.id)

    create_battle.assert_not_awaited()
    db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_quest_battle_cannot_complete_before_every_question(monkeypatch):
    battle = SimpleNamespace(
        id="quest-battle",
        adaptive_owner_id=None,
        questions_data=[{"questions": [{"id": 101}, {"id": 102}]}],
        started_at=None,
        status="running",
    )
    progress = SimpleNamespace(user_id="student-a", status="IN_PROGRESS")
    monkeypatch.setattr(battle_repository, "get_battle", AsyncMock(return_value=battle))
    monkeypatch.setattr(
        battle_repository,
        "get_participants",
        AsyncMock(return_value=[SimpleNamespace(user_id="student-a", score=0, joined_at=None)]),
    )
    monkeypatch.setattr(
        "app.modules.battle.service.battle_result_engine.generate_comprehensive_result",
        lambda *_: {
            "winner_id": "student-a",
            "winner_score": 0,
            "is_draw": False,
            "total_players": 1,
            "average_score": 0.0,
            "accuracy_percentage": 0.0,
            "section_scores": {},
            "question_breakdown": [],
            "skill_breakdown": {},
            "placement_readiness": {},
            "recommendations": [],
        },
    )
    db = AsyncMock()
    db.execute.side_effect = [
        SimpleNamespace(scalar_one_or_none=lambda: None),
        SimpleNamespace(scalars=lambda: SimpleNamespace(all=lambda: [])),
    ]
    db.scalar.return_value = progress

    with pytest.raises(ValueError, match="Complete every question"):
        await battle_service.finish_battle(db, battle.id)

    db.add.assert_not_called()
    db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_map_persists_catalog_and_unlocks_per_student():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as db:
        student = User(
            username="quest-student",
            full_name="Quest Student",
            email="quest-student@example.test",
            password_hash="test-hash",
        )
        db.add(student)
        await db.commit()

        initial = await quest_map_service.get_map(db, student)
        first_level = next(level for level in initial["levels"] if level["id"] == "arrays-foundation")
        next_level = next(level for level in initial["levels"] if level["id"] == "strings-practice")
        assert first_level["status"] == "AVAILABLE"
        assert not first_level["can_start"]
        assert next_level["status"] == "LOCKED"

        with pytest.raises(ValueError, match="Not enough validated mcq questions"):
            await quest_map_service.start_level(db, student, "arrays-foundation")
        assert not (await db.scalars(select(BattleRoom))).all()
        assert not (await db.scalars(select(QuestProgress))).all()

        db.add(Question(
            title="Array indexing check",
            slug="array-indexing-check",
            description="Select the time complexity for direct array index access.",
            difficulty="easy",
            question_type="mcq",
            options=["O(1)", "O(n)"],
            correct_option="O(1)",
            skill_category="Arrays",
            is_validated=True,
            is_active=True,
        ))
        await db.commit()
        started = await quest_map_service.start_level(db, student, "arrays-foundation")
        battle = await db.get(BattleRoom, started["battle_id"])
        progress = await db.scalar(select(QuestProgress).where(
            QuestProgress.user_id == student.id,
            QuestProgress.level_id == "arrays-foundation",
        ))
        assert battle.status == "running"
        assert battle.battle_type == "practice"
        assert progress.status == "IN_PROGRESS"
        assert progress.battle_id == battle.id

        progress.status = "COMPLETED"
        progress.stars = 1
        progress.best_accuracy = 62.5
        await db.commit()
        after_completion = await quest_map_service.get_map(db, student)
        assert next(level for level in after_completion["levels"] if level["id"] == "strings-practice")["status"] == "AVAILABLE"

        another_student = User(
            username="quest-student-two",
            full_name="Another Student",
            email="quest-student-two@example.test",
            password_hash="test-hash",
        )
        db.add(another_student)
        await db.commit()
        isolated_map = await quest_map_service.get_map(db, another_student)
        assert next(level for level in isolated_map["levels"] if level["id"] == "strings-practice")["status"] == "LOCKED"

    await engine.dispose()