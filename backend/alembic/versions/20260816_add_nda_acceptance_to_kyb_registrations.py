"""add nda acceptance tracking to kyb_registrations

Revision ID: 20260816_nda_acceptance
Revises: zzzz_final_consolidation
Create Date: 2026-08-16 16:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text


revision: str = '20260816_nda_acceptance'
down_revision: Union[str, Sequence[str], None] = 'zzzz_final_consolidation'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(name: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        return bind.execute(
            text("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=:t"),
            {'t': name},
        ).fetchone() is not None
    return bind.execute(text("SELECT 1 FROM sqlite_master WHERE type='table' AND name=:t"), {'t': name}).fetchone() is not None


def _column_exists(table: str, col: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        return bind.execute(
            text("SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=:t AND column_name=:c"),
            {'t': table, 'c': col},
        ).fetchone() is not None
    rows = bind.execute(text(f'PRAGMA table_info("{table}")')).fetchall()
    return any(row[1] == col for row in rows)


def upgrade() -> None:
    if not _table_exists('kyb_registrations'):
        return

    if not _column_exists('kyb_registrations', 'nda_accepted'):
        op.add_column('kyb_registrations', sa.Column('nda_accepted', sa.Boolean(), nullable=False, server_default=sa.false()))
    if not _column_exists('kyb_registrations', 'nda_signed_at'):
        op.add_column('kyb_registrations', sa.Column('nda_signed_at', sa.DateTime(timezone=True), nullable=True))

    bind = op.get_bind()
    if bind.dialect.name == 'sqlite':
        bind.execute(text("UPDATE kyb_registrations SET nda_accepted = 1 WHERE nda_accepted IS NULL"))


def downgrade() -> None:
    if not _table_exists('kyb_registrations'):
        return
    if _column_exists('kyb_registrations', 'nda_signed_at'):
        op.drop_column('kyb_registrations', 'nda_signed_at')
    if _column_exists('kyb_registrations', 'nda_accepted'):
        op.drop_column('kyb_registrations', 'nda_accepted')
