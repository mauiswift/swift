"""merge multiple heads after data migration

Revision ID: f111393a3a4f
Revises: 20260816_kyb_reference_code, 20260825_add_main_admin_user, dea6fbf38c9f
Create Date: 2026-08-25 17:03:07.274529

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f111393a3a4f'
down_revision: Union[str, Sequence[str], None] = ('20260816_kyb_reference_code', '20260825_add_main_admin_user', 'dea6fbf38c9f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass