# Explicitly import all models to ensure they are registered with Base.metadata
from models.auth import User, OIDCState
from models.admin_users import AdminUser
from models.api_configs import Api_configs
from models.app_settings import AppSettings
from models.audit_logs import AuditLog
from models.bank_deposit_requests import BankDepositRequest
from models.bot_logs import Bot_logs
from models.bot_settings import Bot_settings
from models.crypto_topup import CryptoTopupRequest
from models.currency_conversion import CurrencyConversion
from models.custom_roles import CustomRole
from models.customers import Customers
from models.disbursements import Disbursements
from models.exchange_rate_history import ExchangeRateHistory
from models.exchange_rate_override import ExchangeRateOverride
from models.kyb_registrations import KybRegistration
from models.kyc_verifications import KycVerification
from models.merchant_api_config import MerchantApiConfig
from models.refunds import Refunds
from models.subscriptions import Subscriptions
from models.team_invitations import TeamInvitation, AdminRole
from models.topup_requests import TopupRequest
from models.transactions import Transactions
from models.usdt_send_requests import UsdtSendRequest
from models.wallet_transactions import Wallet_transactions
from models.wallets import Wallets
