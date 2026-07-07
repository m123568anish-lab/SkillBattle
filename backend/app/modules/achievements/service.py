from sqlalchemy.orm import Session

from app.models.user import User

from app.modules.achievements.repository import (
    achievement_repository,
)


class AchievementService:

    def get_user_achievements(
        self,
        db: Session,
        current_user: User,
    ):
        return achievement_repository.get_all(
            db,
            current_user.id,
        )


achievement_service = AchievementService()