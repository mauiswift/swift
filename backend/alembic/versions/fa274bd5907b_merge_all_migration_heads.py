"""merge all migration heads

Revision ID: fa274bd5907b
Revises: 001_pos_terminals, add_collection_currency, admin_notifications_001, broadcast_messages_001, f111393a3a4f
Create Date: 2026-08-30 19:23:36.820375

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fa274bd5907b'
down_revision: Union[str, Sequence[str], None] = ('001_pos_terminals', 'add_collection_currency', 'admin_notifications_001', 'broadcast_messages_001', 'f111393a3a4f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass