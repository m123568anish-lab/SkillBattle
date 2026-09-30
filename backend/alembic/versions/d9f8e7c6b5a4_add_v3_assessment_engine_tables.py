"""Add V3 unified assessment and skill intelligence tables

Revision ID: d9f8e7c6b5a4
Revises: 5c7e9a1d3f42
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "d9f8e7c6b5a4"
down_revision: Union[str, Sequence[str], None] = "5c7e9a1d3f42"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_tables = inspector.get_table_names()

    # 1. unified_assessments
    if "unified_assessments" not in existing_tables:
        op.create_table(
            "unified_assessments",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("description", sa.Text(), nullable=True, server_default=""),
            sa.Column("assessment_type", sa.String(length=50), nullable=False, server_default="GENERAL"),
            sa.Column("difficulty", sa.String(length=30), nullable=False, server_default="MEDIUM"),
            sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default="60"),
            sa.Column("total_questions", sa.Integer(), nullable=False, server_default="10"),
            sa.Column("passing_score", sa.Float(), nullable=False, server_default="60.0"),
            sa.Column("negative_marking", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("randomize_questions", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("sections_json", sa.JSON(), nullable=False),
            sa.Column("scoring_rules", sa.JSON(), nullable=False),
            sa.Column("allowed_languages", sa.JSON(), nullable=False),
            sa.Column("attempt_limit", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("start_time", sa.DateTime(), nullable=True),
            sa.Column("end_time", sa.DateTime(), nullable=True),
            sa.Column("is_public", sa.Boolean(), nullable=False, server_default=sa.text("1")),
            sa.Column("college_id", sa.Integer(), nullable=True),
            sa.Column("company_id", sa.String(length=36), nullable=True),
            sa.Column("created_by_user_id", sa.String(length=36), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_unified_assessments_title", "unified_assessments", ["title"])
        op.create_index("ix_unified_assessments_assessment_type", "unified_assessments", ["assessment_type"])
        op.create_index("ix_unified_assessments_difficulty", "unified_assessments", ["difficulty"])
        op.create_index("ix_unified_assessments_college_id", "unified_assessments", ["college_id"])
        op.create_index("ix_unified_assessments_company_id", "unified_assessments", ["company_id"])
        op.create_index("ix_unified_assessments_created_by_user_id", "unified_assessments", ["created_by_user_id"])

    # 2. assessment_attempts
    if "assessment_attempts" not in existing_tables:
        op.create_table(
            "assessment_attempts",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("assessment_id", sa.String(length=36), sa.ForeignKey("unified_assessments.id", ondelete="CASCADE"), nullable=False),
            sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("status", sa.String(length=30), nullable=False, server_default="NOT_STARTED"),
            sa.Column("start_time", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.Column("end_time", sa.DateTime(), nullable=False),
            sa.Column("submitted_at", sa.DateTime(), nullable=True),
            sa.Column("current_question_index", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("answers_json", sa.JSON(), nullable=False),
            sa.Column("section_progress_json", sa.JSON(), nullable=False),
            sa.Column("question_sequence", sa.JSON(), nullable=False),
            sa.Column("score", sa.Float(), nullable=False, server_default="0.0"),
            sa.Column("max_possible_score", sa.Float(), nullable=False, server_default="100.0"),
            sa.Column("percentage", sa.Float(), nullable=False, server_default="0.0"),
            sa.Column("is_passed", sa.Boolean(), nullable=False, server_default=sa.text("0")),
            sa.Column("evaluation_summary", sa.JSON(), nullable=False),
            sa.Column("integrity_signals", sa.JSON(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_assessment_attempts_assessment_id", "assessment_attempts", ["assessment_id"])
        op.create_index("ix_assessment_attempts_user_id", "assessment_attempts", ["user_id"])
        op.create_index("ix_assessment_attempts_status", "assessment_attempts", ["status"])

    # 3. assessment_question_submissions
    if "assessment_question_submissions" not in existing_tables:
        op.create_table(
            "assessment_question_submissions",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("attempt_id", sa.String(length=36), sa.ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False),
            sa.Column("assessment_id", sa.String(length=36), nullable=False),
            sa.Column("question_id", sa.Integer(), sa.ForeignKey("questions.id", ondelete="CASCADE"), nullable=False),
            sa.Column("user_id", sa.String(length=36), nullable=False),
            sa.Column("question_type", sa.String(length=30), nullable=False, server_default="CODING"),
            sa.Column("submitted_answer", sa.Text(), nullable=True, server_default=""),
            sa.Column("language", sa.String(length=30), nullable=False, server_default="python"),
            sa.Column("execution_status", sa.String(length=30), nullable=False, server_default="QUEUED"),
            sa.Column("score_awarded", sa.Float(), nullable=False, server_default="0.0"),
            sa.Column("max_score", sa.Float(), nullable=False, server_default="10.0"),
            sa.Column("passed_test_cases", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("total_test_cases", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("execution_time_ms", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("memory_kb", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("error_output", sa.Text(), nullable=True, server_default=""),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_assessment_question_submissions_attempt_id", "assessment_question_submissions", ["attempt_id"])
        op.create_index("ix_assessment_question_submissions_assessment_id", "assessment_question_submissions", ["assessment_id"])
        op.create_index("ix_assessment_question_submissions_question_id", "assessment_question_submissions", ["question_id"])
        op.create_index("ix_assessment_question_submissions_user_id", "assessment_question_submissions", ["user_id"])
        op.create_index("ix_assessment_question_submissions_execution_status", "assessment_question_submissions", ["execution_status"])

    # 4. student_skill_profiles
    if "student_skill_profiles" not in existing_tables:
        op.create_table(
            "student_skill_profiles",
            sa.Column("id", sa.String(length=36), primary_key=True),
            sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
            sa.Column("programming_skills", sa.JSON(), nullable=False),
            sa.Column("core_cs_skills", sa.JSON(), nullable=False),
            sa.Column("practical_skills", sa.JSON(), nullable=False),
            sa.Column("evidence_records", sa.JSON(), nullable=False),
            sa.Column("placement_readiness_score", sa.Float(), nullable=False, server_default="50.0"),
            sa.Column("confidence_level", sa.String(length=20), nullable=False, server_default="Medium"),
            sa.Column("weak_areas", sa.JSON(), nullable=False),
            sa.Column("recommended_actions", sa.JSON(), nullable=False),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_student_skill_profiles_user_id", "student_skill_profiles", ["user_id"])


def downgrade() -> None:
    op.drop_table("student_skill_profiles")
    op.drop_table("assessment_question_submissions")
    op.drop_table("assessment_attempts")
    op.drop_table("unified_assessments")
