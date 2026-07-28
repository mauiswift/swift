"""Add MerchantApiConfig table and settlement fields to AdminUser

Revision ID: merchant_api_config_and_settlement
Revises: zzzz_final_consolidation
Create Date: 2026-07-28 04:40:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = "merch_api_cfg_settle"
down_revision: Union[str, Sequence[str], None] = "zzzz_final_consolidation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _col_exists(table: str, column: str) -> bool:
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


def _table_exists(table: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return bind.execute(
            text(
                "SELECT 1 FROM information_schema.tables "
                "WHERE table_schema='public' AND table_name=:t"
            ),
            {"t": table},
        ).fetchone() is not None
    # SQLite logic
    result = bind.execute(text(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'"))
    return result.fetchone() is not None


def upgrade() -> None:
    # 1. Create merchant_api_configs table
    if not _table_exists("merchant_api_configs"):
        op.create_table(
            "merchant_api_configs",
            sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("organization_id", sa.String(length=64), nullable=False),
            sa.Column("test_access_key", sa.String(length=64), nullable=False),
            sa.Column("test_secret_key", sa.String(length=64), nullable=True),
            sa.Column("live_access_key", sa.String(length=64), nullable=False),
            sa.Column("live_secret_key", sa.String(length=64), nullable=True),
            sa.Column("test_callback_url", sa.String(length=512), nullable=True),
            sa.Column("test_status_page_mode", sa.String(length=32), server_default="swiftpay", nullable=False),
            sa.Column("test_external_status_url", sa.String(length=512), nullable=True),
            sa.Column("test_success_url", sa.String(length=512), nullable=True),
            sa.Column("test_cancel_url", sa.String(length=512), nullable=True),
            sa.Column("test_failure_url", sa.String(length=512), nullable=True),
            sa.Column("live_callback_url", sa.String(length=512), nullable=True),
            sa.Column("live_status_page_mode", sa.String(length=32), server_default="swiftpay", nullable=False),
            sa.Column("live_external_status_url", sa.String(length=512), nullable=True),
            sa.Column("live_success_url", sa.String(length=512), nullable=True),
            sa.Column("live_cancel_url", sa.String(length=512), nullable=True),
            sa.Column("live_failure_url", sa.String(length=512), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_merchant_api_configs_organization_id", "merchant_api_configs", ["organization_id"], unique=True)

    # 2. Add settlement columns to admin_users
    if not _col_exists("admin_users", "settlement_type"):
        op.add_column("admin_users", sa.Column("settlement_type", sa.String(length=64), nullable=True))
    if not _col_exists("admin_users", "settlement_currency"):
        op.add_column("admin_users", sa.Column("settlement_currency", sa.String(length=8), nullable=True))
    if not _col_exists("admin_users", "bank_address"):
        op.add_column("admin_users", sa.Column("bank_address", sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_index("ix_merchant_api_configs_organization_id", table_name="merchant_api_configs")
    op.drop_table("merchant_api_configs")

    op.drop_column("admin_users", "bank_address")
    op.drop_column("admin_users", "settlement_currency")
    op.drop_column("admin_users", "settlement_type")
