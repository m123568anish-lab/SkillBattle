"""Add persisted per-user daily practice assignments."""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "6e1c2d3f4a5b"
down_revision: Union[str, Sequence[str], None] = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None

def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    if "daily_practice_sessions" not in inspector.get_table_names():
        op.create_table("daily_practice_sessions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("session_date", sa.Date(), nullable=False),
            sa.Column("challenge_id", sa.Integer(), sa.ForeignKey("daily_challenges.id", ondelete="SET NULL")),
            sa.Column("problem_id", sa.Integer(), sa.ForeignKey("problems.id", ondelete="RESTRICT"), nullable=False),
            sa.Column("status", sa.String(length=20), nullable=False, server_default="IN_PROGRESS"),
            sa.Column("submission_id", sa.Integer(), sa.ForeignKey("code_submissions.id", ondelete="SET NULL")),
            sa.Column("completed_at", sa.DateTime()), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("updated_at", sa.DateTime(), nullable=False),
            sa.UniqueConstraint("user_id", "session_date", name="uq_daily_practice_user_date"),
        )
        op.create_index("ix_daily_practice_sessions_user_id", "daily_practice_sessions", ["user_id"])
        op.create_index("ix_daily_practice_sessions_session_date", "daily_practice_sessions", ["session_date"])
        op.create_index("ix_daily_practice_sessions_problem_id", "daily_practice_sessions", ["problem_id"])
        op.create_index("ix_daily_practice_sessions_status", "daily_practice_sessions", ["status"])

def downgrade() -> None:
    if "daily_practice_sessions" in sa.inspect(op.get_bind()).get_table_names(): op.drop_table("daily_practice_sessions")
