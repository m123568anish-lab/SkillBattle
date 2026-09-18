"""Add durable matchmaking matches and placement preparation sessions."""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "f2a8c1d9e4b7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "matchmaking_matches",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("room_id", sa.String(36), nullable=False),
        sa.Column("player_one_id", sa.String(36), nullable=False),
        sa.Column("player_two_id", sa.String(36), nullable=False),
        sa.Column("mode", sa.String(30), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["player_one_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["player_two_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("room_id"),
    )
    op.create_index("ix_matchmaking_matches_room_id", "matchmaking_matches", ["room_id"])
    op.create_table(
        "placement_prep_sessions",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("match_id", sa.String(36), nullable=True),
        sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("completed_steps", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_placement_prep_sessions_user_id", "placement_prep_sessions", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_placement_prep_sessions_user_id", table_name="placement_prep_sessions")
    op.drop_table("placement_prep_sessions")
    op.drop_index("ix_matchmaking_matches_room_id", table_name="matchmaking_matches")
    op.drop_table("matchmaking_matches")
