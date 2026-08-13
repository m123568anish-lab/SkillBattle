"""
=========================================================

SkillBattle

Interview Model

=========================================================
"""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import (
    String,
    DateTime,
    Integer,
    ForeignKey,
    Enum as SqlEnum,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
)

from app.database.base import Base


class InterviewStatus(str, Enum):

    CREATED = "created"

    RUNNING = "running"

    COMPLETED = "completed"

    CANCELLED = "cancelled"


class Interview(Base):

    __tablename__ = "interviews"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id"),
        index=True,
    )

    difficulty: Mapped[str] = mapped_column(
        String(20),
        default="medium",
    )

    language: Mapped[str] = mapped_column(
        String(30),
        default="python",
    )

    status: Mapped[InterviewStatus] = mapped_column(
        SqlEnum(InterviewStatus),
        default=InterviewStatus.CREATED,
    )

    current_question: Mapped[int] = mapped_column(
        Integer,
        default=1,
    )

    total_questions: Mapped[int] = mapped_column(
        Integer,
        default=5,
    )

    score: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )