"""
=========================================================

SkillBattle

Problem Model

Production SQLAlchemy 2.x

=========================================================
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


class Problem(Base):

    __tablename__ = "problems"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        unique=True,
        index=True,
    )

    slug: Mapped[str] = mapped_column(
        String(220),
        unique=True,
        index=True,
    )

    difficulty: Mapped[str] = mapped_column(
        String(20),
        index=True,
    )

    category: Mapped[str] = mapped_column(
        String(50),
        index=True,
    )

    description: Mapped[str] = mapped_column(
        Text,
    )

    input_format: Mapped[str] = mapped_column(
        Text,
    )

    output_format: Mapped[str] = mapped_column(
        Text,
    )

    constraints: Mapped[str] = mapped_column(
        Text,
    )

    explanation: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    xp_reward: Mapped[int] = mapped_column(
        Integer,
        default=100,
    )

    time_limit: Mapped[int] = mapped_column(
        Integer,
        default=2,
    )

    memory_limit: Mapped[int] = mapped_column(
        Integer,
        default=256,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
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

    test_cases = relationship(
        "ProblemTestCase",
        back_populates="problem",
        cascade="all, delete-orphan",
    )

    starter_codes = relationship(
        "ProblemStarterCode",
        back_populates="problem",
        cascade="all, delete-orphan",
    )

    tags = relationship(
        "ProblemTag",
        back_populates="problem",
        cascade="all, delete-orphan",
    )

    submissions = relationship(
        "CodeSubmission",
        back_populates="problem",
        cascade="all, delete-orphan",
    )