"""add bank info to admin users

Revision ID: bb7512fda2e9
Revises: 4a168b3a358e
Create Date: 2026-07-22 22:59:46.982666

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bb7512fda2e9'
down_revision: Union[str, Sequence[str], None] = '4a168b3a358e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('admin_users', sa.Column('bank_name', sa.String(length=128), nullable=True))
    op.add_column('admin_users', sa.Column('bank_account_number', sa.String(length=64), nullable=True))
    op.add_column('admin_users', sa.Column('bank_account_name', sa.String(length=256), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('admin_users', 'bank_account_name')
    op.drop_column('admin_users', 'bank_account_number')
    op.drop_column('admin_users', 'bank_name')
