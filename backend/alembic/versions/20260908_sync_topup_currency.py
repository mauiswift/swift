"""Normalize crypto top-up currency metadata.

Revision ID: 20260908_sync_topup_currency
Revises: 20260908_wallet_balances
"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import text


revision: str = "20260908_sync_topup_currency"
down_revision: Union[str, Sequence[str], None] = "20260908_wallet_balances"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    op.execute("UPDATE topup_requests SET currency = 'USDT' WHERE currency IS NULL OR currency IN ('USD', 'PHP')")
    if bind.dialect.name == "sqlite":
        with op.batch_alter_table("topup_requests") as batch_op:
            batch_op.alter_column("currency", server_default="USDT")
    else:
        op.alter_column("topup_requests", "currency", server_default="USDT")


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        with op.batch_alter_table("topup_requests") as batch_op:
            batch_op.alter_column("currency", server_default="USD")
    else:
        op.alter_column("topup_requests", "currency", server_default="USD")
