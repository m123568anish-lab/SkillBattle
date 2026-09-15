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

        user = await dashboard_repository.get_user(
            db,
            current_user.id,
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

        from app.modules.xp.service import xp_service

        user_xp = await xp_service.get_user_xp(db, current_user)
        total_xp = user_xp.total_xp if user_xp else 0
        user_level = user_xp.level if user_xp else max(1, (total_xp // 500) + 1)
        
        # Calculate live rating (defaulting to 1200 for new users + bonus from XP)
        base_rating = user.coding_rating if (user.coding_rating and user.coding_rating > 0) else 1200
        rating = base_rating + (total_xp // 10)

        stats = DashboardStats(
            xp=total_xp,
            level=user_level,
            streak=max(0, user.login_count or 0),
            rating=rating,
            battles_played=battles_played,
            battles_won=battles_won,
        )


        # XP history is not tracked per day yet. Keep the response honest by
        # exposing the persisted weekly total only on the current day.
        from datetime import datetime

        today = datetime.utcnow().strftime("%a")
        weekly = [
            WeeklyActivity(day=day, xp=user_xp.weekly_xp if day == today else 0)
            for day in ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
        ]

        achievement_list = [

            Achievement(
                id=str(item.id),
                title=item.title,
                description=item.description,
                icon=item.icon,
            )

            for item in achievements

        ]

        recommendation = AIRecommendation(
            title="Continue Graph Preparation",
            message="Graph algorithms are your weakest topic. Completing them can improve your interview readiness.",
            progress=72,
            action="Continue Learning",
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
                title=challenge.title,
                difficulty=challenge.difficulty,
                description="Solve today's coding challenge to maintain your streak.",
                xp_reward=50,
            )

        return DashboardResponse(

            user=UserSummary(
                id=user.id,
                username=user.username,
                full_name=user.full_name,
                email=user.email,
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