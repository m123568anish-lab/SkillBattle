"""Add battle questions, submissions, stats, and settings.

Revision ID: f2a8c1d9e4b7
Revises: e7b2c9d4f1a6
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f2a8c1d9e4b7"
down_revision: Union[str, Sequence[str], None] = "e7b2c9d4f1a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_stats",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("level", sa.Integer(), server_default="1", nullable=False),
        sa.Column("rating", sa.Integer(), server_default="1000", nullable=False),
        sa.Column("xp", sa.Integer(), server_default="0", nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_user_stats_user_id"),
    )
    op.create_index("ix_user_stats_user_id", "user_stats", ["user_id"])

    op.create_table(
        "user_settings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("theme", sa.String(length=20), server_default="dark", nullable=False),
        sa.Column("language", sa.String(length=20), server_default="python", nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_user_settings_user_id"),
    )
    op.create_index("ix_user_settings_user_id", "user_settings", ["user_id"])

    op.create_table(
        "questions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=220), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("difficulty", sa.String(length=20), nullable=False),
        sa.Column("constraints", sa.Text(), server_default="", nullable=False),
        sa.Column("examples", sa.JSON(), nullable=False),
        sa.Column("hidden_test_cases", sa.JSON(), nullable=False),
        sa.Column("company_tags", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
        sa.UniqueConstraint("title"),
    )
    op.create_index("ix_questions_title", "questions", ["title"])
    op.create_index("ix_questions_slug", "questions", ["slug"])
    op.create_index("ix_questions_difficulty", "questions", ["difficulty"])

    op.create_table(
        "user_submissions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("question_id", sa.Integer(), nullable=False),
        sa.Column("language", sa.String(length=30), nullable=False),
        sa.Column("source_code", sa.Text(), nullable=False),
        sa.Column("solved", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("passed_tests", sa.Integer(), server_default="0", nullable=False),
        sa.Column("total_tests", sa.Integer(), server_default="0", nullable=False),
        sa.Column("execution_time_ms", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["question_id"], ["questions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "question_id", name="uq_user_question_submission"),
    )
    op.create_index("ix_user_submissions_user_id", "user_submissions", ["user_id"])
    op.create_index("ix_user_submissions_question_id", "user_submissions", ["question_id"])


def downgrade() -> None:
    op.drop_table("user_submissions")
    op.drop_table("questions")
    op.drop_table("user_settings")
    op.drop_table("user_stats")
