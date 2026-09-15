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


class DashboardRepository:

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

        # Use today's day-of-year as a deterministic seed to pick the challenge
        # This makes the challenge rotate daily like LeetCode
        today = date.today()
        day_seed = today.toordinal()  # unique int per day

        # Fetch all challenges
        result = await db.execute(select(Challenge))
        challenges = result.scalars().all()

        if not challenges:
            return None

        # Pick deterministically based on today's date (cycles through all challenges)
        idx = day_seed % len(challenges)
        return challenges[idx]


    async def get_achievements(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> list[Achievement]:

        result = await db.execute(
            select(Achievement)
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
                BattleRoom.status == "finished",
            )
        )
        won_result = await db.execute(
            select(func.count(BattleResult.id)).where(
                BattleResult.winner_id == user_id,
            )
        )
        return played_result.scalar_one(), won_result.scalar_one()


dashboard_repository = DashboardRepository()