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
        full_name=current_user.full_name or "",
        email=current_user.email or "",
        avatar=profile.avatar or current_user.avatar_url or "",
        bio=profile.bio or current_user.bio or "",
        college=profile.college or "",
        branch=profile.branch or "",
        graduation_year=profile.graduation_year or 2027,
        target_company=profile.target_company or "",
        target_package=profile.target_package or "",
        github=profile.github or current_user.github_url or "",
        linkedin=profile.linkedin or current_user.linkedin_url or "",
    )


@router.put(
    "",
    response_model=ProfileResponse,
)
async def update_profile(
    payload: ProfileUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        profile = await profile_service.update_profile(
            db,
            current_user,
            payload,
        )

        return ProfileResponse(
            full_name=current_user.full_name or "",
            email=current_user.email or "",
            avatar=profile.avatar or current_user.avatar_url or "",
            bio=profile.bio or current_user.bio or "",
            college=profile.college or "",
            branch=profile.branch or "",
            graduation_year=profile.graduation_year or 2027,
            target_company=profile.target_company or "",
            target_package=profile.target_package or "",
            github=profile.github or current_user.github_url or "",
            linkedin=profile.linkedin or current_user.linkedin_url or "",
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
    existing = await profile_service.get_profile(db, current_user)
    if existing:
        return ProfileResponse(
            full_name=current_user.full_name or "",
            email=current_user.email or "",
            avatar=existing.avatar or current_user.avatar_url or "",
            bio=existing.bio or current_user.bio or "",
            college=existing.college or "",
            branch=existing.branch or "",
            graduation_year=existing.graduation_year or 2027,
            target_company=existing.target_company or "",
            target_package=existing.target_package or "",
            github=existing.github or current_user.github_url or "",
            linkedin=existing.linkedin or current_user.linkedin_url or "",
        )
    profile = await profile_service.update_profile(db, current_user, payload)
    return ProfileResponse(
        full_name=current_user.full_name or "",
        email=current_user.email or "",
        avatar=profile.avatar or current_user.avatar_url or "",
        bio=profile.bio or current_user.bio or "",
        college=profile.college or "",
        branch=profile.branch or "",
        graduation_year=profile.graduation_year or 2027,
        target_company=profile.target_company or "",
        target_package=profile.target_package or "",
        github=profile.github or current_user.github_url or "",
        linkedin=profile.linkedin or current_user.linkedin_url or "",
    )