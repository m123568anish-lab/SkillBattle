"""
=========================================================

SkillBattle

Battle Config Model

Reusable, configurable battle definition supporting General,
Placement, Company, College, Tournament, and Practice battles.

=========================================================
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    Text,
    Integer,
    Boolean,
    JSON,
    DateTime,
    ForeignKey,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


class BattleConfig(Base):

    __tablename__ = "battle_configs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )

    title: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    battle_type: Mapped[str] = mapped_column(
        String(50),
        default="general",
        index=True,
        nullable=False,
    )

    difficulty: Mapped[str] = mapped_column(
        String(30),
        default="medium",
        index=True,
        nullable=False,
    )

    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        default=30,
        nullable=False,
    )

    question_count: Mapped[int] = mapped_column(
        Integer,
        default=5,
        nullable=False,
    )

    sections: Mapped[list] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    allowed_languages: Mapped[list] = mapped_column(
        JSON,
        default=lambda: ["python", "javascript", "cpp", "java", "sql"],
        nullable=False,
    )

    scoring_rules: Mapped[dict] = mapped_column(
        JSON,
        default=lambda: {
            "mcq_weight": 0.2,
            "coding_weight": 0.5,
            "debugging_weight": 0.2,
            "technical_weight": 0.1,
            "mcq_points": 10,
            "coding_points": 50,
            "debugging_points": 25,
            "technical_points": 15,
            "negative_penalty": 2.5,
        },
        nullable=False,
    )

    negative_marking: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    visibility: Mapped[str] = mapped_column(
        String(30),
        default="public",
        nullable=False,
    )

    eligibility: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )

    company_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("companies.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    college_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("colleges.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    job_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("job_postings.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationships
    company = relationship("Company")
    college = relationship("College")
    job = relationship("JobPosting")

    def __repr__(self) -> str:
        return f"<BattleConfig(id={self.id}, title='{self.title}', type='{self.battle_type}')>"
