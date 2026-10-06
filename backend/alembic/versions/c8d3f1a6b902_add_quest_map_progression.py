"""add persistent quest map progression

Revision ID: c8d3f1a6b902
Revises: a9e4c1b7d602
Create Date: 2026-10-06

"""

from alembic import op
import sqlalchemy as sa


revision = "c8d3f1a6b902"
down_revision = "a9e4c1b7d602"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "quest_map_levels",
        sa.Column("id", sa.String(length=100), nullable=False),
        sa.Column("map_id", sa.String(length=80), nullable=False),
        sa.Column("sequence", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=False),
        sa.Column("level_type", sa.String(length=40), nullable=False),
        sa.Column("skill_category", sa.String(length=100), nullable=False),
        sa.Column("battle_configuration", sa.JSON(), nullable=False),
        sa.Column("prerequisite_level_ids", sa.JSON(), nullable=False),
        sa.Column("reward_configuration", sa.JSON(), nullable=False),
        sa.Column("is_milestone", sa.Boolean(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_quest_map_levels_map_id", "quest_map_levels", ["map_id"])
    op.create_index("ix_quest_map_levels_skill_category", "quest_map_levels", ["skill_category"])

    op.create_table(
        "quest_progress",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("level_id", sa.String(length=100), nullable=False),
        sa.Column("battle_id", sa.String(length=36), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("stars", sa.Integer(), nullable=False),
        sa.Column("best_accuracy", sa.Float(), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["battle_id"], ["battle_rooms.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["level_id"], ["quest_map_levels.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("battle_id", name="uq_quest_progress_battle"),
        sa.UniqueConstraint("user_id", "level_id", name="uq_quest_progress_user_level"),
    )
    op.create_index("ix_quest_progress_user_status", "quest_progress", ["user_id", "status"])


def downgrade() -> None:
    op.drop_index("ix_quest_progress_user_status", table_name="quest_progress")
    op.drop_table("quest_progress")
    op.drop_index("ix_quest_map_levels_skill_category", table_name="quest_map_levels")
    op.drop_index("ix_quest_map_levels_map_id", table_name="quest_map_levels")
    op.drop_table("quest_map_levels")