"""add skill intelligence evidence tables

Revision ID: 5d9e1f1a7c66
Revises: d9f8e7c6b5a4
Create Date: 2026-10-06 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "5d9e1f1a7c66"
down_revision = "d9f8e7c6b5a4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "skill_evidence",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("skill_id", sa.String(length=120), nullable=False),
        sa.Column("skill_name", sa.String(length=120), nullable=False),
        sa.Column("parent_skill_id", sa.String(length=120), nullable=True),
        sa.Column("source_type", sa.String(length=40), nullable=False),
        sa.Column("source_id", sa.String(length=120), nullable=False),
        sa.Column("submission_id", sa.String(length=120), nullable=True),
        sa.Column("question_id", sa.String(length=120), nullable=True),
        sa.Column("difficulty", sa.String(length=20), nullable=False),
        sa.Column("correct", sa.Boolean(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("max_score", sa.Float(), nullable=False),
        sa.Column("response_time_ms", sa.Integer(), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
        sa.Column("extra", sa.JSON(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "source_type", "source_id", "submission_id", "question_id", "skill_id", name="uq_skill_evidence_identity"),
    )
    with op.batch_alter_table("skill_evidence") as batch_op:
        batch_op.create_index(batch_op.f("ix_skill_evidence_user_id"), ["user_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_skill_evidence_skill_id"), ["skill_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_skill_evidence_source_type"), ["source_type"], unique=False)
        batch_op.create_index(batch_op.f("ix_skill_evidence_source_id"), ["source_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_skill_evidence_question_id"), ["question_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_skill_evidence_parent_skill_id"), ["parent_skill_id"], unique=False)

    op.create_table(
        "company_skill_requirements",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("company_id", sa.String(length=36), nullable=False),
        sa.Column("skill_id", sa.String(length=120), nullable=False),
        sa.Column("importance", sa.Integer(), nullable=False),
        sa.Column("minimum_mastery", sa.String(length=30), nullable=False),
        sa.Column("recommended_mastery", sa.String(length=30), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("company_id", "skill_id", name="uq_company_skill_requirement"),
    )
    with op.batch_alter_table("company_skill_requirements") as batch_op:
        batch_op.create_index(batch_op.f("ix_company_skill_requirements_company_id"), ["company_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_company_skill_requirements_skill_id"), ["skill_id"], unique=False)


def downgrade() -> None:
    op.drop_table("company_skill_requirements")
    op.drop_table("skill_evidence")
