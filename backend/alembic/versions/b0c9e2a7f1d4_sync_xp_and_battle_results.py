"""Make XP unique and align stored battle results with settlement data.

Revision ID: b0c9e2a7f1d4
Revises: 4a6e8c2d1f30
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b0c9e2a7f1d4"
down_revision: Union[str, Sequence[str], None] = "4a6e8c2d1f30"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    tables = set(inspector.get_table_names())

    if "xp" in tables:
        xp = sa.table(
            "xp",
            sa.column("id", sa.Integer),
            sa.column("user_id", sa.String(36)),
            sa.column("total_xp", sa.Integer),
            sa.column("weekly_xp", sa.Integer),
            sa.column("daily_xp", sa.Integer),
            sa.column("level", sa.Integer),
            sa.column("rank", sa.Integer),
        )
        duplicate_users = connection.execute(
            sa.select(xp.c.user_id)
            .group_by(xp.c.user_id)
            .having(sa.func.count() > 1)
        ).scalars().all()
        for user_id in duplicate_users:
            rows = connection.execute(
                sa.select(xp)
                .where(xp.c.user_id == user_id)
                .order_by(xp.c.total_xp.desc(), xp.c.id.asc())
            ).mappings().all()
            keeper = rows[0]
            connection.execute(
                xp.update()
                .where(xp.c.id == keeper["id"])
                .values(
                    level=max(1, int(keeper["total_xp"] or 0) // 500 + 1),
                    weekly_xp=int(keeper["weekly_xp"] or 0),
                    daily_xp=int(keeper["daily_xp"] or 0),
                )
            )
            connection.execute(
                xp.delete().where(
                    xp.c.user_id == user_id,
                    xp.c.id != keeper["id"],
                )
            )

        if "users" in tables:
            if "user_stats" in tables:
                connection.execute(sa.text("""
                    INSERT INTO xp (user_id, total_xp, weekly_xp, daily_xp, level, rank)
                    SELECT users.id, COALESCE(user_stats.xp, 0), 0, 0,
                           (COALESCE(user_stats.xp, 0) / 500) + 1, 99999
                    FROM users
                    LEFT JOIN user_stats ON user_stats.user_id = users.id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM xp WHERE xp.user_id = users.id
                    )
                """))
            else:
                connection.execute(sa.text("""
                    INSERT INTO xp (user_id, total_xp, weekly_xp, daily_xp, level, rank)
                    SELECT users.id, 0, 0, 0, 1, 99999
                    FROM users
                    WHERE NOT EXISTS (
                        SELECT 1 FROM xp WHERE xp.user_id = users.id
                    )
                """))

        index_names = {index["name"] for index in inspector.get_indexes("xp")}
        if "uq_xp_user_id" not in index_names:
            op.create_index("uq_xp_user_id", "xp", ["user_id"], unique=True)

        foreign_keys = inspector.get_foreign_keys("xp")
        if not any(
            foreign_key.get("constrained_columns") == ["user_id"]
            and foreign_key.get("referred_table") == "users"
            for foreign_key in foreign_keys
        ):
            with op.batch_alter_table("xp") as batch:
                batch.create_foreign_key(
                    "fk_xp_user_id_users",
                    "users",
                    ["user_id"],
                    ["id"],
                    ondelete="CASCADE",
                )

    if "battle_results" in tables:
        result_columns = {column["name"] for column in inspector.get_columns("battle_results")}
        if "is_draw" not in result_columns or any(
            column["name"] == "winner_id" and not column["nullable"]
            for column in inspector.get_columns("battle_results")
        ):
            with op.batch_alter_table("battle_results") as batch:
                if "is_draw" not in result_columns:
                    batch.add_column(
                        sa.Column("is_draw", sa.Boolean(), nullable=False, server_default=sa.false())
                    )
                if any(
                    column["name"] == "winner_id" and not column["nullable"]
                    for column in inspector.get_columns("battle_results")
                ):
                    batch.alter_column(
                        "winner_id",
                        existing_type=sa.String(length=36),
                        nullable=True,
                    )


def downgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    if "xp" in inspector.get_table_names():
        indexes = {index["name"] for index in inspector.get_indexes("xp")}
        if "uq_xp_user_id" in indexes:
            op.drop_index("uq_xp_user_id", table_name="xp")
        foreign_keys = inspector.get_foreign_keys("xp")
        if any(foreign_key.get("name") == "fk_xp_user_id_users" for foreign_key in foreign_keys):
            with op.batch_alter_table("xp") as batch:
                batch.drop_constraint("fk_xp_user_id_users", type_="foreignkey")

    if "battle_results" in inspector.get_table_names():
        columns = {column["name"]: column for column in inspector.get_columns("battle_results")}
        if "is_draw" in columns:
            draws = connection.execute(
                sa.text("SELECT COUNT(*) FROM battle_results WHERE is_draw = TRUE")
            ).scalar_one()
            if draws:
                raise RuntimeError("Cannot downgrade while draw results exist")
            with op.batch_alter_table("battle_results") as batch:
                batch.drop_column("is_draw")
                batch.alter_column(
                    "winner_id",
                    existing_type=sa.String(length=36),
                    nullable=False,
                )
