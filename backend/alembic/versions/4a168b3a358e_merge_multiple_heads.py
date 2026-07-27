"""merge multiple heads

Revision ID: 4a168b3a358e
Revises: 92e2f2d9c8e3, a1b2c3d4e5f7
Create Date: 2026-07-22 22:59:39.593522

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4a168b3a358e'
down_revision: Union[str, Sequence[str], None] = ('92e2f2d9c8e3', 'a1b2c3d4e5f7')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass