"""
=========================================================

SkillBattle

Notification Service

Production Async Version

=========================================================
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification

from app.modules.notification.repository import (
    notification_repository,
)


class NotificationService:

    # =====================================================
    # Create Notification
    # =====================================================

    async def create(
        self,
        db: AsyncSession,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "system",
    ):

        notification = Notification(

            user_id=user_id,

            title=title,

            message=message,

            notification_type=notification_type,

        )

        notification = await notification_repository.create(

            db,

            notification,

        )

        await notification_repository.commit(db)

        return notification

    # =====================================================
    # User Notifications
    # =====================================================

    async def list_user_notifications(
        self,
        db: AsyncSession,
        user_id: str,
    ):

        return await notification_repository.get_by_user(

            db,

            user_id,

        )

    # =====================================================
    # Mark Read
    # =====================================================

    async def mark_read(
        self,
        db: AsyncSession,
        notification,
    ):

        await notification_repository.mark_read(

            db,

            notification,

        )

        await notification_repository.commit(db)

        return notification

    # =====================================================
    # Delete
    # =====================================================

    async def delete(
        self,
        db: AsyncSession,
        notification,
    ):

        await notification_repository.delete(

            db,

            notification,

        )

        await notification_repository.commit(db)


notification_service = NotificationService()