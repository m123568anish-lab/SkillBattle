"""
=========================================================

SkillBattle

Audit Model

=========================================================
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database.base import Base


class AuditLog(Base):

    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str | None] = mapped_column(
        String(36),
        nullable=True,
        index=True,
    )

    action: Mapped[str] = mapped_column(
        String(150),
    )

    module: Mapped[str] = mapped_column(
        String(100),
    )

    ip_address: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    user_agent: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )