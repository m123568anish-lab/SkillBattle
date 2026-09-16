"""
=========================================================

SkillBattle

XP Repository

Production Async Version

=========================================================
"""

from __future__ import annotations

from sqlalchemy import select, update
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

            select(XP)
            .where(

                XP.user_id == user_id

            )
            .order_by(XP.id.desc())
            .limit(1)

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

    async def increment(
        self,
        db: AsyncSession,
        user_id: str,
        amount: int,
    ) -> XP | None:
        result = await db.execute(
            update(XP)
            .where(XP.user_id == user_id)
            .values(
                total_xp=XP.total_xp + amount,
                weekly_xp=XP.weekly_xp + amount,
                daily_xp=XP.daily_xp + amount,
                level=((XP.total_xp + amount) // 500) + 1,
            )
            .returning(XP)
        )
        return result.scalar_one_or_none()

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