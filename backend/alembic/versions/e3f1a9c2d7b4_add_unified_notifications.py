"""Add migration-managed notifications with related entity references."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e3f1a9c2d7b4"
down_revision: Union[str, Sequence[str], None] = "d9f8e7c6b5a4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    tables = set(inspector.get_table_names())

    if "notifications" not in tables:
        op.create_table(
            "notifications",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("user_id", sa.String(length=36), nullable=False),
            sa.Column("title", sa.String(length=200), nullable=False),
            sa.Column("message", sa.String(length=1000), nullable=False),
            sa.Column("notification_type", sa.String(length=50), server_default="system", nullable=False),
            sa.Column("is_read", sa.Boolean(), server_default=sa.false(), nullable=False),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
            sa.Column("related_entity_type", sa.String(length=50), nullable=True),
            sa.Column("related_entity_id", sa.String(length=100), nullable=True),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
    else:
        existing_columns = {
            column["name"] for column in inspector.get_columns("notifications")
        }
        if "related_entity_type" not in existing_columns:
            op.add_column(
                "notifications",
                sa.Column("related_entity_type", sa.String(length=50), nullable=True),
            )
        if "related_entity_id" not in existing_columns:
            op.add_column(
                "notifications",
                sa.Column("related_entity_id", sa.String(length=100), nullable=True),
            )

    index_names = {index["name"] for index in sa.inspect(connection).get_indexes("notifications")}
    if "ix_notifications_user_id" not in index_names:
        op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    if "ix_notifications_user_created_at" not in index_names:
        op.create_index(
            "ix_notifications_user_created_at",
            "notifications",
            ["user_id", "created_at"],
        )


def downgrade() -> None:
    raise RuntimeError(
        "Notification schema downgrade is blocked to preserve user notification data."
    )