"""Add organization and entity context to existing audit events."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a4d5b6c7e8f9"
down_revision: Union[str, Sequence[str], None] = "e3f1a9c2d7b4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    if "audit_logs" not in inspector.get_table_names():
        op.create_table(
            "audit_logs",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("user_id", sa.String(length=36), nullable=True),
            sa.Column("action", sa.String(length=150), nullable=False),
            sa.Column("module", sa.String(length=100), nullable=False),
            sa.Column("ip_address", sa.String(length=50), nullable=True),
            sa.Column("user_agent", sa.String(length=500), nullable=True),
            sa.Column("organization_type", sa.String(length=30), nullable=True),
            sa.Column("organization_id", sa.String(length=100), nullable=True),
            sa.Column("entity_type", sa.String(length=50), nullable=True),
            sa.Column("entity_id", sa.String(length=100), nullable=True),
            sa.Column(
                "metadata_json",
                sa.JSON(),
                nullable=False,
                server_default=sa.text("'{}'"),
            ),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
    else:
        existing_columns = {
            column["name"] for column in inspector.get_columns("audit_logs")
        }
        additions = (
            ("organization_type", sa.String(length=30), True, None),
            ("organization_id", sa.String(length=100), True, None),
            ("entity_type", sa.String(length=50), True, None),
            ("entity_id", sa.String(length=100), True, None),
            ("metadata_json", sa.JSON(), False, sa.text("'{}'")),
        )
        for name, column_type, nullable, server_default in additions:
            if name not in existing_columns:
                op.add_column(
                    "audit_logs",
                    sa.Column(
                        name,
                        column_type,
                        nullable=nullable,
                        server_default=server_default,
                    ),
                )

    index_names = {index["name"] for index in sa.inspect(connection).get_indexes("audit_logs")}
    if "ix_audit_logs_user_id" not in index_names:
        op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
    if "ix_audit_logs_organization_id" not in index_names:
        op.create_index("ix_audit_logs_organization_id", "audit_logs", ["organization_type", "organization_id"])


def downgrade() -> None:
    raise RuntimeError("Activity timeline downgrade is blocked to preserve audit history.")