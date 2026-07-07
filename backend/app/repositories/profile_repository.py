from sqlalchemy.orm import Session

from app.models.profile import Profile

from app.repositories.base_repository import (
    BaseRepository,
)


class ProfileRepository(
    BaseRepository[Profile]
):

    def __init__(self):
        super().__init__(Profile)

    def get_by_user(
        self,
        db: Session,
        user_id: str,
    ):
        return (
            db.query(Profile)
            .filter(Profile.user_id == user_id)
            .first()
        )