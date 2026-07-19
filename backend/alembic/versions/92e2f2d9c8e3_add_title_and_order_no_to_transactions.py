"""add title and order_no to transactions

Revision ID: 92e2f2d9c8e3
Revises: fd60a0c5e22a
Create Date: 2026-07-19 07:42:52.972565

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '92e2f2d9c8e3'
down_revision: Union[str, Sequence[str], None] = 'fd60a0c5e22a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('transactions', sa.Column('title', sa.String(), nullable=True))
    op.add_column('transactions', sa.Column('order_no', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('transactions', 'order_no')
    op.drop_column('transactions', 'title')
