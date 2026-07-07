from typing import Optional

from sqlalchemy.orm import Session

from app.models.profile import Profile


class ProfileRepository:

    def get_by_user_id(
        self,
        db: Session,
        user_id: str,
    ) -> Optional[Profile]:

        return (
            db.query(Profile)
            .filter(Profile.user_id == user_id)
            .first()
        )

    def exists(
        self,
        db: Session,
        user_id: str,
    ) -> bool:

        return (
            self.get_by_user_id(
                db,
                user_id,
            )
            is not None
        )

    def create(
        self,
        db: Session,
        profile: Profile,
    ) -> Profile:

        db.add(profile)

        db.commit()

        db.refresh(profile)

        return profile

    def update(
        self,
        db: Session,
        profile: Profile,
    ) -> Profile:

        db.commit()

        db.refresh(profile)

        return profile

    def delete(
        self,
        db: Session,
        profile: Profile,
    ):

        db.delete(profile)

        db.commit()


profile_repository = ProfileRepository()