import importlib.util
from pathlib import Path

import pytest
from sqlalchemy import create_engine, text


MIGRATION_PATH = (
    Path(__file__).parents[1]
    / "alembic"
    / "versions"
    / "20260929_consolidate_member_wallets.py"
)
SPEC = importlib.util.spec_from_file_location("wallet_consolidation_migration", MIGRATION_PATH)
assert SPEC and SPEC.loader
MIGRATION = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MIGRATION)


@pytest.fixture
def migration_engine():
    engine = create_engine("sqlite:///:memory:")
    with engine.begin() as connection:
        connection.exec_driver_sql("PRAGMA foreign_keys = ON")
        connection.exec_driver_sql(
            "CREATE TABLE admin_users (telegram_id TEXT PRIMARY KEY, organization_id TEXT)"
        )
        connection.exec_driver_sql(
            """
            CREATE TABLE wallets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                organization_id TEXT,
                currency TEXT,
                balance FLOAT NOT NULL DEFAULT 0,
                available_balance FLOAT NOT NULL DEFAULT 0,
                pending_balance FLOAT NOT NULL DEFAULT 0,
                reserved_balance FLOAT NOT NULL DEFAULT 0,
                total_credits FLOAT NOT NULL DEFAULT 0,
                total_debits FLOAT NOT NULL DEFAULT 0,
                transaction_count INTEGER NOT NULL DEFAULT 0,
                conversion_count INTEGER NOT NULL DEFAULT 0,
                is_frozen BOOLEAN NOT NULL DEFAULT 0,
                created_at DATETIME,
                updated_at DATETIME
            )
            """
        )
        connection.exec_driver_sql(
            """
            CREATE TABLE wallet_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                wallet_id INTEGER NOT NULL REFERENCES wallets(id),
                transaction_type TEXT NOT NULL,
                amount FLOAT NOT NULL,
                balance_before FLOAT,
                balance_after FLOAT,
                note TEXT,
                status TEXT,
                reference_id TEXT,
                created_at DATETIME
            )
            """
        )
        connection.exec_driver_sql(
            """
            CREATE TABLE wallet_reservations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_id INTEGER NOT NULL REFERENCES wallets(id),
                user_id TEXT NOT NULL,
                organization_id TEXT,
                currency TEXT NOT NULL,
                amount FLOAT NOT NULL,
                reference_id TEXT NOT NULL,
                status TEXT NOT NULL
            )
            """
        )
        connection.exec_driver_sql("CREATE TABLE currency_conversion (id INTEGER PRIMARY KEY, wallet_id INTEGER NOT NULL)")
        connection.exec_driver_sql("CREATE TABLE usdt_send_requests (id INTEGER PRIMARY KEY, wallet_id INTEGER)")
        connection.exec_driver_sql("CREATE TABLE crypto_topup_requests (id INTEGER PRIMARY KEY, wallet_id INTEGER)")
    yield engine
    engine.dispose()


def _wallet_id(connection, user_id: str | None = None, organization_id: str | None = None, currency: str = "PHP"):
    if organization_id:
        return connection.execute(
            text("SELECT id FROM wallets WHERE organization_id = :organization_id AND currency = :currency"),
            {"organization_id": organization_id, "currency": currency},
        ).scalar_one()
    return connection.execute(
        text("SELECT id FROM wallets WHERE user_id = :user_id AND organization_id IS NULL AND currency = :currency"),
        {"user_id": user_id, "currency": currency},
    ).scalar_one()


def test_consolidates_member_wallet_balances_and_deletes_personal_ledger(migration_engine):
    with migration_engine.begin() as connection:
        connection.execute(
            text("INSERT INTO admin_users (telegram_id, organization_id) VALUES (:user, :org)"),
            [{"user": "merchant-a", "org": "org-a"}, {"user": "merchant-b", "org": "org-a"}],
        )
        connection.exec_driver_sql(
            """
            INSERT INTO wallets
                (id, user_id, organization_id, currency, balance, available_balance,
                 pending_balance, reserved_balance, total_credits, total_debits, transaction_count)
            VALUES
                (1, 'org:org-a', 'org-a', 'PHP', 100, 90, 10, 0, 100, 0, 1),
                (2, 'merchant-a', NULL, 'PHP', 25, 20, 5, 2, 25, 0, 1),
                (3, 'tg-merchant-b', NULL, 'PHP', 40, 35, 5, 0, 40, 0, 1),
                (4, 'merchant-a', NULL, 'USDT', 50, 50, 0, 0, 50, 0, 1),
                (5, 'unassigned-user', NULL, 'PHP', 75, 75, 0, 0, 75, 0, 1)
            """
        )
        connection.exec_driver_sql(
            """
            INSERT INTO wallet_transactions (user_id, wallet_id, transaction_type, amount, status, reference_id)
            VALUES
                ('org:org-a', 1, 'receive', 100, 'completed', 'org-existing'),
                ('merchant-a', 2, 'receive', 25, 'completed', 'personal-a'),
                ('tg-merchant-b', 3, 'receive', 40, 'completed', 'personal-b'),
                ('merchant-a', 4, 'receive', 50, 'completed', 'personal-usdt'),
                ('unassigned-user', 5, 'receive', 75, 'completed', 'unassigned')
            """
        )
        connection.exec_driver_sql(
            """
            INSERT INTO wallet_reservations
                (id, wallet_id, user_id, organization_id, currency, amount, reference_id, status)
            VALUES (1, 2, 'merchant-a', NULL, 'PHP', 2, 'pending-1', 'pending')
            """
        )
        connection.exec_driver_sql("INSERT INTO currency_conversion (id, wallet_id) VALUES (1, 4)")
        connection.exec_driver_sql("INSERT INTO usdt_send_requests (id, wallet_id) VALUES (1, 4)")
        connection.exec_driver_sql("INSERT INTO crypto_topup_requests (id, wallet_id) VALUES (1, 4)")

        moved = MIGRATION.consolidate_member_wallets(connection)

        assert moved == 3
        php_wallet_id = _wallet_id(connection, organization_id="org-a")
        usdt_wallet_id = _wallet_id(connection, organization_id="org-a", currency="USD")
        php_balance = connection.execute(
            text(
                "SELECT balance, available_balance, pending_balance, reserved_balance "
                "FROM wallets WHERE id = :wallet_id"
            ),
            {"wallet_id": php_wallet_id},
        ).one()
        assert tuple(php_balance) == (165, 145, 20, 2)
        assert connection.execute(
            text("SELECT balance FROM wallets WHERE id = :wallet_id"),
            {"wallet_id": usdt_wallet_id},
        ).scalar_one() == 50

        assert connection.execute(
            text("SELECT COUNT(*) FROM wallets WHERE id IN (2, 3, 4)")
        ).scalar_one() == 0
        assert connection.execute(
            text("SELECT COUNT(*) FROM wallet_transactions WHERE wallet_id IN (2, 3, 4)")
        ).scalar_one() == 0
        assert connection.execute(
            text("SELECT COUNT(*) FROM wallet_transactions WHERE user_id = 'org:org-a'")
        ).scalar_one() == 3
        consolidated_entries = connection.execute(
            text(
                "SELECT amount, balance_before, balance_after FROM wallet_transactions "
                "WHERE transaction_type = 'wallet_migration' ORDER BY amount"
            )
        ).all()
        assert [tuple(entry) for entry in consolidated_entries] == [(50, 0, 50), (65, 100, 165)]
        assert connection.execute(
            text("SELECT COUNT(*) FROM wallets WHERE user_id = 'unassigned-user'")
        ).scalar_one() == 1
        assert connection.execute(
            text("SELECT COUNT(*) FROM wallet_transactions WHERE reference_id = 'unassigned'")
        ).scalar_one() == 1
        assert connection.execute(
            text("SELECT wallet_id, organization_id FROM wallet_reservations WHERE id = 1")
        ).one() == (php_wallet_id, "org-a")
        for table_name in ("currency_conversion", "usdt_send_requests", "crypto_topup_requests"):
            assert connection.execute(
                text(f"SELECT wallet_id FROM {table_name} WHERE id = 1")
            ).scalar_one() == usdt_wallet_id

        assert MIGRATION.consolidate_member_wallets(connection) == 0
