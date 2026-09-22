"""
=========================================================

SkillBattle

Dashboard Service

=========================================================
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.models.user import User
from app.models.user_stats import UserStats

from app.modules.dashboard.repository import (
    dashboard_repository,
)

from app.modules.dashboard.schemas import (
    DashboardResponse,
    UserSummary,
    DashboardStats,
    WeeklyActivity,
    Achievement,
    AIRecommendation,
    DailyChallenge,
)


class DashboardService:

    @staticmethod
    async def _rollback_after_database_error(db: AsyncSession) -> None:
        """Clear SQLAlchemy's failed transaction state before fallback queries."""
        try:
            await db.rollback()
        except Exception:
            pass

    async def get_dashboard(
        self,
        db: AsyncSession,
        current_user: User,
    ) -> DashboardResponse:

        try:
            user = await dashboard_repository.get_user(db, current_user.id)
        except Exception:
            await self._rollback_after_database_error(db)
            user = None

        if user is None:
            user = current_user

        # Fetch queries with defensive error handling so dashboard never throws HTTP 500
        try:
            challenge = await dashboard_repository.get_daily_challenge(db)
        except Exception:
            await self._rollback_after_database_error(db)
            challenge = None

        try:
            achievements = await dashboard_repository.get_achievements(db, current_user.id)
        except Exception:
            await self._rollback_after_database_error(db)
            achievements = []

        try:
            battles_played, battles_won = await dashboard_repository.get_battle_stats(db, current_user.id)
        except Exception:
            await self._rollback_after_database_error(db)
            battles_played, battles_won = 0, 0

        try:
            current_streak = await dashboard_repository.get_current_streak(db, current_user.id)
        except Exception:
            await self._rollback_after_database_error(db)
            current_streak = 0

        total_xp = 0
        user_level = 1
        rating = 1000
        user_xp = None
        try:
            stats = (
                await db.execute(
                    select(UserStats).where(UserStats.user_id == current_user.id)
                )
            ).scalar_one_or_none()
            if stats:
                total_xp = getattr(stats, "xp", 0) or 0
                user_level = getattr(stats, "level", 1) or 1
                rating = getattr(stats, "rating", 1000) or 1000

            from app.modules.xp.repository import xp_repository
            user_xp = await xp_repository.get_by_user(db, current_user.id)
            if not stats and user_xp:
                total_xp = int(getattr(user_xp, "total_xp", 0) or 0)
                user_level = int(getattr(user_xp, "level", 1) or 1)
        except Exception:
            await self._rollback_after_database_error(db)
            total_xp = 0
            user_level = 1
            rating = 1000

        stats = DashboardStats(
            xp=total_xp,
            level=user_level,
            streak=current_streak,
            rating=rating,
            battles_played=battles_played,
            battles_won=battles_won,
        )

        from datetime import datetime

        today = datetime.utcnow().strftime("%a")
        weekly = [
            WeeklyActivity(
                day=day,
                xp=int(getattr(user_xp, "weekly_xp", 0) or 0) if day == today and user_xp else 0,
            )
            for day in ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
        ]

        achievement_list = [
            Achievement(
                id=str(getattr(item, "id", "0")),
                title=str(getattr(item, "title", "Achievement") or "Achievement"),
                description=str(getattr(item, "description", "Keep practicing to unlock achievements.") or "Keep practicing to unlock achievements."),
                icon=str(getattr(item, "icon", "trophy") or "trophy"),
            )
            for item in achievements
        ]

        recommendation = AIRecommendation(
            title="Keep building your streak" if stats.streak == 0 else "Continue your practice",
            message=(
                "Complete your first battle to start building a measurable record."
                if stats.battles_played == 0
                else "Finish another battle to improve your live battle statistics."
            ),
            progress=min(stats.battles_played, 100),
            action="Start Battle",
        )

        if challenge is None:
            daily = DailyChallenge(
                id="0",
                title="Daily Coding Arena",
                difficulty="Easy",
                description="Solve today's coding challenge to build your streak and earn XP.",
                xp_reward=100,
            )
        else:
            daily = DailyChallenge(
                id=str(getattr(challenge, "id", 0)),
                title=str(getattr(challenge, "title", "Daily challenge") or "Daily challenge"),
                difficulty=str(getattr(challenge, "difficulty", "Easy") or "Easy"),
                description=str(
                    f"Solve today's {getattr(challenge, 'category', 'coding') or 'coding'} challenge "
                    "to maintain your streak."
                ),
                xp_reward=int(getattr(challenge, "xp_reward", 100) or 100),
            )

        return DashboardResponse(
            user=UserSummary(
                id=str(user.id),
                username=str(getattr(user, "username", None) or "player"),
                full_name=str(getattr(user, "full_name", None) or getattr(user, "username", None) or "SkillBattle player"),
                email=str(getattr(user, "email", None) or ""),
                avatar_url=getattr(user, "avatar_url", None),
                role=str(getattr(user, "role", "user") or "user"),
                is_superuser=bool(getattr(user, "is_superuser", False)),
            ),
            stats=stats,
            weekly_activity=weekly,
            achievements=achievement_list,
            ai_recommendation=recommendation,
            daily_challenge=daily,
        )


dashboard_service = DashboardService()