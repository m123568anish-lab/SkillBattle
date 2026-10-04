from datetime import datetime, timedelta

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.database.init_db  # noqa: F401 - register all mapped models
from app.database.base import Base
from app.models.battle.battle_participant import BattleParticipant
from app.models.battle.battle_result import BattleResult
from app.models.battle.battle_room import BattleRoom
from app.models.compiler import CodeSubmission
from app.models.profile import Profile
from app.models.problem import Problem
from app.models.problem_testcase import ProblemTestCase
from app.models.user import User
from app.models.user_stats import UserStats
from app.models.xp import XP
from app.modules.auth.schemas.requests import RegisterRequest
from app.modules.auth.services.auth_service import auth_service
from app.modules.battle.service import battle_service
from app.modules.battle.websocket import battle_ws
from app.modules.dashboard.service import dashboard_service
from app.modules.compiler.schemas import JudgeResult, SubmitCodeRequest
from app.modules.compiler.service import compiler_service
from app.modules.xp.service import xp_service
from app.modules.profile.router import get_profile
from app.modules.xp.repository import xp_repository
from app.modules.xp.service import xp_service


@pytest.mark.asyncio
async def test_registration_creates_progression_row_and_profile_reads_persisted_xp():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        user = await auth_service.register(
            session,
            RegisterRequest(
                username="persistence_user",
                full_name="Persistence User",
                email="persistence-user@example.com",
                password="Persistence123",
            ),
        )
        xp = await xp_repository.get_by_user(session, user.id)
        assert xp is not None
        assert xp.total_xp == 0
        assert xp.level == 1

        await xp_service.add_xp(session, user, 550)
        stats = (await session.execute(
            select(UserStats).where(UserStats.user_id == user.id)
        )).scalar_one()
        assert stats.xp == 550
        assert stats.level == 2

        stats.xp = 0
        stats.level = 1
        await session.commit()

        profile = await get_profile(session, user)
        assert profile.total_xp == 550
        assert profile.level == 2

        dashboard = await dashboard_service.get_dashboard(session, user)
        assert dashboard.stats.xp == 550
        assert dashboard.stats.level == 2

    await engine.dispose()


@pytest.mark.asyncio
async def test_battle_finish_persists_result_and_awards_xp_once(monkeypatch):
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    async def no_broadcast(*args, **kwargs):
        return None

    monkeypatch.setattr(battle_ws, "broadcast", no_broadcast)

    async with session_factory() as session:
        winner = User(
            username="battle_winner",
            full_name="Battle Winner",
            email="battle-winner@example.com",
            password_hash="not-used",
        )
        participant = User(
            username="battle_participant",
            full_name="Battle Participant",
            email="battle-participant@example.com",
            password_hash="not-used",
        )
        session.add_all([winner, participant])
        await session.flush()
        session.add_all([
            UserStats(user_id=winner.id, level=1, rating=1000, xp=0),
            UserStats(user_id=participant.id, level=1, rating=1000, xp=0),
        ])
        battle = BattleRoom(
            title="Persistence verification battle",
            difficulty="Easy",
            problem_id=1,
            status="running",
            max_players=2,
            started_at=datetime.utcnow() - timedelta(seconds=40),
        )
        session.add(battle)
        await session.flush()
        session.add_all([
            BattleParticipant(battle_id=battle.id, user_id=winner.id, score=100, rank=1),
            BattleParticipant(battle_id=battle.id, user_id=participant.id, score=40, rank=2),
        ])
        await session.commit()
        battle_id = battle.id
        winner_id = winner.id
        participant_id = participant.id

        first_result = await battle_service.finish_battle(session, battle_id)
        assert first_result is not None
        assert first_result["rewards"][0]["xp"] == 150

        second_result = await battle_service.finish_battle(session, battle_id)
        assert second_result is not None

        saved_result = (await session.execute(
            select(BattleResult).where(BattleResult.battle_id == battle_id)
        )).scalar_one()
        winner_xp = await xp_repository.get_by_user(session, winner_id)
        participant_xp = await xp_repository.get_by_user(session, participant_id)
        winner_stats = (await session.execute(
            select(UserStats).where(UserStats.user_id == winner_id)
        )).scalar_one()
        participant_stats = (await session.execute(
            select(UserStats).where(UserStats.user_id == participant_id)
        )).scalar_one()
        result_count = (await session.execute(
            select(func.count(BattleResult.id)).where(BattleResult.battle_id == battle_id)
        )).scalar_one()

        assert result_count == 1
        assert saved_result.xp_earned == 200
        assert saved_result.is_draw is False
        assert winner_xp.total_xp == 150
        assert participant_xp.total_xp == 50
        assert winner_stats.xp == winner_xp.total_xp
        assert winner_stats.level == winner_xp.level
        assert participant_stats.xp == participant_xp.total_xp
        assert participant_stats.level == participant_xp.level

    await engine.dispose()


@pytest.mark.asyncio
async def test_unauthorized_client_xp_award_endpoint_is_disabled(client):
    from fastapi import HTTPException
    from app.modules.xp.router import add_xp
    from app.modules.xp.schemas import AddXPRequest
    from types import SimpleNamespace

    with pytest.raises(HTTPException) as raised:
        await add_xp(
            AddXPRequest(amount=500, reason="client supplied"),
            db=None,
            current_user=SimpleNamespace(id="authenticated-user"),
        )

    assert raised.value.status_code == 403


@pytest.mark.asyncio
async def test_solo_finish_rejects_client_claimed_results():
    from fastapi import HTTPException
    from app.modules.battle.router import solo_finish
    from app.modules.battle.schemas import SoloFinishRequest

    with pytest.raises(HTTPException) as raised:
        await solo_finish(
            SoloFinishRequest(
                xp_earned=9000,
                mcq_results=[],
                coding_solved=True,
            ),
            db=None,
            current_user=User(
                username="solo_finish_user",
                full_name="Solo Finish User",
                email="solo-finish@example.com",
                password_hash="not-used",
            ),
        )
    assert raised.value.status_code == 410


@pytest.mark.asyncio
async def test_accepted_compiler_submission_awards_once_and_empty_tests_do_not_reward(monkeypatch):
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
            username="compiler_xp_user",
            full_name="Compiler XP User",
            email="compiler-xp@example.com",
            password_hash="not-used",
        )
        session.add(user)
        await session.flush()
        session.add(UserStats(user_id=user.id, level=1, rating=1000, xp=0))
        problem = Problem(
            title="Verified compiler XP",
            slug="verified-compiler-xp",
            difficulty="Easy",
            category="Arrays",
            description="Test valid submissions receive server calculated XP.",
            input_format="number",
            output_format="number",
            constraints="1 <= n <= 10",
            explanation="",
            xp_reward=100,
            is_active=True,
        )
        session.add(problem)
        await session.flush()
        session.add(ProblemTestCase(
            problem_id=problem.id,
            input_data="1",
            expected_output="1",
            is_hidden=True,
        ))
        await session.commit()

        request = SubmitCodeRequest(
            problem_id=problem.id,
            language="python",
            source_code="print(1)",
        )
        first = await compiler_service.submit_solution(session, user, request)
        repeated = await compiler_service.submit_solution(session, user, request)
        xp = await xp_repository.get_by_user(session, user.id)
        submissions = (await session.execute(
            select(func.count()).select_from(CodeSubmission).where(
                CodeSubmission.user_id == user.id,
                CodeSubmission.problem_id == problem.id,
            )
        )).scalar_one()

        assert first.verdict == "Accepted"
        assert first.xp_earned == 150
        assert repeated.verdict == "Accepted"
        assert repeated.xp_earned == 0
        assert xp is not None and xp.total_xp == 150
        assert submissions == 2

        empty_problem = Problem(
            title="No test cases configured",
            slug="no-test-cases-configured",
            difficulty="Easy",
            category="Arrays",
            description="No cases means no verified acceptance.",
            input_format="number",
            output_format="number",
            constraints="1 <= n <= 10",
            explanation="",
            xp_reward=100,
            is_active=True,
        )
        session.add(empty_problem)
        await session.commit()
        with pytest.raises(ValueError, match="no configured test cases"):
            await compiler_service.submit_solution(
                session,
                user,
                SubmitCodeRequest(
                    problem_id=empty_problem.id,
                    language="python",
                    source_code="print(1)",
                ),
            )
        xp = await xp_repository.get_by_user(session, user.id)
        assert xp is not None and xp.total_xp == 150

    await engine.dispose()
