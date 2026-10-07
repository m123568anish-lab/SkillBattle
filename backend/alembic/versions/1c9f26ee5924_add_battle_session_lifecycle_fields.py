"""add battle session lifecycle fields

Revision ID: 1c9f26ee5924
Revises: c8d3f1a6b902
Create Date: 2026-10-07 00:00:00.000000

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = "1c9f26ee5924"
down_revision = "c8d3f1a6b902"
branch_labels = None
depends_on = None


def _add_column_if_missing(table_name: str, column_name: str, column_def: sa.Column) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    existing = {col["name"] for col in inspector.get_columns(table_name)}
    if column_name not in existing:
        with op.batch_alter_table(table_name) as batch:
            batch.add_column(column_def)


def upgrade() -> None:
    _add_column_if_missing(
        "battle_rooms",
        "battle_mode",
        sa.Column("battle_mode", sa.String(length=30), nullable=False, server_default="solo"),
    )
    _add_column_if_missing(
        "battle_rooms",
        "creator_id",
        sa.Column("creator_id", sa.String(length=36), nullable=True),
    )
    _add_column_if_missing(
        "battle_rooms",
        "current_round",
        sa.Column("current_round", sa.Integer(), nullable=False, server_default="1"),
    )
    _add_column_if_missing(
        "battle_rooms",
        "round_status",
        sa.Column("round_status", sa.String(length=30), nullable=False, server_default="created"),
    )
    _add_column_if_missing(
        "battle_rooms",
        "expires_at",
        sa.Column("expires_at", sa.DateTime(), nullable=True),
    )
    _add_column_if_missing(
        "battle_rooms",
        "last_transition_at",
        sa.Column("last_transition_at", sa.DateTime(), nullable=True),
    )
    _add_column_if_missing(
        "battle_rooms",
        "state_history",
        sa.Column("state_history", sa.JSON(), nullable=False, server_default="[]"),
    )
    _add_column_if_missing(
        "battle_participants",
        "status",
        sa.Column("status", sa.String(length=30), nullable=False, server_default="joined"),
    )
    _add_column_if_missing(
        "battle_participants",
        "is_ready",
        sa.Column("is_ready", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    for table_name, columns in {
        "battle_rooms": [
            "battle_mode",
            "creator_id",
            "current_round",
            "round_status",
            "expires_at",
            "last_transition_at",
            "state_history",
        ],
        "battle_participants": ["status", "is_ready"],
    }.items():
        if table_name in inspector.get_table_names():
            for column_name in columns:
                if column_name in {col["name"] for col in inspector.get_columns(table_name)}:
                    with op.batch_alter_table(table_name) as batch:
                        batch.drop_column(column_name)
