import random
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.toss_account_pool import TossAccountPool
from models.transactions import Transactions


async def assign_toss_account_to_transaction(
    db: AsyncSession,
    txn: Transactions,
) -> dict[str, str] | None:
    """Assign an active checkout-pool account to a KRW payment transaction."""
    result = await db.execute(
        select(TossAccountPool)
        .where(TossAccountPool.is_active.is_(True))
        .order_by(TossAccountPool.id.asc())
        .with_for_update()
    )
    pool_accounts = result.scalars().all()
    reference = str(txn.external_id or "").strip()

    if txn.bank_account_number and txn.bank_account_reference == reference:
        assigned = await db.scalar(
            select(TossAccountPool).where(
                TossAccountPool.account_number == txn.bank_account_number,
                TossAccountPool.last_assigned_transaction_id == txn.id,
            )
        )
        if assigned:
            return {
                "bank_name": assigned.bank_name,
                "number": assigned.account_number,
                "account_name": assigned.account_holder_name,
            }

    candidates = [
        {
            "bank_name": account.bank_name,
            "number": account.account_number,
            "account_name": account.account_holder_name,
        }
        for account in pool_accounts
    ]
    if txn.bank_account_number and txn.bank_account_reference == reference:
        existing = next(
            (candidate for candidate in candidates if candidate["number"] == txn.bank_account_number),
            None,
        )
        if existing:
            return existing

    if not candidates:
        return None

    candidate_numbers = {candidate["number"] for candidate in candidates}
    latest_result = await db.execute(
        select(Transactions.bank_account_number)
        .where(
            Transactions.currency == "KRW",
            Transactions.bank_account_number.in_(candidate_numbers),
        )
        .order_by(Transactions.id.desc())
        .limit(1)
    )
    latest_number = str(latest_result.scalar_one_or_none() or "").strip()
    previous_number = str(txn.bank_account_number or "").strip()
    rotation_candidates = [
        candidate for candidate in candidates
        if candidate["number"] not in {latest_number, previous_number}
    ]
    if not rotation_candidates:
        rotation_candidates = [
            candidate for candidate in candidates
            if candidate["number"] != previous_number
        ] or candidates
    account = random.choice(rotation_candidates)
    pool_account = next(
        (candidate for candidate in pool_accounts if candidate.account_number == account["number"]),
        None,
    )
    if pool_account is None:
        raise RuntimeError("Selected TOSS checkout account is missing from the active pool.")

    now = datetime.now(timezone.utc)
    pool_account.last_assigned_at = now
    pool_account.last_assigned_transaction_id = txn.id
    pool_account.updated_at = now
    txn.bank_name = account["bank_name"]
    txn.bank_account_number = account["number"]
    txn.bank_account_name = account["account_name"]
    txn.bank_account_reference = reference
    await db.commit()
    return account
