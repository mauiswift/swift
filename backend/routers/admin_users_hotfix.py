"""
HOTFIX: Emergency patch for crashing admin pages
This resolves the AttributeError in AdminUserUpdate model
"""

from typing import Optional
from pydantic import BaseModel


class AdminUserUpdateHotfix(BaseModel):
    """Fixed AdminUserUpdate with proper optional handling"""
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    can_manage_payments: Optional[bool] = None
    can_manage_disbursements: Optional[bool] = None
    can_view_reports: Optional[bool] = None
    can_manage_wallet: Optional[bool] = None
    can_manage_transactions: Optional[bool] = None
    can_manage_bot: Optional[bool] = None
    can_approve_topups: Optional[bool] = None
    can_manage_team: Optional[bool] = None
    service_fee_percent: Optional[float] = None  # CRITICAL FIX: Made optional
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_address: Optional[str] = None
    usdt_wallet_address: Optional[str] = None
    settlement_type: Optional[str] = None
    settlement_currency: Optional[str] = None
    language: Optional[str] = None
    preferred_currency: Optional[str] = None
    test_mode: Optional[bool] = None

    class Config:
        from_attributes = True
