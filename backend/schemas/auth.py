from datetime import datetime
from typing import Optional

from pydantic import ConfigDict, BaseModel, Field


class UserPermissions(BaseModel):
    is_super_admin: bool = False
    # Least privilege by default. Explicit grants are set at login/token issuance.
    can_manage_payments: bool = False
    can_manage_disbursements: bool = False
    can_view_reports: bool = False
    can_manage_wallet: bool = False
    can_manage_transactions: bool = False
    can_manage_bot: bool = False
    can_approve_topups: bool = False
    can_manage_team: bool = False
    can_credit_wallet: bool = False
    can_debit_wallet: bool = False
    can_freeze_wallet: bool = False
    can_unfreeze_wallet: bool = False

    model_config = ConfigDict(from_attributes=True)


class UserResponse(BaseModel):
    id: str  # Telegram user ID
    email: str
    name: Optional[str] = None
    role: str = "user"  # user/admin
    last_login: Optional[datetime] = None
    must_change_password: bool = False
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    permissions: Optional[UserPermissions] = None

    # Settlement Information
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_address: Optional[str] = None
    usdt_wallet_address: Optional[str] = None
    settlement_type: Optional[str] = None
    settlement_currency: Optional[str] = None
    payment_channels: Optional[dict[str, list[str]]] = None
    toss_virtual_account_status: str = "not_started"
    toss_virtual_account_application: Optional[dict] = None
    krw_benefits_unlocked: bool = False
    krw_benefits_unlocked_at: Optional[datetime] = None
    krw_benefits_unlock_source: Optional[str] = None

    # Store Branding
    store_name: Optional[str] = None
    store_logo_url: Optional[str] = None
    permanent_link_slug: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PlatformTokenExchangeRequest(BaseModel):
    """Request body for exchanging Platform token for app token."""

    platform_token: str


class TelegramWidgetLoginRequest(BaseModel):
    id: int
    auth_date: int
    hash: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    username: Optional[str] = None
    photo_url: Optional[str] = None
    # Cloudflare Turnstile token produced by the frontend widget.
    # Verified server-side when CLOUDFLARE_TURNSTILE_SECRET_KEY is configured.
    cf_turnstile_token: Optional[str] = None
    device_id: Optional[str] = None

    # Keep forward-compatible Telegram fields (e.g. allows_write_to_pm)
    # so backend signature verification can include every signed key.
    model_config = ConfigDict(extra="allow")


class GoogleLoginRequest(BaseModel):
    credential: str = Field(min_length=1)
    cf_turnstile_token: Optional[str] = None


class TokenExchangeResponse(BaseModel):
    """Response body for issued application token."""

    token: str
    user: Optional[UserResponse] = None
    terminal_id: Optional[int] = None
    has_pin: bool = False


class LoginRequest(BaseModel):
    email: str
    password: str
    device_id: Optional[str] = None
    cf_turnstile_token: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    terminal_id: Optional[int] = None
    has_pin: bool = False


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_new_password: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
