"""
=========================================================

SkillBattle

Notification Repository

Production Async Version

=========================================================
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification


class NotificationRepository:

    # =====================================================
    # Get User Notifications
    # =====================================================

    async def get_by_user(
        self,
        db: AsyncSession,
        user_id: str,
    ) -> list[Notification]:

        result = await db.execute(

            select(Notification)

            .where(

                Notification.user_id == user_id,

            )

            .order_by(

                Notification.created_at.desc(),

            )

        )

        return list(result.scalars().all())

    # =====================================================
    # Create
    # =====================================================

    async def create(
        self,
        db: AsyncSession,
        notification: Notification,
    ) -> Notification:

        db.add(notification)

        await db.flush()

        await db.refresh(notification)

        return notification

    # =====================================================
    # Mark Read
    # =====================================================

    async def mark_read(
        self,
        db: AsyncSession,
        notification: Notification,
    ):

        notification.is_read = True

        db.add(notification)

        await db.flush()

    # =====================================================
    # Delete
    # =====================================================

    async def delete(
        self,
        db: AsyncSession,
        notification: Notification,
    ):

        await db.delete(notification)

    # =====================================================
    # Commit
    # =====================================================

    async def commit(
        self,
        db: AsyncSession,
    ):

        await db.commit()


notification_repository = NotificationRepository()