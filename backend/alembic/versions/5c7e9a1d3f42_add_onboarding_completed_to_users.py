"""Add onboarding_completed to users with safe backfill for existing users."""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "5c7e9a1d3f42"
down_revision: Union[str, Sequence[str], None] = "4a6e8c2d1f30"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "onboarding_completed",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
    )
    op.execute("UPDATE users SET onboarding_completed = true WHERE onboarding_completed IS NULL")


def downgrade() -> None:
    op.drop_column("users", "onboarding_completed")
