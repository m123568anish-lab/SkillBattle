"""
=========================================================

SkillBattle

Dashboard Service

=========================================================
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

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

        try:
            user = await dashboard_repository.get_user(db, current_user.id)
        except Exception:
            user = None

        if user is None:
            user = current_user

        # Fetch queries with defensive error handling so dashboard never throws HTTP 500
        try:
            challenge = await dashboard_repository.get_daily_challenge(db)
        except Exception:
            challenge = None

        try:
            achievements = await dashboard_repository.get_achievements(db, current_user.id)
        except Exception:
            achievements = []

        try:
            battles_played, battles_won = await dashboard_repository.get_battle_stats(db, current_user.id)
        except Exception:
            battles_played, battles_won = 0, 0

        try:
            current_streak = await dashboard_repository.get_current_streak(db, current_user.id)
        except Exception:
            current_streak = 0

        total_xp = 0
        user_level = 1
        user_xp = None
        try:
            from app.modules.xp.service import xp_service
            user_xp = await xp_service.get_user_xp(db, current_user)
            total_xp = int(user_xp.total_xp or 0) if user_xp else 0
            user_level = (
                int(user_xp.level or 1)
                if user_xp
                else max(1, (total_xp // 500) + 1)
            )
        except Exception:
            pass

        rating = max(0, getattr(user, "coding_rating", 0) or 0)

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
                xp=int(user_xp.weekly_xp or 0) if day == today and user_xp else 0,
            )
            for day in ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
        ]

        achievement_list = [
            Achievement(
                id=str(item.id),
                title=getattr(item, "title", "Achievement") or "Achievement",
                description=getattr(item, "description", "Keep practicing to unlock achievements.") or "Keep practicing to unlock achievements.",
                icon=getattr(item, "icon", "trophy") or "trophy",
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
                id=str(challenge.id),
                title=getattr(challenge, "title", "Daily challenge") or "Daily challenge",
                difficulty=getattr(challenge, "difficulty", "Easy") or "Easy",
                description=(
                    f"Solve today's {getattr(challenge, 'category', 'coding') or 'coding'} challenge "
                    "to maintain your streak."
                ),
                xp_reward=int(getattr(challenge, "xp_reward", 100) or 100),
            )

        return DashboardResponse(
            user=UserSummary(
                id=user.id,
                username=user.username,
                full_name=user.full_name or user.username or "SkillBattle player",
                email=user.email or "",
                avatar_url=user.avatar_url,
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