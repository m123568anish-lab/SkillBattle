"""
=========================================================

SkillBattle

Leaderboard Repository

Production Async Repository

=========================================================
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.xp import XP


class LeaderboardRepository:

    async def global_leaderboard(
        self,
        db: AsyncSession,
        limit: int = 100,
    ):

        result = await db.execute(

            select(
                User,
                XP,
            )

            .join(
                XP,
                XP.user_id == User.id,
            )

            .order_by(
                XP.total_xp.desc(),
            )

            .limit(limit)

        )

        return result.all()

    async def get_user_rank(
        self,
        db: AsyncSession,
        user_id: str,
    ):

        rows = await self.global_leaderboard(
            db,
            limit=10000,
        )

        for rank, (user, xp) in enumerate(
            rows,
            start=1,
        ):

            if user.id == user_id:

                return rank, xp

        return None, None


leaderboard_repository = LeaderboardRepository()