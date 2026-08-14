"""
=========================================================

SkillBattle

Problem Tag Model

Production SQLAlchemy 2.x

=========================================================
"""

from __future__ import annotations

from sqlalchemy import (
    ForeignKey,
    Integer,
    String,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


class ProblemTag(Base):

    __tablename__ = "problem_tags"

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

    tag: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    problem = relationship(
        "Problem",
        back_populates="tags",
    )

    def __repr__(self) -> str:
        return (
            f"<ProblemTag("
            f"problem_id={self.problem_id}, "
            f"tag='{self.tag}')>"
        )