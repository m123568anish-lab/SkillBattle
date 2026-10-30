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
from app.models.streak import Streak
from app.models.user_stats import UserStats


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
                Streak,
                UserStats,
            )
            .join(
                XP,
                XP.user_id == User.id,
            )
            .outerjoin(
                Streak,
                Streak.user_id == User.id,
            )
            .outerjoin(
                UserStats,
                UserStats.user_id == User.id,
            )
            .order_by(
                XP.total_xp.desc(),
                User.id.asc(),
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

        for rank, row in enumerate(
            rows,
            start=1,
        ):
            user = row[0]
            xp = row[1]
            if str(user.id) == str(user_id):
                return rank, xp

        return None, None


leaderboard_repository = LeaderboardRepository()
