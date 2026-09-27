"""
=========================================================
SkillBattle - College / Placement Cell Platform Models
=========================================================
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    String,
    Integer,
    Boolean,
    DateTime,
    Float,
    Text,
    JSON,
    ForeignKey,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


# ==========================================================
# 1. College Entity
# ==========================================================

class College(Base):
    __tablename__ = "colleges"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )

    domain: Mapped[str] = mapped_column(
        String(100),
        default="",
    )

    city: Mapped[str] = mapped_column(
        String(100),
        default="",
    )

    state: Mapped[str] = mapped_column(
        String(100),
        default="",
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    admin_user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
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

    departments: Mapped[List["Department"]] = relationship(
        back_populates="college",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    batches: Mapped[List["Batch"]] = relationship(
        back_populates="college",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    students: Mapped[List["CollegeStudent"]] = relationship(
        back_populates="college",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


# ==========================================================
# 2. Department Entity
# ==========================================================

class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    college_id: Mapped[int] = mapped_column(
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    head_name: Mapped[str] = mapped_column(
        String(150),
        default="",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    college: Mapped["College"] = relationship(
        back_populates="departments",
    )

    batches: Mapped[List["Batch"]] = relationship(
        back_populates="department",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


# ==========================================================
# 3. Batch Entity
# ==========================================================

class Batch(Base):
    __tablename__ = "batches"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    college_id: Mapped[int] = mapped_column(
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    department_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    passout_year: Mapped[int] = mapped_column(
        Integer,
        default=2027,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    college: Mapped["College"] = relationship(
        back_populates="batches",
    )

    department: Mapped[Optional["Department"]] = relationship(
        back_populates="batches",
    )


# ==========================================================
# 4. Student-College Association
# ==========================================================

class CollegeStudent(Base):
    __tablename__ = "college_students"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    college_id: Mapped[int] = mapped_column(
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    department_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )

    batch_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("batches.id", ondelete="SET NULL"),
        nullable=True,
    )

    roll_number: Mapped[str] = mapped_column(
        String(50),
        default="",
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    college: Mapped["College"] = relationship(
        back_populates="students",
    )

    user: Mapped["User"] = relationship("User")


# ==========================================================
# 5. College Assessment Entity
# ==========================================================

class CollegeAssessment(Base):
    __tablename__ = "college_assessments"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    college_id: Mapped[int] = mapped_column(
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    department_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )

    batch_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("batches.id", ondelete="SET NULL"),
        nullable=True,
    )

    created_by_user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    assessment_type: Mapped[str] = mapped_column(
        String(50),
        default="HYBRID",  # HYBRID, MCQ, CODING
    )

    duration_minutes: Mapped[int] = mapped_column(
        Integer,
        default=60,
    )

    start_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
    )

    end_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="SCHEDULED",  # DRAFT, SCHEDULED, ACTIVE, COMPLETED
    )

    pass_marks: Mapped[int] = mapped_column(
        Integer,
        default=50,
    )

    total_marks: Mapped[int] = mapped_column(
        Integer,
        default=100,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    questions: Mapped[List["CollegeAssessmentQuestion"]] = relationship(
        back_populates="assessment",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    submissions: Mapped[List["CollegeAssessmentSubmission"]] = relationship(
        back_populates="assessment",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


# ==========================================================
# 6. College Assessment Question Entity
# ==========================================================

class CollegeAssessmentQuestion(Base):
    __tablename__ = "college_assessment_questions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    assessment_id: Mapped[int] = mapped_column(
        ForeignKey("college_assessments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    question_type: Mapped[str] = mapped_column(
        String(30),
        default="MCQ",  # MCQ or CODING
    )

    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    options_json: Mapped[list] = mapped_column(
        JSON,
        default=list,  # List of string options
    )

    correct_option: Mapped[str] = mapped_column(
        String(100),
        default="",
    )

    coding_starter_code: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    test_cases_json: Mapped[list] = mapped_column(
        JSON,
        default=list,
    )

    marks: Mapped[int] = mapped_column(
        Integer,
        default=10,
    )

    assessment: Mapped["CollegeAssessment"] = relationship(
        back_populates="questions",
    )


# ==========================================================
# 7. College Assessment Submission Entity
# ==========================================================

class CollegeAssessmentSubmission(Base):
    __tablename__ = "college_assessment_submissions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )

    assessment_id: Mapped[int] = mapped_column(
        ForeignKey("college_assessments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    student_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    mcq_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    coding_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    total_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    percentage: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="SUBMITTED",  # IN_PROGRESS, SUBMITTED, EVALUATED
    )

    is_passed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    answers_json: Mapped[dict] = mapped_column(
        JSON,
        default=dict,
    )

    submitted_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    assessment: Mapped["CollegeAssessment"] = relationship(
        back_populates="submissions",
    )

    student: Mapped["User"] = relationship("User")
