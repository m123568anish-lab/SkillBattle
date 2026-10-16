"""Add persisted placement company tracks and rounds."""
from alembic import op
import sqlalchemy as sa
revision = "7a2b1c4d9e8f"
down_revision = "6e1c2d3f4a5b"
branch_labels = None
depends_on = None
def upgrade():
    op.create_table("placement_companies", sa.Column("id", sa.String(36), primary_key=True), sa.Column("name", sa.String(160), nullable=False, unique=True), sa.Column("category", sa.String(80), nullable=False), sa.Column("source_url", sa.String(500), nullable=False, server_default=""), sa.Column("last_verified_at", sa.DateTime()), sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.true()), sa.Column("created_at", sa.DateTime(), nullable=False))
    op.create_index("ix_placement_companies_name", "placement_companies", ["name"])
    op.create_index("ix_placement_companies_category", "placement_companies", ["category"])
    op.create_table("placement_tracks", sa.Column("id", sa.String(36), primary_key=True), sa.Column("company_id", sa.String(36), sa.ForeignKey("placement_companies.id", ondelete="CASCADE"), nullable=False), sa.Column("role", sa.String(120), nullable=False), sa.Column("title", sa.String(200), nullable=False), sa.Column("description", sa.Text(), nullable=False), sa.Column("template_kind", sa.String(30), nullable=False), sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.create_index("ix_placement_tracks_company_id", "placement_tracks", ["company_id"]); op.create_index("ix_placement_tracks_role", "placement_tracks", ["role"])
    op.create_table("placement_track_rounds", sa.Column("id", sa.String(36), primary_key=True), sa.Column("track_id", sa.String(36), sa.ForeignKey("placement_tracks.id", ondelete="CASCADE"), nullable=False), sa.Column("position", sa.Integer(), nullable=False), sa.Column("title", sa.String(160), nullable=False), sa.Column("assessment_type", sa.String(40), nullable=False), sa.Column("topic", sa.String(120), nullable=False), sa.Column("description", sa.Text(), nullable=False), sa.Column("assessment_id", sa.String(36), sa.ForeignKey("unified_assessments.id", ondelete="SET NULL")))
    op.create_index("ix_placement_track_rounds_track_id", "placement_track_rounds", ["track_id"])
def downgrade():
    op.drop_table("placement_track_rounds"); op.drop_table("placement_tracks"); op.drop_table("placement_companies")
