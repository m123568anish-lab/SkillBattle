"""
=========================================================

SkillBattle

Notification Model

Production Version

=========================================================
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    func,
    text,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database.base import Base


class Notification(Base):

    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_created_at", "user_id", "created_at"),
    )

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
    )

    message: Mapped[str] = mapped_column(
        String(1000),
    )

    notification_type: Mapped[str] = mapped_column(
        String(50),
        default="system",
        server_default=text("'system'"),
        nullable=False,
    )

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=text("false"),
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        server_default=func.now(),
        nullable=False,
    )

    related_entity_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    related_entity_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )