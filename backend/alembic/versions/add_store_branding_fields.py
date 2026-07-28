"""Add store branding fields to merchant_api_configs

Revision ID: add_store_branding_fields
Revises: merchant_api_config_and_settlement
Create Date: 2026-07-28 04:55:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = "add_store_branding_fields"
down_revision: Union[str, Sequence[str], None] = "merch_api_cfg_settle"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table: str, column: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return bind.execute(
            text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_schema='public' AND table_name=:t AND column_name=:c"
            ),
            {"t": table, "c": column},
        ).fetchone() is not None
    result = bind.execute(text(f"PRAGMA table_info({table})"))
    return any(row[1] == column for row in result)


def upgrade() -> None:
    if not _column_exists("merchant_api_configs", "store_name"):
        op.add_column("merchant_api_configs", sa.Column("store_name", sa.String(length=256), nullable=True))
    if not _column_exists("merchant_api_configs", "store_logo_url"):
        op.add_column("merchant_api_configs", sa.Column("store_logo_url", sa.String(length=512), nullable=True))
    if not _column_exists("merchant_api_configs", "permanent_link_slug"):
        op.add_column("merchant_api_configs", sa.Column("permanent_link_slug", sa.String(length=128), nullable=True))
        op.create_index("ix_merchant_api_configs_permanent_link_slug", "merchant_api_configs", ["permanent_link_slug"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_merchant_api_configs_permanent_link_slug", table_name="merchant_api_configs")
    op.drop_column("merchant_api_configs", "permanent_link_slug")
    op.drop_column("merchant_api_configs", "store_logo_url")
    op.drop_column("merchant_api_configs", "store_name")
