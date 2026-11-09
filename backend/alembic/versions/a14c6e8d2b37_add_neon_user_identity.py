"""add Neon identity mapping to users

Revision ID: a14c6e8d2b37
Revises: 47292a2a50d2
Create Date: 2026-11-09 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "a14c6e8d2b37"
down_revision = "47292a2a50d2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("users")}

    if "neon_user_id" not in columns:
        with op.batch_alter_table("users") as batch:
            batch.add_column(sa.Column("neon_user_id", sa.String(length=64), nullable=True))

    indexes = {index["name"] for index in inspector.get_indexes("users")}
    if "ix_users_neon_user_id" not in indexes:
        op.create_index("ix_users_neon_user_id", "users", ["neon_user_id"], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    indexes = {index["name"] for index in inspector.get_indexes("users")}
    if "ix_users_neon_user_id" in indexes:
        op.drop_index("ix_users_neon_user_id", table_name="users")

    columns = {column["name"] for column in inspector.get_columns("users")}
    if "neon_user_id" in columns:
        with op.batch_alter_table("users") as batch:
            batch.drop_column("neon_user_id")
