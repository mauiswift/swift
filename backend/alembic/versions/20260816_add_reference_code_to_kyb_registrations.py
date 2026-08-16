"""add reference_code to kyb_registrations

Revision ID: 20260816_kyb_reference_code
Revises: 20260816_nda_acceptance
Create Date: 2026-08-16 16:45:00.000000

"""
import secrets
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text


revision: str = '20260816_kyb_reference_code'
down_revision: Union[str, Sequence[str], None] = '20260816_nda_acceptance'
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


def _index_exists(table: str, index_name: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == 'postgresql':
        return bind.execute(
            text("SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename=:t AND indexname=:i"),
            {'t': table, 'i': index_name},
        ).fetchone() is not None
    return bind.execute(text("SELECT 1 FROM sqlite_master WHERE type='index' AND tbl_name=:t AND name=:i"), {'t': table, 'i': index_name}).fetchone() is not None


def upgrade() -> None:
    if not _table_exists('kyb_registrations'):
        return

    if not _column_exists('kyb_registrations', 'reference_code'):
        op.add_column('kyb_registrations', sa.Column('reference_code', sa.String(length=12), nullable=True))

    bind = op.get_bind()
    rows = bind.execute(text('SELECT id FROM kyb_registrations WHERE reference_code IS NULL OR reference_code = "" ORDER BY id')).fetchall()
    used_codes = set()
    for (row_id,) in rows:
        while True:
            code = str(secrets.randbelow(900000) + 100000)
            if code not in used_codes:
                used_codes.add(code)
                bind.execute(text('UPDATE kyb_registrations SET reference_code = :code WHERE id = :id'), {'code': code, 'id': row_id})
                break

    if bind.dialect.name == 'postgresql':
        op.execute(text("ALTER TABLE kyb_registrations ALTER COLUMN reference_code SET NOT NULL"))

    if not _index_exists('kyb_registrations', 'ix_kyb_registrations_reference_code'):
        op.create_index('ix_kyb_registrations_reference_code', 'kyb_registrations', ['reference_code'], unique=True)


def downgrade() -> None:
    if not _table_exists('kyb_registrations'):
        return
    if _index_exists('kyb_registrations', 'ix_kyb_registrations_reference_code'):
        op.drop_index('ix_kyb_registrations_reference_code', table_name='kyb_registrations')
    if _column_exists('kyb_registrations', 'reference_code'):
        op.drop_column('kyb_registrations', 'reference_code')
