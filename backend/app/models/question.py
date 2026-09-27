from __future__ import annotations

import json
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.types import TypeDecorator
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class SafeJSON(TypeDecorator):
    impl = JSON
    cache_ok = True

    def process_result_value(self, value, dialect):
        if value is None or value == "" or value == "''" or value == '""':
            return []
        if isinstance(value, (dict, list)):
            return value
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return []
        return value


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String(20), index=True)
    
    # Advanced Battle Engine fields
    question_type: Mapped[str] = mapped_column(String(30), default="coding", index=True, nullable=False) # "mcq", "coding", "debugging", "technical"
    options: Mapped[list] = mapped_column(SafeJSON, default=list) # For MCQ: [{"key": "A", "text": "..."}, ...]
    correct_option: Mapped[str] = mapped_column(String(100), default="") # Correct choice key or text for MCQ
    buggy_code: Mapped[str] = mapped_column(Text, default="") # Pre-filled code containing bugs for Debugging Qs
    fixed_code_reference: Mapped[str] = mapped_column(Text, default="") # Reference solution for Debugging
    rubric: Mapped[dict] = mapped_column(SafeJSON, default=dict) # Evaluation rubric for Technical Qs
    explanation: Mapped[str] = mapped_column(Text, default="") # Explanation of answer/solution
    
    # Metadata & Tags
    constraints: Mapped[str] = mapped_column(Text, default="")
    examples: Mapped[list] = mapped_column(SafeJSON, default=list)
    hidden_test_cases: Mapped[list] = mapped_column(SafeJSON, default=list)
    company_tags: Mapped[list] = mapped_column(SafeJSON, default=list)
    topic_tags: Mapped[list] = mapped_column(SafeJSON, default=list)
    skill_category: Mapped[str] = mapped_column(String(50), default="Problem Solving", index=True)
    estimated_time_minutes: Mapped[int] = mapped_column(Integer, default=5)
    
    # AI Generation & Validation
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_validated: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)


class UserSubmission(Base):
    __tablename__ = "user_submissions"
    __table_args__ = (UniqueConstraint("user_id", "question_id", name="uq_user_question_submission"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    question_id: Mapped[int] = mapped_column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), index=True)
    language: Mapped[str] = mapped_column(String(30))
    source_code: Mapped[str] = mapped_column(Text)
    solved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    passed_tests: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_tests: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    execution_time_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
