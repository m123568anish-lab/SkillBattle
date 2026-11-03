"""merge migration heads

Revision ID: 47292a2a50d2
Revises: 7a2b1c4d9e8f, b8f2d4e6a901
Create Date: 2026-11-03 11:06:59.207134

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '47292a2a50d2'
down_revision: Union[str, Sequence[str], None] = ('7a2b1c4d9e8f', 'b8f2d4e6a901')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
