from sqlalchemy.orm import Session

from app.models.user import User


class RecruiterRepository:

    def get_candidate(
        self,
        db: Session,
        user_id: str,
    ):
        return (
            db.query(User)
            .filter(User.id == user_id)
            .first()
        )


recruiter_repository = RecruiterRepository()