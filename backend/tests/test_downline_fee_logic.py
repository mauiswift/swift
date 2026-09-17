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
