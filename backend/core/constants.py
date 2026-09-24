"""Shared constants to prevent circular imports between routers."""

# xend PH bank accounts
PAYBOT_BANK_ACCOUNTS = {
    "Netbank": {"number": "041-105-00037-6", "name": "Swift Technology Ventures Inc."},
}

# Directory for uploaded bank transfer receipts
BANK_RECEIPTS_SUBDIR = "bank-receipts"

# App settings keys
MAINTENANCE_MODE_KEY = "maintenance_mode"
MAINTENANCE_REGION_KEY = "maintenance_region"
MAINTENANCE_STARTED_AT_KEY = "maintenance_started_at"
MAINTENANCE_ENDS_AT_KEY = "maintenance_ends_at"
USDT_PHP_RATE_KEY = "usdt_php_rate"
DEFAULT_USDT_PHP_RATE = 58.0
USDT_TRC20_ADDRESS_KEY = "usdt_trc20_address"
BITGO_ENABLED_KEY = "bitgo_enabled"
BITGO_ACCESS_TOKEN_KEY = "bitgo_access_token"
BITGO_BASE_URL_KEY = "bitgo_base_url"
BITGO_WALLET_ID_KEY = "bitgo_wallet_id"
BITGO_COIN_KEY = "bitgo_coin"
BITGO_USDT_CONTRACT_KEY = "bitgo_usdt_contract"
DEFAULT_BITGO_BASE_URL = "https://app.bitgo.com"
DEFAULT_BITGO_COIN = "trx"
DEFAULT_BITGO_USDT_CONTRACT = "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj"
# Legacy names remain aliases for deployments that imported these constants.
TATUM_ENABLED_KEY = BITGO_ENABLED_KEY
TATUM_API_KEY_KEY = BITGO_ACCESS_TOKEN_KEY
TATUM_BASE_URL_KEY = BITGO_BASE_URL_KEY
TATUM_TRON_XPUB_KEY = BITGO_WALLET_ID_KEY
TATUM_WEBHOOK_SECRET_KEY = BITGO_USDT_CONTRACT_KEY
ENABLED_COLLECTION_CURRENCIES_KEY = "enabled_collection_currencies"
SUPPORTED_COLLECTION_CURRENCIES = ("PHP", "CNY", "KRW", "USDT")
SUPPORTED_CURRENCIES = ("PHP", "CNY", "KRW", "USDT")
LEDGER_CURRENCIES = ("PHP", "CNY", "KRW", "USD")
# Customer and platform fee adjustments are disabled. External provider fees
# may still apply when a payment provider charges them directly.
FEES_ENABLED = False


def normalize_currency(currency: str | None, default: str = "PHP") -> str:
    """Return the internal ledger code for a supported public currency."""
    normalized = str(currency or default).strip().upper()
    return "USD" if normalized == "USDT" else normalized


def public_currency(currency: str | None, default: str = "PHP") -> str:
    """Return the public currency label for an internal ledger code."""
    normalized = normalize_currency(currency, default)
    return "USDT" if normalized == "USD" else normalized
PAYMENT_CHANNELS_KEY = "payment_channels"
ADDITIONAL_COLLECTION_FEE_PERCENT_KEY = "additional_collection_fee_percent"
COLLECTION_FEE_PERCENT_KEY = "collection_fee_percent"
VIP_GOLD_COLLECTION_FEE_PERCENT_KEY = "vip_gold_collection_fee_percent"
DEFAULT_COLLECTION_FEE_PERCENT = 0.004
DEFAULT_ADDITIONAL_COLLECTION_FEE_PERCENT = 0.0
DEFAULT_VIP_GOLD_COLLECTION_FEE_PERCENT = DEFAULT_COLLECTION_FEE_PERCENT * 100
CONVERSION_FEE_PERCENT_KEY = "conversion_fee_percent"
WITHDRAWAL_FEES_KEY = "withdrawal_fees"
DEFAULT_CONVERSION_FEE_PERCENT = 1.0
WALLET_SETTINGS_KEY = "wallet_limits"
CHECKOUT_DESIGN_KEY = "checkout_design"
DEPOSIT_RULES_KEY = "deposit_rules"
DEPOSIT_ACCOUNTS_KEY = "deposit_accounts"
DEFAULT_DEPOSIT_ACCOUNTS = [
    {
        "value": "Netbank",
        "label": "Netbank",
        "account_number": "041-105-00037-6",
        "account_name": "Swift Technology Ventures Inc.",
        "currency": "PHP",
    },
]
WALLET_SETTING_CURRENCIES = ("PHP", "CNY", "KRW", "USDT")
DEFAULT_WALLET_LIMITS = {
    "max_incoming": 0.0,
    "minimum_balance": 0.0,
    "minimum_deposit": 0.0,
    "max_withdrawal_daily": 0.0,
    "max_withdrawal_monthly": 0.0,
}
DEFAULT_DEPOSIT_RULES = {
    "bank_deposit_currencies": ["PHP", "KRW"],
    "topup_currencies": ["PHP", "USDT", "KRW"],
    "receipt_max_size_mb": 10.0,
    "first_usdt_topup_amount": 600.0,
    "first_usdt_topup_rule_enabled": False,
}
PAYMENT_CHANNELS = (
    "gcash",
    "maya",
    "bank_transfer",
    "virtual_account",
    "qr_code",
    "alipay",
    "wechat",
    "unionpay",
    "card",
    "kakaopay",
    "naverpay",
    "tosspay",
    "payco",
)
PHP_CHECKOUT_INSTITUTIONS = (
    "GCASH",
    "MAYA",
    "ALIPAY",
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
        "checkout": ["gcash", "maya", "bank_transfer", "virtual_account", "qr_code", "card"],
        "checkout_institutions": list(PHP_CHECKOUT_INSTITUTIONS),
        "withdrawal": ["bank_transfer"],
        "disbursement": ["bank_transfer"],
    },
    "CNY": {
        "checkout": ["alipay", "wechat", "unionpay", "card"],
        "withdrawal": [],
        "disbursement": [],
    },
    "KRW": {
        "checkout": ["bank_transfer", "virtual_account"],
        "withdrawal": ["bank_transfer"],
        "disbursement": ["bank_transfer"],
    },
    "USDT": {
        "checkout": [],
        "withdrawal": [],
        "disbursement": [],
    },
}
KRW_BANK_NAME_KEY = "krw_bank_name"
DEFAULT_KRW_BANK_NAME = ""
KRW_ACCOUNT_HOLDER_NAME_KEY = "krw_account_holder_name"
DEFAULT_KRW_ACCOUNT_HOLDER_NAME = ""
