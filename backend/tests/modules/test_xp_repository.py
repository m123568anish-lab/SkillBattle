import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database.base import Base
from app.models.xp import XP
from app.modules.xp.repository import XPRepository


@pytest.mark.asyncio
async def test_increment_updates_all_xp_counters_atomically():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    repository = XPRepository()

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        session.add(XP(user_id="user-1", total_xp=490, weekly_xp=10, daily_xp=2, level=1))
        await session.commit()

        updated = await repository.increment(session, "user-1", 20)
        await session.commit()

        assert updated is not None
        assert updated.total_xp == 510
        assert updated.weekly_xp == 30
        assert updated.daily_xp == 22
        assert updated.level == 2

    await engine.dispose()
