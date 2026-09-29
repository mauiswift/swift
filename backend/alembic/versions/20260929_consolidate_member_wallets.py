"""Consolidate current organization members' personal wallets.

Revision ID: 20260929_consolidate_member_wallets
Revises: 20260928_wallet_integrity

Personal wallet balances are merged into the member's current organization
wallet. Personal wallet ledger rows are removed after dependent wallet IDs are
repointed. Accounts without a current organization are left unchanged.
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

from core.constants import normalize_currency


revision: str = "20260929_consolidate_member_wallets"
down_revision: Union[str, None] = "20260928_wallet_integrity"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


BALANCE_COLUMNS = (
    "balance",
    "available_balance",
    "pending_balance",
    "reserved_balance",
    "total_credits",
    "total_debits",
    "transaction_count",
    "conversion_count",
)
COUNT_COLUMNS = {"transaction_count", "conversion_count"}


def _columns(bind, table_name: str) -> set[str]:
    return {column["name"] for column in inspect(bind).get_columns(table_name)}


def _member_organizations(bind) -> tuple[dict[str, str], dict[str, set[str]]]:
    exact: dict[str, str] = {}
    normalized: dict[str, set[str]] = {}
    rows = bind.execute(
        sa.text(
            "SELECT telegram_id, organization_id FROM admin_users "
            "WHERE organization_id IS NOT NULL AND organization_id <> ''"
        )
    ).fetchall()
    for telegram_id, organization_id in rows:
        user_id = str(telegram_id).strip()
        org_id = str(organization_id).strip()
        if not user_id or not org_id:
            continue
        exact[user_id] = org_id
        normalized.setdefault(user_id.removeprefix("tg-"), set()).add(org_id)
    return exact, normalized


def _resolve_organization(user_id: str, exact: dict[str, str], normalized: dict[str, set[str]]) -> str | None:
    if user_id in exact:
        return exact[user_id]
    matches = normalized.get(user_id.removeprefix("tg-"), set())
    return next(iter(matches)) if len(matches) == 1 else None


def _get_or_create_organization_wallet(bind, columns: set[str], organization_id: str, currency: str) -> int:
    wallets = sa.table("wallets", sa.column("id"), sa.column("organization_id"), sa.column("currency"))
    target = bind.execute(
        sa.select(wallets.c.id)
        .where(
            wallets.c.organization_id == organization_id,
            wallets.c.currency == currency,
        )
        .order_by(wallets.c.id)
        .limit(1)
    ).scalar_one_or_none()
    if target is not None:
        return int(target)

    values = {
        "user_id": f"org:{organization_id}",
        "organization_id": organization_id,
        "currency": currency,
    }
    for name in BALANCE_COLUMNS:
        if name in columns:
            values[name] = 0
    for name in ("is_frozen", "total_credits", "total_debits", "transaction_count", "conversion_count"):
        if name in columns:
            values.setdefault(name, False if name == "is_frozen" else 0)
    for name in ("created_at", "updated_at"):
        if name in columns:
            values[name] = sa.func.current_timestamp()

    bind.execute(sa.insert(sa.table("wallets", *[sa.column(name) for name in values])).values(**values))
    return int(bind.execute(
        sa.select(wallets.c.id)
        .where(
            wallets.c.organization_id == organization_id,
            wallets.c.currency == currency,
        )
        .order_by(wallets.c.id)
        .limit(1)
    ).scalar_one())


def consolidate_member_wallets(bind) -> int:
    """Merge eligible balances, repoint live references, and delete personal rows."""
    tables = set(inspect(bind).get_table_names())
    if not {"admin_users", "wallets"}.issubset(tables):
        return 0

    wallet_columns = _columns(bind, "wallets")
    if not {"id", "user_id", "currency", "organization_id", "balance"}.issubset(wallet_columns):
        return 0

    exact, normalized = _member_organizations(bind)
    wallet_rows = bind.execute(sa.text("SELECT * FROM wallets WHERE organization_id IS NULL")).mappings().all()
    grouped: dict[tuple[str, str], list[dict]] = {}
    for row in wallet_rows:
        organization_id = _resolve_organization(str(row["user_id"]), exact, normalized)
        if organization_id is None:
            continue
        currency = normalize_currency(row["currency"])
        grouped.setdefault((organization_id, currency), []).append(dict(row))

    if grouped:
        if "wallet_transactions" not in tables:
            raise RuntimeError("Cannot consolidate member wallets without the wallet transaction ledger.")
        ledger_columns = _columns(bind, "wallet_transactions")
        required_ledger_columns = {
            "wallet_id",
            "user_id",
            "transaction_type",
            "amount",
            "status",
            "reference_id",
        }
        if not required_ledger_columns.issubset(ledger_columns):
            raise RuntimeError("Cannot consolidate member wallets: wallet transaction ledger schema is incomplete.")

    wallet_targets: dict[tuple[str, str], int] = {}
    wallet_moves: dict[int, int] = {}
    wallet_organizations: dict[int, str] = {}
    wallet_totals: dict[tuple[str, str], dict[str, float]] = {}
    for key, personal_wallets in grouped.items():
        organization_id, currency = key
        target_id = _get_or_create_organization_wallet(bind, wallet_columns, organization_id, currency)
        wallet_targets[key] = target_id
        wallet_totals[key] = {
            name: sum(float(wallet.get(name) or 0) for wallet in personal_wallets)
            for name in BALANCE_COLUMNS
            if name in wallet_columns
        }
        wallet_moves.update({int(wallet["id"]): target_id for wallet in personal_wallets})
        wallet_organizations.update({int(wallet["id"]): organization_id for wallet in personal_wallets})

        update_values = dict(wallet_totals[key])
        if "updated_at" in wallet_columns:
            update_values["updated_at"] = sa.func.current_timestamp()
        wallet_table = sa.table(
            "wallets",
            sa.column("id"),
            *[sa.column(name) for name in update_values],
        )
        current_values = bind.execute(
            sa.select(*[wallet_table.c[name] for name in update_values])
            .where(wallet_table.c.id == target_id)
        ).mappings().one()
        update_values = {
            name: (int(current_values[name] or 0) + int(amount))
            if name in COUNT_COLUMNS
            else (float(current_values[name] or 0) + amount)
            for name, amount in wallet_totals[key].items()
        } | {
            name: value
            for name, value in update_values.items()
            if name not in wallet_totals[key]
        }
        bind.execute(
            sa.update(wallet_table)
            .where(wallet_table.c.id == target_id)
            .values(**update_values)
        )

    if not wallet_moves:
        return 0

    old_wallet_ids = list(wallet_moves)
    placeholders = ", ".join(f":wallet_id_{index}" for index in range(len(old_wallet_ids)))
    parameters = {f"wallet_id_{index}": wallet_id for index, wallet_id in enumerate(old_wallet_ids)}

    # Keep active reservations and request records attached to the canonical wallet.
    for table_name in ("wallet_reservations", "currency_conversion", "usdt_send_requests", "crypto_topup_requests"):
        if table_name not in tables or "wallet_id" not in _columns(bind, table_name):
            continue
        for old_id, new_id in wallet_moves.items():
            values = {"wallet_id": new_id}
            table_columns = _columns(bind, table_name)
            if table_name == "wallet_reservations" and "organization_id" in table_columns:
                values["organization_id"] = wallet_organizations[old_id]
            reference_table = sa.table(
                table_name,
                sa.column("wallet_id"),
                *[sa.column(name) for name in values if name != "wallet_id"],
            )
            bind.execute(
                sa.update(reference_table)
                .where(reference_table.c.wallet_id == old_id)
                .values(**values)
            )

    if "wallet_transactions" in tables:
        bind.execute(
            sa.text(f"DELETE FROM wallet_transactions WHERE wallet_id IN ({placeholders})"),
            parameters,
        )

        for (organization_id, currency), total in wallet_totals.items():
            balance_delta = total.get("balance", 0.0)
            if not balance_delta:
                continue
            target_id = wallet_targets[(organization_id, currency)]
            note = "Legacy member wallet balance consolidated into organization wallet"
            ledger_values = {
                "wallet_id": target_id,
                "user_id": f"org:{organization_id}",
                "transaction_type": "wallet_migration",
                "amount": balance_delta,
                "status": "completed",
                "reference_id": f"{revision}:{organization_id}:{currency}",
            }
            if "note" in ledger_columns:
                ledger_values["note"] = note
            if "balance_after" in ledger_columns:
                target_balance = bind.execute(
                    sa.text("SELECT balance FROM wallets WHERE id = :wallet_id"),
                    {"wallet_id": target_id},
                ).scalar_one()
                ledger_values["balance_after"] = float(target_balance or 0)
                if "balance_before" in ledger_columns:
                    ledger_values["balance_before"] = float(target_balance or 0) - balance_delta
            if "created_at" in ledger_columns:
                ledger_values["created_at"] = sa.func.current_timestamp()
            ledger_table = sa.table(
                "wallet_transactions",
                *[sa.column(name) for name in ledger_values],
            )
            bind.execute(
                sa.insert(ledger_table)
                .values(**ledger_values)
            )

    bind.execute(sa.text(f"DELETE FROM wallets WHERE id IN ({placeholders})"), parameters)
    return len(old_wallet_ids)


def upgrade() -> None:
    consolidate_member_wallets(op.get_bind())


def downgrade() -> None:
    raise RuntimeError(
        "Organization wallet consolidation deletes personal wallet ledgers and cannot be reversed."
    )
