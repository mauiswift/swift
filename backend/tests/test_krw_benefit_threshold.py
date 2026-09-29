from types import SimpleNamespace

import pytest
import pytest_asyncio
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from core.config import SYSTEM_WALLET_ADMIN_TELEGRAM_ID
from routers.app_settings import (
    KrwBenefitThresholdUpdateRequest,
    set_krw_benefit_threshold_endpoint,
)
from models.admin_users import AdminUser
from models.app_settings import AppSettings
from models.crypto_topup import CryptoTopupRequest
from models.topup_requests import TopupRequest
from services.app_settings import (
    get_krw_benefit_threshold,
    set_krw_benefit_threshold,
)
from services.user_benefits import get_krw_benefits


@pytest_asyncio.fixture
async def benefits_db():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        for model in (AppSettings, AdminUser, TopupRequest, CryptoTopupRequest):
            await connection.run_sync(model.__table__.create)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    await engine.dispose()


@pytest.mark.asyncio
async def test_krw_benefit_threshold_defaults_and_persists(benefits_db):
    assert await get_krw_benefit_threshold(benefits_db) == 600

    assert await set_krw_benefit_threshold(benefits_db, 125.5) == 125.5
    assert await get_krw_benefit_threshold(benefits_db) == 125.5

    assert await set_krw_benefit_threshold(benefits_db, 0) == 0
    assert await get_krw_benefit_threshold(benefits_db) == 0


@pytest.mark.asyncio
async def test_only_system_wallet_admin_can_update_krw_threshold(benefits_db):
    request = KrwBenefitThresholdUpdateRequest(threshold_usdt=250)
    another_super_admin = SimpleNamespace(
        id="another-admin",
        permissions=SimpleNamespace(is_super_admin=True),
    )
    with pytest.raises(HTTPException) as error:
        await set_krw_benefit_threshold_endpoint(
            request,
            current_user=another_super_admin,
            db=benefits_db,
        )
    assert error.value.status_code == 403

    system_admin = SimpleNamespace(
        id=SYSTEM_WALLET_ADMIN_TELEGRAM_ID,
        permissions=SimpleNamespace(is_super_admin=True),
    )
    result = await set_krw_benefit_threshold_endpoint(
        request,
        current_user=system_admin,
        db=benefits_db,
    )
    assert result == {"threshold_usdt": 250}


def test_krw_threshold_request_rejects_boolean_values():
    with pytest.raises(ValueError):
        KrwBenefitThresholdUpdateRequest(threshold_usdt=True)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("threshold", "amount", "expected"),
    [
        (600, 599.99, False),
        (600, 600, True),
        (0, 0, False),
        (0, 0.01, True),
    ],
)
async def test_krw_benefit_eligibility_uses_configured_threshold(
    benefits_db,
    threshold,
    amount,
    expected,
):
    benefits_db.add(AdminUser(telegram_id="merchant-1", name="Merchant"))
    benefits_db.add(
        TopupRequest(
            chat_id="merchant-1",
            amount_usdt=amount,
            currency="USDT",
            status="approved",
        )
    )
    await benefits_db.commit()
    await set_krw_benefit_threshold(benefits_db, threshold)

    benefits = await get_krw_benefits(benefits_db, "merchant-1")

    assert benefits["threshold_usdt"] == threshold
    assert benefits["unlocked"] is expected
