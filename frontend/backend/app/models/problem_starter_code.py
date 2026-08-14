"""
=========================================================

SkillBattle

Problem Starter Code Model

Production SQLAlchemy 2.x

=========================================================
"""

from __future__ import annotations

from sqlalchemy import (
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


class ProblemStarterCode(Base):

    __tablename__ = "problem_starter_codes"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    problem_id: Mapped[int] = mapped_column(
        ForeignKey(
            "problems.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    language: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )

    code: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    problem = relationship(
        "Problem",
        back_populates="starter_codes",
    )

    def __repr__(self) -> str:
        return (
            f"<ProblemStarterCode("
            f"problem_id={self.problem_id}, "
            f"language='{self.language}')>"
        )