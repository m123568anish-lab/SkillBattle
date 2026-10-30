from datetime import date, datetime, timedelta
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.database.init_db  # noqa: F401 - register all mapped models
from app.database.base import Base
from app.models.streak import Streak, UserDailyActivity
from app.models.user import User
from app.models.user_stats import UserStats
from app.models.xp import XP
from app.models.problem import Problem
from app.models.problem_testcase import ProblemTestCase
from app.models.battle.battle_room import BattleRoom
from app.models.battle.battle_participant import BattleParticipant
from app.modules.streak.service import streak_service
from app.modules.compiler.service import compiler_service
from app.modules.compiler.schemas import JudgeResult, SubmitCodeRequest
from app.modules.battle.service import battle_service
from app.modules.battle.websocket import battle_ws
from app.modules.leaderboard.service import leaderboard_service
from app.modules.leaderboard.cache import leaderboard_cache


@pytest.mark.asyncio
async def test_user_daily_activity_uniqueness_and_idempotency():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        user = User(
            id="streak-user-101",
            username="streak_test_user",
            full_name="Streak User",
            email="streak_user@example.com",
            password_hash="test-pass",
        )
        session.add(user)
        await session.commit()

        today = date.today()

        # First activity of the day
        curr_streak, best_streak = await streak_service.record_activity(
            session,
            user_id=user.id,
            activity_type="practice",
            reference_id="prob-1",
            xp_earned=50,
            activity_date=today,
            commit=True,
        )
        assert curr_streak == 1
        assert best_streak == 1

        info = await streak_service.get_streak(session, user.id)
        assert info["current_streak"] == 1
        assert info["best_streak"] == 1
        assert info["is_active_today"] is True

        # Second activity on the same day with different reference_id
        curr_streak2, best_streak2 = await streak_service.record_activity(
            session,
            user_id=user.id,
            activity_type="practice",
            reference_id="prob-2",
            xp_earned=30,
            activity_date=today,
            commit=True,
        )
        # Should NOT increment streak twice on the same day
        assert curr_streak2 == 1
        assert best_streak2 == 1

        # Check DB UserDailyActivity count for user is strictly 1
        activities = (await session.execute(
            select(UserDailyActivity).where(UserDailyActivity.user_id == user.id)
        )).scalars().all()
        assert len(activities) == 1

    await engine.dispose()


@pytest.mark.asyncio
async def test_streak_consecutive_progression_and_break():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        user = User(
            id="streak-user-102",
            username="consecutive_user",
            full_name="Consecutive User",
            email="consecutive@example.com",
            password_hash="test-pass",
        )
        session.add(user)
        await session.commit()

        base_date = date(2026, 1, 1)

        # Day 1: Jan 1 -> streak 1
        c1, b1 = await streak_service.record_activity(
            session, user.id, "practice", "task-1", 10, activity_date=base_date, commit=True
        )
        assert c1 == 1
        assert b1 == 1

        # Day 2: Jan 2 -> streak 2
        c2, b2 = await streak_service.record_activity(
            session, user.id, "practice", "task-2", 10, activity_date=base_date + timedelta(days=1), commit=True
        )
        assert c2 == 2
        assert b2 == 2

        # Day 3: Jan 3 -> streak 3
        c3, b3 = await streak_service.record_activity(
            session, user.id, "practice", "task-3", 10, activity_date=base_date + timedelta(days=2), commit=True
        )
        assert c3 == 3
        assert b3 == 3

        # Day 5: Jan 5 (Missed Jan 4!) -> streak resets to 1, best_streak stays 3
        c5, b5 = await streak_service.record_activity(
            session, user.id, "practice", "task-4", 10, activity_date=base_date + timedelta(days=4), commit=True
        )
        assert c5 == 1
        assert b5 == 3

    await engine.dispose()


@pytest.mark.asyncio
async def test_streak_expiration_on_read():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        user = User(
            id="streak-user-103",
            username="lapsed_user",
            full_name="Lapsed User",
            email="lapsed@example.com",
            password_hash="test-pass",
        )
        session.add(user)
        await session.commit()

        # Last activity was 5 days ago
        old_date = date.today() - timedelta(days=5)
        streak_row = Streak(
            user_id=user.id,
            current_streak=7,
            best_streak=14,
            last_activity_date=old_date,
            last_active=datetime.utcnow() - timedelta(days=5),
        )
        session.add(streak_row)
        await session.commit()

        # Reading streak via get_streak notices the missed days and returns current_streak as 0
        streak_info = await streak_service.get_streak(session, user.id)
        assert streak_info["current_streak"] == 0
        assert streak_info["best_streak"] == 14
        assert streak_info["is_active_today"] is False

    await engine.dispose()


@pytest.mark.asyncio
async def test_streak_reconciliation_from_historical_activities():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        user = User(
            id="streak-user-104",
            username="reconcile_user",
            full_name="Reconcile User",
            email="reconcile@example.com",
            password_hash="test-pass",
        )
        session.add(user)
        await session.commit()

        today = date.today()
        yesterday = today - timedelta(days=1)
        two_days_ago = today - timedelta(days=2)

        # Add 3 consecutive days of activities
        session.add_all([
            UserDailyActivity(user_id=user.id, activity_date=two_days_ago, activity_type="battle", xp_earned=100),
            UserDailyActivity(user_id=user.id, activity_date=yesterday, activity_type="compiler", xp_earned=50),
            UserDailyActivity(user_id=user.id, activity_date=today, activity_type="daily_challenge", xp_earned=25),
        ])
        await session.commit()

        # Reconcile streak
        curr, best = await streak_service.reconcile_streak(session, user.id)
        assert curr == 3
        assert best == 3

        # Check DB Streak row matches
        db_streak = (await session.execute(
            select(Streak).where(Streak.user_id == user.id)
        )).scalar_one()
        assert db_streak.current_streak == 3
        assert db_streak.best_streak == 3

    await engine.dispose()


@pytest.mark.asyncio
async def test_compiler_submission_triggers_streak(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    def accepted_judgement(*args, **kwargs):
        return JudgeResult(
            verdict="Accepted",
            passed_tests=1,
            total_tests=1,
            execution_time=10,
            memory_used=1,
            failed_test_index=None,
            runtime_ms=10,
            memory_mb=1,
            score=100,
        )

    async def no_battle_notification(*args, **kwargs):
        return None

    monkeypatch.setattr("app.modules.compiler.service.judge_engine.judge", accepted_judgement)
    monkeypatch.setattr(compiler_service, "notify_battle", no_battle_notification)

    async with session_factory() as session:
        user = User(
            id="streak-user-105",
            username="solver_user",
            full_name="Solver User",
            email="solver@example.com",
            password_hash="test-pass",
        )
        session.add(user)
        session.add(UserStats(user_id=user.id, level=1, rating=1000, xp=0))
        await session.flush()

        problem = Problem(
            title="Two Sum Test",
            slug="two-sum-test",
            description="Add numbers",
            difficulty="Easy",
            category="DSA",
            input_format="number",
            output_format="number",
            constraints="1 <= n <= 1000",
            is_active=True,
        )
        session.add(problem)
        await session.flush()

        testcase = ProblemTestCase(
            problem_id=problem.id,
            input_data="1 2",
            expected_output="3",
            is_hidden=False,
        )
        session.add(testcase)
        await session.commit()

        # Submit code
        sub_res = await compiler_service.submit_solution(
            session,
            user,
            SubmitCodeRequest(
                source_code="print(3)",
                language="python",
                problem_id=problem.id,
            ),
        )
        assert sub_res.verdict == "Accepted"

        # Verify streak was recorded
        streak = await streak_service.get_streak(session, user.id)
        assert streak["current_streak"] == 1
        assert streak["is_active_today"] is True

        # Verify UserDailyActivity exists
        activity = (await session.execute(
            select(UserDailyActivity).where(UserDailyActivity.user_id == user.id)
        )).scalar_one()
        assert activity.activity_type == "problem_submission"

    await engine.dispose()


@pytest.mark.asyncio
async def test_battle_finish_syncs_streak_and_stats(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async def no_broadcast(*args, **kwargs):
        return None

    monkeypatch.setattr(battle_ws, "broadcast", no_broadcast)

    async with session_factory() as session:
        u1 = User(id="streak-user-106", username="fighter1", full_name="Fighter One", email="f1@example.com", password_hash="pw", coding_rating=1200)
        u2 = User(id="streak-user-107", username="fighter2", full_name="Fighter Two", email="f2@example.com", password_hash="pw", coding_rating=1200)
        session.add_all([u1, u2])
        await session.flush()
        session.add_all([
            UserStats(user_id=u1.id, level=1, rating=1200, xp=0),
            UserStats(user_id=u2.id, level=1, rating=1200, xp=0),
        ])
        await session.flush()

        battle = BattleRoom(
            title="Battle Sync Room",
            difficulty="Medium",
            problem_id=1,
            status="running",
            max_players=2,
            started_at=datetime.utcnow() - timedelta(seconds=40),
        )
        session.add(battle)
        await session.flush()

        session.add_all([
            BattleParticipant(battle_id=battle.id, user_id=u1.id, score=100, rank=1),
            BattleParticipant(battle_id=battle.id, user_id=u2.id, score=50, rank=2),
        ])
        await session.commit()

        # Finish battle
        await battle_service.finish_battle(session, battle.id)

        # Check u1 (winner) and u2 (participant) both have streaks recorded
        s1 = await streak_service.get_streak(session, u1.id)
        s2 = await streak_service.get_streak(session, u2.id)
        assert s1["current_streak"] == 1
        assert s2["current_streak"] == 1
        assert s1["is_active_today"] is True
        assert s2["is_active_today"] is True

        # Check UserStats rating synced with user coding_rating
        stats1 = (await session.execute(select(UserStats).where(UserStats.user_id == u1.id))).scalar_one()
        assert stats1.rating == u1.coding_rating

    await engine.dispose()


@pytest.mark.asyncio
async def test_leaderboard_joins_real_stats_xp_and_streak():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        user = User(
            id="streak-user-108",
            username="top_ranker",
            full_name="Top Ranker",
            email="top@example.com",
            password_hash="pw",
            coding_rating=1450,
        )
        session.add(user)
        await session.flush()

        # Add XP row
        xp_row = XP(user_id=user.id, total_xp=3200, level=5)
        # Add Streak row
        streak_row = Streak(
            user_id=user.id,
            current_streak=12,
            best_streak=20,
            last_activity_date=date.today(),
            last_active=datetime.utcnow(),
        )
        # Add UserStats row
        stats_row = UserStats(
            user_id=user.id,
            xp=3200,
            level=5,
            rating=1450,
        )
        session.add_all([xp_row, streak_row, stats_row])
        await session.commit()

        # Clear leaderboard cache to ensure fresh DB read
        leaderboard_cache.clear()

        # Fetch global leaderboard
        res = await leaderboard_service.get_global_leaderboard(session)
        lb_entries = res["leaderboard"]
        assert len(lb_entries) >= 1
        entry = next(e for e in lb_entries if e["user_id"] == user.id)
        assert entry["xp"] == 3200
        assert entry["level"] == 5
        assert entry["streak"] == 12
        assert entry["rating"] == 1450

    await engine.dispose()


@pytest.mark.asyncio
async def test_user_isolation_and_streak_independence():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        user_a = User(id="user-aaa-1", username="usera", full_name="User A", email="a@example.com", password_hash="pw")
        user_b = User(id="user-bbb-2", username="userb", full_name="User B", email="b@example.com", password_hash="pw")
        session.add_all([user_a, user_b])
        await session.commit()

        today = date.today()

        # User A records 1 activity
        await streak_service.record_activity(
            session, user_id=user_a.id, activity_type="practice", reference_id="prob-1", xp_earned=25, activity_date=today, commit=True
        )

        # Check User A streak is 1, User B streak is 0
        s_a = await streak_service.get_streak(session, user_a.id)
        s_b = await streak_service.get_streak(session, user_b.id)

        assert s_a["current_streak"] == 1
        assert s_a["is_active_today"] is True

        assert s_b["current_streak"] == 0
        assert s_b["is_active_today"] is False

        # User B's activities list in DB is completely empty
        acts_b = (await session.execute(
            select(UserDailyActivity).where(UserDailyActivity.user_id == user_b.id)
        )).scalars().all()
        assert len(acts_b) == 0

    await engine.dispose()

