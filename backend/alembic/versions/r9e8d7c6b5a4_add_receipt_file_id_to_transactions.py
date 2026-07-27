"""add receipt_file_id to transactions

Revision ID: r9e8d7c6b5a4
Revises: f4e19613f3a8
Create Date: 2026-07-15 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = 'r9e8d7c6b5a4'
down_revision: Union[str, Sequence[str], None] = 'f4e19613f3a8'
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
    # Add column only if it doesn't already exist
    if not _column_exists('transactions', 'receipt_file_id'):
        op.add_column('transactions', sa.Column('receipt_file_id', sa.String(), nullable=True))


def downgrade() -> None:
    if not _table_exists('transactions'):
        return
    if _column_exists('transactions', 'receipt_file_id'):
        op.drop_column('transactions', 'receipt_file_id')
