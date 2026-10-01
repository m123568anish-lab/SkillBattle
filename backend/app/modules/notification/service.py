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

    def enqueue(
        self,
        db: AsyncSession,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "system",
        related_entity_type: str | None = None,
        related_entity_id: str | None = None,
    ) -> Notification:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
        )
        db.add(notification)
        return notification

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
        related_entity_type: str | None = None,
        related_entity_id: str | None = None,
    ):
        notification = self.enqueue(
            db,
            user_id,
            title,
            message,
            notification_type,
            related_entity_type,
            related_entity_id,
        )
        await db.flush()
        await db.refresh(notification)
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