from __future__ import annotations

from datetime import datetime
from typing import List

from sqlalchemy import (
    String,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


# ==========================================================
# Roadmap
# ==========================================================

class Roadmap(Base):
    """
    Stores the main AI generated roadmap.
    """

    __tablename__ = "roadmaps"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    target_company: Mapped[str] = mapped_column(
        String(100),
        default="",
    )

    duration_weeks: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    estimated_hours: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    progress: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="ACTIVE",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    weeks: Mapped[List["RoadmapWeek"]] = relationship(
        back_populates="roadmap",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"<Roadmap(id={self.id}, "
            f"title='{self.title}', "
            f"user='{self.user_id}')>"
        )


# ==========================================================
# Roadmap Week
# ==========================================================

class RoadmapWeek(Base):
    """
    Represents one week inside a roadmap.
    """

    __tablename__ = "roadmap_weeks"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    roadmap_id: Mapped[int] = mapped_column(
        ForeignKey("roadmaps.id", ondelete="CASCADE"),
        nullable=False,
    )

    week_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    objective: Mapped[str] = mapped_column(
        String(500),
        default="",
    )

    completion: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    roadmap: Mapped["Roadmap"] = relationship(
        back_populates="weeks",
    )

    tasks: Mapped[List["RoadmapTask"]] = relationship(
        back_populates="week",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"<RoadmapWeek("
            f"week={self.week_number}, "
            f"title='{self.title}')>"
        )


# ==========================================================
# Roadmap Task
# ==========================================================

class RoadmapTask(Base):
    """
    Represents one learning task.
    """

    __tablename__ = "roadmap_tasks"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    week_id: Mapped[int] = mapped_column(
        ForeignKey("roadmap_weeks.id", ondelete="CASCADE"),
        nullable=False,
    )

    day: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    topic: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    difficulty: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    estimated_minutes: Mapped[int] = mapped_column(
        Integer,
        default=60,
    )

    reward_xp: Mapped[int] = mapped_column(
        Integer,
        default=100,
    )

    completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    week: Mapped["RoadmapWeek"] = relationship(
        back_populates="tasks",
    )

    def __repr__(self) -> str:
        return (
            f"<RoadmapTask("
            f"id={self.id}, "
            f"topic='{self.topic}', "
            f"completed={self.completed})>"
        )