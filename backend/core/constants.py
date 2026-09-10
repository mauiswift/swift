"""Shared constants to prevent circular imports between routers."""

# xend PH bank accounts
PAYBOT_BANK_ACCOUNTS = {
    "Netbank": {"number": "041-105-00037-6", "name": "Swift Technology Ventures Inc."},
}

# Directory for uploaded bank transfer receipts
BANK_RECEIPTS_SUBDIR = "bank-receipts"

# App settings keys
MAINTENANCE_MODE_KEY = "maintenance_mode"
USDT_PHP_RATE_KEY = "usdt_php_rate"
DEFAULT_USDT_PHP_RATE = 58.0
USDT_TRC20_ADDRESS_KEY = "usdt_trc20_address"
ENABLED_COLLECTION_CURRENCIES_KEY = "enabled_collection_currencies"
SUPPORTED_COLLECTION_CURRENCIES = ("PHP", "CNY", "KRW")
PAYMENT_CHANNELS_KEY = "payment_channels"
ADDITIONAL_COLLECTION_FEE_PERCENT_KEY = "additional_collection_fee_percent"
DEFAULT_COLLECTION_FEE_PERCENT = 0.004
DEFAULT_ADDITIONAL_COLLECTION_FEE_PERCENT = 0.0
CONVERSION_FEE_PERCENT_KEY = "conversion_fee_percent"
DEFAULT_CONVERSION_FEE_PERCENT = 1.0
PAYMENT_CHANNELS = (
    "gcash",
    "maya",
    "bank_transfer",
    "qr_code",
    "alipay",
    "wechat",
    "card",
)
PHP_CHECKOUT_INSTITUTIONS = (
    "GCASH",
    "MAYA",
    "NK",
    "UNIONBANK",
    "RCBC",
    "BPI",
    "BDO",
    "METROBANK",
    "LANDBANK",
    "PNB",
    "EASTWEST",
    "CHINABANK",
    "SECURITYBANK",
    "UBP",
    "UCPB",
    "PSBANK",
    "CIMB",
    "MAYBANK",
    "ROBINSONS",
)
DEFAULT_PAYMENT_CHANNELS = {
    "PHP": {
        "checkout": ["gcash", "maya", "bank_transfer", "qr_code"],
        "checkout_institutions": list(PHP_CHECKOUT_INSTITUTIONS),
        "withdrawal": ["bank_transfer"],
        "disbursement": ["bank_transfer"],
    },
    "CNY": {
        "checkout": ["alipay", "wechat", "card"],
        "withdrawal": [],
        "disbursement": [],
    },
    "KRW": {
        "checkout": ["bank_transfer"],
        "withdrawal": ["bank_transfer"],
        "disbursement": ["bank_transfer"],
    },
}
KRW_BANK_NAME_KEY = "krw_bank_name"
DEFAULT_KRW_BANK_NAME = "Toss Bank"
KRW_ACCOUNT_HOLDER_NAME_KEY = "krw_account_holder_name"
DEFAULT_KRW_ACCOUNT_HOLDER_NAME = "SwiftPay Ventures Inc."
