"""add bank info to admin users

Revision ID: bb7512fda2e9
Revises: 4a168b3a358e
Create Date: 2026-07-22 22:59:46.982666

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = 'bb7512fda2e9'
down_revision: Union[str, Sequence[str], None] = '4a168b3a358e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table: str, column: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        return bind.execute(
            text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
            ),
            {'t': table, 'c': column},
        ).fetchone() is not None
    rows = bind.execute(text(f'PRAGMA table_info("{table}")')).fetchall()
    return any(row[1] == column for row in rows)


def upgrade() -> None:
    """Upgrade schema."""
    if not _column_exists('admin_users', 'bank_name'):
        op.add_column('admin_users', sa.Column('bank_name', sa.String(length=128), nullable=True))
    if not _column_exists('admin_users', 'bank_account_number'):
        op.add_column('admin_users', sa.Column('bank_account_number', sa.String(length=64), nullable=True))
    if not _column_exists('admin_users', 'bank_account_name'):
        op.add_column('admin_users', sa.Column('bank_account_name', sa.String(length=256), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    if _column_exists('admin_users', 'bank_account_name'):
        op.drop_column('admin_users', 'bank_account_name')
    if _column_exists('admin_users', 'bank_account_number'):
        op.drop_column('admin_users', 'bank_account_number')
    if _column_exists('admin_users', 'bank_name'):
        op.drop_column('admin_users', 'bank_name')
