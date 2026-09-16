"""
=========================================================

SkillBattle

Dashboard Service

=========================================================
"""

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

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

        user = await dashboard_repository.get_user(
            db,
            current_user.id,
        )

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found",
            )

        challenge = await dashboard_repository.get_daily_challenge(
            db,
        )

        achievements = await dashboard_repository.get_achievements(
            db,
            current_user.id,
        )
        battles_played, battles_won = await dashboard_repository.get_battle_stats(
            db,
            current_user.id,
        )
        current_streak = await dashboard_repository.get_current_streak(
            db,
            current_user.id,
        )

        from app.modules.xp.service import xp_service

        user_xp = await xp_service.get_user_xp(db, current_user)
        total_xp = int(user_xp.total_xp or 0) if user_xp else 0
        user_level = (
            int(user_xp.level or 1)
            if user_xp
            else max(1, (total_xp // 500) + 1)
        )
        
        rating = max(0, user.coding_rating or 0)

        stats = DashboardStats(
            xp=total_xp,
            level=user_level,
            streak=current_streak,
            rating=rating,
            battles_played=battles_played,
            battles_won=battles_won,
        )


        # XP history is not tracked per day yet. Keep the response honest by
        # exposing the persisted weekly total only on the current day.
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
                title=item.title or "Achievement",
                description=item.description or "Keep practicing to unlock achievements.",
                icon=item.icon or "trophy",
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

        # If no daily challenge exists, provide a sensible default
        if challenge is None:
            daily = DailyChallenge(
                id="0",
                title="No challenge available",
                difficulty="Easy",
                description="No challenge has been published for today.",
                xp_reward=0,
            )
        else:
            daily = DailyChallenge(
                id=str(challenge.id),
                title=challenge.title or "Daily challenge",
                difficulty=challenge.difficulty or "Easy",
                description=(
                    f"Solve today's {challenge.category or 'coding'} challenge "
                    "to maintain your streak."
                ),
                xp_reward=int(challenge.xp_reward or 0),
            )

        return DashboardResponse(

            user=UserSummary(
                id=user.id,
                username=user.username,
                full_name=user.full_name or user.username or "SkillBattle player",
                email=user.email or "",
                avatar_url=user.avatar_url,
                role=getattr(user, "role", "user"),
                is_superuser=getattr(user, "is_superuser", False),
            ),

            stats=stats,

            weekly_activity=weekly,

            achievements=achievement_list,

            ai_recommendation=recommendation,

            daily_challenge=daily,
        )


dashboard_service = DashboardService()