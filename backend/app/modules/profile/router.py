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
from sqlalchemy import select

from app.models.user import User
from app.models.company import CandidatePrivacySettings

from app.modules.profile.schemas import (
    ProfileResponse,
    ProfileUpdateRequest,
    SkillProfileResponse,
)

from app.modules.profile.service import (
    profile_service,
)
from app.modules.profile.skill_profile_service import skill_profile_service
from app.modules.company.schemas import CandidatePrivacySettingsRequest, CandidatePrivacySettingsResponse
from app.modules.xp.service import xp_service

router = APIRouter(

    prefix="/profile",

    tags=["Profile"],

)


async def _profile_response(
    db: AsyncSession,
    current_user: User,
    profile,
) -> ProfileResponse:
    progression = await xp_service.get_user_xp(db, current_user)
    return ProfileResponse(
        full_name=current_user.full_name or "",
        email=current_user.email or "",
        total_xp=progression.total_xp,
        level=progression.level,
        avatar=profile.avatar or current_user.avatar_url or "",
        bio=profile.bio or current_user.bio or "",
        college=profile.college or "",
        branch=profile.branch or "",
        graduation_year=profile.graduation_year or 2027,
        target_company=profile.target_company or "",
        target_package=profile.target_package or "",
        onboarding_preferences=profile.onboarding_preferences or {},
        github=profile.github or current_user.github_url or "",
        linkedin=profile.linkedin or current_user.linkedin_url or "",
        onboarding_completed=bool(getattr(current_user, "onboarding_completed", True)),
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
@router.get("", response_model=ProfileResponse, include_in_schema=False)
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

    return await _profile_response(db, current_user, profile)


@router.get("/skill-profile", response_model=SkillProfileResponse)
async def get_skill_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SkillProfileResponse:
    return SkillProfileResponse(**await skill_profile_service.get_profile(db, current_user))


@router.get("/sharing-settings", response_model=CandidatePrivacySettingsResponse)
async def get_sharing_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CandidatePrivacySettingsResponse:
    result = await db.execute(
        select(CandidatePrivacySettings).where(CandidatePrivacySettings.user_id == current_user.id)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        return CandidatePrivacySettingsResponse(user_id=current_user.id)
    return CandidatePrivacySettingsResponse(
        user_id=current_user.id,
        share_contact_info=settings.share_contact_info,
        share_skill_profile=settings.share_skill_profile,
        share_assessment_results=settings.share_assessment_results,
        allow_recruiter_search=settings.allow_recruiter_search,
    )


@router.put("/sharing-settings", response_model=CandidatePrivacySettingsResponse)
async def update_sharing_settings(
    payload: CandidatePrivacySettingsRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CandidatePrivacySettingsResponse:
    result = await db.execute(
        select(CandidatePrivacySettings).where(CandidatePrivacySettings.user_id == current_user.id)
    )
    settings = result.scalar_one_or_none()
    if not settings:
        settings = CandidatePrivacySettings(user_id=current_user.id)
        db.add(settings)
    for key, value in payload.model_dump().items():
        setattr(settings, key, value)
    await db.commit()
    await db.refresh(settings)
    return CandidatePrivacySettingsResponse(
        user_id=current_user.id,
        share_contact_info=settings.share_contact_info,
        share_skill_profile=settings.share_skill_profile,
        share_assessment_results=settings.share_assessment_results,
        allow_recruiter_search=settings.allow_recruiter_search,
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
        payload = payload.model_copy(update={
            "onboarding_preferences": (
                await profile_service.get_profile(db, current_user)
            ).onboarding_preferences or {}
        })
        profile = await profile_service.update_profile(
            db,
            current_user,
            payload,
        )

        return await _profile_response(db, current_user, profile)
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
        return await _profile_response(db, current_user, existing)
    profile = await profile_service.update_profile(db, current_user, payload)
    return await _profile_response(db, current_user, profile)


# ==========================================================
# Profile Photo Chooser / Avatar Upload System
# ==========================================================

from fastapi import File, UploadFile
import os
import time

MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


@router.post("/avatar", response_model=ProfileResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProfileResponse:
    """Upload a profile picture from device with validation."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected.")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS or (file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid image type. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    content = await file.read()
    if len(content) > MAX_AVATAR_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowed limit of 5 MB.")

    os.makedirs("uploads/avatars", exist_ok=True)
    filename = f"avatar_{current_user.id}_{int(time.time())}{ext}"
    filepath = os.path.join("uploads", "avatars", filename)

    # Clean up previous custom avatar file if present
    if current_user.avatar_url and "/uploads/avatars/" in current_user.avatar_url:
        try:
            old_filename = current_user.avatar_url.split("/uploads/avatars/")[-1]
            old_filepath = os.path.join("uploads", "avatars", old_filename)
            if os.path.exists(old_filepath):
                os.remove(old_filepath)
        except Exception:
            pass

    with open(filepath, "wb") as f:
        f.write(content)

    avatar_url = f"/uploads/avatars/{filename}"
    current_user.avatar_url = avatar_url

    profile = await profile_service.get_profile(db, current_user)
    if profile:
        profile.avatar = avatar_url

    await db.commit()
    await db.refresh(current_user)

    return await _profile_response(db, current_user, profile)


@router.delete("/avatar", response_model=ProfileResponse)
async def delete_avatar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProfileResponse:
    """Remove current profile picture."""
    if current_user.avatar_url and "/uploads/avatars/" in current_user.avatar_url:
        try:
            filename = current_user.avatar_url.split("/uploads/avatars/")[-1]
            filepath = os.path.join("uploads", "avatars", filename)
            if os.path.exists(filepath):
                os.remove(filepath)
        except Exception:
            pass

    current_user.avatar_url = None
    profile = await profile_service.get_profile(db, current_user)
    if profile:
        profile.avatar = ""

    await db.commit()
    await db.refresh(current_user)

    return await _profile_response(db, current_user, profile)

