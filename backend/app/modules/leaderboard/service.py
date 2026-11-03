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

class LeaderboardService:

    async def get_global_leaderboard(
        self,
        db: AsyncSession,
    ):
        rows = await leaderboard_repository.global_leaderboard(
            db,
        )

        leaderboard = []
        today = datetime.utcnow().date()
        yesterday = today - timedelta(days=1)

        for user, xp, streak, stats, solved, battles_count, wins, losses, draws in rows:
            user_xp = xp.total_xp if xp else 0
            user_level = xp.level if xp else 1
            user_rating = (
                stats.rating
                if stats and stats.rating is not None
                else int(user.coding_rating or 0)
            )

            user_streak = 0
            if streak:
                last_d = streak.last_activity_date or (streak.last_active.date() if streak.last_active else None)
                if last_d in (today, yesterday):
                    user_streak = streak.current_streak

            leaderboard.append(
                {
                    "user_id": str(user.id),
                    "username": str(user.username),
                    "full_name": str(user.full_name),
                    "avatar": getattr(user, "avatar_url", None) or getattr(user, "avatar", None),
                    "xp": user_xp,
                    "level": user_level,
                    "streak": user_streak,
                    "solved": int(solved or 0),
                    "rating": user_rating,
                    "wins": wins,
                    "losses": losses,
                    "draws": draws,
                    "battles_count": battles_count,
                    "win_rate": (
                        round(wins / (wins + losses) * 100, 1)
                        if wins + losses
                        else 0
                    ),
                }
            )

        leaderboard = calculate_rank(
            leaderboard,
        )

        result = {
            "leaderboard": leaderboard,
        }

        return result

    async def my_rank(
        self,
        db: AsyncSession,
        current_user,
    ):
        rank, xp, total_users = await leaderboard_repository.get_user_rank(
            db,
            str(current_user.id),
        )

        if rank is None:
            return {
                "rank": None,
                "total_users": total_users,
                "xp": 0,
                "level": 1,
            }

        return {
            "rank": rank,
            "total_users": total_users,
            "xp": int(xp.total_xp or 0) if xp else 0,
            "level": int(xp.level or 1) if xp else 1,
        }


leaderboard_service = LeaderboardService()
