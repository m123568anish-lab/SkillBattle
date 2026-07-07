from sqlalchemy.orm import Session

from app.models.xp import XP

from app.repositories.base_repository import BaseRepository


class XPRepository(BaseRepository[XP]):

    def __init__(self):
        super().__init__(XP)

    def get_by_user(
        self,
        db: Session,
        user_id: str,
    ):
        return (
            db.query(XP)
            .filter(XP.user_id == user_id)
            .first()
        )