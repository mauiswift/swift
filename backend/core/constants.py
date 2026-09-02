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
KRW_ACCOUNT_HOLDER_NAME_KEY = "krw_account_holder_name"
DEFAULT_KRW_ACCOUNT_HOLDER_NAME = "SWIFTPAY PH"
