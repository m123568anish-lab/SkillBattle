"""
=========================================================

SkillBattle

Profile Router

Production Async Version

=========================================================
"""

from __future__ import annotations

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_current_user

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


@router.get("/health")
async def health():

    return {

        "module": "profile",

        "status": "healthy",

    }


@router.get(
    "/me",
    response_model=ProfileResponse,
)
async def get_profile(

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(
        get_current_user,
    ),

):

    profile = await profile_service.get_profile(

        db,

        current_user,

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
async def update_profile(

    payload: ProfileUpdateRequest,

    db: AsyncSession = Depends(get_db),

    current_user: User = Depends(
        get_current_user,
    ),

):

    try:

        profile = await profile_service.update_profile(

            db,

            current_user,

            payload,

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

    except Exception as exc:

        raise HTTPException(

            status_code=400,

            detail=str(exc),

        )


@router.post(
    "",
    response_model=ProfileResponse,
    status_code=201,
)
async def create_profile(
    payload: ProfileUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProfileResponse:
    """Create a new profile for the authenticated user.

    If a profile already exists, the existing one is returned.
    """
    # Check if profile exists
    existing = await profile_service.get_profile(db, current_user)
    if existing:
        return ProfileResponse(
            full_name=current_user.full_name,
            email=current_user.email,
            avatar=existing.avatar,
            bio=existing.bio,
            college=existing.college,
            branch=existing.branch,
            graduation_year=existing.graduation_year,
            target_company=existing.target_company,
            target_package=existing.target_package,
            github=existing.github,
            linkedin=existing.linkedin,
        )
    # Create via service using payload as update data
    profile = await profile_service.update_profile(db, current_user, payload)
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