"""Persist onboarding preferences on the existing profile."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "4a6e8c2d1f30"
down_revision: Union[str, Sequence[str], None] = "b7c9d2e1f4a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "profiles" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("profiles")}
    if "onboarding_preferences" not in columns:
        op.add_column(
            "profiles",
            sa.Column(
                "onboarding_preferences",
                sa.JSON(),
                nullable=False,
                server_default=sa.text("'{}'"),
            ),
        )


def downgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "profiles" in inspector.get_table_names():
        columns = {column["name"] for column in inspector.get_columns("profiles")}
        if "onboarding_preferences" in columns:
            op.drop_column("profiles", "onboarding_preferences")