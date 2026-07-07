from sqlalchemy.orm import Session

from app.models.xp import XP


class XPRepository:

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

    def create(
        self,
        db: Session,
        xp: XP,
    ):
        db.add(xp)
        db.commit()
        db.refresh(xp)
        return xp

    def update(
        self,
        db: Session,
        xp: XP,
    ):
        db.commit()
        db.refresh(xp)
        return xp


xp_repository = XPRepository()