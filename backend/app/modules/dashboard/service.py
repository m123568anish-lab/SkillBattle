from sqlalchemy.orm import Session

from app.models.user import User

from app.modules.profile.service import profile_service
from app.modules.xp.service import xp_service
from app.modules.streak.service import streak_service
from app.modules.achievements.service import achievement_service


class DashboardService:

    def get_dashboard(
        self,
        db: Session,
        current_user: User,
    ):

        profile = profile_service.get_profile(
            db,
            current_user,
        )

        xp = xp_service.get_user_xp(
            db,
            current_user,
        )

        streak = streak_service.get_streak(
            db,
            current_user,
        )

        achievements = (
            achievement_service.get_user_achievements(
                db,
                current_user,
            )
        )

        return {

            "profile": {

                "full_name": current_user.full_name,

                "avatar": profile.avatar,

                "college": profile.college,

                "target_company": profile.target_company,

            },

            "xp": {

                "level": xp.level,

                "total_xp": xp.total_xp,

                "weekly_xp": xp.weekly_xp,

                "rank": xp.rank,

            },

            "streak": {

                "current": streak.current_streak,

                "best": streak.best_streak,

            },

            "achievements": achievements,

            "challenge": {

                "title": "Binary Search",

                "difficulty": "Medium",

                "reward": 100,

            },

            "weekly_stats": {

                "study_hours": 18,

                "problems_solved": 37,

                "accuracy": 91,

            },

        }


dashboard_service = DashboardService()