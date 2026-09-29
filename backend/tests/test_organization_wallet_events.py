import pytest

from routers import events as events_router
from schemas.auth import UserPermissions, UserResponse


@pytest.mark.asyncio
async def test_recent_events_include_same_organization_wallet_credits(monkeypatch):
    wallet_events = [
        {
            "event_type": "wallet_update",
            "user_id": "org-owner",
            "organization_id": "org-a",
            "wallet_id": 10,
            "balance": 250.0,
        },
        {
            "event_type": "wallet_update",
            "user_id": "other-owner",
            "organization_id": "org-b",
            "wallet_id": 11,
            "balance": 900.0,
        },
    ]
    monkeypatch.setattr(
        events_router.payment_event_bus,
        "get_recent_events",
        lambda _limit: wallet_events,
    )
    user = UserResponse(
        id="org-member",
        email="member@example.test",
        organization_id="org-a",
        permissions=UserPermissions(can_manage_wallet=True),
    )

    response = await events_router.get_recent_events(0, user)

    assert response["events"] == [wallet_events[0]]


@pytest.mark.asyncio
async def test_recent_events_do_not_share_organization_wallet_credits_with_other_orgs(monkeypatch):
    wallet_event = {
        "event_type": "wallet_update",
        "user_id": "org-owner",
        "organization_id": "org-a",
        "wallet_id": 10,
        "balance": 250.0,
    }
    monkeypatch.setattr(
        events_router.payment_event_bus,
        "get_recent_events",
        lambda _limit: [wallet_event],
    )
    user = UserResponse(
        id="org-member",
        email="member@example.test",
        organization_id="org-b",
        permissions=UserPermissions(can_manage_wallet=True),
    )

    response = await events_router.get_recent_events(0, user)

    assert response["events"] == []
