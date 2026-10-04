"""Add adaptive battle ownership and question exposure history."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c1f4a8d2e9b0"
down_revision: Union[str, Sequence[str], None] = "a4d5b6c7e8f9"
branch_labels = None
depends_on = None


def upgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    if "battle_rooms" in inspector.get_table_names():
        columns = {column["name"] for column in inspector.get_columns("battle_rooms")}
        with op.batch_alter_table("battle_rooms") as batch:
            if "adaptive_owner_id" not in columns:
                batch.add_column(sa.Column("adaptive_owner_id", sa.String(36), nullable=True))
                batch.create_foreign_key(
                    "fk_battle_rooms_adaptive_owner_id_users",
                    "users",
                    ["adaptive_owner_id"],
                    ["id"],
                    ondelete="CASCADE",
                )
                batch.create_index("ix_battle_rooms_adaptive_owner_id", ["adaptive_owner_id"])
            if "adaptive_date" not in columns:
                batch.add_column(sa.Column("adaptive_date", sa.Date(), nullable=True))
            constraints = {item["name"] for item in sa.inspect(connection).get_unique_constraints("battle_rooms")}
            if "uq_battle_rooms_adaptive_owner_date" not in constraints:
                batch.create_unique_constraint(
                    "uq_battle_rooms_adaptive_owner_date",
                    ["adaptive_owner_id", "adaptive_date"],
                )

    if "question_exposures" not in sa.inspect(connection).get_table_names():
        op.create_table(
            "question_exposures",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column(
                "user_id",
                sa.String(36),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "question_id",
                sa.Integer(),
                sa.ForeignKey("questions.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("first_seen_at", sa.DateTime(), nullable=False),
            sa.Column("last_seen_at", sa.DateTime(), nullable=False),
            sa.Column("exposure_count", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("correct_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("incorrect_count", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("last_result", sa.String(30), nullable=True),
            sa.Column("last_score", sa.Float(), nullable=True),
            sa.UniqueConstraint(
                "user_id",
                "question_id",
                name="uq_question_exposure_user_question",
            ),
        )
        op.create_index("ix_question_exposures_user_id", "question_exposures", ["user_id"])
        op.create_index("ix_question_exposures_question_id", "question_exposures", ["question_id"])


def downgrade() -> None:
    op.drop_index("ix_question_exposures_question_id", table_name="question_exposures")
    op.drop_index("ix_question_exposures_user_id", table_name="question_exposures")
    op.drop_table("question_exposures")

    with op.batch_alter_table("battle_rooms") as batch:
        batch.drop_constraint("uq_battle_rooms_adaptive_owner_date", type_="unique")
        batch.drop_index("ix_battle_rooms_adaptive_owner_id")
        batch.drop_column("adaptive_date")
        batch.drop_column("adaptive_owner_id")
