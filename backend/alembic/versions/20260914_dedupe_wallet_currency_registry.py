"""Deduplicate wallet currency registry and enforce one row per user/currency."""

from typing import Sequence, Union

from alembic import op
from sqlalchemy import text


revision: str = "20260914_wallet_currency_registry"
down_revision: Union[str, Sequence[str], None] = "20260911_add_failed_passkey_attempt_tracking"
branch_labels = None
depends_on = None


def _index_exists(index_name: str) -> bool:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return bind.execute(
            text("SELECT 1 FROM pg_indexes WHERE indexname = :name"),
            {"name": index_name},
        ).fetchone() is not None
    return bind.execute(
        text("SELECT 1 FROM sqlite_master WHERE type='index' AND name=:name"),
        {"name": index_name},
    ).fetchone() is not None


def upgrade() -> None:
    bind = op.get_bind()
    bind.execute(text("UPDATE wallets SET currency = 'PHP' WHERE currency IS NULL OR TRIM(currency) = ''"))
    bind.execute(text("UPDATE wallets SET currency = 'USD' WHERE UPPER(TRIM(currency)) = 'USDT'"))

    duplicate_groups = bind.execute(
        text(
            "SELECT user_id, currency, MIN(id) AS keep_id "
            "FROM wallets GROUP BY user_id, currency HAVING COUNT(*) > 1"
        )
    ).fetchall()
    for user_id, currency, keep_id in duplicate_groups:
        duplicate_rows = bind.execute(
            text(
                "SELECT id, balance, available_balance, pending_balance, total_credits, "
                "total_debits, transaction_count FROM wallets "
                "WHERE user_id = :user_id AND currency = :currency AND id <> :keep_id"
            ),
            {"user_id": user_id, "currency": currency, "keep_id": keep_id},
        ).fetchall()
        if not duplicate_rows:
            continue

        totals = [sum(float(row[index] or 0) for row in duplicate_rows) for index in range(1, 7)]
        for row in duplicate_rows:
            bind.execute(
                text("UPDATE wallet_transactions SET wallet_id = :keep_id WHERE wallet_id = :duplicate_id"),
                {"keep_id": keep_id, "duplicate_id": row[0]},
            )
        bind.execute(
            text(
                "UPDATE wallets SET balance = balance + :balance, "
                "available_balance = available_balance + :available_balance, "
                "pending_balance = pending_balance + :pending_balance, "
                "total_credits = total_credits + :total_credits, "
                "total_debits = total_debits + :total_debits, "
                "transaction_count = transaction_count + :transaction_count "
                "WHERE id = :keep_id"
            ),
            {
                "keep_id": keep_id,
                "balance": totals[0],
                "available_balance": totals[1],
                "pending_balance": totals[2],
                "total_credits": totals[3],
                "total_debits": totals[4],
                "transaction_count": int(totals[5]),
            },
        )
        for row in duplicate_rows:
            bind.execute(text("DELETE FROM wallets WHERE id = :id"), {"id": row[0]})

    if not _index_exists("uq_wallets_user_currency"):
        from alembic import op
        op.create_index("uq_wallets_user_currency", "wallets", ["user_id", "currency"], unique=True)


def downgrade() -> None:
    if _index_exists("uq_wallets_user_currency"):
        op.drop_index("uq_wallets_user_currency", table_name="wallets")
