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

        # Fallback to UserSkillStat if no formal multiplayer battles found
        if played == 0:
            from app.models.user_skill_stat import UserSkillStat
            attempts_result = await db.execute(
                select(func.sum(UserSkillStat.total_attempts)).where(UserSkillStat.user_id == user_id)
            )
            attempts = attempts_result.scalar_one_or_none() or 0
            if attempts > 0:
                played = attempts
                correct_result = await db.execute(
                    select(func.sum(UserSkillStat.correct_attempts)).where(UserSkillStat.user_id == user_id)
                )
                won = correct_result.scalar_one_or_none() or 0

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