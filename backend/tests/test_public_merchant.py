from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException

from routers.merchant_api import _get_organization_merchant_config
from routers.public_merchant import (
    _get_public_merchant_config,
    _get_public_merchant_owner,
    _resolve_link_currency,
)
from services.wallets import WalletsService
from routers.xend import CreatePaymentRequest, _process_xend_request


class _ScalarResult:
    def __init__(self, value):
        self.value = value

    def scalars(self):
        return self

    def first(self):
        return self.value

    def scalar_one_or_none(self):
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


@pytest.mark.asyncio
async def test_permanent_link_owner_fallback_does_not_select_an_org_member():
    db = SimpleNamespace(
        scalar=AsyncMock(return_value=None),
        execute=AsyncMock(return_value=_ScalarResult(None)),
    )
    config = SimpleNamespace(user_id="legacy-member", organization_id="org-42")

    with pytest.raises(HTTPException, match="owner not found"):
        await _get_public_merchant_owner(db, config)

    statement = db.execute.await_args.args[0]
    where_sql = str(statement.whereclause.compile(compile_kwargs={"literal_binds": True}))
    assert "admin_users.role = 'owner'" in where_sql
    assert "admin_users.is_super_admin" not in where_sql


def test_permanent_link_currency_is_fixed_to_configured_wallet_currency():
    assert _resolve_link_currency("KRW", "krw") == "KRW"

    with pytest.raises(HTTPException, match="different currency"):
        _resolve_link_currency("PHP", "KRW")


@pytest.mark.asyncio
async def test_organization_owned_payment_link_settles_to_org_wallet():
    """If a payment link belongs to an organization, the wallet owner is the org, not the individual merchant account."""

    class DummyDB:
        async def execute(self, *_args, **_kwargs):
            return _ScalarResult(SimpleNamespace(organization_id="acme-org", is_super_admin=False))

    service = WalletsService(DummyDB())

    owner_id, organization_id = await service._resolve_effective_wallet_owner("merchant-owner")

    assert owner_id == "org:acme-org"
    assert organization_id == "acme-org"


@pytest.mark.asyncio
async def test_org_default_merchant_config_is_preferred_for_members():
    org_default = SimpleNamespace(id=10, organization_id="acme-org", user_id=None, permanent_link_slug="acme-org-default")
    member_default = SimpleNamespace(id=11, organization_id="acme-org", user_id="member-1", permanent_link_slug="member-1-link")
    db = SimpleNamespace(execute=AsyncMock(return_value=_ScalarResult(org_default)))

    result = await _get_organization_merchant_config(db, "acme-org", "member-1")

    assert result is org_default
    assert result.user_id is None


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
