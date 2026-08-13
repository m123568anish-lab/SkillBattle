"""
=========================================================

SkillBattle

Profile Repository

Production Async Version

=========================================================
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile import Profile


class ProfileRepository:

    # =====================================================
    # Get By User
    # =====================================================

    async def get_by_user_id(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> Profile | None:

        result = await db.execute(

            select(Profile).where(

                Profile.user_id == user_id,

            )

        )

        return result.scalar_one_or_none()

    # =====================================================
    # Exists
    # =====================================================

    async def exists(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> bool:

        profile = await self.get_by_user_id(

            db,

            user_id,

        )

        return profile is not None

    # =====================================================
    # Create
    # =====================================================

    async def create(
        self,
        db: AsyncSession,
        profile: Profile,
    ) -> Profile:

        db.add(profile)

        await db.flush()

        await db.refresh(profile)

        return profile

    # =====================================================
    # Update
    # =====================================================

    async def update(
        self,
        db: AsyncSession,
        profile: Profile,
    ) -> Profile:

        db.add(profile)

        await db.flush()

        await db.refresh(profile)

        return profile

    # =====================================================
    # Delete
    # =====================================================

    async def delete(
        self,
        db: AsyncSession,
        profile: Profile,
    ):

        await db.delete(profile)

    # =====================================================
    # Commit
    # =====================================================

    async def commit(
        self,
        db: AsyncSession,
    ):

        await db.commit()

    # =====================================================
    # Rollback
    # =====================================================

    async def rollback(
        self,
        db: AsyncSession,
    ):

        await db.rollback()


profile_repository = ProfileRepository()