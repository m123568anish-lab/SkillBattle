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
from app.models.battle import BattleParticipant, BattleResult, BattleRoom
from app.models.streak import Streak


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
        from datetime import date

        today = date.today()
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
    ) -> tuple[int, int]:
        played_result = await db.execute(
            select(func.count(BattleParticipant.id))
            .join(BattleRoom, BattleRoom.id == BattleParticipant.battle_id)
            .where(
                BattleParticipant.user_id == user_id,
            )
        )
        played = played_result.scalar_one_or_none() or 0

        won_result = await db.execute(
            select(func.count(BattleResult.id)).where(
                BattleResult.winner_id == user_id,
            )
        )
        won = won_result.scalar_one_or_none() or 0

        return played, won


    async def get_current_streak(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> int:
        result = await db.execute(
            select(Streak.current_streak)
            .where(Streak.user_id == user_id)
            .order_by(Streak.id.desc())
            .limit(1)
        )
        return result.scalar_one_or_none() or 0


dashboard_repository = DashboardRepository()