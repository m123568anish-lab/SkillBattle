"""align company skill requirements company id type

Revision ID: e8c1b2a3f4d5
Revises: 4f2a7c9e1b6d
Create Date: 2026-10-15 00:00:00.000000

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "e8c1b2a3f4d5"
down_revision = "4f2a7c9e1b6d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = set(inspector.get_table_names())

    if "company_skill_requirements" not in tables:
        op.create_table(
            "company_skill_requirements",
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("company_id", sa.Integer(), nullable=False),
            sa.Column("skill_id", sa.String(length=120), nullable=False),
            sa.Column("importance", sa.Integer(), nullable=False),
            sa.Column("minimum_mastery", sa.String(length=30), nullable=False),
            sa.Column("recommended_mastery", sa.String(length=30), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(
                ["company_id"],
                ["companies.id"],
                ondelete="CASCADE",
                name="fk_company_skill_requirements_company_id_companies",
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("company_id", "skill_id", name="uq_company_skill_requirement"),
        )
        with op.batch_alter_table("company_skill_requirements") as batch_op:
            batch_op.create_index(
                batch_op.f("ix_company_skill_requirements_company_id"),
                ["company_id"],
                unique=False,
            )
            batch_op.create_index(
                batch_op.f("ix_company_skill_requirements_skill_id"),
                ["skill_id"],
                unique=False,
            )
        return

    cols = {c["name"]: c for c in inspector.get_columns("company_skill_requirements")}
    company_id_col = cols.get("company_id")

    if company_id_col is not None and not isinstance(company_id_col["type"], sa.Integer):
        fks = inspector.get_foreign_keys("company_skill_requirements")
        fk_names = [
            fk["name"]
            for fk in fks
            if "company_id" in fk.get("constrained_columns", [])
        ]

        with op.batch_alter_table("company_skill_requirements") as batch_op:
            for fk_name in fk_names:
                if fk_name:
                    batch_op.drop_constraint(fk_name, type_="foreignkey")

            batch_op.alter_column(
                "company_id",
                existing_type=company_id_col["type"],
                type_=sa.Integer(),
                postgresql_using="company_id::integer",
                existing_nullable=False,
            )
            batch_op.create_foreign_key(
                "fk_company_skill_requirements_company_id_companies",
                "companies",
                ["company_id"],
                ["id"],
                ondelete="CASCADE",
            )


def downgrade() -> None:
    # Retaining integer type for company_id on downgrade ensures schema compatibility
    # and prevents breaking foreign key constraints against companies.id.
    pass
