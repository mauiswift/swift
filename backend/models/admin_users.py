from core.database import Base
from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, JSON
from sqlalchemy.sql import func


class AdminUser(Base):
    __tablename__ = "admin_users"
    __table_args__ = {"extend_existing": True}

    id = Column(Integer, primary_key=True, autoincrement=True)
    telegram_id = Column(String(64), unique=True, index=True, nullable=False)
    telegram_username = Column(String(128), nullable=True)
    name = Column(String(256), nullable=True)

    # Dashboard login credentials (issued by the super admin on KYB approval)
    email = Column(String(256), unique=True, index=True, nullable=True)
    google_id = Column(String(255), unique=True, index=True, nullable=True)
    passkey_credential_id = Column(String(512), unique=True, index=True, nullable=True)
    passkey_public_key = Column(String(2048), nullable=True)
    passkey_sign_count = Column(Integer, default=0, server_default='0', nullable=False)
    passkey_failed_attempts = Column(Integer, default=0, server_default='0', nullable=False)
    passkey_transports = Column(String(128), nullable=True)
    password_hash = Column(String(256), nullable=True)
    must_change_password = Column(Boolean, default=False, server_default='false', nullable=False)
    is_active = Column(Boolean, default=True, server_default='true', nullable=False)
    is_super_admin = Column(Boolean, default=False, server_default='false', nullable=False)

    # Role name from the invitation (admin, editor, viewer, withdrawer, developer, approver)
    role = Column(String(64), nullable=True)

    # Granular permissions (least privilege by default; explicit role assignment grants access)
    can_manage_payments = Column(Boolean, default=False, server_default='false', nullable=False)
    can_manage_disbursements = Column(Boolean, default=False, server_default='false', nullable=False)
    can_view_reports = Column(Boolean, default=False, server_default='false', nullable=False)
    can_manage_wallet = Column(Boolean, default=False, server_default='false', nullable=False)
    can_manage_transactions = Column(Boolean, default=False, server_default='false', nullable=False)
    can_manage_bot = Column(Boolean, default=False, server_default='false', nullable=False)
    can_approve_topups = Column(Boolean, default=False, server_default='false', nullable=False)
    can_manage_team = Column(Boolean, default=False, server_default='false', nullable=False)

    # New 19-permission schema stored as JSON (populated when invitation is accepted)
    team_permissions = Column(JSON, nullable=True)

    # Organization scoping for non-super-admin users
    organization_id = Column(String(64), index=True, nullable=True)
    organization_name = Column(String(256), nullable=True)

    # PIN authentication (sha256 hex digest of salt:pin)
    pin_hash = Column(String(128), nullable=True)
    pin_salt = Column(String(64), nullable=True)
    pin_failed_attempts = Column(Integer, default=0, server_default='0', nullable=False)
    pin_locked_until = Column(DateTime(timezone=True), nullable=True)

    # UI Preferences
    language = Column(String(8), default='en', server_default='en', nullable=False)
    preferred_currency = Column(String(8), default='PHP', server_default='PHP', nullable=False)
    vip_gold = Column(Boolean, default=False, server_default='false', nullable=False)
    # Admin-specific commission surcharge, added to the super-admin base fee.
    service_fee_percent = Column(Float, nullable=False, default=0.0, server_default='0.0')
    payment_channels = Column(JSON, nullable=True)

    # Withdrawal fees per currency (configurable per user)
    # PHP: default 15.0
    withdrawal_fee_php = Column(Float, nullable=False, default=15.0, server_default='15.0')
    # KRW: default 1500
    withdrawal_fee_krw = Column(Float, nullable=False, default=1500.0, server_default='1500.0')
    # USDT: default 1.0
    withdrawal_fee_usdt = Column(Float, nullable=False, default=1.0, server_default='1.0')
    # CNY: default 10.0
    withdrawal_fee_cny = Column(Float, nullable=False, default=10.0, server_default='10.0')
    # USD: default 1.0
    withdrawal_fee_usd = Column(Float, nullable=False, default=1.0, server_default='1.0')

    # Security: require a password change after login until the user has successfully updated it.
    must_change_password = Column(Boolean, default=True, server_default='true', nullable=False)

    # Payment environment: true = sandbox/test, false = live
    test_mode = Column(Boolean, default=True, server_default='true', nullable=False)

    # Merchant Bank Information
    bank_name = Column(String(128), nullable=True)
    bank_account_number = Column(String(64), nullable=True)
    bank_account_name = Column(String(256), nullable=True)
    bank_address = Column(String(512), nullable=True)
    usdt_wallet_address = Column(String(128), unique=True, index=True, nullable=True)
    settlement_type = Column(String(64), nullable=True)
    settlement_currency = Column(String(8), nullable=True)
    payment_channels = Column(JSON, nullable=True)
    toss_virtual_account_status = Column(String(32), nullable=False, default="not_started", server_default="not_started")
    toss_virtual_account_application = Column(JSON, nullable=True)
    krw_benefits_unlocked = Column(Boolean, nullable=False, default=False, server_default="false")
    krw_benefits_unlocked_at = Column(DateTime(timezone=True), nullable=True)
    krw_benefits_unlock_source = Column(String(128), nullable=True)

    added_by = Column(String(64), nullable=True)   # telegram_id of who added
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
