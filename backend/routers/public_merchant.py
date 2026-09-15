import logging
import math
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.merchant_api_config import MerchantApiConfig
from models.admin_users import AdminUser
from models.transactions import Transactions

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/public/merchant", tags=["public-merchant"])
SUPPORTED_LINK_CURRENCIES = {"PHP", "KRW", "CNY", "USDT"}


class PublicMerchantInfo(BaseModel):
    store_name: Optional[str] = None
    store_logo_url: Optional[str] = None
    organization_id: str
    collection_currency: str = "PHP"
    store_slug: str = "3"


class PublicMerchantPaymentRequest(BaseModel):
    amount: float
    description: Optional[str] = None
    currency: Optional[str] = None


def _resolve_link_currency(currency: Optional[str], configured_currency: Optional[str]) -> str:
    configured = (configured_currency or "PHP").strip().upper()
    if configured not in SUPPORTED_LINK_CURRENCIES:
        raise HTTPException(status_code=400, detail="Merchant currency is not supported")
    if currency and currency.strip().upper() != configured:
        raise HTTPException(status_code=400, detail="This permanent link is for a different currency")
    selected = currency.strip().upper() if currency else configured
    if selected not in SUPPORTED_LINK_CURRENCIES:
        raise HTTPException(status_code=400, detail="Unsupported payment currency")
    return selected


@router.get("/{slug}", response_model=PublicMerchantInfo)
async def get_public_merchant_info(
    slug: str,
    currency: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(MerchantApiConfig).where(MerchantApiConfig.permanent_link_slug == slug)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(status_code=404, detail="Merchant not found")

    link_currency = _resolve_link_currency(currency, config.collection_currency)

    return {
        "store_name": config.store_name or "SwiftPay Merchant",
        "store_logo_url": config.store_logo_url,
        "organization_id": config.organization_id,
        "collection_currency": link_currency,
        "store_slug": config.store_slug or "3",
    }


@router.post("/{slug}/payment")
async def create_public_merchant_payment(
    slug: str,
    payload: PublicMerchantPaymentRequest,
    currency: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Create a self-hosted checkout transaction from a permanent merchant link."""
    if not math.isfinite(payload.amount) or payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be a positive finite number")

    config = await db.scalar(
        select(MerchantApiConfig).where(MerchantApiConfig.permanent_link_slug == slug)
    )
    if not config:
        raise HTTPException(status_code=404, detail="Merchant not found")

    link_currency = _resolve_link_currency(currency or payload.currency, config.collection_currency)

    owner_query = select(AdminUser).where(AdminUser.is_active.is_(True))
    if config.user_id:
        owner_query = owner_query.where(AdminUser.telegram_id == config.user_id)
    else:
        owner_query = owner_query.where(AdminUser.organization_id == config.organization_id).order_by(
            AdminUser.is_super_admin.asc(), AdminUser.id.asc()
        )
    owner = await db.scalar(owner_query.limit(1))
    if not owner:
        raise HTTPException(status_code=404, detail="Merchant owner not found")

    reference = f"PUBLIC-PAY-{uuid.uuid4().hex[:16].upper()}"
    now = datetime.now(timezone.utc)
    transaction = Transactions(
        user_id=str(owner.telegram_id),
        transaction_type="payment_link",
        amount=round(payload.amount, 2),
        currency=link_currency,
        external_id=reference,
        status="pending",
        description=(payload.description or config.store_name or "Payment").strip(),
        payment_url=f"/checkout/{reference}",
        created_at=now,
        updated_at=now,
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)

    return {
        "success": True,
        "external_id": transaction.external_id,
        "checkout_url": transaction.payment_url,
        "amount": transaction.amount,
        "currency": transaction.currency,
    }


@router.get("/platform/branding", response_model=PublicMerchantInfo)
async def get_platform_branding(
    db: AsyncSession = Depends(get_db),
):
    from core.config import settings
    platform_org_id = getattr(settings, "platform_organization_id", "swiftpay-ph")

    stmt = select(MerchantApiConfig).where(MerchantApiConfig.organization_id == platform_org_id)
    result = await db.execute(stmt)
    config = result.scalar_one_or_none()

    if not config:
        return {
            "store_name": "SwiftPay",
            "store_logo_url": "/logo.svg",
            "organization_id": platform_org_id,
            "collection_currency": "PHP",
        }

    return {
        "store_name": config.store_name or "SwiftPay",
        "store_logo_url": config.store_logo_url or "/logo.svg",
        "organization_id": config.organization_id,
        "collection_currency": (config.collection_currency or "PHP").upper(),
    }
