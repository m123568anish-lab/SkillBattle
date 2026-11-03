from uuid import uuid4

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.database.init_db  # noqa: F401
from app.database.base import Base
from app.models.user import User
from app.models.xp import XP
from app.modules.leaderboard.service import leaderboard_service


@pytest.mark.asyncio
async def test_leaderboard_uses_persisted_counts_and_actual_eligible_user_total():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with session_factory() as db:
        first = User(
            id="00000000-0000-0000-0000-000000000001",
            username=f"leader_{uuid4().hex[:8]}",
            full_name="Leaderboard First",
            email=f"{uuid4().hex}@example.com",
            password_hash="test-hash",
        )
        second = User(
            id="00000000-0000-0000-0000-000000000002",
            username=f"leader_{uuid4().hex[:8]}",
            full_name="Leaderboard Second",
            email=f"{uuid4().hex}@example.com",
            password_hash="test-hash",
        )
        db.add_all([first, second])
        await db.flush()
        db.add(XP(user_id=first.id, total_xp=500, level=2))
        await db.commit()

        response = await leaderboard_service.get_global_leaderboard(db)
        entries = response["leaderboard"]
        first_entry = next(item for item in entries if item["user_id"] == first.id)
        second_entry = next(item for item in entries if item["user_id"] == second.id)
        rank = await leaderboard_service.my_rank(db, second)

        assert len(entries) == 2
        assert first_entry["rank"] == 1
        assert first_entry["solved"] == 0
        assert first_entry["rating"] == 0
        assert first_entry["battles_count"] == 0
        assert second_entry["rank"] == 2
        assert rank == {"rank": 2, "total_users": 2, "xp": 0, "level": 1}

    await engine.dispose()
