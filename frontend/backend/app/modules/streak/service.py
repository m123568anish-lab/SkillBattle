from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.streak import Streak
from app.models.user import User

from app.modules.streak.repository import streak_repository


class StreakService:

    def get_streak(
        self,
        db: Session,
        current_user: User,
    ):

        streak = streak_repository.get_by_user(
            db,
            current_user.id,
        )

        if streak:
            return streak

        streak = Streak(
            user_id=current_user.id,
            current_streak=1,
            best_streak=1,
            last_active=datetime.utcnow(),
        )

        return streak_repository.create(
            db,
            streak,
        )

    def update_streak(
        self,
        db: Session,
        current_user: User,
    ):

        streak = self.get_streak(
            db,
            current_user,
        )

        now = datetime.utcnow()

        last = streak.last_active

        if last.date() == now.date():
            return streak

        if last.date() == (now - timedelta(days=1)).date():
            streak.current_streak += 1
        else:
            streak.current_streak = 1

        streak.best_streak = max(
            streak.best_streak,
            streak.current_streak,
        )

        streak.last_active = now

        return streak_repository.update(
            db,
            streak,
        )


streak_service = StreakService()