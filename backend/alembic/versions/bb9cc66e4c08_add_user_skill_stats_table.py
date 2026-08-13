"""Add user_skill_stats table

Revision ID: bb9cc66e4c08
Revises: dd495117949b
Create Date: 2026-08-10 21:56:43.487676

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bb9cc66e4c08'
down_revision: Union[str, Sequence[str], None] = 'dd495117949b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('user_skill_stats',
    sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
    sa.Column('user_id', sa.String(length=36), nullable=False),
    sa.Column('subject', sa.String(length=100), nullable=False),
    sa.Column('correct_attempts', sa.Integer(), nullable=False),
    sa.Column('total_attempts', sa.Integer(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_user_skill_stats_user_id_users')),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_user_skill_stats'))
    )
    op.create_index(op.f('ix_user_skill_stats_user_id'), 'user_skill_stats', ['user_id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_user_skill_stats_user_id'), table_name='user_skill_stats')
    op.drop_table('user_skill_stats')
