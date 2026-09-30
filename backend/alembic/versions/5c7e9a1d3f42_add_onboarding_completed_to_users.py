"""Add onboarding_completed to users with safe backfill for existing users."""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "5c7e9a1d3f42"
down_revision: Union[str, Sequence[str], None] = "b0c9e2a7f1d4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    existing_columns = [c["name"] for c in inspector.get_columns("users")]
    
    if "onboarding_completed" not in existing_columns:
        op.add_column(
            "users",
            sa.Column(
                "onboarding_completed",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("1"),
            ),
        )
    op.execute("UPDATE users SET onboarding_completed = 1 WHERE onboarding_completed IS NULL")


def downgrade() -> None:
    op.drop_column("users", "onboarding_completed")
