from __future__ import annotations

from datetime import datetime
from typing import List

from sqlalchemy import (
    String,
    Integer,
    DateTime,
    Text,
    Float,
    ForeignKey,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


# ==========================================================
# Interview Session
# ==========================================================

class InterviewSession(Base):

    __tablename__ = "interview_sessions"

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

    company: Mapped[str] = mapped_column(
        String(100),
    )

    role: Mapped[str] = mapped_column(
        String(100),
    )

    interview_type: Mapped[str] = mapped_column(
        String(50),
    )

    difficulty: Mapped[str] = mapped_column(
        String(30),
    )

    total_questions: Mapped[int] = mapped_column(
        Integer,
        default=5,
    )

    overall_score: Mapped[float] = mapped_column(
        Float,
        default=0,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="IN_PROGRESS",
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    finished_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    questions: Mapped[List["InterviewQuestion"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self):

        return (
            f"<InterviewSession("
            f"id={self.id}, "
            f"company='{self.company}', "
            f"status='{self.status}')>"
        )


# ==========================================================
# Interview Question
# ==========================================================

class InterviewQuestion(Base):

    __tablename__ = "interview_questions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    session_id: Mapped[int] = mapped_column(
        ForeignKey(
            "interview_sessions.id",
            ondelete="CASCADE",
        ),
    )

    sequence: Mapped[int] = mapped_column(
        Integer,
    )

    question: Mapped[str] = mapped_column(
        Text,
    )

    expected_topics: Mapped[str] = mapped_column(
        Text,
    )

    difficulty: Mapped[str] = mapped_column(
        String(30),
    )

    session: Mapped["InterviewSession"] = relationship(
        back_populates="questions",
    )

    answers: Mapped[List["InterviewAnswer"]] = relationship(
        back_populates="question",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self):

        return (
            f"<InterviewQuestion("
            f"id={self.id}, "
            f"sequence={self.sequence})>"
        )


# ==========================================================
# Interview Answer
# ==========================================================

class InterviewAnswer(Base):

    __tablename__ = "interview_answers"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    question_id: Mapped[int] = mapped_column(
        ForeignKey(
            "interview_questions.id",
            ondelete="CASCADE",
        ),
    )

    answer: Mapped[str] = mapped_column(
        Text,
    )

    feedback: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    score: Mapped[float] = mapped_column(
        Float,
        default=0,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    question: Mapped["InterviewQuestion"] = relationship(
        back_populates="answers",
    )

    def __repr__(self):

        return (
            f"<InterviewAnswer("
            f"id={self.id}, "
            f"score={self.score})>"
        )