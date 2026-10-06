"""add company interview scheduling

Revision ID: a9e4c1b7d602
Revises: a4d5b6c7e8f9, c1f4a8d2e9b0, 5d9e1f1a7c66
Create Date: 2026-10-06 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa


revision = "a9e4c1b7d602"
down_revision = ("a4d5b6c7e8f9", "c1f4a8d2e9b0", "5d9e1f1a7c66")
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "company_interviews",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("application_id", sa.Integer(), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("meeting_url", sa.String(length=500), nullable=False),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("created_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["candidate_applications.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_company_interviews_application_id", "company_interviews", ["application_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_company_interviews_application_id", table_name="company_interviews")
    op.drop_table("company_interviews")