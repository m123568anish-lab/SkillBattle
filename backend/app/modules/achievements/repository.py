"""
=========================================================

SkillBattle

Achievement Repository

Production Async Version

=========================================================
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.achievement import Achievement


class AchievementRepository:

    # =====================================================
    # Get All
    # =====================================================

    async def get_all(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> list[Achievement]:

        result = await db.execute(

            select(Achievement)

            .where(

                Achievement.user_id == user_id,

            )

        )

        return list(result.scalars().all())

    # =====================================================
    # Create
    # =====================================================

    async def create(
        self,
        db: AsyncSession,
        achievement: Achievement,
    ) -> Achievement:

        db.add(achievement)

        await db.flush()

        await db.refresh(achievement)

        return achievement

    # =====================================================
    # Update
    # =====================================================

    async def update(
        self,
        db: AsyncSession,
        achievement: Achievement,
    ) -> Achievement:

        db.add(achievement)

        await db.flush()

        await db.refresh(achievement)

        return achievement

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


achievement_repository = AchievementRepository()