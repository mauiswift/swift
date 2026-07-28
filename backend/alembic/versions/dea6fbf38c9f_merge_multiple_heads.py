"""merge multiple heads

Revision ID: dea6fbf38c9f
Revises: bb7512fda2e9, increase_logo_url_length
Create Date: 2026-07-29 03:51:59.509704

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dea6fbf38c9f'
down_revision: Union[str, Sequence[str], None] = ('bb7512fda2e9', 'increase_logo_url_length')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass