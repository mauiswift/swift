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
    # Use alter_column to change the length
    # Note: SQLite doesn't support changing column length easily via ALTER,
    # but for Production (Postgres/MySQL) this works perfectly.
    op.alter_column('merchant_api_configs', 'store_logo_url',
               existing_type=sa.String(length=512),
               type_=sa.String(length=2048),
               existing_nullable=True)

def downgrade() -> None:
    op.alter_column('merchant_api_configs', 'store_logo_url',
               existing_type=sa.String(length=2048),
               type_=sa.String(length=512),
               existing_nullable=True)
