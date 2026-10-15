"""add Clerk identity mapping to users

Revision ID: 3e7f2c1a9b44
Revises: 1c9f26ee5924
Create Date: 2026-10-15 00:00:00.000000
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "3e7f2c1a9b44"
down_revision = "1c9f26ee5924"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("users")}

    if "clerk_user_id" not in columns:
        with op.batch_alter_table("users") as batch:
            batch.add_column(sa.Column("clerk_user_id", sa.String(length=64), nullable=True))

    indexes = {index["name"] for index in inspector.get_indexes("users")}
    if "ix_users_clerk_user_id" not in indexes:
        op.create_index("ix_users_clerk_user_id", "users", ["clerk_user_id"], unique=True)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    indexes = {index["name"] for index in inspector.get_indexes("users")}
    if "ix_users_clerk_user_id" in indexes:
        op.drop_index("ix_users_clerk_user_id", table_name="users")

    columns = {column["name"] for column in inspector.get_columns("users")}
    if "clerk_user_id" in columns:
        with op.batch_alter_table("users") as batch:
            batch.drop_column("clerk_user_id")
