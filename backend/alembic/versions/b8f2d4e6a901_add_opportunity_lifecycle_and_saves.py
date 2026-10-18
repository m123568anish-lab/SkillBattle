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
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing_job_columns = {column["name"] for column in inspector.get_columns("job_postings")}
    job_columns = [
        sa.Column("category", sa.String(length=100), nullable=False, server_default="general"),
        sa.Column("work_mode", sa.String(length=20), nullable=False, server_default="on_site"),
        sa.Column("eligibility", sa.Text(), nullable=False, server_default=""),
        sa.Column("application_url", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("source_url", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("source_label", sa.String(length=120), nullable=False, server_default="Company"),
        sa.Column("verification_status", sa.String(length=30), nullable=False, server_default="verified"),
        sa.Column("opens_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deadline_at", sa.DateTime(timezone=True), nullable=True),
    ]
    for column in job_columns:
        if column.name not in existing_job_columns:
            op.add_column("job_postings", column)
    if "ix_job_postings_deadline_at" not in {index["name"] for index in inspector.get_indexes("job_postings")}:
        op.create_index("ix_job_postings_deadline_at", "job_postings", ["deadline_at"])

    existing_application_columns = {column["name"] for column in inspector.get_columns("candidate_applications")}
    for column in [sa.Column("application_method", sa.String(length=30), nullable=False, server_default="internal"), sa.Column("externally_confirmed_at", sa.DateTime(timezone=True), nullable=True)]:
        if column.name not in existing_application_columns:
            op.add_column("candidate_applications", column)
    application_indexes = {index["name"] for index in inspector.get_indexes("candidate_applications")}
    if "uq_candidate_application_job_user" not in application_indexes:
        op.create_index("uq_candidate_application_job_user", "candidate_applications", ["job_id", "candidate_user_id"], unique=True)

    tables = set(inspector.get_table_names())
    if "saved_opportunities" not in tables:
        op.create_table("saved_opportunities", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("job_id", sa.Integer(), sa.ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False), sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False), sa.UniqueConstraint("job_id", "user_id", name="uq_saved_opportunity_job_user"))
        op.create_index("ix_saved_opportunities_job_id", "saved_opportunities", ["job_id"])
        op.create_index("ix_saved_opportunities_user_id", "saved_opportunities", ["user_id"])
    if "application_status_history" not in tables:
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
