from sqlalchemy.orm import Session

from app.models.profile import Profile
from app.repositories.profile_repository import (
    ProfileRepository,
)
from app.schemas.profile import ProfileUpdate

profile_repository = ProfileRepository()


class ProfileService:

    def get_profile(
        self,
        db: Session,
        user_id: str,
    ):
        return profile_repository.get_by_user(
            db,
            user_id,
        )


profile_service = ProfileService()


def get_profile(db: Session, user_id: str):
    return profile_service.get_profile(db, user_id)


def update_profile(db: Session, user_id: str, payload: ProfileUpdate):
    profile = profile_repository.get_by_user(db, user_id)

    if not profile:
        profile = Profile(user_id=user_id)

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile