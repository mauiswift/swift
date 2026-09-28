import pytest

from services.payment_channel_availability import (
    institution_supports_amount,
    php_checkout_institution_is_enabled,
)


@pytest.mark.parametrize(
    ("institution_code", "checkout_channels", "enabled_institutions", "expected"),
    [
        ("GCASH", ["gcash"], ["GCASH"], True),
        ("GCASH", [], ["GCASH"], False),
        ("MAYA", ["maya"], ["MAYA"], True),
        ("ALIPAY", ["alipay"], ["ALIPAY"], True),
        ("ALIPAY", ["alipay"], [], False),
        ("ALIPAY", [], ["ALIPAY"], False),
        ("BDO", ["bank_transfer"], ["BDO"], True),
        ("BNORPHMXXX", ["bank_transfer"], ["BDO"], True),
        ("BDO", [], ["BDO"], False),
        ("QRPH", ["qr_code"], [], True),
        ("QRPH", [], [], False),
        ("NETBANK", ["bank_transfer"], ["NETBANK"], False),
        ("NETBANK", [], [], False),
        ("UNKNOWN", ["card"], ["UNKNOWN"], False),
        ("GCASH", ["gcash"], None, False),
    ],
)
def test_php_checkout_institution_requires_enabled_channel_and_institution(
    institution_code,
    checkout_channels,
    enabled_institutions,
    expected,
):
    channels = {
        "PHP": {
            "checkout": checkout_channels,
            "withdrawal": [],
            "disbursement": [],
            "checkout_institutions": enabled_institutions,
        },
    }

    assert php_checkout_institution_is_enabled(institution_code, channels) is expected


@pytest.mark.parametrize(
    ("institution", "amount", "expected"),
    [
        ({"minAmount": 100, "maxAmount": 50000}, 100, True),
        ({"minAmount": 100, "maxAmount": 50000}, 50000, True),
        ({"minAmount": 100, "maxAmount": 50000}, 99.99, False),
        ({"minAmount": 100, "maxAmount": 50000}, 50000.01, False),
        ({}, 100000, True),
        ({"maxAmount": "invalid"}, 100, False),
        ({"maxAmount": "nan"}, 100, False),
        ({"maxAmount": 50000}, float("inf"), False),
    ],
)
def test_institution_supports_catalog_amount_range(institution, amount, expected):
    assert institution_supports_amount(institution, amount) is expected
