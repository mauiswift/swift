import asyncio
from types import SimpleNamespace

import pytest

from models.admin_users import AdminUser
from services.downline_fee_allocation import DownlineFeeAllocationService


def test_vip_gold_upline_uses_super_admin_configured_fee():
    service = DownlineFeeAllocationService(db=None)

    gold_upline = AdminUser(telegram_id="gold-upline", vip_gold=True, service_fee_percent=0.4)
    non_gold_upline = AdminUser(telegram_id="normal-upline", vip_gold=False, service_fee_percent=0.0)

    assert service.get_effective_service_fee_percent(gold_upline) == 0.4
    assert service.get_effective_service_fee_percent(non_gold_upline) == 0.0


def test_gold_vip_upline_rule_is_based_on_upline_not_downline_status():
    service = DownlineFeeAllocationService(db=None)

    gold_upline = AdminUser(telegram_id="gold-upline", vip_gold=True, service_fee_percent=0.4)
    downline_user = AdminUser(telegram_id="downline", vip_gold=False)

    assert service.get_effective_service_fee_percent(gold_upline) == 0.4
    assert service.get_effective_service_fee_percent(gold_upline if downline_user.vip_gold is False else gold_upline) == 0.4


def test_individual_service_fee_creates_upline_fee():
    service = DownlineFeeAllocationService(db=None)
    upline = AdminUser(telegram_id="upline", vip_gold=False, service_fee_percent=1.25)

    assert service.get_effective_service_fee_percent(upline) == 1.25


def test_nested_referral_fees_are_added_for_payment_owner():
    class FakeResult:
        def __init__(self, relationship):
            self.relationship = relationship

        def scalars(self):
            return self

        def first(self):
            return self.relationship

    class FakeDb:
        def __init__(self):
            self.relationships = iter(
                [
                    SimpleNamespace(
                        upline_user_id="invite-owner",
                        downline_user_id="customer",
                        level=1,
                        service_fee_percent=0.7,
                    ),
                    SimpleNamespace(
                        upline_user_id="super-admin",
                        downline_user_id="invite-owner",
                        level=1,
                        service_fee_percent=0.4,
                    ),
                    None,
                ]
            )

        async def execute(self, _query):
            return FakeResult(next(self.relationships))

    service = DownlineFeeAllocationService(FakeDb())
    total_rate, commissions = asyncio.run(
        service.calculate_upline_commissions(
            downline_user_id="customer",
            base_fee_rate=0.0,
        )
    )

    assert total_rate == 0.011
    assert [item[0] for item in commissions] == ["invite-owner", "super-admin"]
    assert [item[2] for item in commissions] == pytest.approx([0.007, 0.004])


def test_upline_fees_are_capped_at_remaining_amount():
    class FakeResult:
        def __init__(self, relationship):
            self.relationship = relationship

        def scalars(self):
            return self

        def first(self):
            return self.relationship

    class FakeDb:
        def __init__(self):
            self.relationships = iter(
                [
                    SimpleNamespace(
                        upline_user_id="upline",
                        downline_user_id="merchant",
                        level=1,
                        service_fee_percent=10.0,
                    ),
                    None,
                ]
            )

        async def execute(self, _query):
            return FakeResult(next(self.relationships))

    total_rate, commissions = asyncio.run(
        DownlineFeeAllocationService(FakeDb()).calculate_upline_commissions(
            downline_user_id="merchant",
            base_fee_rate=0.99,
        )
    )

    assert total_rate == pytest.approx(1.0)
    assert [item[2] for item in commissions] == pytest.approx([0.01])


def test_zero_relationship_fee_does_not_create_fee_or_upline_earning():
    class FakeResult:
        def scalars(self):
            return self

        def first(self):
            return SimpleNamespace(
                upline_user_id="upline",
                downline_user_id="customer",
                level=1,
                service_fee_percent=0.0,
            )

    class FakeDb:
        async def execute(self, _query):
            return FakeResult()

    breakdown = asyncio.run(
        DownlineFeeAllocationService(FakeDb()).calculate_fee_breakdown(
            downline_user_id="customer",
            gross_amount=1000.0,
            base_fee_rate=0.0,
        )
    )

    assert breakdown["system_fee"] == 0.0
    assert breakdown["upline_fees"] == []
    assert breakdown["total_fee"] == 0.0
