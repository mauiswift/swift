import pytest

from services.payment_channel_availability import php_checkout_institution_is_enabled


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
