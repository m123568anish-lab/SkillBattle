"""
=========================================================

SkillBattle

Leaderboard Service

=========================================================
"""

from __future__ import annotations

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

        for user, xp in rows:
            leaderboard.append(
                {
                    "user_id": user.id,
                    "username": user.username,
                    "full_name": user.full_name,
                    "avatar": getattr(
                        user,
                        "avatar",
                        None,
                    ),
                    "xp": xp.total_xp,
                    "level": xp.level,
                    "streak": getattr(
                        xp,
                        "current_streak",
                        0,
                    ),
                    "solved": getattr(
                        xp,
                        "problems_solved",
                        0,
                    ),
                    "rating": getattr(
                        xp,
                        "rating",
                        1200,
                    ),
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

            current_user.id,

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