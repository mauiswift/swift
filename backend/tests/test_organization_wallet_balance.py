import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from models.admin_users import AdminUser
from models.wallets import Wallets
from models.wallet_transactions import Wallet_transactions
from models.wallet_reservations import WalletReservation
from routers.wallet import get_organization_balance
from schemas.auth import UserResponse
from services.wallets import WalletsService


@pytest_asyncio.fixture
async def wallet_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(AdminUser.__table__.create)
        await connection.run_sync(Wallets.__table__.create)
        await connection.run_sync(Wallet_transactions.__table__.create)
        await connection.run_sync(WalletReservation.__table__.create)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("user_id", "role", "is_super_admin", "expected_wallet_user_id"),
    [
        ("merchant-owner", "owner", False, "merchant-owner"),
        ("platform-admin", "admin", True, "org:swiftpay-ph"),
        ("invite-member", "manager", False, "merchant-owner"),
    ],
)
async def test_organization_balance_uses_effective_wallet(
    wallet_db,
    user_id,
    role,
    is_super_admin,
    expected_wallet_user_id,
):
    wallet_db.add(
        AdminUser(
            telegram_id="merchant-owner" if user_id == "invite-member" else user_id,
            role="owner" if user_id == "invite-member" else role,
            is_super_admin=False if user_id == "invite-member" else is_super_admin,
            organization_id="swiftpay-ph",
            organization_name="SwiftPay Philippines",
        )
    )
    if user_id == "invite-member":
        wallet_db.add(
            AdminUser(
                telegram_id=user_id,
                role=role,
                is_super_admin=is_super_admin,
                organization_id="swiftpay-ph",
                organization_name="SwiftPay Philippines",
            )
        )
    wallet_db.add(
        Wallets(
            user_id=expected_wallet_user_id,
            organization_id="swiftpay-ph",
            currency="PHP",
            balance=1250.50,
            available_balance=1100.25,
            pending_balance=150.25,
        )
    )
    await wallet_db.flush()
    seeded_wallet = await wallet_db.scalar(
        select(Wallets).where(
            Wallets.user_id == expected_wallet_user_id,
            Wallets.currency == "PHP",
        )
    )
    assert seeded_wallet is not None
    assert seeded_wallet.balance == 1250.50

    result = await get_organization_balance(
        currency="PHP",
        current_user=UserResponse(
            id=user_id,
            email=f"{user_id}@example.com",
            organization_id="swiftpay-ph",
            organization_name="SwiftPay Philippines",
        ),
        db=wallet_db,
    )

    assert result["organization_id"] == "swiftpay-ph"
    assert result["organization_name"] == "SwiftPay Philippines"
    assert result["wallet_id"] == seeded_wallet.id
    assert result["balance"] == 1250.50
    assert result["available_balance"] == 1100.25
    assert result["pending_balance"] == 150.25


@pytest.mark.asyncio
async def test_organization_usdt_balance_uses_shared_wallet_for_super_admin(wallet_db):
    wallet_db.add(
        AdminUser(
            telegram_id="platform-admin",
            role="admin",
            is_super_admin=True,
            organization_id="swiftpay-ph",
            organization_name="SwiftPay Philippines",
        )
    )
    wallet_db.add(
        Wallets(
            user_id="org:swiftpay-ph",
            organization_id="swiftpay-ph",
            currency="USD",
            balance=300.0,
            available_balance=275.0,
            pending_balance=25.0,
        )
    )
    await wallet_db.flush()
    seeded_wallet = await wallet_db.scalar(
        select(Wallets).where(
            Wallets.organization_id == "swiftpay-ph",
            Wallets.currency == "USD",
        )
    )
    assert seeded_wallet is not None

    result = await get_organization_balance(
        currency="USDT",
        current_user=UserResponse(
            id="platform-admin",
            email="platform-admin@example.com",
            organization_id="swiftpay-ph",
            organization_name="SwiftPay Philippines",
        ),
        db=wallet_db,
    )

    assert result["organization_id"] == "swiftpay-ph"
    assert result["wallet_id"] == seeded_wallet.id
    assert result["currency"] == "USDT"
    assert result["balance"] == 300.0
    assert result["available_balance"] == 275.0
    assert result["pending_balance"] == 25.0

    wallet_for_admin = await WalletsService(wallet_db).get_or_create_wallet(
        "platform-admin",
        "USDT",
    )
    assert wallet_for_admin.id == seeded_wallet.id


@pytest.mark.asyncio
async def test_usdt_wallets_are_isolated_by_organization(wallet_db):
    wallet_db.add_all(
        [
            AdminUser(
                telegram_id="admin-a",
                role="admin",
                is_super_admin=True,
                organization_id="business-a",
            ),
            AdminUser(
                telegram_id="admin-b",
                role="admin",
                is_super_admin=True,
                organization_id="business-b",
            ),
            Wallets(
                user_id="org:business-a",
                organization_id="business-a",
                currency="USD",
                balance=100,
            ),
            Wallets(
                user_id="org:business-b",
                organization_id="business-b",
                currency="USD",
                balance=250,
            ),
        ]
    )
    await wallet_db.flush()

    service = WalletsService(wallet_db)
    wallet_a = await service.get_or_create_wallet("admin-a", "USDT")
    wallet_b = await service.get_or_create_wallet("admin-b", "USDT")

    assert wallet_a.organization_id == "business-a"
    assert wallet_a.balance == 100
    assert wallet_b.organization_id == "business-b"
    assert wallet_b.balance == 250
    assert wallet_a.id != wallet_b.id


@pytest.mark.asyncio
async def test_organization_member_can_spend_direct_owners_wallet(wallet_db):
    wallet_db.add_all(
        [
            AdminUser(
                telegram_id="merchant-owner",
                role="owner",
                organization_id="swiftpay-ph",
                is_super_admin=True,
            ),
            AdminUser(
                telegram_id="invite-manager",
                role="manager",
                organization_id="swiftpay-ph",
                is_super_admin=False,
            ),
            Wallets(
                user_id="merchant-owner",
                organization_id="swiftpay-ph",
                currency="PHP",
                balance=1250.50,
                available_balance=1100.25,
                pending_balance=150.25,
            ),
        ]
    )
    await wallet_db.flush()

    wallet = await WalletsService(wallet_db).debit_wallet(
        user_id="invite-manager",
        amount=100,
        currency="PHP",
        transaction_type="withdraw",
        reference_id="org-member-withdrawal",
    )

    assert wallet.organization_id == "swiftpay-ph"
    assert wallet.balance == 1150.50
    assert wallet.available_balance == 1000.25


@pytest.mark.asyncio
async def test_organization_member_cannot_resolve_another_organizations_wallet(wallet_db):
    wallet_db.add_all(
        [
            AdminUser(
                telegram_id="owner-a",
                role="owner",
                organization_id="business-a",
                is_super_admin=False,
            ),
            AdminUser(
                telegram_id="member-b",
                role="manager",
                organization_id="business-b",
                is_super_admin=False,
            ),
            Wallets(user_id="owner-a", organization_id="business-a", currency="PHP", balance=500),
        ]
    )
    await wallet_db.flush()

    member_wallet = await WalletsService(wallet_db).get_or_create_wallet("member-b", "PHP")

    assert member_wallet.organization_id == "business-b"
    assert member_wallet.balance == 0


@pytest.mark.asyncio
async def test_php_reservation_consumes_once_on_shared_organization_wallet(wallet_db):
    wallet_db.add(
        AdminUser(
            telegram_id="member-a",
            role="manager",
            organization_id="business-a",
            is_super_admin=False,
        )
    )
    wallet_db.add(
        Wallets(
            user_id="org:business-a",
            organization_id="business-a",
            currency="PHP",
            balance=500,
            available_balance=500,
            reserved_balance=0,
        )
    )
    await wallet_db.flush()

    service = WalletsService(wallet_db)
    reservation = await service.reserve_wallet(
        user_id="member-a",
        amount=200,
        currency="PHP",
        reference_id="usdt-trade-test",
    )
    wallet = await service.get_or_create_wallet("member-a", "PHP")
    assert reservation.status == "pending"
    assert wallet.balance == 500
    assert wallet.available_balance == 300
    assert wallet.reserved_balance == 200

    await service.consume_wallet_reservation(
        reference_id="usdt-trade-test",
        transaction_type="usdt_purchase",
    )
    await wallet_db.commit()
    await wallet_db.refresh(wallet)
    assert wallet.balance == 300
    assert wallet.available_balance == 300
    assert wallet.reserved_balance == 0

    ledger = await wallet_db.scalar(
        select(Wallet_transactions).where(
            Wallet_transactions.reference_id == "usdt-trade-test"
        )
    )
    assert ledger is not None
    assert ledger.amount == -200
