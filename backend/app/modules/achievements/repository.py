from sqlalchemy.orm import Session

from app.models.achievement import Achievement


class AchievementRepository:

    def get_all(
        self,
        db: Session,
        user_id: str,
    ):
        return (
            db.query(Achievement)
            .filter(Achievement.user_id == user_id)
            .all()
        )

    def create(
        self,
        db: Session,
        achievement: Achievement,
    ):
        db.add(achievement)
        db.commit()
        db.refresh(achievement)

        return achievement

    def update(
        self,
        db: Session,
        achievement: Achievement,
    ):
        db.commit()
        db.refresh(achievement)

        return achievement


achievement_repository = AchievementRepository()