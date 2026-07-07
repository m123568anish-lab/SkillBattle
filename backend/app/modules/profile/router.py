from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.core.security import get_current_user
from app.core.exceptions.responses import api_error

from app.models.user import User

from app.modules.profile.schemas import (
    ProfileResponse,
    ProfileUpdateRequest,
)

from app.modules.profile.service import (
    profile_service,
)

router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
)


@router.get(
    "",
    response_model=ProfileResponse,
)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = profile_service.get_profile(
        db,
        current_user,
    )

    if profile is None:
        return api_error(
            "Profile not found",
            404,
        )

    return ProfileResponse(
        full_name=current_user.full_name,
        email=current_user.email,

        avatar=profile.avatar,
        bio=profile.bio,

        college=profile.college,
        branch=profile.branch,
        graduation_year=profile.graduation_year,

        target_company=profile.target_company,
        target_package=profile.target_package,

        github=profile.github,
        linkedin=profile.linkedin,
    )


@router.put(
    "",
    response_model=ProfileResponse,
)
def update_profile(
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = profile_service.update_profile(
        db,
        current_user,
        payload,
    )

    if profile is None:
        return api_error(
            "Unable to update profile",
            404,
        )

    return ProfileResponse(
        full_name=current_user.full_name,
        email=current_user.email,

        avatar=profile.avatar,
        bio=profile.bio,

        college=profile.college,
        branch=profile.branch,
        graduation_year=profile.graduation_year,

        target_company=profile.target_company,
        target_package=profile.target_package,

        github=profile.github,
        linkedin=profile.linkedin,
    )