from datetime import datetime, timedelta
from uuid import uuid4

import pytest
from sqlalchemy import select
from sqlalchemy.engine import URL
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.database.init_db  # noqa: F401 - register all mapped models
from app.database.base import Base
from app.models.battle.battle_participant import BattleParticipant
from app.models.battle.battle_result import BattleResult
from app.models.battle.battle_room import BattleRoom
from app.models.profile import Profile
from app.models.user import User
from app.models.xp import XP
from app.modules.auth.schemas.requests import RegisterRequest
from app.modules.auth.services.auth_service import auth_service
from app.modules.admin.schemas import AdminUserUpdate
from app.modules.admin.service import admin_service
from app.modules.battle.service import battle_service
from app.modules.battle.router import battle_history
from app.modules.battle.websocket import battle_ws
from app.modules.profile.schemas import ProfileUpdateRequest
from app.modules.profile.service import profile_service
from app.modules.xp.service import xp_service


@pytest.mark.asyncio
async def test_user_dashboard_data_persists_after_database_engine_restart(tmp_path, monkeypatch):
    database_path = tmp_path / "skillbattle-persistence-test.db"
    database_url = URL.create("sqlite+aiosqlite", database=str(database_path))
    engine = create_async_engine(database_url)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async def no_broadcast(*args, **kwargs):
        return None

    monkeypatch.setattr(battle_ws, "broadcast", no_broadcast)

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    suffix = uuid4().hex[:10]
    async with session_factory() as session:
        winner = await auth_service.register(
            session,
            RegisterRequest(
                username=f"persist_{suffix}",
                full_name="Persistence User",
                email=f"persist_{suffix}@example.com",
                password="PersistenceTest#123",
            ),
        )
        opponent = await auth_service.register(
            session,
            RegisterRequest(
                username=f"opponent_{suffix}",
                full_name="Battle Opponent",
                email=f"opponent_{suffix}@example.com",
                password="PersistenceTest#123",
            ),
        )
        winner_id = winner.id
        opponent_id = opponent.id

        updated_profile = await profile_service.update_profile(
            session,
            winner,
            ProfileUpdateRequest(full_name="Updated Persistence User", bio="Persisted profile"),
        )
        assert updated_profile.bio == "Persisted profile"

        xp = await xp_service.add_xp(session, winner, 550)
        assert xp.total_xp == 550
        assert xp.level == 2

        battle = BattleRoom(
            title="Persistence restart test",
            difficulty="Easy",
            problem_id=1,
            status="running",
            max_players=2,
            started_at=datetime.utcnow() - timedelta(seconds=20),
        )
        session.add(battle)
        await session.flush()
        battle_id = battle.id
        session.add_all(
            [
                BattleParticipant(battle_id=battle_id, user_id=winner_id, score=100, rank=1),
                BattleParticipant(battle_id=battle_id, user_id=opponent_id, score=40, rank=2),
            ]
        )
        await session.commit()

        result = await battle_service.finish_battle(session, battle_id)
        assert result is not None
        history = await battle_history(
            limit=10,
            offset=0,
            db=session,
            current_user=winner,
        )
        assert history["total"] == 1
        assert history["history"][0]["battle_id"] == battle_id

        admin_update = await admin_service.update_user(
            session,
            winner_id,
            AdminUserUpdate(full_name="Admin Persisted Name", is_active=True),
        )
        assert admin_update is not None
        assert admin_update.full_name == "Admin Persisted Name"

    await engine.dispose()

    restarted_engine = create_async_engine(database_url)
    restarted_session_factory = async_sessionmaker(restarted_engine, expire_on_commit=False)
    async with restarted_session_factory() as session:
        persisted_user = await session.get(User, winner_id)
        assert persisted_user is not None
        assert persisted_user.full_name == "Admin Persisted Name"

        persisted_profile = (
            await session.execute(select(Profile).where(Profile.user_id == winner_id))
        ).scalar_one()
        assert persisted_profile.bio == "Persisted profile"

        persisted_xp = (
            await session.execute(select(XP).where(XP.user_id == winner_id))
        ).scalar_one()
        assert persisted_xp.total_xp == 700
        assert persisted_xp.level == 2

        persisted_result = (
            await session.execute(select(BattleResult).where(BattleResult.battle_id == battle_id))
        ).scalar_one()
        assert persisted_result.xp_earned == 200
        persisted_history = await battle_history(
            limit=10,
            offset=0,
            db=session,
            current_user=persisted_user,
        )
        assert persisted_history["total"] == 1
        assert persisted_history["history"][0]["battle_id"] == battle_id

    await restarted_engine.dispose()
