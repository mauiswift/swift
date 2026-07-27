"""add checkout_token and expires_at to transactions

Revision ID: 77eb8934e7d1
Revises: zzzz_final_consolidation
Create Date: 2026-07-16 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '77eb8934e7d1'
down_revision: Union[str, Sequence[str], None] = 'zzzz_final_consolidation'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(name: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        return bind.execute(
            text("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=:t"),
            {"t": name},
        ).fetchone() is not None
    return bind.execute(
        text("SELECT 1 FROM sqlite_master WHERE type='table' AND name=:t"), {"t": name}
    ).fetchone() is not None


def _column_exists(table: str, column: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        return bind.execute(
            text("SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=:t AND column_name=:c"),
            {"t": table, "c": column},
        ).fetchone() is not None
    rows = bind.execute(text(f'PRAGMA table_info("{table}")')).fetchall()
    return any(row[1] == column for row in rows)


def upgrade() -> None:
    if not _table_exists('transactions'):
        return
    # Add checkout_token if missing
    if not _column_exists('transactions', 'checkout_token'):
        op.add_column('transactions', sa.Column('checkout_token', sa.String(), nullable=True))
    # Add expires_at if missing
    if not _column_exists('transactions', 'expires_at'):
        op.add_column('transactions', sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    if not _table_exists('transactions'):
        return
    if _column_exists('transactions', 'checkout_token'):
        op.drop_column('transactions', 'checkout_token')
    if _column_exists('transactions', 'expires_at'):
        op.drop_column('transactions', 'expires_at')
