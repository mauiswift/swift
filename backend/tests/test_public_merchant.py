from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from routers.public_merchant import (
    _get_public_merchant_config,
    _get_public_merchant_owner,
    _resolve_link_currency,
)


class _ScalarResult:
    def __init__(self, value):
        self.value = value

    def scalars(self):
        return self

    def first(self):
        return self.value


@pytest.mark.asyncio
async def test_permanent_link_resolves_merchant_config_deterministically():
    config = SimpleNamespace(id=7, permanent_link_slug="store-korea")
    db = SimpleNamespace(execute=AsyncMock(return_value=_ScalarResult(config)))

    result = await _get_public_merchant_config(db, "store-korea")

    assert result is config
    db.execute.assert_awaited_once()


@pytest.mark.asyncio
async def test_permanent_link_uses_configured_user_as_wallet_owner():
    owner = SimpleNamespace(telegram_id="merchant-42", is_active=True)
    config = SimpleNamespace(user_id="merchant-42")
    db = SimpleNamespace(scalar=AsyncMock(return_value=owner))

    result = await _get_public_merchant_owner(db, config)

    assert result is owner
    db.scalar.assert_awaited_once()


@pytest.mark.asyncio
async def test_permanent_link_rejects_missing_configured_owner():
    db = SimpleNamespace(scalar=AsyncMock())
    config = SimpleNamespace(user_id=None)

    with pytest.raises(HTTPException, match="owner is not configured"):
        await _get_public_merchant_owner(db, config)


def test_permanent_link_currency_is_fixed_to_configured_wallet_currency():
    assert _resolve_link_currency("KRW", "krw") == "KRW"

    with pytest.raises(HTTPException, match="different currency"):
        _resolve_link_currency("PHP", "KRW")
