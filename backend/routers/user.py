from datetime import datetime, timezone
import logging
from typing import List, Optional

from core.database import get_db
from dependencies.auth import get_current_user
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from models.auth import User
from models.admin_users import AdminUser
from models.disbursements import Disbursements
from models.transactions import Transactions
from models.wallet_transactions import Wallet_transactions
from models.wallets import Wallets
from core.constants import PAYMENT_CHANNELS, SUPPORTED_COLLECTION_CURRENCIES, DEFAULT_PAYMENT_CHANNELS
from pydantic import BaseModel, ConfigDict, Field
from routers.admin_users import _ensure_unique_usdt_wallet_address, _normalize_usdt_wallet_address
from schemas.auth import UserResponse
from services.user import UserService
from services.user_benefits import KRW_BENEFIT_THRESHOLD_USDT, get_krw_benefits
from services.toss_virtual_accounts import create_toss_virtual_account
from services.email_service import EmailService
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from utils.datetime import serialize_utc_datetime

router = APIRouter(prefix="/api/v1/users", tags=["users"])
admin_router = APIRouter(prefix="/api/v1/admin", tags=["admin-toss-approvals"])
logger = logging.getLogger(__name__)


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None


@router.get("/profile", response_model=UserResponse)
async def get_profile(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    profile = await UserService.get_user_profile(db, current_user.id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found")
    return profile


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UpdateProfileRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user profile"""
    profile = await UserService.update_user_profile(db, current_user.id, profile_data.name)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User profile not found")
    return profile


# ── User Management (super admin only) ───────────────────────────────────────


class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserRoleUpdate(BaseModel):
    role: str  # "user" | "admin"


def _require_super_admin(current_user: UserResponse):
    perms = current_user.permissions
    if not perms or not perms.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required.",
        )


@router.get("", response_model=List[UserOut])
async def list_users(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all registered users. Super admin only."""
    _require_super_admin(current_user)
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.patch("/{user_id}/role", response_model=UserOut)
async def update_user_role(
    user_id: str,
    data: UserRoleUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's role. Super admin only."""
    _require_super_admin(current_user)

    if data.role not in ("user", "admin", "co_admin", "agent", "super_admin"):
        raise HTTPException(status_code=400, detail="Role must be 'user', 'admin', 'co_admin', 'agent', or 'super_admin'.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.role = data.role
    await db.commit()
    await db.refresh(user)
    return user


def _serialize_datetime(value: Optional[datetime]) -> Optional[str]:
    return serialize_utc_datetime(value)


@router.get("/{user_id}/activity")
async def get_user_activity(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the complete operational view of one user for super admins."""
    _require_super_admin(current_user)

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    wallets_result = await db.execute(
        select(Wallets)
        .where(or_(Wallets.user_id == user_id, Wallets.user_id == f"tg-{user_id}"))
        .order_by(Wallets.currency)
    )
    wallet_rows = wallets_result.scalars().all()
    wallet_currency_by_id = {wallet.id: wallet.currency for wallet in wallet_rows}

    wallet_transactions_result = await db.execute(
        select(Wallet_transactions)
        .where(Wallet_transactions.user_id == user_id)
        .order_by(Wallet_transactions.id.desc())
        .limit(500)
    )
    wallet_transactions = wallet_transactions_result.scalars().all()

    transactions_result = await db.execute(
        select(Transactions)
        .where(Transactions.user_id == user_id)
        .order_by(Transactions.id.desc())
        .limit(500)
    )
    transactions = transactions_result.scalars().all()

    disbursements_result = await db.execute(
        select(Disbursements)
        .where(Disbursements.user_id == user_id)
        .order_by(Disbursements.id.desc())
        .limit(500)
    )
    disbursements = disbursements_result.scalars().all()

    activity = [
        {
            "id": item.id,
            "kind": "wallet",
            "type": item.transaction_type,
            "amount": float(item.amount or 0),
            "currency": wallet_currency_by_id.get(item.wallet_id),
            "status": item.status,
            "description": item.note,
            "reference_id": item.reference_id,
            "created_at": _serialize_datetime(item.created_at),
        }
        for item in wallet_transactions
    ]
    activity.extend({
        "id": item.id,
        "kind": "transaction",
        "type": item.transaction_type,
        "amount": float(item.amount or 0),
        "currency": item.currency,
        "status": item.status,
        "description": item.description or item.title,
        "reference_id": item.external_id or item.xendit_id,
        "created_at": _serialize_datetime(item.created_at),
    } for item in transactions)
    activity.extend({
        "id": item.id,
        "kind": "disbursement",
        "type": "disbursement",
        "amount": float(item.amount or 0),
        "currency": item.currency,
        "status": item.status,
        "description": item.description,
        "reference_id": item.external_id,
        "created_at": _serialize_datetime(item.created_at),
    } for item in disbursements)
    activity.sort(key=lambda item: item["created_at"] or "", reverse=True)

    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "created_at": _serialize_datetime(user.created_at),
            "last_login": _serialize_datetime(user.last_login),
        },
        "wallets": [
            {
                "id": wallet.id,
                "currency": wallet.currency,
                "balance": float(wallet.balance or 0),
                "available_balance": float(wallet.available_balance or 0),
                "pending_balance": float(wallet.pending_balance or 0),
                "is_frozen": bool(wallet.is_frozen),
            }
            for wallet in wallet_rows
        ],
        "transactions": [
            {
                "id": item.id,
                "type": item.transaction_type,
                "amount": float(item.amount or 0),
                "currency": item.currency,
                "status": item.status,
                "description": item.description or item.title,
                "reference_id": item.external_id or item.xendit_id,
                "created_at": _serialize_datetime(item.created_at),
            }
            for item in transactions
        ],
        "disbursements": [
            {
                "id": item.id,
                "amount": float(item.amount or 0),
                "currency": item.currency,
                "status": item.status,
                "processing_fee": float(item.processing_fee or 0),
                "reference_id": item.external_id,
                "created_at": _serialize_datetime(item.created_at),
            }
            for item in disbursements
        ],
        "activity": activity,
    }


class SettlementUpdateRequest(BaseModel):
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    bank_account_name: Optional[str] = None
    bank_address: Optional[str] = None
    usdt_wallet_address: Optional[str] = None
    settlement_type: Optional[str] = None
    settlement_currency: Optional[str] = None
    payment_channels: Optional[dict[str, list[str]]] = None


def _normalize_settlement_payload(payload: dict[str, object]) -> dict[str, object]:
    """Normalize settlement values before they are persisted."""
    normalized = dict(payload)
    for field in (
        "bank_name",
        "bank_account_number",
        "bank_account_name",
        "bank_address",
        "usdt_wallet_address",
        "settlement_type",
    ):
        if field in normalized and isinstance(normalized[field], str):
            normalized[field] = normalized[field].strip() or None
    if "settlement_currency" in normalized and isinstance(normalized["settlement_currency"], str):
        currency = normalized["settlement_currency"].strip().upper()
        if currency not in {"PHP", "KRW", "USDT", "CNY"}:
            raise HTTPException(status_code=400, detail="Unsupported settlement currency.")
        normalized["settlement_currency"] = currency
    if normalized.get("bank_account_number") and not normalized.get("bank_name"):
        raise HTTPException(status_code=400, detail="Bank name is required with an account number.")
    if normalized.get("bank_account_name") and not normalized.get("bank_account_number"):
        raise HTTPException(status_code=400, detail="Account number is required with an account holder name.")
    return normalized


class PaymentChannelsUpdateRequest(BaseModel):
    channels: dict[str, list[str]]


class TossVirtualAccountApplicationRequest(BaseModel):
    legal_name: str = Field(min_length=2, max_length=256)
    country: str = Field(min_length=2, max_length=128)
    business_type: str = Field(min_length=2, max_length=64)
    monthly_volume: str = Field(min_length=2, max_length=64)
    currencies: list[str] = Field(min_length=1, max_length=1)
    purpose: str = Field(min_length=5, max_length=512)
    contact_email: str = Field(min_length=3, max_length=256)
    signature_data: str = Field(min_length=32, max_length=2_000_000)


class TossVirtualAccountReviewRequest(BaseModel):
    note: Optional[str] = None


class TossVirtualAccountControlRequest(BaseModel):
    bank_name: str = Field(min_length=2, max_length=128)
    account_number: str = Field(min_length=6, max_length=32)
    account_holder_name: str = Field(min_length=2, max_length=256)
    status: str = Field(pattern="^(active|suspended)$")


def _require_toss_reviewer(current_user: UserResponse) -> None:
    if (
        not current_user.permissions
        or not current_user.permissions.is_super_admin
        or not current_user.permissions.can_manage_wallet
    ):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin approval required.")


def _queue_toss_email(email: Optional[str], name: Optional[str], event: str, account: Optional[dict] = None, note: Optional[str] = None) -> None:
    if not email:
        return
    try:
        EmailService.send_toss_account_notification(email, name, event, account, note)
    except Exception:
        logger.exception("Failed to send TOSS account %s email to %s", event, email)


def _serialize_toss_application(user: AdminUser) -> dict:
    application = user.toss_virtual_account_application or {}
    return {
        "user_id": str(user.telegram_id),
        "name": user.name,
        "email": user.email,
        "telegram_username": user.telegram_username,
        "status": user.toss_virtual_account_status or "not_started",
        "application": application,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
    }


@admin_router.get("/toss-virtual-accounts")
async def list_toss_virtual_account_applications(
    status_filter: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_toss_reviewer(current_user)
    query = select(AdminUser).where(AdminUser.toss_virtual_account_application.is_not(None))
    if status_filter:
        query = query.where(AdminUser.toss_virtual_account_status == status_filter)
    result = await db.execute(query.order_by(AdminUser.updated_at.desc(), AdminUser.id.desc()))
    return {"items": [_serialize_toss_application(user) for user in result.scalars().all()]}


@admin_router.post("/toss-virtual-accounts/{user_id}/approve")
async def approve_toss_virtual_account_application(
    user_id: str,
    background_tasks: BackgroundTasks,
    body: TossVirtualAccountReviewRequest = TossVirtualAccountReviewRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_toss_reviewer(current_user)
    user = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(user_id)))
    if not user or not user.toss_virtual_account_application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TOSS account application not found.")
    if user.toss_virtual_account_status != "pending_review":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Application is already {user.toss_virtual_account_status}.")
    application = dict(user.toss_virtual_account_application)
    application.update({
        "reviewed_by": str(current_user.id),
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "review_note": (body.note or "").strip() or None,
        "virtual_account": create_toss_virtual_account(
            str(user.telegram_id),
            str(application.get("legal_name") or user.name or ""),
        ),
    })
    user.toss_virtual_account_application = application
    user.toss_virtual_account_status = "approved"
    await db.commit()
    await db.refresh(user)
    background_tasks.add_task(
        _queue_toss_email,
        application.get("contact_email") or user.email,
        user.name,
        "approved",
        application.get("virtual_account"),
        application.get("review_note"),
    )
    return _serialize_toss_application(user)


@admin_router.post("/toss-virtual-accounts/{user_id}/reject")
async def reject_toss_virtual_account_application(
    user_id: str,
    background_tasks: BackgroundTasks,
    body: TossVirtualAccountReviewRequest = TossVirtualAccountReviewRequest(),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_toss_reviewer(current_user)
    user = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(user_id)))
    if not user or not user.toss_virtual_account_application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TOSS account application not found.")
    if user.toss_virtual_account_status != "pending_review":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Application is already {user.toss_virtual_account_status}.")
    application = dict(user.toss_virtual_account_application)
    application.update({
        "reviewed_by": str(current_user.id),
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "review_note": (body.note or "").strip() or "Application rejected by Relationship Manager.",
    })
    user.toss_virtual_account_application = application
    user.toss_virtual_account_status = "rejected"
    await db.commit()
    await db.refresh(user)
    background_tasks.add_task(
        _queue_toss_email,
        application.get("contact_email") or user.email,
        user.name,
        "rejected",
        None,
        application.get("review_note"),
    )
    return _serialize_toss_application(user)


@admin_router.patch("/toss-virtual-accounts/{user_id}/account")
async def control_toss_virtual_account(
    user_id: str,
    body: TossVirtualAccountControlRequest,
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_toss_reviewer(current_user)
    user = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(user_id)))
    if not user or not user.toss_virtual_account_application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="TOSS account application not found.")
    if user.toss_virtual_account_status != "approved":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only approved TOSS accounts can be managed.")
    application = dict(user.toss_virtual_account_application)
    current_account = dict(application.get("virtual_account") or {})
    current_account.update({
        "bank_name": body.bank_name.strip(),
        "account_number": body.account_number.strip(),
        "account_holder_name": body.account_holder_name.strip(),
        "currency": "KRW",
        "account_type": "virtual_account",
        "status": body.status,
        "updated_by": str(current_user.id),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    })
    application["virtual_account"] = current_account
    user.toss_virtual_account_application = application
    await db.commit()
    await db.refresh(user)
    background_tasks.add_task(
        _queue_toss_email,
        application.get("contact_email") or user.email,
        user.name,
        "suspended" if body.status == "suspended" else "active",
        current_account,
    )
    return _serialize_toss_application(user)


@router.get("/{user_id}/toss-virtual-account")
async def get_toss_virtual_account_application(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        if str(current_user.id) != str(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own account application.")
    user = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(user_id)))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    benefits = await get_krw_benefits(db, str(user_id))
    await db.commit()
    return {
        "status": user.toss_virtual_account_status or "not_started",
        "application": user.toss_virtual_account_application,
        "virtual_account": (
            user.toss_virtual_account_application or {}
        ).get("virtual_account"),
        "benefits": benefits,
    }


@router.post("/{user_id}/toss-virtual-account")
async def submit_toss_virtual_account_application(
    user_id: str,
    data: TossVirtualAccountApplicationRequest,
    background_tasks: BackgroundTasks,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        if str(current_user.id) != str(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only submit your own account application.")
    user = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(user_id)))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if user.toss_virtual_account_status == "pending_review":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Your TOSS Virtual Account application is already under review.")
    if not (await get_krw_benefits(db, str(user_id)))["unlocked"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Complete an approved USDT deposit of at least {KRW_BENEFIT_THRESHOLD_USDT:g} USDT before applying.",
        )
    data.legal_name = data.legal_name.strip()
    data.country = data.country.strip()
    data.purpose = data.purpose.strip()
    data.contact_email = data.contact_email.strip().lower()
    if data.currencies != ["KRW"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only KRW Virtual Accounts are currently supported.")
    if not data.signature_data.startswith("data:image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A drawn signature is required.")
    user.toss_virtual_account_application = data.model_dump()
    user.toss_virtual_account_status = "pending_review"
    await db.commit()
    background_tasks.add_task(
        _queue_toss_email,
        data.contact_email or user.email,
        user.name,
        "submitted",
    )
    return {
        "status": user.toss_virtual_account_status,
        "application": user.toss_virtual_account_application,
        "message": "Your TOSS Bank account application was submitted. Please wait for your Relationship Manager's approval.",
    }


def _default_user_payment_channels() -> dict[str, list[str]]:
    return {
        currency: list(DEFAULT_PAYMENT_CHANNELS.get(currency, {}).get("checkout", []))
        for currency in SUPPORTED_COLLECTION_CURRENCIES
    }


@router.get("/{user_id}/payment-channels")
async def get_user_payment_channels(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        if str(current_user.id) != str(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own payment channels.")
    user = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(user_id)))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    eligible = (await get_krw_benefits(db, str(user_id)))["unlocked"]
    channels = user.payment_channels if isinstance(user.payment_channels, dict) else _default_user_payment_channels()
    return {"eligible": eligible, "minimum_deposit_usdt": KRW_BENEFIT_THRESHOLD_USDT, "channels": channels}


@router.put("/{user_id}/payment-channels")
async def update_user_payment_channels(
    user_id: str,
    data: PaymentChannelsUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        if str(current_user.id) != str(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own payment channels.")
    user = await db.scalar(select(AdminUser).where(AdminUser.telegram_id == str(user_id)))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    if not (await get_krw_benefits(db, str(user_id)))["unlocked"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Payment channels can be changed after one approved USDT deposit of at least 600 USDT.",
        )
    normalized: dict[str, list[str]] = {}
    for currency in SUPPORTED_COLLECTION_CURRENCIES:
        values = data.channels.get(currency, [])
        if not isinstance(values, list):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{currency} channels must be a list.")
        invalid = [channel for channel in values if channel not in PAYMENT_CHANNELS]
        if invalid:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported payment channel: {invalid[0]}")
        normalized[currency] = list(dict.fromkeys(values))
    user.payment_channels = normalized
    await db.commit()
    return {"eligible": True, "minimum_deposit_usdt": KRW_BENEFIT_THRESHOLD_USDT, "channels": normalized}


@router.patch("/{user_id}/settlement", response_model=UserResponse)
async def update_user_settlement(
    user_id: str,
    data: SettlementUpdateRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Allow a user to update their own settlement details, while super admins may update any user."""
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        if str(current_user.id) != str(user_id):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own settlement details.")

    result = await db.execute(select(AdminUser).where(AdminUser.telegram_id == str(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        if str(current_user.id) != str(user_id):
            raise HTTPException(status_code=404, detail="User not found.")
        user = AdminUser(
            telegram_id=str(user_id),
            telegram_username=current_user.name or user_id,
            name=current_user.name,
            email=current_user.email,
            is_active=True,
            is_super_admin=bool(current_user.permissions and current_user.permissions.is_super_admin),
            organization_id=current_user.organization_id,
            organization_name=current_user.organization_name,
            added_by=str(current_user.id),
        )
        db.add(user)

    payload_data = _normalize_settlement_payload(data.model_dump(exclude_unset=True))
    if "usdt_wallet_address" in payload_data:
        normalized = _normalize_usdt_wallet_address(payload_data["usdt_wallet_address"])
        payload_data["usdt_wallet_address"] = normalized
        if normalized:
            await _ensure_unique_usdt_wallet_address(db, normalized, exclude_admin_id=user.id)

    for field, value in payload_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    return UserResponse(
        id=str(user.telegram_id),
        email=user.email or current_user.email,
        name=user.name or current_user.name,
        role=(user.role or current_user.role or "user"),
        organization_id=user.organization_id or current_user.organization_id,
        organization_name=user.organization_name or current_user.organization_name,
        permissions=current_user.permissions,
        bank_name=user.bank_name,
        bank_account_number=user.bank_account_number,
        bank_account_name=user.bank_account_name,
        bank_address=user.bank_address,
        usdt_wallet_address=user.usdt_wallet_address,
        settlement_type=user.settlement_type,
        settlement_currency=user.settlement_currency,
        payment_channels=user.payment_channels if isinstance(user.payment_channels, dict) else None,
    )


@router.delete("/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user account and all associated data. Super admin only."""
    _require_super_admin(current_user)

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    await db.delete(user)
    await db.execute(Wallet_transactions.__table__.delete().where(Wallet_transactions.user_id == user_id))
    await db.execute(Wallets.__table__.delete().where(Wallets.user_id == user_id))
    await db.execute(Transactions.__table__.delete().where(Transactions.user_id == user_id))
    await db.execute(Disbursements.__table__.delete().where(Disbursements.user_id == user_id))
    await db.commit()
