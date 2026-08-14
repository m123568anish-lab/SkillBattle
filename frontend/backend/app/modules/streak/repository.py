from sqlalchemy.orm import Session

from app.models.streak import Streak


class StreakRepository:

    def get_by_user(
        self,
        db: Session,
        user_id: str,
    ):
        return (
            db.query(Streak)
            .filter(Streak.user_id == user_id)
            .first()
        )

    def create(
        self,
        db: Session,
        streak: Streak,
    ):
        db.add(streak)
        db.commit()
        db.refresh(streak)
        return streak

    def update(
        self,
        db: Session,
        streak: Streak,
    ):
        db.commit()
        db.refresh(streak)
        return streak


streak_repository = StreakRepository()