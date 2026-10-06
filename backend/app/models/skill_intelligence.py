from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base
from app.models.question import SafeJSON


class SkillEvidence(Base):
    __tablename__ = "skill_evidence"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "source_type",
            "source_id",
            "submission_id",
            "question_id",
            "skill_id",
            name="uq_skill_evidence_identity",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    skill_id: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    skill_name: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    parent_skill_id: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    source_type: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    source_id: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    submission_id: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    question_id: Mapped[str | None] = mapped_column(String(120), index=True, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    correct: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    max_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    response_time_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    attempt_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    extra: Mapped[dict] = mapped_column(SafeJSON, default=dict, nullable=False)


class CompanySkillRequirement(Base):
    __tablename__ = "company_skill_requirements"
    __table_args__ = (
        UniqueConstraint("company_id", "skill_id", name="uq_company_skill_requirement"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id: Mapped[str] = mapped_column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=False)
    skill_id: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    importance: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    minimum_mastery: Mapped[str] = mapped_column(String(30), default="LEARNING", nullable=False)
    recommended_mastery: Mapped[str] = mapped_column(String(30), default="COMPETENT", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
