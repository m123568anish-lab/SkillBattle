import importlib.util
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from alembic.migration import MigrationContext
from alembic.operations import Operations
from sqlalchemy import Column, Integer, MetaData, String, Table, create_engine, inspect

from app.modules.battle.repository import battle_repository
from app.modules.battle.service import battle_service


migration_path = (
    Path(__file__).resolve().parents[2]
    / "alembic"
    / "versions"
    / "c1f4a8d2e9b0_add_adaptive_battle_history.py"
)
migration_spec = importlib.util.spec_from_file_location("adaptive_battle_migration", migration_path)
assert migration_spec and migration_spec.loader
migration = importlib.util.module_from_spec(migration_spec)
migration_spec.loader.exec_module(migration)


def test_adaptive_battle_migration_upgrades_and_downgrades_sqlite():
    engine = create_engine("sqlite:///:memory:")
    metadata = MetaData()
    Table("users", metadata, Column("id", String(36), primary_key=True))
    Table("questions", metadata, Column("id", Integer, primary_key=True))
    Table(
        "battle_rooms",
        metadata,
        Column("id", String(36), primary_key=True),
    )
    metadata.create_all(engine)

    with engine.begin() as connection:
        migration_context = MigrationContext.configure(connection)
        with Operations.context(migration_context):
            migration.upgrade()
        inspector = inspect(connection)
        battle_columns = {column["name"] for column in inspector.get_columns("battle_rooms")}
        assert {"adaptive_owner_id", "adaptive_date"} <= battle_columns
        assert "uq_battle_rooms_adaptive_owner_date" in {
            constraint["name"] for constraint in inspector.get_unique_constraints("battle_rooms")
        }
        assert "question_exposures" in inspector.get_table_names()

        with Operations.context(migration_context):
            migration.downgrade()
        inspector = inspect(connection)
        battle_columns = {column["name"] for column in inspector.get_columns("battle_rooms")}
        assert "adaptive_owner_id" not in battle_columns
        assert "adaptive_date" not in battle_columns
        assert "question_exposures" not in inspector.get_table_names()

    engine.dispose()


@pytest.mark.asyncio
async def test_daily_battle_cannot_finish_until_every_question_is_submitted(monkeypatch):
    battle = SimpleNamespace(
        id="daily-battle",
        adaptive_owner_id="student-id",
        questions_data=[
            {"questions": [{"id": 101}, {"id": 102}]},
        ],
    )
    monkeypatch.setattr(battle_repository, "get_battle", AsyncMock(return_value=battle))
    monkeypatch.setattr(
        battle_repository,
        "get_participants",
        AsyncMock(return_value=[SimpleNamespace(user_id="student-id", score=0, joined_at=None)]),
    )
    monkeypatch.setattr(
        "app.modules.battle.service.battle_result_engine.generate_comprehensive_result",
        lambda *_: {
            "winner_id": "student-id",
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

    with pytest.raises(ValueError, match="Complete every question"):
        await battle_service.finish_battle(db, battle.id)

    db.add.assert_not_called()
    db.commit.assert_not_awaited()
