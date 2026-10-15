"""add xp ledger table for authoritative xp audit and idempotency

Revision ID: f1a2b3c4d5e6
Revises: e8c1b2a3f4d5
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "f1a2b3c4d5e6"
down_revision = "e8c1b2a3f4d5"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "xp_ledger" in inspector.get_table_names():
        return

    op.create_table(
        "xp_ledger",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=50), nullable=False, server_default="general"),
        sa.Column("reference_id", sa.String(length=100), nullable=True),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "source", "reference_id", name="uq_xp_ledger_user_source_ref"),
    )
    op.create_index("ix_xp_ledger_user_id", "xp_ledger", ["user_id"])
    op.create_index("ix_xp_ledger_source", "xp_ledger", ["source"])
    op.create_index("ix_xp_ledger_reference_id", "xp_ledger", ["reference_id"])


def downgrade() -> None:
    op.drop_index("ix_xp_ledger_reference_id", table_name="xp_ledger")
    op.drop_index("ix_xp_ledger_source", table_name="xp_ledger")
    op.drop_index("ix_xp_ledger_user_id", table_name="xp_ledger")
    op.drop_table("xp_ledger")
