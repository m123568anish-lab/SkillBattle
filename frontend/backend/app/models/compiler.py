from __future__ import annotations

from datetime import datetime
from typing import List

from sqlalchemy import (
    String,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base
from app.models.problem import Problem


# ==========================================================
# Test Case
# ==========================================================

class TestCase(Base):

    __tablename__ = "test_cases"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    problem_id: Mapped[int] = mapped_column(
        ForeignKey(
            "problems.id",
            ondelete="CASCADE",
        )
    )

    input_data: Mapped[str] = mapped_column(
        Text,
    )

    expected_output: Mapped[str] = mapped_column(
        Text,
    )

    is_sample: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    problem: Mapped["Problem"] = relationship()


# ==========================================================
# Code Submission
# ==========================================================

class CodeSubmission(Base):

    __tablename__ = "code_submissions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        index=True,
    )

    problem_id: Mapped[int] = mapped_column(
        ForeignKey(
            "problems.id",
            ondelete="CASCADE",
        )
    )

    language: Mapped[str] = mapped_column(
        String(30),
    )

    source_code: Mapped[str] = mapped_column(
        Text,
    )

    verdict: Mapped[str] = mapped_column(
        String(50),
        default="Pending",
    )

    execution_time: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    memory_used: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    passed_tests: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    total_tests: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    problem: Mapped["Problem"] = relationship()