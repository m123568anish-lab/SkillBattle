"""Reconcile battle ownership columns and preserve useful indexes.

Revision ID: d1f5a8e7c2b4
Revises: c9b0f2d5a713
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "d1f5a8e7c2b4"
down_revision = "c9b0f2d5a713"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "battle_rooms" not in inspector.get_table_names():
        raise RuntimeError("Cannot reconcile adaptive battle columns: battle_rooms is missing.")

    columns = {column["name"] for column in inspector.get_columns("battle_rooms")}
    if "adaptive_owner_id" not in columns:
        op.add_column(
            "battle_rooms",
            sa.Column("adaptive_owner_id", sa.String(length=36), nullable=True),
        )
    if "adaptive_date" not in columns:
        op.add_column(
            "battle_rooms",
            sa.Column("adaptive_date", sa.Date(), nullable=True),
        )

    inspector = sa.inspect(bind)
    owner_fk = next(
        (
            foreign_key
            for foreign_key in inspector.get_foreign_keys("battle_rooms")
            if foreign_key.get("name") == "fk_battle_rooms_adaptive_owner_id_users"
        ),
        None,
    )
    if owner_fk is not None and (
        owner_fk.get("constrained_columns") != ["adaptive_owner_id"]
        or owner_fk.get("referred_table") != "users"
        or owner_fk.get("referred_columns") != ["id"]
    ):
        raise RuntimeError("Existing adaptive owner foreign key has an unexpected definition.")
    if owner_fk is None:
        op.create_foreign_key(
            "fk_battle_rooms_adaptive_owner_id_users",
            "battle_rooms",
            "users",
            ["adaptive_owner_id"],
            ["id"],
            ondelete="CASCADE",
        )

    indexes = {index["name"]: index for index in inspector.get_indexes("battle_rooms")}
    owner_index = indexes.get("ix_battle_rooms_adaptive_owner_id")
    if owner_index is not None and owner_index.get("column_names") != ["adaptive_owner_id"]:
        raise RuntimeError("Existing adaptive owner index has an unexpected definition.")
    if owner_index is None:
        op.create_index(
            "ix_battle_rooms_adaptive_owner_id",
            "battle_rooms",
            ["adaptive_owner_id"],
        )

    unique_constraints = {
        constraint["name"]: constraint
        for constraint in inspector.get_unique_constraints("battle_rooms")
    }
    adaptive_unique = unique_constraints.get("uq_battle_rooms_adaptive_owner_date")
    if adaptive_unique is not None and adaptive_unique.get("column_names") != [
        "adaptive_owner_id",
        "adaptive_date",
    ]:
        raise RuntimeError("Existing adaptive battle constraint has an unexpected definition.")
    if adaptive_unique is None:
        op.create_unique_constraint(
            "uq_battle_rooms_adaptive_owner_date",
            "battle_rooms",
            ["adaptive_owner_id", "adaptive_date"],
        )

    _drop_redundant_unique_index(
        "streak",
        "ix_streak_user_id_unique",
        ["user_id"],
        "uq_streak_user_id",
    )
    _drop_redundant_unique_index(
        "user_daily_activities",
        "ix_user_daily_act_user_date",
        ["user_id", "activity_date"],
        "uq_user_daily_activity",
    )


def _drop_redundant_unique_index(
    table_name: str,
    index_name: str,
    columns: list[str],
    constraint_name: str,
) -> None:
    inspector = sa.inspect(op.get_bind())
    if table_name not in inspector.get_table_names():
        return

    constraint = next(
        (
            item
            for item in inspector.get_unique_constraints(table_name)
            if item.get("name") == constraint_name
        ),
        None,
    )
    index = next(
        (
            item
            for item in inspector.get_indexes(table_name)
            if item.get("name") == index_name
        ),
        None,
    )
    if index is None:
        return
    if (
        index.get("column_names") != columns
        or index.get("unique") not in (True, 1)
        or constraint is None
        or constraint.get("column_names") != columns
    ):
        raise RuntimeError(f"Existing index {index_name} is not a verified redundant index.")
    op.drop_index(index_name, table_name=table_name)


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "battle_rooms" not in inspector.get_table_names():
        return

    constraints = {
        item["name"] for item in inspector.get_unique_constraints("battle_rooms")
    }
    if "uq_battle_rooms_adaptive_owner_date" in constraints:
        op.drop_constraint(
            "uq_battle_rooms_adaptive_owner_date",
            "battle_rooms",
            type_="unique",
        )

    foreign_keys = {
        item["name"] for item in inspector.get_foreign_keys("battle_rooms")
    }
    if "fk_battle_rooms_adaptive_owner_id_users" in foreign_keys:
        op.drop_constraint(
            "fk_battle_rooms_adaptive_owner_id_users",
            "battle_rooms",
            type_="foreignkey",
        )

    indexes = {item["name"] for item in inspector.get_indexes("battle_rooms")}
    if "ix_battle_rooms_adaptive_owner_id" in indexes:
        op.drop_index(
            "ix_battle_rooms_adaptive_owner_id",
            table_name="battle_rooms",
        )

    columns = {item["name"] for item in inspector.get_columns("battle_rooms")}
    if "adaptive_date" in columns:
        op.drop_column("battle_rooms", "adaptive_date")
    if "adaptive_owner_id" in columns:
        op.drop_column("battle_rooms", "adaptive_owner_id")
