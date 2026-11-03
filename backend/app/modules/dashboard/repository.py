"""
=========================================================

SkillBattle

Dashboard Repository

Handles all database access for the dashboard.

=========================================================
"""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.challenge import Challenge
from app.models.achievement import Achievement
from app.models.battle import BattleParticipant, BattleResult
from app.models.streak import Streak, UserDailyActivity


class DashboardRepository:

    def __init__(self):
        self._cached_day: int | None = None
        self._cached_challenge: Challenge | None = None

    async def get_user(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> User | None:

        result = await db.execute(
            select(User).where(User.id == user_id)
        )

        return result.scalar_one_or_none()


    async def get_daily_challenge(
        self,
        db: AsyncSession,
    ) -> Challenge | None:
        from datetime import datetime

        today = datetime.utcnow().date()
        day_seed = today.toordinal()

        if self._cached_day == day_seed and self._cached_challenge is not None:
            return self._cached_challenge

        count_res = await db.execute(select(func.count(Challenge.id)))
        total_challenges = count_res.scalar_one_or_none() or 0

        if total_challenges == 0:
            return None

        idx = day_seed % total_challenges
        result = await db.execute(select(Challenge).offset(idx).limit(1))
        challenge = result.scalar_one_or_none()
        self._cached_day = day_seed
        self._cached_challenge = challenge
        return challenge


    async def get_achievements(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> list[Achievement]:

        result = await db.execute(
            select(Achievement).where(Achievement.user_id == user_id)
        )

        return result.scalars().all()

    async def get_battle_stats(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> tuple[int, int, int]:
        completed_filter = BattleResult.completion_status == "completed"
        played_result = await db.execute(
            select(func.count(func.distinct(BattleResult.battle_id)))
            .join(BattleParticipant, BattleParticipant.battle_id == BattleResult.battle_id)
            .where(
                BattleParticipant.user_id == user_id,
                completed_filter,
            )
        )
        played = played_result.scalar_one_or_none() or 0

        won_result = await db.execute(
            select(func.count(func.distinct(BattleResult.battle_id)))
            .join(BattleParticipant, BattleParticipant.battle_id == BattleResult.battle_id)
            .where(
                BattleParticipant.user_id == user_id,
                BattleResult.winner_id == user_id,
                completed_filter,
            )
        )
        won = won_result.scalar_one_or_none() or 0

        lost_result = await db.execute(
            select(func.count(func.distinct(BattleResult.battle_id)))
            .join(BattleParticipant, BattleParticipant.battle_id == BattleResult.battle_id)
            .where(
                BattleParticipant.user_id == user_id,
                BattleResult.winner_id != user_id,
                BattleResult.is_draw.is_(False),
                completed_filter,
            )
        )
        lost = lost_result.scalar_one_or_none() or 0

        return played, won, lost


    async def get_current_streak(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> int:
        from app.modules.streak.service import streak_service
        data = await streak_service.get_streak(db, str(user_id))
        return int(data.get("current_streak", 0))

    async def get_streak_stats(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> tuple[int, int]:
        result = await db.execute(
            select(Streak.current_streak, Streak.best_streak)
            .where(Streak.user_id == str(user_id))
        )
        streak = result.one_or_none()
        if streak is None:
            return 0, 0
        data = await self._get_effective_streak(db, user_id, streak[0])
        return data, int(streak[1] or 0)

    async def _get_effective_streak(
        self,
        db: AsyncSession,
        user_id: str,
        stored_streak: int,
    ) -> int:
        from app.modules.streak.service import streak_service

        data = await streak_service.get_streak(db, str(user_id))
        return int(data.get("current_streak", stored_streak) or 0)

    async def get_recent_activity(
        self,
        db: AsyncSession,
        user_id: str,
        limit: int = 10,
    ) -> list[UserDailyActivity]:
        result = await db.execute(
            select(UserDailyActivity)
            .where(UserDailyActivity.user_id == str(user_id))
            .order_by(UserDailyActivity.activity_date.desc())
            .limit(limit)
        )
        return list(result.scalars().all())


dashboard_repository = DashboardRepository()