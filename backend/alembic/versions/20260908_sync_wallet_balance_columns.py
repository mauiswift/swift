"""Add wallet available and pending balance columns.

Revision ID: 20260908_wallet_balances
Revises: 20260907_add_support_tickets
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text


revision: str = "20260908_wallet_balances"
down_revision: Union[str, Sequence[str], None] = "20260907_add_support_tickets"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_exists(table: str, column: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return bind.execute(
            text(
                "SELECT 1 FROM information_schema.columns "
                "WHERE table_schema='public' AND table_name=:table_name "
                "AND column_name=:column_name"
            ),
            {"table_name": table, "column_name": column},
        ).first() is not None
    return any(row[1] == column for row in bind.execute(text(f"PRAGMA table_info({table})")))


def upgrade() -> None:
    if not _column_exists("wallets", "available_balance"):
        op.add_column(
            "wallets",
            sa.Column("available_balance", sa.Float(), nullable=False, server_default="0.0"),
        )
    if not _column_exists("wallets", "pending_balance"):
        op.add_column(
            "wallets",
            sa.Column("pending_balance", sa.Float(), nullable=False, server_default="0.0"),
        )
    op.execute("UPDATE wallets SET available_balance = balance WHERE available_balance = 0 AND balance <> 0")


def downgrade() -> None:
    if _column_exists("wallets", "pending_balance"):
        op.drop_column("wallets", "pending_balance")
    if _column_exists("wallets", "available_balance"):
        op.drop_column("wallets", "available_balance")
