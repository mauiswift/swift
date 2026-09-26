#!/usr/bin/env python3
"""Insert deterministic, local-only dashboard fixtures.

Run from ``backend/`` with ``ENVIRONMENT=development`` and a local database:
``python tools/seed_mock_data.py --apply``.
"""

import argparse
import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.engine import make_url

from core.config import settings
from core.database import db_manager
from models.admin_users import AdminUser
from models.disbursements import Disbursements
from models.transactions import Transactions
from models.wallets import Wallets

MOCK_ADMIN_EMAIL = "merchant.mock@example.test"
MOCK_TELEGRAM_ID = "mock-merchant-local"
MOCK_ORGANIZATION_ID = "mock-organization-local"


def require_local_target(
    environment: str,
    database_url: str,
    render: str = "",
    railway_environment: str = "",
    railway_project_id: str = "",
) -> None:
    """Refuse to write fixtures unless explicitly pointed at a local dev database."""
    if environment.strip().lower() not in {"local", "development", "dev", "test"}:
        raise RuntimeError("Mock fixtures require ENVIRONMENT=local, development, dev, or test.")
    if render or railway_environment or railway_project_id:
        raise RuntimeError("Mock fixtures cannot run on a hosted Render or Railway environment.")

    url = make_url(database_url)
    if url.get_backend_name() == "sqlite":
        return
    if url.get_backend_name() == "postgresql" and url.host in {"localhost", "127.0.0.1", "::1"}:
        return
    raise RuntimeError("Mock fixtures require SQLite or a PostgreSQL database on localhost.")


async def insert_mock_data() -> dict[str, int]:
    await db_manager.ensure_initialized()
    if db_manager.async_session_maker is None:
        raise RuntimeError("Database session factory was not initialized.")

    inserted = {"admins": 0, "payments": 0, "wallets": 0, "disbursements": 0}
    now = datetime.now(timezone.utc)

    async with db_manager.async_session_maker() as session:
        admin = await session.scalar(
            select(AdminUser).where(AdminUser.email == MOCK_ADMIN_EMAIL)
        )
        if admin is None:
            admin = AdminUser(
                telegram_id=MOCK_TELEGRAM_ID,
                telegram_username="mock_merchant",
                name="Local Mock Merchant",
                email=MOCK_ADMIN_EMAIL,
                is_active=True,
                is_super_admin=False,
                role="admin",
                organization_id=MOCK_ORGANIZATION_ID,
                organization_name="Local Mock Organization",
                test_mode=True,
            )
            session.add(admin)
            await session.flush()
            inserted["admins"] += 1

        user_id = str(admin.id)
        for currency, balance, pending in (
            ("PHP", 125_000.0, 5_000.0),
            ("KRW", 2_500_000.0, 100_000.0),
            ("USDT", 1_250.0, 50.0),
        ):
            wallet = await session.scalar(
                select(Wallets).where(
                    Wallets.user_id == user_id,
                    Wallets.currency == currency,
                )
            )
            if wallet is None:
                session.add(
                    Wallets(
                        user_id=user_id,
                        organization_id=MOCK_ORGANIZATION_ID,
                        balance=balance,
                        available_balance=balance - pending,
                        pending_balance=pending,
                        currency=currency,
                        total_credits=balance,
                        total_debits=0.0,
                        transaction_count=4,
                        last_activity=now,
                        created_at=now,
                        updated_at=now,
                    )
                )
                inserted["wallets"] += 1

        payments = (
            ("paid", "qrph_payment", 2_500.0, "QRPH payment", 1),
            ("pending", "payment_link", 4_200.0, "Payment link", 2),
            ("failed", "qrph_payment", 1_750.0, "Failed QR payment", 3),
            ("expired", "payment_link", 900.0, "Expired payment link", 4),
        )
        for index, (status, transaction_type, amount, title, days_ago) in enumerate(payments, 1):
            external_id = f"mock-local-payment-{index}"
            existing = await session.scalar(
                select(Transactions.id).where(Transactions.external_id == external_id)
            )
            if existing is None:
                created_at = now - timedelta(days=days_ago)
                session.add(
                    Transactions(
                        user_id=user_id,
                        transaction_type=transaction_type,
                        external_id=external_id,
                        amount=amount,
                        currency="PHP",
                        status=status,
                        approval_status="approved" if status == "paid" else "pending",
                        paid_at=created_at if status == "paid" else None,
                        title=title,
                        description="Local development mock payment",
                        customer_name=f"Mock Customer {index}",
                        customer_email=f"customer{index}@example.test",
                        created_at=created_at,
                        updated_at=created_at,
                    )
                )
                inserted["payments"] += 1

        disbursements = (
            ("completed", 1_200.0, "Local mock completed disbursement", 1),
            ("pending", 3_500.0, "Local mock pending disbursement", 2),
            ("failed", 800.0, "Local mock failed disbursement", 3),
        )
        for index, (status, amount, description, days_ago) in enumerate(disbursements, 1):
            external_id = f"mock-local-disbursement-{index}"
            existing = await session.scalar(
                select(Disbursements.id).where(Disbursements.external_id == external_id)
            )
            if existing is None:
                created_at = now - timedelta(days=days_ago)
                session.add(
                    Disbursements(
                        user_id=user_id,
                        external_id=external_id,
                        amount=amount,
                        currency="PHP",
                        bank_code="MOCK_BANK",
                        account_number=f"000000000{index}",
                        account_name=f"Mock Recipient {index}",
                        description=description,
                        status=status,
                        disbursement_type="single",
                        processing_fee=25.0,
                        net_amount=amount - 25.0,
                        created_at=created_at,
                        updated_at=created_at,
                    )
                )
                inserted["disbursements"] += 1

        await session.commit()

    return inserted


async def main(apply: bool) -> None:
    if not apply:
        print("Dry run only. No records were written. Use --apply to insert local fixtures.")
        return

    require_local_target(
        settings.environment,
        settings.database_url,
        render=settings.render,
        railway_environment=settings.railway_environment,
        railway_project_id=settings.railway_project_id,
    )
    inserted = await insert_mock_data()
    print("Inserted local mock records: " + ", ".join(f"{key}={value}" for key, value in inserted.items()))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="write fixtures to an explicitly local development database",
    )
    args = parser.parse_args()
    asyncio.run(main(args.apply))
