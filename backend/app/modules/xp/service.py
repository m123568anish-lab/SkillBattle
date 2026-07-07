from sqlalchemy.orm import Session

from app.models.user import User
from app.models.xp import XP

from app.modules.xp.repository import (
    xp_repository,
)


class XPService:

    def get_user_xp(
        self,
        db: Session,
        current_user: User,
    ):

        xp = xp_repository.get_by_user(
            db,
            current_user.id,
        )

        if xp:
            return xp

        xp = XP(
            user_id=current_user.id,
            total_xp=0,
            weekly_xp=0,
            daily_xp=0,
            level=1,
            rank=999999,
        )

        return xp_repository.create(
            db,
            xp,
        )

    def add_xp(
        self,
        db: Session,
        current_user: User,
        amount: int,
    ):

        xp = self.get_user_xp(
            db,
            current_user,
        )

        xp.total_xp += amount
        xp.weekly_xp += amount
        xp.daily_xp += amount

        xp.level = (xp.total_xp // 500) + 1

        return xp_repository.update(
            db,
            xp,
        )


xp_service = XPService()