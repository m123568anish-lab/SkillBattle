from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class QuestMapLevel(Base):
    __tablename__ = "quest_map_levels"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    map_id: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    level_type: Mapped[str] = mapped_column(String(40), nullable=False)
    skill_category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    battle_configuration: Mapped[dict] = mapped_column(JSON, nullable=False)
    prerequisite_level_ids: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    reward_configuration: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    is_milestone: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class QuestProgress(Base):
    __tablename__ = "quest_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "level_id", name="uq_quest_progress_user_level"),
        UniqueConstraint("battle_id", name="uq_quest_progress_battle"),
        Index("ix_quest_progress_user_status", "user_id", "status"),
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
    )
    level_id: Mapped[str] = mapped_column(
        String(100),
        ForeignKey("quest_map_levels.id", ondelete="CASCADE"),
        nullable=False,
    )
    battle_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("battle_rooms.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(String(20), default="IN_PROGRESS", nullable=False)
    stars: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    best_accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )