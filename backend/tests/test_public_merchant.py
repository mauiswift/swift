from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from routers.public_merchant import (
    _get_public_merchant_config,
    _get_public_merchant_owner,
    _resolve_link_currency,
)
from routers.xend import CreatePaymentRequest, _process_xend_request


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
    db = SimpleNamespace(
        scalar=AsyncMock(),
        execute=AsyncMock(return_value=_ScalarResult(None)),
    )
    config = SimpleNamespace(user_id=None, organization_id="missing-org")

    with pytest.raises(HTTPException, match="owner not found"):
        await _get_public_merchant_owner(db, config)


@pytest.mark.asyncio
async def test_permanent_link_falls_back_to_active_organization_owner():
    owner = SimpleNamespace(telegram_id="merchant-owner", is_active=True)
    db = SimpleNamespace(
        scalar=AsyncMock(return_value=None),
        execute=AsyncMock(return_value=_ScalarResult(owner)),
    )
    config = SimpleNamespace(user_id="legacy-user", organization_id="org-42")

    result = await _get_public_merchant_owner(db, config)

    assert result is owner
    db.execute.assert_awaited_once()


def test_permanent_link_currency_is_fixed_to_configured_wallet_currency():
    assert _resolve_link_currency("KRW", "krw") == "KRW"

    with pytest.raises(HTTPException, match="different currency"):
        _resolve_link_currency("PHP", "KRW")


@pytest.mark.asyncio
async def test_xend_request_preserves_explicit_currency_over_store_default(monkeypatch):
    """A KRW payment must not be sent to the provider as the store's PHP default."""
    from routers import xend

    captured = {}

    async def fake_create_payment(*args, **kwargs):
        captured.update(kwargs)
        return {"success": True}

    monkeypatch.setattr(xend.SwiftPayService, "is_configured", lambda self: False)
    monkeypatch.setattr(xend.payment_gateway, "create_payment", fake_create_payment)

    result = await _process_xend_request(
        db=SimpleNamespace(),
        current_user=SimpleNamespace(id="merchant-1", organization_id=None),
        request=CreatePaymentRequest(amount=100, currency="KRW"),
        transaction_type="invoice",
    )

    assert result["success"] is True
    assert captured["amount"] == 100
    assert captured["currency"] == "KRW"
