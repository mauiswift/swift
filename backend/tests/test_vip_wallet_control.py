import pytest
from fastapi import HTTPException
from unittest.mock import AsyncMock

from routers.admin_wallets import _reject_vip_wallet_control


@pytest.mark.asyncio
async def test_vip_wallet_freeze_controls_are_rejected():
    db = AsyncMock()
    db.scalar.return_value = type("Admin", (), {"vip_gold": True})()

    with pytest.raises(HTTPException) as error:
        await _reject_vip_wallet_control(db, "vip-user")

    assert error.value.status_code == 400


@pytest.mark.asyncio
async def test_non_vip_wallet_controls_remain_available():
    db = AsyncMock()
    db.scalar.return_value = type("Admin", (), {"vip_gold": False})()

    await _reject_vip_wallet_control(db, "standard-user")
