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
from app.models.user_skill_stat import UserSkillStat

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

        from app.modules.xp.service import xp_service
        user_xp = await xp_service.get_user_xp(db, current_user)
        total_xp = int(user_xp.total_xp or 0)
        user_level = int(user_xp.level or 1)
        rating = 1000
        user_stats = (
            await db.execute(
                select(UserStats).where(UserStats.user_id == user_id)
            )
        ).scalar_one_or_none()
        if user_stats:
            rating = getattr(user_stats, "rating", 1000) or 1000

        stats = DashboardStats(
            xp=total_xp,
            level=user_level,
            streak=current_streak,
            rating=rating,
            battles_played=battles_played,
            battles_won=battles_won,
        )

        # XP stores a weekly aggregate, not per-day history. Do not fabricate a daily chart.
        weekly: list[WeeklyActivity] = []

        achievement_list = [
            Achievement(
                id=str(getattr(item, "id", "0")),
                title=str(getattr(item, "title", "Achievement") or "Achievement"),
                description=str(getattr(item, "description", "Keep practicing to unlock achievements.") or "Keep practicing to unlock achievements."),
                icon=str(getattr(item, "icon", "trophy") or "trophy"),
            )
            for item in achievements
        ]

        skill_result = await db.execute(
            select(UserSkillStat).where(
                UserSkillStat.user_id == user_id,
                UserSkillStat.total_attempts > 0,
            )
        )
        skill_evidence = list(skill_result.scalars().all())
        weakest_skill = min(
            skill_evidence,
            key=lambda skill: skill.correct_attempts / skill.total_attempts,
            default=None,
        )
        if weakest_skill:
            accuracy = round(weakest_skill.correct_attempts / weakest_skill.total_attempts * 100)
            recommendation = AIRecommendation(
                title=f"Practice {weakest_skill.subject}",
                message=(
                    f"Your recorded accuracy is {accuracy}% "
                    f"({weakest_skill.correct_attempts} of {weakest_skill.total_attempts} attempts). "
                    "Focused practice in this area is your clearest next step."
                ),
                progress=accuracy,
                action=f"Practice {weakest_skill.subject}",
            )
        elif stats.battles_played == 0:
            recommendation = AIRecommendation(
                title="Record your first result",
                message="There is not enough assessment or practice evidence to personalize a next step yet.",
                progress=0,
                action="Start practice",
            )
        else:
            recommendation = AIRecommendation(
                title="Build on your battle activity",
                message=f"You have {stats.battles_played} recorded battles. Try a new practice topic to add skill evidence.",
                progress=min(stats.battles_played, 100),
                action="Explore practice",
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