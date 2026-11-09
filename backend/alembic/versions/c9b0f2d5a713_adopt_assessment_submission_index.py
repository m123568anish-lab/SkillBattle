"""Represent the existing assessment submission performance index.

Revision ID: c9b0f2d5a713
Revises: a14c6e8d2b37
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "c9b0f2d5a713"
down_revision = "a14c6e8d2b37"
branch_labels = None
depends_on = None

INDEX_NAME = "ix_assessment_q_sub_user_created"
TABLE_NAME = "assessment_question_submissions"
INDEX_COLUMNS = ["user_id", "created_at"]


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if TABLE_NAME not in inspector.get_table_names():
        raise RuntimeError(
            f"Cannot ensure {INDEX_NAME}: required table {TABLE_NAME} is missing."
        )

    indexes = {index["name"]: index for index in inspector.get_indexes(TABLE_NAME)}
    existing_index = indexes.get(INDEX_NAME)
    if existing_index is not None:
        if (
            existing_index.get("column_names") != INDEX_COLUMNS
            or existing_index.get("unique") not in (False, 0)
        ):
            raise RuntimeError(
                f"Existing {INDEX_NAME} does not match the reviewed index definition."
            )
        return

    op.create_index(INDEX_NAME, TABLE_NAME, INDEX_COLUMNS, unique=False)


def downgrade() -> None:
    # This migration may adopt an index created before Alembic managed it.
    # Preserve it on downgrade because ownership of a pre-existing index is unknown.
    pass
