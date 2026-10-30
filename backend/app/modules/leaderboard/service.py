"""
=========================================================

SkillBattle

Leaderboard Service

=========================================================
"""

from __future__ import annotations

from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from .repository import (
    leaderboard_repository,
)

from .ranking import (
    calculate_rank,
)

from .cache import (
    leaderboard_cache,
)


class LeaderboardService:

    async def get_global_leaderboard(
        self,
        db: AsyncSession,
    ):
        cached = leaderboard_cache.get(
            "global",
        )

        if cached:
            return cached

        rows = await leaderboard_repository.global_leaderboard(
            db,
        )

        leaderboard = []
        today = datetime.utcnow().date()
        yesterday = today - timedelta(days=1)

        for user, xp, streak, stats in rows:
            user_xp = xp.total_xp if xp else 0
            user_level = xp.level if xp else 1
            user_rating = stats.rating if (stats and stats.rating) else (getattr(user, "coding_rating", None) or 1000)

            user_streak = 0
            if streak:
                last_d = streak.last_activity_date or (streak.last_active.date() if streak.last_active else None)
                if last_d in (today, yesterday):
                    user_streak = streak.current_streak

            leaderboard.append(
                {
                    "user_id": str(user.id),
                    "username": str(user.username or "player"),
                    "full_name": str(user.full_name or user.username or "Player"),
                    "avatar": getattr(user, "avatar_url", None) or getattr(user, "avatar", None),
                    "xp": user_xp,
                    "level": user_level,
                    "streak": user_streak,
                    "solved": max(0, user_xp // 100),
                    "rating": user_rating,
                }
            )

        leaderboard = calculate_rank(
            leaderboard,
        )

        result = {
            "leaderboard": leaderboard,
        }

        leaderboard_cache.set(
            "global",
            result,
        )

        return result

    async def my_rank(
        self,
        db: AsyncSession,
        current_user,
    ):
        rank, xp = await leaderboard_repository.get_user_rank(
            db,
            str(current_user.id),
        )

        if xp is None:
            return {
                "rank": None,
                "total_users": 0,
                "xp": 0,
                "level": 0,
            }

        return {
            "rank": rank,
            "total_users": 10000,
            "xp": xp.total_xp,
            "level": xp.level,
        }


leaderboard_service = LeaderboardService()
