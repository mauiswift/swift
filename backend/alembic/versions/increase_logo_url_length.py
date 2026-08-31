"""Increase store_logo_url length to 2048

Revision ID: increase_logo_url_length
Revises: add_store_branding_fields
Create Date: 2026-07-28 05:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'increase_logo_url_length'
down_revision: Union[str, Sequence[str], None] = 'add_store_branding_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'sqlite':
        # SQLite does not support ALTER COLUMN for type changes.
        # Rebuild the table with the wider column definition to keep the migration idempotent and safe.
        with op.batch_alter_table('merchant_api_configs', recreate='always') as batch_op:
            batch_op.alter_column(
                'store_logo_url',
                existing_type=sa.String(length=512),
                type_=sa.String(length=2048),
                existing_nullable=True,
            )
        return

    op.alter_column(
        'merchant_api_configs',
        'store_logo_url',
        existing_type=sa.String(length=512),
        type_=sa.String(length=2048),
        existing_nullable=True,
    )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == 'sqlite':
        with op.batch_alter_table('merchant_api_configs', recreate='always') as batch_op:
            batch_op.alter_column(
                'store_logo_url',
                existing_type=sa.String(length=2048),
                type_=sa.String(length=512),
                existing_nullable=True,
            )
        return

    op.alter_column(
        'merchant_api_configs',
        'store_logo_url',
        existing_type=sa.String(length=2048),
        type_=sa.String(length=512),
        existing_nullable=True,
    )
