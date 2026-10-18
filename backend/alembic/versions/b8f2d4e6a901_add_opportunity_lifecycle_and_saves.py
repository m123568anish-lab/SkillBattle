"""add opportunity lifecycle, saves and application history

Revision ID: b8f2d4e6a901
Revises: a9e4c1b7d602
Create Date: 2026-10-18 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "b8f2d4e6a901"
down_revision = "a9e4c1b7d602"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("job_postings") as batch:
        batch.add_column(sa.Column("category", sa.String(length=100), nullable=False, server_default="general"))
        batch.add_column(sa.Column("work_mode", sa.String(length=20), nullable=False, server_default="on_site"))
        batch.add_column(sa.Column("eligibility", sa.Text(), nullable=False, server_default=""))
        batch.add_column(sa.Column("application_url", sa.String(length=500), nullable=False, server_default=""))
        batch.add_column(sa.Column("source_url", sa.String(length=500), nullable=False, server_default=""))
        batch.add_column(sa.Column("source_label", sa.String(length=120), nullable=False, server_default="Company"))
        batch.add_column(sa.Column("verification_status", sa.String(length=30), nullable=False, server_default="verified"))
        batch.add_column(sa.Column("opens_at", sa.DateTime(timezone=True), nullable=True))
        batch.add_column(sa.Column("deadline_at", sa.DateTime(timezone=True), nullable=True))
        batch.create_index("ix_job_postings_deadline_at", ["deadline_at"])
    with op.batch_alter_table("candidate_applications") as batch:
        batch.add_column(sa.Column("application_method", sa.String(length=30), nullable=False, server_default="internal"))
        batch.add_column(sa.Column("externally_confirmed_at", sa.DateTime(timezone=True), nullable=True))
        batch.create_unique_constraint("uq_candidate_application_job_user", ["job_id", "candidate_user_id"])
    op.create_table("saved_opportunities", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("job_id", sa.Integer(), sa.ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False), sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_saved_opportunities_job_id", "saved_opportunities", ["job_id"])
    op.create_index("ix_saved_opportunities_user_id", "saved_opportunities", ["user_id"])
    op.create_unique_constraint("uq_saved_opportunity_job_user", "saved_opportunities", ["job_id", "user_id"])
    op.create_table("application_status_history", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("application_id", sa.Integer(), sa.ForeignKey("candidate_applications.id", ondelete="CASCADE"), nullable=False), sa.Column("status", sa.String(length=50), nullable=False), sa.Column("changed_by_user_id", sa.String(), sa.ForeignKey("users.id", ondelete="SET NULL")), sa.Column("created_at", sa.DateTime(timezone=True), nullable=False))
    op.create_index("ix_application_status_history_application_id", "application_status_history", ["application_id"])


def downgrade() -> None:
    op.drop_index("ix_application_status_history_application_id", table_name="application_status_history")
    op.drop_table("application_status_history")
    op.drop_table("saved_opportunities")
    with op.batch_alter_table("candidate_applications") as batch:
        batch.drop_constraint("uq_candidate_application_job_user", type_="unique")
        batch.drop_column("externally_confirmed_at")
        batch.drop_column("application_method")
    with op.batch_alter_table("job_postings") as batch:
        batch.drop_index("ix_job_postings_deadline_at")
        for column in ("deadline_at", "opens_at", "verification_status", "source_label", "source_url", "application_url", "eligibility", "work_mode", "category"):
            batch.drop_column(column)
