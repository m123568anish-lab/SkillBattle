"""Add placement jobs, source records, inventory targets, and question provenance fields."""

from alembic import op
import sqlalchemy as sa

revision = "f9a1b2c3d4e5"
down_revision = "d1f5a8e7c2b4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("questions") as batch_op:
        batch_op.add_column(sa.Column("source_url", sa.String(length=500), nullable=False, server_default=""))
        batch_op.add_column(sa.Column("source_classification", sa.String(length=60), nullable=False, server_default="existing-inventory"))
        batch_op.add_column(sa.Column("company", sa.String(length=120), nullable=False, server_default=""))
        batch_op.add_column(sa.Column("role", sa.String(length=120), nullable=False, server_default=""))
        batch_op.add_column(sa.Column("assessment_round", sa.String(length=80), nullable=False, server_default=""))
        batch_op.add_column(sa.Column("question_kind", sa.String(length=40), nullable=False, server_default="mcq"))
        batch_op.add_column(sa.Column("topic", sa.String(length=120), nullable=False, server_default=""))
        batch_op.add_column(sa.Column("subtopic", sa.String(length=120), nullable=False, server_default=""))
        batch_op.add_column(sa.Column("original_publish_date", sa.String(length=30), nullable=True))
        batch_op.add_column(sa.Column("license", sa.String(length=300), nullable=False, server_default=""))
        batch_op.add_column(sa.Column("verification_status", sa.String(length=40), nullable=False, server_default="approved"))
        batch_op.add_column(sa.Column("approval_status", sa.String(length=40), nullable=False, server_default="approved"))
        batch_op.add_column(sa.Column("lifecycle_state", sa.String(length=40), nullable=False, server_default="PUBLISHED"))
        batch_op.add_column(sa.Column("duplicate_of_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("failure_reasons", sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column("canonical_hash", sa.String(length=128), nullable=False, server_default=""))
        batch_op.add_column(sa.Column("reuse_permission", sa.String(length=220), nullable=False, server_default=""))

    op.execute(
        sa.text(
            "UPDATE questions SET "
            "question_kind = COALESCE(NULLIF(lower(trim(question_type)), ''), 'mcq'), "
            "verification_status = CASE "
            "WHEN is_active IS TRUE AND is_validated IS TRUE THEN 'approved' "
            "ELSE 'needs_review' END, "
            "approval_status = CASE "
            "WHEN is_active IS TRUE AND is_validated IS TRUE THEN 'approved' "
            "ELSE 'needs_review' END, "
            "lifecycle_state = CASE "
            "WHEN is_active IS TRUE AND is_validated IS TRUE THEN 'PUBLISHED' "
            "ELSE 'NEEDS_REVIEW' END"
        )
    )

    # placement_jobs
    op.create_table(
        "placement_jobs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("job_type", sa.String(length=80), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="queued"),
        sa.Column("idempotency_key", sa.String(length=200), nullable=False, unique=True),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("result", sa.JSON(), nullable=True),
        sa.Column("error_details", sa.Text(), nullable=False, server_default=""),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_retries", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("worker_name", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("worker_lock_token", sa.String(length=80), nullable=False, server_default=""),
        sa.Column("lock_expires_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
    )
    op.create_index(op.f("ix_placement_jobs_job_type"), "placement_jobs", ["job_type"], unique=False)
    op.create_index(op.f("ix_placement_jobs_status"), "placement_jobs", ["status"], unique=False)
    op.create_index(op.f("ix_placement_jobs_idempotency_key"), "placement_jobs", ["idempotency_key"], unique=False)

    op.create_table(
        "placement_source_records",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("source_url", sa.String(length=500), nullable=False, unique=True),
        sa.Column("source_classification", sa.String(length=60), nullable=False, server_default="official-public-material"),
        sa.Column("company", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("role", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("title", sa.String(length=220), nullable=False, server_default=""),
        sa.Column("summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("topics", sa.JSON(), nullable=True),
        sa.Column("extracted_topics", sa.JSON(), nullable=True),
        sa.Column("license", sa.String(length=220), nullable=False, server_default=""),
        sa.Column("raw_content", sa.Text(), nullable=False, server_default=""),
        sa.Column("discovered_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("last_processed_at", sa.DateTime(), nullable=True),
        sa.Column("processed", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_index(op.f("ix_placement_source_records_company"), "placement_source_records", ["company"], unique=False)
    op.create_index(op.f("ix_placement_source_records_role"), "placement_source_records", ["role"], unique=False)

    op.create_table(
        "placement_inventory_targets",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("company", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("role", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("topic", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("difficulty", sa.String(length=30), nullable=False, server_default="medium"),
        sa.Column("question_type", sa.String(length=40), nullable=False, server_default="mcq"),
        sa.Column("target_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("current_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_placement_inventory_targets_company"), "placement_inventory_targets", ["company"], unique=False)
    op.create_index(op.f("ix_placement_inventory_targets_difficulty"), "placement_inventory_targets", ["difficulty"], unique=False)

    with op.batch_alter_table("questions") as batch_op:
        batch_op.create_index(batch_op.f("ix_questions_source_classification"), ["source_classification"], unique=False)
        batch_op.create_index(batch_op.f("ix_questions_company"), ["company"], unique=False)
        batch_op.create_index(batch_op.f("ix_questions_role"), ["role"], unique=False)
        batch_op.create_index(batch_op.f("ix_questions_assessment_round"), ["assessment_round"], unique=False)
        batch_op.create_index(batch_op.f("ix_questions_question_kind"), ["question_kind"], unique=False)
        batch_op.create_index(batch_op.f("ix_questions_topic"), ["topic"], unique=False)
        batch_op.create_index(batch_op.f("ix_questions_verification_status"), ["verification_status"], unique=False)
        batch_op.create_index(batch_op.f("ix_questions_lifecycle_state"), ["lifecycle_state"], unique=False)
        batch_op.create_index(batch_op.f("ix_questions_duplicate_of_id"), ["duplicate_of_id"], unique=False)
        batch_op.create_index(batch_op.f("ix_questions_canonical_hash"), ["canonical_hash"], unique=False)


def downgrade() -> None:
    with op.batch_alter_table("questions") as batch_op:
        for column_name in [
            "source_url",
            "source_classification",
            "company",
            "role",
            "assessment_round",
            "question_kind",
            "topic",
            "subtopic",
            "original_publish_date",
            "license",
            "verification_status",
            "approval_status",
            "lifecycle_state",
            "duplicate_of_id",
            "failure_reasons",
            "canonical_hash",
            "reuse_permission",
        ]:
            batch_op.drop_column(column_name)

    op.drop_index(op.f("ix_placement_inventory_targets_company"), table_name="placement_inventory_targets")
    op.drop_index(op.f("ix_placement_inventory_targets_difficulty"), table_name="placement_inventory_targets")
    op.drop_table("placement_inventory_targets")

    op.drop_index(op.f("ix_placement_source_records_company"), table_name="placement_source_records")
    op.drop_index(op.f("ix_placement_source_records_role"), table_name="placement_source_records")
    op.drop_table("placement_source_records")

    op.drop_index(op.f("ix_placement_jobs_job_type"), table_name="placement_jobs")
    op.drop_index(op.f("ix_placement_jobs_status"), table_name="placement_jobs")
    op.drop_index(op.f("ix_placement_jobs_idempotency_key"), table_name="placement_jobs")
    op.drop_table("placement_jobs")
