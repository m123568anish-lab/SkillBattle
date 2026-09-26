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

    async def get_dashboard(
        self,
        db: AsyncSession,
        current_user: User,
    ) -> DashboardResponse:
        user_id = str(current_user.id)
        user = await dashboard_repository.get_user(db, user_id)
        if user is None:
            user = current_user

        challenge = await dashboard_repository.get_daily_challenge(db)
        achievements = await dashboard_repository.get_achievements(db, user_id)
        battles_played, battles_won = await dashboard_repository.get_battle_stats(db, user_id)
        current_streak = await dashboard_repository.get_current_streak(db, user_id)

        total_xp = 0
        user_level = 1
        rating = 1000
        user_stats = (
            await db.execute(
                select(UserStats).where(UserStats.user_id == user_id)
            )
        ).scalar_one_or_none()
        if user_stats:
            total_xp = getattr(user_stats, "xp", 0) or 0
            user_level = getattr(user_stats, "level", 1) or 1
            rating = getattr(user_stats, "rating", 1000) or 1000

        from app.modules.xp.repository import xp_repository
        user_xp = await xp_repository.get_by_user(db, user_id)
        if not user_stats and user_xp:
            total_xp = int(getattr(user_xp, "total_xp", 0) or 0)
            user_level = int(getattr(user_xp, "level", 1) or 1)

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
                title="No daily challenge available",
                difficulty="Easy",
                description="Check back later for a new challenge.",
                xp_reward=0,
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