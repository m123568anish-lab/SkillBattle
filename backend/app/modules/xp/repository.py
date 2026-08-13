"""
=========================================================

SkillBattle

XP Repository

Production Async Version

=========================================================
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.xp import XP


class XPRepository:

    # =====================================================
    # Get By User
    # =====================================================

    async def get_by_user(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> XP | None:

        result = await db.execute(

            select(XP).where(

                XP.user_id == user_id

            )

        )

        return result.scalar_one_or_none()

    # =====================================================
    # Create
    # =====================================================

    async def create(
        self,
        db: AsyncSession,
        xp: XP,
    ) -> XP:

        db.add(xp)

        await db.flush()

        await db.refresh(xp)

        return xp

    # =====================================================
    # Update
    # =====================================================

    async def update(
        self,
        db: AsyncSession,
        xp: XP,
    ) -> XP:

        db.add(xp)

        await db.flush()

        await db.refresh(xp)

        return xp

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

    # =====================================================
    # Refresh
    # =====================================================

    async def refresh(
        self,
        db: AsyncSession,
        obj,
    ):

        await db.refresh(obj)


xp_repository = XPRepository()