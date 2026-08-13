"""
=========================================================

Problem Test Case

=========================================================
"""

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Integer,
    Text,
)

from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


class ProblemTestCase(Base):

    __tablename__ = "problem_test_cases"

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
        index=True,
    )

    input_data: Mapped[str] = mapped_column(
        Text,
    )

    expected_output: Mapped[str] = mapped_column(
        Text,
    )

    is_hidden: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    explanation: Mapped[str] = mapped_column(
        Text,
        default="",
    )

    problem = relationship(
        "Problem",
        back_populates="test_cases",
    )