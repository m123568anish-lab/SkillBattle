"""Add daily XP tracking column.

Revision ID: c4f8a1d2e6b7
Revises: bb9cc66e4c08
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4f8a1d2e6b7"
down_revision: Union[str, Sequence[str], None] = "bb9cc66e4c08"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "xp",
        sa.Column("daily_xp", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("xp", "daily_xp")
