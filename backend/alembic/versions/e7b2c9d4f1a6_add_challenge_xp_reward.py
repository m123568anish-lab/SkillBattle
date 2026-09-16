"""Add persisted XP rewards to daily challenges.

Revision ID: e7b2c9d4f1a6
Revises: c4f8a1d2e6b7
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e7b2c9d4f1a6"
down_revision: Union[str, Sequence[str], None] = "c4f8a1d2e6b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "daily_challenges",
        sa.Column("xp_reward", sa.Integer(), nullable=False, server_default="50"),
    )


def downgrade() -> None:
    op.drop_column("daily_challenges", "xp_reward")
