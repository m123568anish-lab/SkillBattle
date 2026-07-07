from sqlalchemy.orm import Session

from app.models.profile import Profile
from app.models.user import User

from app.modules.profile.repository import (
    profile_repository,
)

from app.modules.profile.schemas import (
    ProfileUpdateRequest,
)


class ProfileService:

    def get_profile(
        self,
        db: Session,
        current_user: User,
    ) -> Profile:

        profile = profile_repository.get_by_user_id(
            db,
            current_user.id,
        )

        if profile:
            return profile

        profile = Profile(
            user_id=current_user.id,
            avatar="",
            bio="",
            college="",
            branch="",
            graduation_year=2027,
            target_company="",
            target_package="",
            github="",
            linkedin="",
        )

        return profile_repository.create(
            db,
            profile,
        )

    def update_profile(
        self,
        db: Session,
        current_user: User,
        data: ProfileUpdateRequest,
    ) -> Profile:

        profile = self.get_profile(
            db,
            current_user,
        )

        update_data = data.model_dump(
            exclude_unset=True
        )

        for key, value in update_data.items():
            setattr(profile, key, value)

        return profile_repository.update(
            db,
            profile,
        )


profile_service = ProfileService()