"""
=========================================================

SkillBattle

Profile Service

Production Async Version

=========================================================
"""

from __future__ import annotations

import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import Profile
from app.models.user import User

from app.modules.profile.repository import (
    profile_repository,
)

from app.modules.profile.schemas import (
    ProfileUpdateRequest,
)

logger = logging.getLogger(__name__)


class ProfileService:

    # =====================================================
    # Get Profile
    # =====================================================

    async def get_profile(
        self,
        db: AsyncSession,
        current_user: User,
    ) -> Profile:

        profile = await profile_repository.get_by_user_id(

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

        profile = await profile_repository.create(

            db,

            profile,

        )

        await profile_repository.commit(db)

        return profile

    # =====================================================
    # Update Profile
    # =====================================================

    async def update_profile(
        self,
        db: AsyncSession,
        current_user: User,
        data: ProfileUpdateRequest,
    ) -> Profile:

        profile = await self.get_profile(

            db,

            current_user,

        )

        update_data = data.model_dump(

            exclude_unset=True,

        )

        for key, value in update_data.items():
            if hasattr(profile, key):
                setattr(profile, key, value)

        # Sync key profile fields back to the User model so Auth / Navbar see them immediately
        if data.full_name:
            current_user.full_name = data.full_name
        if data.avatar:
            current_user.avatar_url = data.avatar
        if data.bio:
            current_user.bio = data.bio
        if data.github:
            current_user.github_url = data.github
        if data.linkedin:
            current_user.linkedin_url = data.linkedin

        db.add(current_user)

        profile = await profile_repository.update(
            db,
            profile,
        )

        await profile_repository.commit(db)
        await db.refresh(current_user)

        logger.info(
            "Profile and User updated for %s",
            current_user.id,
        )

        return profile


profile_service = ProfileService()