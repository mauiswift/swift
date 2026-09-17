"""Fallback open-amount routes for deployments with a partial router load."""

from datetime import datetime, timezone
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.config import settings
from dependencies.auth import get_payment_user
from models.admin_users import AdminUser
from models.merchant_api_config import MerchantApiConfig
from models.transactions import Transactions
from models.auth import User
from utils.datetime import serialize_utc_datetime
from schemas.auth import UserResponse
from services.magpie_services import MagpieService

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])

SUPPORTED_CURRENCIES = {"PHP", "KRW", "CNY", "USDT"}


def _link_currency(requested: Optional[str], configured: Optional[str]) -> str:
    candidate = (requested or configured or "PHP").strip().upper()
    if candidate not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail="Unsupported permanent-link currency")
    return candidate


async def _get_checkout_transaction(identifier: str, db: AsyncSession) -> Transactions:
    result = await db.execute(
        select(Transactions).where(
            func.lower(Transactions.external_id) == identifier.lower(),
        ).limit(1)
    )
    txn = result.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")
    return txn


def _ensure_card_transaction(txn: Transactions) -> str:
    currency = (txn.currency or "").strip().upper()
    if currency not in {"PHP", "KRW", "CNY"}:
        raise HTTPException(
            status_code=400,
            detail="Custom Magpie card checkout is only available for PHP, KRW, and CNY payments",
        )
    if str(txn.status or "").lower() not in {"pending", "created"}:
        raise HTTPException(status_code=400, detail="This payment is no longer available")
    return currency


@router.get("/checkout/{identifier}/magpie-card/config", include_in_schema=False)
async def get_magpie_card_config_compat(identifier: str, db: AsyncSession = Depends(get_db)):
    txn = await _get_checkout_transaction(identifier, db)
    currency = _ensure_card_transaction(txn)
    public_key = (getattr(settings, "magpie_public_key", "") or "").strip()
    if not public_key:
        raise HTTPException(status_code=503, detail="Magpie card payments are not configured")
    return {"success": True, "public_key": public_key, "currency": currency.lower()}


@router.post("/checkout/{identifier}/magpie-card/source", include_in_schema=False)
async def create_magpie_card_source_compat(
    identifier: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    txn = await _get_checkout_transaction(identifier, db)
    currency = _ensure_card_transaction(txn)
    card = payload.get("card")
    if not isinstance(card, dict) or not card:
        raise HTTPException(status_code=422, detail="Card details are required")
    public_host = (
        getattr(settings, "public_checkout_host", "")
        or getattr(settings, "frontend_url", "")
        or "https://swiftpay.site"
    ).strip().rstrip("/")
    if not public_host.startswith(("http://", "https://")):
        public_host = f"https://{public_host}"
    source = await MagpieService().create_card_source(
        public_key=(getattr(settings, "magpie_public_key", "") or "").strip(),
        currency=currency,
        card=card,
        success_url=f"{public_host}/magpie-success?external_id={txn.external_id}&currency={currency}",
        fail_url=f"{public_host}/checkout/{txn.external_id}",
    )
    if not source.get("success") or not source.get("source_id"):
        raise HTTPException(status_code=502, detail=source.get("error", "Unable to initialize card payment"))
    return {"success": True, "source_id": source["source_id"]}


@router.post("/checkout/{identifier}/magpie-card/charge", include_in_schema=False)
async def charge_magpie_card_source_compat(
    identifier: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    txn = await _get_checkout_transaction(identifier, db)
    currency = _ensure_card_transaction(txn)
    source_id = str(payload.get("source_id") or "").strip()
    if len(source_id) < 8:
        raise HTTPException(status_code=422, detail="A valid card source is required")
    charge = await MagpieService().create_charge(
        source_id=source_id,
        amount=int(round(float(txn.amount) * 100)),
        currency=currency,
        description=txn.description or f"{currency} card payment",
        statement_descriptor="SwiftPay",
        capture=True,
    )
    if not charge.get("success"):
        raise HTTPException(status_code=502, detail=charge.get("error", "Card payment could not be processed"))
    return {
        "success": True,
        "charge_id": charge.get("charge_id"),
        "status": charge.get("status"),
        "redirect_url": charge.get("redirect_url"),
    }


async def _get_open_amount_link(
    current_user: UserResponse,
    db: AsyncSession,
    requested_currency: Optional[str],
) -> dict:
    currency = (requested_currency or "PHP").strip().upper()
    if currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail="Unsupported permanent-link currency")

    reference = f"OPEN-AMOUNT-{current_user.id}-{currency}"
    store_name = (current_user.organization_name or current_user.name or "").strip()
    organization_id = current_user.organization_id
    if not organization_id:
        result = await db.execute(
            select(AdminUser).where(AdminUser.telegram_id == str(current_user.id)).limit(1)
        )
        admin = result.scalar_one_or_none()
        if admin:
            organization_id = admin.organization_id
            store_name = (admin.organization_name or admin.name or store_name).strip()

    permanent_link_slug = None
    if organization_id:
        result = await db.execute(
            select(MerchantApiConfig)
            .where(
                MerchantApiConfig.organization_id == organization_id,
                or_(
                    MerchantApiConfig.user_id == str(current_user.id),
                    MerchantApiConfig.user_id.is_(None),
                ),
            )
            .order_by(
                (MerchantApiConfig.user_id == str(current_user.id)).desc(),
                MerchantApiConfig.id.asc(),
            )
            .limit(1)
        )
        config = result.scalars().first()
        if config:
            configured_currency = (config.collection_currency or "").upper()
            if not requested_currency and configured_currency in SUPPORTED_CURRENCIES:
                currency = configured_currency
            store_name = (config.store_name or store_name).strip()
            permanent_link_slug = config.permanent_link_slug

    result = await db.execute(
        select(Transactions).where(Transactions.external_id == reference).limit(1)
    )
    txn = result.scalars().first()
    if not txn:
        txn = Transactions(
            user_id=str(current_user.id),
            transaction_type="open_amount_link",
            amount=0,
            currency=currency,
            external_id=reference,
            status="pending",
            description=store_name or "Open amount payment",
            payment_url=f"/checkout/{reference}?open_amount=1",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(txn)
        await db.commit()
    elif txn.currency != currency:
        txn.currency = currency
        txn.updated_at = datetime.now(timezone.utc)
        await db.commit()

    store_name = txn.description if txn.description and txn.description != "Open amount payment" else store_name
    return {
        "success": True,
        "url": (
            f"/pay/{permanent_link_slug}-{currency}"
            if permanent_link_slug
            else f"/checkout/{reference}?open_amount=1&currency={currency}"
        ),
        "reference": reference,
        "store_name": store_name or None,
        "permanent_link_slug": permanent_link_slug,
    }


@router.get("/open-amount-link", include_in_schema=False)
async def get_open_amount_link_compat(
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
    requested_currency: Optional[str] = Query(None, alias="currency"),
):
    return await _get_open_amount_link(current_user, db, requested_currency)


@router.get("/open-amount-links", include_in_schema=False)
async def get_open_amount_links_compat(
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    links = [
        await _get_open_amount_link(current_user, db, currency)
        for currency in ("PHP", "KRW", "CNY", "USDT")
    ]
    return {
        "success": True,
        "links": [
            {
                "currency": currency,
                "url": link["url"],
                "reference": link["reference"],
                "store_name": link["store_name"],
            }
            for currency, link in zip(("PHP", "KRW", "CNY", "USDT"), links)
        ],
    }


@router.post("/checkout/{identifier}/open-amount-request", include_in_schema=False)
async def create_open_amount_payment_request_compat(
    identifier: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transactions).where(
            func.lower(Transactions.external_id) == identifier.lower(),
        ).limit(1)
    )
    reusable = result.scalars().first()
    if not reusable or not reusable.external_id.startswith("OPEN-AMOUNT-") or float(reusable.amount or 0) != 0:
        raise HTTPException(status_code=404, detail="Reusable payment link not found")
    try:
        amount = float(payload.get("amount"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="Payment amount must be a positive number")
    if amount <= 0:
        raise HTTPException(status_code=422, detail="Payment amount must be a positive number")

    request_reference = f"OPEN-AMOUNT-PAY-{reusable.user_id}-{uuid.uuid4().hex[:12].upper()}"
    payment = Transactions(
        user_id=reusable.user_id,
        transaction_type="open_amount_payment",
        amount=round(amount, 2),
        currency=reusable.currency or "PHP",
        external_id=request_reference,
        status="pending",
        approval_status="pending",
        description="Customer-entered amount payment",
        payment_url=f"/checkout/{request_reference}",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return {
        "success": True,
        "id": payment.id,
        "external_id": payment.external_id,
        "amount": payment.amount,
        "currency": payment.currency,
        "status": payment.status,
        "approval_status": payment.approval_status,
    }


@router.get("/checkout/{identifier}", include_in_schema=False)
async def get_checkout_payment_compat(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transactions).where(
            or_(
                func.lower(Transactions.external_id) == identifier.lower(),
                func.lower(Transactions.payment_url) == identifier.lower(),
            )
        ).limit(1)
    )
    txn = result.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")

    merchant_name = "Merchant"
    merchant_result = await db.execute(select(User.name).where(User.id == txn.user_id).limit(1))
    name = merchant_result.scalar()
    if name:
        merchant_name = name
    return {
        "success": True,
        "id": txn.id,
        "external_id": txn.external_id,
        "transaction_type": txn.transaction_type,
        "amount": float(txn.amount or 0),
        "currency": txn.currency or "PHP",
        "status": txn.status,
        "description": txn.description or "",
        "payment_url": txn.payment_url or "",
        "qr_code_url": txn.qr_code_url or "",
        "customer_name": txn.customer_name or "",
        "customer_email": txn.customer_email or "",
        "merchant_name": merchant_name,
        "merchant_logo_url": None,
        "bank_name": "Toss Bank" if (txn.currency or "").upper() == "KRW" else None,
        "bank_account_number": "1908-1618-8260" if (txn.currency or "").upper() == "KRW" else None,
        "bank_account_name": "SwiftPay Ventures Inc." if (txn.currency or "").upper() == "KRW" else None,
        "created_at": serialize_utc_datetime(txn.created_at),
        "updated_at": serialize_utc_datetime(txn.updated_at),
    }


@router.get("/checkout/{identifier}/status", include_in_schema=False)
async def get_checkout_status_compat(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transactions).where(
            func.lower(Transactions.external_id) == identifier.lower(),
        ).limit(1)
    )
    txn = result.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {
        "status": txn.status,
        "amount": float(txn.amount or 0),
        "currency": txn.currency or "PHP",
        "payment_url": txn.payment_url or "",
        "updated_at": serialize_utc_datetime(txn.updated_at),
    }
