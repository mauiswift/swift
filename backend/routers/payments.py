from typing import Any, Dict, Literal, Optional
import os
import uuid
from fastapi import APIRouter, HTTPException, Request, Depends, File, Form, UploadFile, Query
import xmltodict
from fastapi.responses import StreamingResponse, JSONResponse, RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from datetime import datetime, timezone, timedelta
import secrets
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode, quote

from core.database import get_db
from dependencies.auth import get_payment_user, get_payment_user_allow_test
from schemas.auth import UserResponse
from models.transactions import Transactions
from models.auth import User
from models.admin_users import AdminUser
from models.merchant_api_config import MerchantApiConfig
from models.toss_account_pool import TossAccountPool
from core.config import settings
from core.constants import BANK_RECEIPTS_SUBDIR
from services.app_settings import get_payment_channels
from services.url_shortener import URLShortenerService
from io import BytesIO
import qrcode
import logging

from services.alipay_service import AlipayService
from services.wechat_service import WechatService
from services.magpie_services import CurrencyConverter, MagpieService
from services.payment_gateway import gateway, _select_manual_transfer_account
from services.paymentwall_service import PaymentwallService
from services.transactions import publish_payment_link_created
from services.swiftpay_service import SwiftPayService
from services.ph_banks_service import PHBanksService
from services.event_bus import payment_event_bus
from services.checkout_urls import build_checkout_url, checkout_host
from utils.datetime import serialize_utc_datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


async def _get_toss_account_for_transaction(db: AsyncSession, txn: Transactions) -> dict[str, str]:
    """Return the pool account assigned to this checkout session."""
    result = await db.execute(
        select(TossAccountPool)
        .where(TossAccountPool.is_active.is_(True))
        .order_by(TossAccountPool.last_assigned_at.asc().nullsfirst(), TossAccountPool.id.asc())
        .with_for_update()
    )
    account = result.scalars().first()
    if txn.bank_account_number:
        assigned = await db.scalar(
            select(TossAccountPool).where(
                TossAccountPool.account_number == txn.bank_account_number,
                TossAccountPool.last_assigned_transaction_id == txn.id,
            )
        )
        if assigned:
            return {
                "bank_name": assigned.bank_name,
                "number": assigned.account_number,
                "account_name": assigned.account_holder_name,
            }
    if account:
        now = datetime.now(timezone.utc)
        account.last_assigned_at = now
        account.last_assigned_transaction_id = txn.id
        account.updated_at = now
        txn.bank_name = account.bank_name
        txn.bank_account_number = account.account_number
        txn.bank_account_name = account.account_holder_name
        await db.commit()
        return {
            "bank_name": account.bank_name,
            "number": account.account_number,
            "account_name": account.account_holder_name,
        }

    virtual_account = PaymentwallService.generate_krw_virtual_account(
        user_id=str(txn.user_id),
        reference_id=f"session-{txn.id}",
    )
    return virtual_account

SWIFTPAY_INSTITUTION_PREFIXES = {
    "BDO": ("BNORPHM",),
    "BPI": ("BOPIPHM",),
    "RCBC": ("RCBCPHM",),
    "UNIONBANK": ("UBPHPHM",),
    "METROBANK": ("MBTCPHM",),
    "LANDBANK": ("TLBPPHM",),
    "PNB": ("PNBMPHM",),
    "EASTWEST": ("EWB CPHM".replace(" ", ""), "EAWRPHM"),
    "CHINABANK": ("CHSVPHM", "CHBKPHM"),
    "SECURITYBANK": ("SETCPHM",),
    "UBP": ("UBPHPHM",),
    "UCPB": ("UCPVPHM",),
    "PSBANK": ("PSB PPHM".replace(" ", ""),),
    "CIMB": ("CIPHPHM",),
    "MAYBANK": ("MBBEPHM",),
    "ROBINSONS": ("ROBPPHM",),
}


def _institution_matches_enabled(provider_code: str, enabled_codes: set[str]) -> bool:
    code = str(provider_code or "").strip().upper()
    return code in enabled_codes or any(
        code.startswith(prefix)
        for enabled in enabled_codes
        for prefix in SWIFTPAY_INSTITUTION_PREFIXES.get(enabled, ())
    )

# Simple in-memory cache for demo QR images (do NOT use in prod)
_QR_CACHE: dict = {}
_CHECKOUT_CACHE: dict = {}
SWIFTPAY_MIN_PHP_AMOUNT = 1.0

alipay = AlipayService()
wechat = WechatService()


@router.get("/p/{slug}")
async def redirect_short_url(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """Redirect from short URL to full checkout URL.

    Example: /api/v1/payments/p/abc12345 → /checkout/full-reference-number
    """
    try:
        target_url = await URLShortenerService.get_short_url_target(db, slug)
        if not target_url:
            raise HTTPException(status_code=404, detail="Payment link not found")

        # Redirect to the checkout URL (relative or absolute)
        if target_url.startswith('/'):
            # Relative URL
            return RedirectResponse(url=target_url)
        else:
            # Absolute URL
            return RedirectResponse(url=target_url)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resolving short URL '{slug}': {e}")
        raise HTTPException(status_code=500, detail="Failed to resolve payment link")


@router.get("/open-amount-link")
async def get_open_amount_link(
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
    requested_currency: Optional[str] = Query(None, alias="currency"),
):
    """Return the merchant's reusable customer-entered-amount checkout link."""
    currency = (requested_currency or "PHP").strip().upper()
    if currency not in {"PHP", "KRW", "CNY", "USDT"}:
        raise HTTPException(status_code=400, detail="Unsupported permanent-link currency")
    reference = f"OPEN-AMOUNT-{current_user.id}-{currency}"
    store_name = (current_user.store_name or current_user.organization_name or "").strip()
    permanent_link_slug = None
    organization_id = current_user.organization_id
    if not organization_id:
        admin_result = await db.execute(
            select(AdminUser)
            .where(AdminUser.telegram_id == str(current_user.id))
            .limit(1)
        )
        admin = admin_result.scalar_one_or_none()
        if admin:
            organization_id = admin.organization_id
            store_name = (admin.organization_name or store_name).strip()
    if organization_id:
        # Prefer the authenticated user's own store profile. Only fall back to
        # an unowned organization profile for legacy records.
        config_query = select(MerchantApiConfig).where(
            MerchantApiConfig.organization_id == organization_id,
            or_(
                MerchantApiConfig.user_id == str(current_user.id),
                MerchantApiConfig.user_id.is_(None),
            ),
        ).order_by(
            (MerchantApiConfig.user_id == str(current_user.id)).desc(),
            MerchantApiConfig.id.asc(),
        ).limit(1)
        config_result = await db.execute(config_query)
        config = config_result.scalars().first()
        if config:
            configured_currency = (config.collection_currency or "").upper()
            if not requested_currency and configured_currency in {"PHP", "KRW", "CNY", "USDT"}:
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
            payment_url=build_checkout_url(reference, currency, {"open_amount": "1"}),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(txn)
        await db.commit()
    else:
        changed = False
        if txn.currency != currency:
            txn.currency = currency
            changed = True
        if store_name and txn.description in {None, "", "Open amount payment"}:
            txn.description = store_name
            changed = True
        if changed:
            txn.updated_at = datetime.now(timezone.utc)
            await db.commit()
    if txn and txn.description and txn.description != "Open amount payment":
        store_name = txn.description
    return {
        "success": True,
        "url": (
            f"/pay/{permanent_link_slug}-{currency}"
            if permanent_link_slug
            else build_checkout_url(reference, currency, {"open_amount": "1", "currency": currency})
        ),
        "reference": reference,
        "store_name": store_name or None,
        "permanent_link_slug": permanent_link_slug,
    }


@router.get("/open-amount-links")
async def get_open_amount_links(
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    """Return one stable permanent open-amount link for every supported currency."""
    currencies = ("PHP", "KRW", "CNY", "USDT")
    links = []
    for currency in currencies:
        result = await get_open_amount_link(
            current_user=current_user,
            db=db,
            requested_currency=currency,
        )
        links.append({
            "currency": currency,
            "url": result["url"],
            "reference": result["reference"],
            "store_name": result["store_name"],
        })
    return {"success": True, "links": links}


class CheckoutInstitutionRequest(BaseModel):
    institution_code: str = Field(..., min_length=1, max_length=100)
    amount: Optional[float] = Field(default=None, gt=0)


class OpenAmountPaymentRequest(BaseModel):
    amount: float = Field(..., gt=0)


@router.get("/checkout/{identifier}/magpie-card/config")
async def get_magpie_card_config(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Return non-secret configuration for the custom Magpie card form."""
    result = await db.execute(
        select(Transactions).where(func.lower(Transactions.external_id) == identifier.lower()).limit(1)
    )
    txn = result.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")
    currency = (txn.currency or "").strip().upper()
    if currency not in {"PHP", "KRW", "CNY"}:
        raise HTTPException(status_code=400, detail="Custom Magpie card checkout is only available for PHP, KRW, and CNY payments")
    public_key = (getattr(settings, "magpie_public_key", "") or "").strip()
    if not public_key:
        raise HTTPException(status_code=503, detail="Magpie card payments are not configured")
    return {
        "success": True,
        "public_key": public_key,
        "currency": currency.lower(),
    }


@router.post("/checkout/{identifier}/magpie-card/source")
async def create_magpie_card_source(
    identifier: str,
    payload: MagpieCardDetailsRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create a tokenized card source server-side to avoid provider CORS failures."""
    result = await db.execute(
        select(Transactions).where(func.lower(Transactions.external_id) == identifier.lower()).limit(1)
    )
    txn = result.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")
    currency = (txn.currency or "").strip().upper()
    if currency not in {"PHP", "KRW", "CNY"}:
        raise HTTPException(status_code=400, detail="Custom Magpie card checkout is only available for PHP, KRW, and CNY payments")
    if str(txn.status or "").lower() not in {"pending", "created"}:
        raise HTTPException(status_code=400, detail="This payment is no longer available")
    provider_currency = "PHP"
    provider_amount = float(txn.amount or 0)
    if currency != provider_currency:
        provider_amount = CurrencyConverter.convert(provider_amount, currency, provider_currency)
        if provider_amount < 1:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{currency} {float(txn.amount or 0):,.2f} converts to less than the provider minimum "
                    "of PHP 1.00. Increase the payment amount and try again."
                ),
            )
    customer_country = (payload.customer_country or payload.country or payload.card.get("country") or "").strip().upper()
    if not customer_country:
        customer_country = "KR" if currency == "KRW" else "PH"
    card_payload = {**payload.card, "country": customer_country}
    public_host = checkout_host(currency)
    source = await MagpieService().create_card_source(
        public_key=(getattr(settings, "magpie_public_key", "") or "").strip(),
        currency=provider_currency,
        card=card_payload,
        customer_country=customer_country,
        success_url=f"{public_host}/magpie-success?external_id={txn.external_id}&currency={currency}",
        fail_url=f"{public_host}/checkout/{txn.external_id}",
    )
    if not source.get("success") or not source.get("source_id"):
        raise HTTPException(status_code=502, detail=source.get("error", "Unable to initialize card payment"))
    return {
        "success": True,
        "source_id": source["source_id"],
        "currency": provider_currency,
        "amount": round(provider_amount, 2),
    }


class MagpieCardSourceRequest(BaseModel):
    source_id: str = Field(..., min_length=8, max_length=100)


class MagpieCardDetails(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    number: str = Field(..., min_length=12, max_length=19)
    exp_month: str = Field(..., min_length=2, max_length=2)
    exp_year: str = Field(..., min_length=4, max_length=4)
    cvc: str = Field(..., min_length=3, max_length=4)


class MagpieCardSourceProxyRequest(BaseModel):
    card: MagpieCardDetails


@router.post("/checkout/{identifier}/magpie-card/source")
async def create_magpie_card_source_proxy(
    identifier: str,
    payload: MagpieCardSourceProxyRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create a Magpie card source when browser CORS blocks direct tokenization.

    Card details are forwarded only to Magpie and are never persisted or logged.
    """
    result = await db.execute(
        select(Transactions).where(func.lower(Transactions.external_id) == identifier.lower()).limit(1)
    )
    txn = result.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")
    currency = (txn.currency or "").strip().upper()
    if currency not in {"KRW", "CNY"}:
        raise HTTPException(status_code=400, detail="Custom Magpie card checkout is only available for KRW and CNY payments")
    if str(txn.status or "").lower() not in {"pending", "created"}:
        raise HTTPException(status_code=400, detail="This payment is no longer available")

    public_key = (getattr(settings, "magpie_public_key", "") or "").strip()
    if not public_key:
        raise HTTPException(status_code=503, detail="Magpie card payments are not configured")

    public_host = checkout_host(currency)

    service = MagpieService()
    source = await service.create_card_source(
        public_key=public_key,
        currency=currency,
        card=payload.card.model_dump(),
        success_url=f"{public_host}/magpie-success?external_id={quote(txn.external_id, safe='')}",
        fail_url=f"{public_host}/checkout/{quote(txn.external_id, safe='')}",
    )
    if not source.get("success") or not source.get("source_id"):
        raise HTTPException(status_code=502, detail=source.get("error", "Card verification failed"))
    return {"success": True, "source_id": source["source_id"]}


class MagpieCheckoutMethodRequest(BaseModel):
    payment_method: Literal["alipay", "wechat", "unionpay"]


@router.post("/checkout/{identifier}/magpie-method")
async def create_magpie_method_checkout(
    identifier: str,
    payload: MagpieCheckoutMethodRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create a Magpie session restricted to the selected CNY wallet."""
    result = await db.execute(
        select(Transactions).where(func.lower(Transactions.external_id) == identifier.lower()).limit(1)
    )
    txn = result.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")
    if (txn.currency or "").strip().upper() != "CNY":
        raise HTTPException(status_code=400, detail="Wallet-specific Magpie checkout is only available for CNY payments")
    if str(txn.status or "").lower() not in {"pending", "created"}:
        raise HTTPException(status_code=400, detail="This payment is no longer available")

    public_host = checkout_host("CNY")
    service = MagpieService()
    session = await service.create_session(
        amount_cents=int(round(float(txn.amount) * 100)),
        currency="PHP",
        product_name=txn.description or "CNY payment",
        success_url=f"{public_host}/checkout/{txn.external_id}?status=success",
        cancel_url=f"{public_host}/checkout/{txn.external_id}?status=cancel",
        client_reference_id=txn.external_id,
        payment_method_types=[payload.payment_method],
        customer_name=txn.customer_name or None,
        customer_email=txn.customer_email or None,
    )
    if not session.get("success"):
        raise HTTPException(status_code=502, detail=session.get("error", "Magpie checkout could not be initialized"))
    data = session.get("data") if isinstance(session.get("data"), dict) else {}
    checkout_url = session.get("checkout_url") or session.get("payment_url") or data.get("checkout_url") or data.get("payment_url") or data.get("url")
    if not checkout_url:
        raise HTTPException(status_code=502, detail="Magpie did not return a checkout URL")
    txn.payment_url = checkout_url
    txn.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"success": True, "checkout_url": checkout_url, "payment_url": checkout_url, "payment_method": payload.payment_method}


@router.get("/checkout/{identifier}/magpie-wallet/config")
async def get_magpie_wallet_config(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Return public configuration for the hosted SwiftPay CNY wallet form."""
    result = await db.execute(
        select(Transactions).where(func.lower(Transactions.external_id) == identifier.lower()).limit(1)
    )
    txn = result.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")
    if (txn.currency or "").strip().upper() != "CNY":
        raise HTTPException(status_code=400, detail="Wallet checkout is only available for CNY payments")
    public_key = (getattr(settings, "magpie_public_key", "") or "").strip()
    if not public_key:
        raise HTTPException(status_code=503, detail="Magpie wallet payments are not configured")
    return {
        "success": True,
        "public_key": public_key,
        "currency": "cny",
        "source_url": "https://api.magpie.im/v2/sources/",
        "payment_methods": ["alipay", "wechat", "unionpay"],
    }


class MagpieWalletSourceRequest(BaseModel):
    payment_method: Literal["alipay", "wechat", "unionpay"]


class MagpieWalletChargeRequest(BaseModel):
    source_id: str = Field(..., min_length=8, max_length=100)
    payment_method: Literal["alipay", "wechat", "unionpay"]


@router.post("/checkout/{identifier}/magpie-wallet/source")
async def create_magpie_wallet_source(
    identifier: str,
    payload: MagpieWalletSourceRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create a tokenized CNY wallet source without exposing Magpie to the browser."""
    result = await db.execute(
        select(Transactions).where(func.lower(Transactions.external_id) == identifier.lower()).limit(1)
    )
    txn = result.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")
    if (txn.currency or "").strip().upper() != "CNY":
        raise HTTPException(status_code=400, detail="Wallet checkout is only available for CNY payments")
    if str(txn.status or "").lower() not in {"pending", "created"}:
        raise HTTPException(status_code=400, detail="This payment is no longer available")
    public_host = checkout_host("CNY")
    source = await MagpieService().create_wallet_source(
        public_key=(getattr(settings, "magpie_public_key", "") or "").strip(),
        currency="CNY",
        payment_type=payload.payment_method,
        success_url=f"{public_host}/magpie-success?external_id={txn.external_id}",
        fail_url=f"{public_host}/checkout/{txn.external_id}",
    )
    if not source.get("success") or not source.get("source_id"):
        raise HTTPException(status_code=502, detail=source.get("error", "Unable to initialize wallet payment"))
    return {"success": True, "source_id": source["source_id"], "payment_method": payload.payment_method}


@router.post("/checkout/{identifier}/magpie-wallet/charge")
async def charge_magpie_wallet_source(
    identifier: str,
    payload: MagpieWalletChargeRequest,
    db: AsyncSession = Depends(get_db),
):
    """Charge a tokenized CNY wallet source without accepting wallet credentials."""
    result = await db.execute(
        select(Transactions).where(func.lower(Transactions.external_id) == identifier.lower()).limit(1)
    )
    txn = result.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")
    if (txn.currency or "").strip().upper() != "CNY":
        raise HTTPException(status_code=400, detail="Wallet checkout is only available for CNY payments")
    if str(txn.status or "").lower() not in {"pending", "created"}:
        raise HTTPException(status_code=400, detail="This payment is no longer available")
    service = MagpieService()
    charge = await service.create_charge(
        source_id=payload.source_id,
        amount=int(round(float(txn.amount) * 100)),
        currency="CNY",
        description=txn.description or f"CNY {payload.payment_method} payment",
        statement_descriptor="SwiftPay",
        capture=True,
    )
    if not charge.get("success"):
        raise HTTPException(status_code=502, detail=charge.get("error", "Wallet payment could not be processed"))
    return {
        "success": True,
        "charge_id": charge.get("charge_id"),
        "status": charge.get("status"),
        "redirect_url": charge.get("redirect_url"),
        "action_type": charge.get("action_type"),
    }


@router.post("/checkout/{identifier}/magpie-card/charge")
async def charge_magpie_card_source(
    identifier: str,
    payload: MagpieCardSourceRequest,
    db: AsyncSession = Depends(get_db),
):
    """Charge a one-time Magpie card source without accepting card data."""
    result = await db.execute(
        select(Transactions).where(func.lower(Transactions.external_id) == identifier.lower()).limit(1)
    )
    txn = result.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")
    currency = (txn.currency or "").strip().upper()
    if currency not in {"PHP", "KRW", "CNY"}:
        raise HTTPException(status_code=400, detail="Custom Magpie card checkout is only available for PHP, KRW, and CNY payments")
    if str(txn.status or "").lower() not in {"pending", "created"}:
        raise HTTPException(status_code=400, detail="This payment is no longer available")
    from services.magpie_services import MagpieService
    service = MagpieService()
    provider_currency = "PHP"
    provider_amount = float(txn.amount or 0)
    if currency != provider_currency:
        provider_amount = CurrencyConverter.convert(provider_amount, currency, provider_currency)
        if provider_amount < 1:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{currency} {float(txn.amount or 0):,.2f} converts to less than the provider minimum "
                    "of PHP 1.00. Increase the payment amount and try again."
                ),
            )
    charge = await service.create_charge(
        source_id=payload.source_id,
        amount=int(round(provider_amount * 100)),
        currency=provider_currency,
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


@router.post("/checkout/{identifier}/magpie-card")
async def create_magpie_card_checkout(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Create a separate Magpie card session for a manual PHP or KRW checkout."""
    result = await db.execute(
        select(Transactions).where(
            func.lower(Transactions.external_id) == identifier.lower(),
        ).limit(1)
    )
    txn = result.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")
    card_currency = (txn.currency or "").strip().upper()
    if card_currency not in {"PHP", "KRW"}:
        raise HTTPException(status_code=400, detail="Magpie card checkout is only available for PHP and KRW payments")
    if str(txn.status or "").lower() not in {"pending", "created"}:
        raise HTTPException(status_code=400, detail="This payment is no longer available")

    result = await gateway.create_payment(
        db,
        user_id=str(txn.user_id),
        amount=float(txn.amount),
        currency=card_currency,
        description=txn.description or f"{card_currency} card payment",
        transaction_type="payment_link",
        customer_name=txn.customer_name or "",
        customer_email=txn.customer_email or "",
        external_id=f"{txn.external_id}-CARD",
        payment_methods=["card"],
        metadata={"magpie_card": True, "source_transaction_id": txn.external_id},
    )
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Card checkout could not be initialized"))
    data = result.get("data") or {}
    checkout_url = data.get("checkout_url") or data.get("payment_url")
    if not checkout_url:
        raise HTTPException(status_code=502, detail="Magpie did not return a card checkout URL")
    return {
        "success": True,
        "checkout_url": checkout_url,
        "payment_url": checkout_url,
        "external_id": data.get("external_id") or data.get("payment_id"),
    }


def _is_reusable_open_amount_link(txn: Transactions) -> bool:
    return (
        bool(txn.external_id)
        and txn.external_id.startswith("OPEN-AMOUNT-")
        and txn.transaction_type in {"open_amount_link", "payment_link"}
        and float(txn.amount or 0) == 0
    )


def _is_reusable_payment_attempt(txn: Transactions) -> bool:
    return (
        txn.transaction_type == "payment_link"
        and bool(txn.external_id)
        and "-PAY-" in txn.external_id.upper()
    )


async def _create_reusable_payment_attempt(
    db: AsyncSession,
    template: Transactions,
) -> Transactions:
    """Create an independent payment attempt for a fixed reusable payment link."""
    reference = f"{template.external_id}-PAY-{uuid.uuid4().hex[:12].upper()}"
    now = datetime.now(timezone.utc)
    currency = (template.currency or "PHP").strip().upper()
    payment = Transactions(
        user_id=template.user_id,
        transaction_type="payment_link",
        amount=float(template.amount or 0.0),
        currency=currency,
        external_id=reference,
        status="pending",
        description=template.description or "Payment link payment",
        customer_name=template.customer_name,
        customer_email=template.customer_email,
        payment_url=build_checkout_url(reference, currency),
        created_at=now,
        updated_at=now,
    )
    db.add(payment)
    await db.flush()
    return payment


@router.post("/checkout/{identifier}/open-amount-request")
async def create_open_amount_payment_request(
    identifier: str,
    payload: OpenAmountPaymentRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create an individual approval request from a reusable open-amount link."""
    result = await db.execute(
        select(Transactions).where(
            func.lower(Transactions.external_id) == identifier.lower(),
        ).limit(1)
    )
    reusable = result.scalars().first()
    if not reusable or not _is_reusable_open_amount_link(reusable):
        raise HTTPException(status_code=404, detail="Reusable payment link not found")

    request_reference = f"OPEN-AMOUNT-PAY-{reusable.user_id}-{uuid.uuid4().hex[:12].upper()}"
    transfer_account = {}
    if str(reusable.currency or "").upper() == "KRW":
        transfer_account = await _select_manual_transfer_account(db, "KRW", payload.amount)
    payment = Transactions(
        user_id=reusable.user_id,
        transaction_type="open_amount_payment",
        amount=round(payload.amount, 2),
        currency=reusable.currency or "PHP",
        external_id=request_reference,
        status="pending",
        approval_status="pending",
        description="Customer-entered amount payment",
        payment_url=build_checkout_url(request_reference, reusable.currency),
        **transfer_account,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    publish_payment_link_created(payment)
    return {
        "success": True,
        "id": payment.id,
        "external_id": payment.external_id,
        "amount": payment.amount,
        "currency": payment.currency,
        "status": payment.status,
        "approval_status": payment.approval_status,
    }


async def _mark_transaction_webhook_status(
    db: AsyncSession,
    *,
    external_id: Optional[str],
    provider_reference: Optional[str] = None,
    status: str,
    amount: Optional[float] = None,
) -> bool:
    """Persist a payment notification status back to the matching transaction row."""
    if not external_id:
        logger.warning("Webhook status ignored because no external_id was provided")
        return False

    stmt = (
        select(Transactions)
        .where(or_(Transactions.external_id == external_id, Transactions.xendit_id == external_id))
        .order_by(Transactions.id.desc())
        .limit(1)
    )
    result = await db.execute(stmt)
    txn = result.scalars().first()
    if not txn:
        logger.warning("Webhook status update skipped: no transaction matched external_id=%s", external_id)
        return False

    if provider_reference:
        txn.xendit_id = provider_reference
    if amount is not None:
        try:
            txn.amount = float(amount)
        except (TypeError, ValueError):
            logger.warning("Ignored invalid webhook amount %r for external_id=%s", amount, external_id)

    if status in {"paid", "completed"}:
        from services.transactions import TransactionsService
        finalized = await TransactionsService(db).mark_as_paid(txn, gateway_label="Payment gateway")
        if not finalized:
            logger.error("Payment webhook could not finalize transaction %s", txn.id)
            return False
    else:
        txn.status = status
        txn.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(txn)
    return True


@router.post("/create-legacy-qr")
async def create_legacy_qr_payment(payload: dict, current_user: UserResponse = Depends(get_payment_user_allow_test("payments:write")), db: AsyncSession = Depends(get_db)):
    """Create a payment QR for `method` in payload ('alipay' or 'wechat').

    Expected payload: {"method": "alipay|wechat", "out_trade_no": "...", "amount": 1.23}
    """
    method = (payload.get("method") or "").lower()
    out_trade_no = payload.get("out_trade_no") or payload.get("reference_id")
    amount = payload.get("amount")

    if method not in ("alipay", "wechat"):
        raise HTTPException(status_code=400, detail="method must be 'alipay' or 'wechat'")
    if not out_trade_no or not amount:
        raise HTTPException(status_code=400, detail="out_trade_no and amount are required")

    success_url = payload.get("success_url")
    cancel_url = payload.get("cancel_url")
    metadata = payload.get("metadata")

    if method == "alipay":
        result = await alipay.create_precreate_qr(
            out_trade_no=out_trade_no, amount=amount, success_url=success_url, cancel_url=cancel_url, metadata=metadata
        )
    else:
        # WeChat expects integer fen amount in scaffold; convert if float provided
        fen = int(round(float(amount) * 100))
        result = await wechat.create_native_qr(out_trade_no=out_trade_no, amount_cny=fen, success_url=success_url, cancel_url=cancel_url, metadata=metadata)

    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error") or "payment provider error")

    # If provider returned a checkout_url (Magpie / web checkout), return it directly
    checkout_url = result.get("checkout_url") or result.get("checkout_url")
    if checkout_url:
        # cache checkout url for simple browser redirect flow
        # generate a short-lived access token and append to URL
        ttl_seconds = int(getattr(settings, "checkout_ttl_seconds", 900))
        token = secrets.token_urlsafe(32)
        parsed = urlparse(checkout_url)
        qs = parse_qs(parsed.query)
        qs["token"] = [token]
        tokenized_query = urlencode(qs, doseq=True)
        tokenized_url = urlunparse(parsed._replace(query=tokenized_query))
        _CHECKOUT_CACHE[out_trade_no] = tokenized_url

        # Persist checkout URL as a transaction record for production use
        try:
            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(seconds=int(getattr(settings, "checkout_ttl_seconds", 900)))

            txn = Transactions(
                user_id=str(current_user.id),
                transaction_type="checkout",
                external_id=out_trade_no,
                amount=float(amount),
                currency=result.get("currency") or "CNY",
                status="pending",
                description=(payload.get("description") or ""),
                payment_url=checkout_url,
                checkout_token=token,
                expires_at=expires_at,
                qr_code_url=result.get("qr_url") or None,
                customer_name=payload.get("customer_name"),
                customer_email=payload.get("customer_email"),
                created_at=now,
                updated_at=now,
            )
            db.add(txn)
            await db.commit()
        except Exception:
            logger.exception("Failed to persist checkout transaction")

        return {"success": True, "out_trade_no": out_trade_no, "checkout_url": tokenized_url, "raw": result.get("raw")}

    # Otherwise generate PNG and cache it in-memory for quick retrieval
    qr_text = result.get("qr_content") or result.get("qr_url") or result.get("code_url")
    buf = BytesIO()
    img = qrcode.make(qr_text)
    img.save(buf, format="PNG")
    buf.seek(0)

    _QR_CACHE[out_trade_no] = buf.getvalue()

    return {"success": True, "out_trade_no": out_trade_no, "qr_text": qr_text}



@router.get("/checkout-redirect/{out_trade_no}")
async def redirect_checkout(request: Request, out_trade_no: str, db: AsyncSession = Depends(get_db)):
    """Redirect browser to provider checkout URL previously returned by `/create`.

    This is a convenience wrapper for simple browser flows. In production you
    should persist the checkout URL server-side and validate access to it.
    """
    # Require token param for access control
    token_param = request.query_params.get("token")
    if not token_param:
        raise HTTPException(status_code=401, detail="missing token")

    # First check in-memory cache
    url = _CHECKOUT_CACHE.get(out_trade_no)

    # If not in cache, try to load from DB
    if not url and db:
        from sqlalchemy import select
        stmt = select(Transactions).where(Transactions.external_id == out_trade_no).limit(1)
        res = await db.execute(stmt)
        txn = res.scalars().first()
        if txn and txn.payment_url:
            # Enforce token match
            if getattr(txn, "checkout_token", None) != token_param:
                raise HTTPException(status_code=403, detail="invalid token")
            url = txn.payment_url
            # Append stored checkout token as `token` query param when available
            if getattr(txn, "checkout_token", None):
                try:
                    parsed = urlparse(url)
                    qs = parse_qs(parsed.query)
                    qs["token"] = [txn.checkout_token]
                    new_query = urlencode(qs, doseq=True)
                    url = urlunparse(parsed._replace(query=new_query))
                except Exception:
                    logger.exception("Failed to append token to checkout URL")
            # Append stored checkout token as `token` query param when available
            if getattr(txn, "checkout_token", None):
                try:
                    parsed = urlparse(url)
                    qs = parse_qs(parsed.query)
                    qs["token"] = [txn.checkout_token]
                    new_query = urlencode(qs, doseq=True)
                    url = urlunparse(parsed._replace(query=new_query))
                except Exception:
                    logger.exception("Failed to append token to checkout URL")

    if not url:
        raise HTTPException(status_code=404, detail="checkout url not found")

    # Enforce TTL using stored transaction created_at when possible
    ttl_seconds = int(getattr(settings, "checkout_ttl_seconds", 900))
    try:
        if db:
            from sqlalchemy import select
            stmt = select(Transactions).where(Transactions.external_id == out_trade_no).limit(1)
            res = await db.execute(stmt)
            txn = res.scalars().first()
            if txn:
                # Token must match stored token
                if getattr(txn, "checkout_token", None) != token_param:
                    raise HTTPException(status_code=403, detail="invalid token")
                if txn.expires_at:
                    if datetime.now(timezone.utc) > txn.expires_at:
                        raise HTTPException(status_code=410, detail="checkout url expired")
                elif txn.created_at:
                    age = datetime.now(timezone.utc) - txn.created_at
                    if age > timedelta(seconds=ttl_seconds):
                        raise HTTPException(status_code=410, detail="checkout url expired")
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error checking checkout TTL")

    return RedirectResponse(url)


@router.get("/qr/{out_trade_no}")
async def get_qr(out_trade_no: str):
    """Return a PNG QR image for a previously-created `out_trade_no`.

    This returns an in-memory image created by `/create`. In production you
    should store images on disk or generate them on-demand.
    """
    img = _QR_CACHE.get(out_trade_no)
    if not img:
        raise HTTPException(status_code=404, detail="QR not found")
    return StreamingResponse(BytesIO(img), media_type="image/png")


@router.post("/notify/alipay")
async def notify_alipay(request: Request, db: AsyncSession = Depends(get_db)):
    form = await request.form()
    data = dict(form)
    ok = await alipay.verify_notify(data)
    if not ok:
        logger.warning("Alipay notify failed verification: %s", data)
        return JSONResponse({"success": False, "error": "signature verification failed"})

    trade_status = (data.get("trade_status") or "").upper()
    external_id = data.get("out_trade_no") or data.get("merchant_out_order_no")
    provider_reference = data.get("trade_no") or data.get("out_trade_no")
    amount_raw = data.get("total_amount") or data.get("amount")

    try:
        amount = float(amount_raw) if amount_raw is not None and amount_raw != "" else None
    except (TypeError, ValueError):
        amount = None

    if trade_status in {"TRADE_SUCCESS", "TRADE_FINISHED"}:
        db_status = "paid"
    elif trade_status in {"TRADE_CLOSED", "TRADE_CANCELED", "TRADE_FAILED"}:
        db_status = "failed"
    else:
        db_status = "pending"

    await _mark_transaction_webhook_status(
        db,
        external_id=external_id,
        provider_reference=provider_reference,
        status=db_status,
        amount=amount,
    )

    return JSONResponse({"success": True, "status": db_status})


@router.post("/notify/wechat")
async def notify_wechat(request: Request, db: AsyncSession = Depends(get_db)):
    body = await request.body()
    xml = body.decode("utf-8")
    ok = await wechat.verify_notify(xml)
    if not ok:
        logger.warning("WeChat notify failed verification")
        return StreamingResponse(content=b"<xml><return_code>FAIL</return_code></xml>", media_type="application/xml")

    payload = xmltodict.parse(xml).get("xml", {})
    trade_state = (payload.get("trade_state") or "").upper()
    result_code = (payload.get("result_code") or "").upper()
    external_id = payload.get("out_trade_no")
    provider_reference = payload.get("transaction_id")
    amount_raw = payload.get("total_fee")

    try:
        amount = float(amount_raw) / 100.0 if amount_raw not in (None, "") else None
    except (TypeError, ValueError):
        amount = None

    if trade_state in {"SUCCESS", "FINISHED"} or result_code == "SUCCESS":
        db_status = "paid"
    elif trade_state in {"CLOSED", "REVOKED", "PAYERROR"}:
        db_status = "failed"
    else:
        db_status = "pending"

    await _mark_transaction_webhook_status(
        db,
        external_id=external_id,
        provider_reference=provider_reference,
        status=db_status,
        amount=amount,
    )

    return StreamingResponse(content=b"<xml><return_code>SUCCESS</return_code></xml>", media_type="application/xml")


class CreatePaymentPayload(BaseModel):
    amount: float
    description: str = ""
    currency: str = "PHP"
    transaction_type: Literal["payment_link", "invoice"] = "invoice"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class UpdatePaymentStatusPayload(BaseModel):
    status: str = "pending"
    provider_reference: str = ""
    metadata: Dict[str, Any] = Field(default_factory=dict)


@router.post("/create")
async def create_payment(
    request: Request,
    payload: CreatePaymentPayload = None,
    receipt: UploadFile = File(None),
    current_user: UserResponse = Depends(get_payment_user_allow_test("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    """Create payment. Supports JSON body (application/json) or multipart/form-data with an optional `receipt` file.

    If a receipt is provided it will be saved under `static/uploads/{BANK_RECEIPTS_SUBDIR}` and the path
    included in the payment metadata as `receipt_path`.
    """
    try:
        # Determine content type to parse payload accordingly
        content_type = request.headers.get("content-type", "")
        metadata = {}
        if content_type.startswith("multipart/form-data"):
            form = await request.form()
            if "method" in form or "out_trade_no" in form or "reference_id" in form:
                legacy_payload = {
                    "method": form.get("method"),
                    "out_trade_no": form.get("out_trade_no") or form.get("reference_id"),
                    "amount": form.get("amount"),
                    "success_url": form.get("success_url"),
                    "cancel_url": form.get("cancel_url"),
                    "description": form.get("description"),
                    "metadata": {
                        key[5:]: value
                        for key, value in form.items()
                        if key.startswith("meta_")
                    },
                }
                return await create_legacy_qr_payment(legacy_payload, current_user=current_user, db=db)
            # FastAPI already exposes `receipt` as UploadFile param when declared, but form may be used
            amount = float(form.get("amount", 0))
            description = form.get("description", "")
            currency = form.get("currency", "PHP")
            # collect any metadata fields prefixed with meta_
            for k, v in form.items():
                if k.startswith("meta_"):
                    metadata[k[5:]] = v

            # Handle receipt file saving
            receipt_path = None
            if receipt and getattr(receipt, "filename", None):
                uploads_dir = os.path.join(os.path.dirname(__file__), "..", "static", "uploads", BANK_RECEIPTS_SUBDIR)
                os.makedirs(uploads_dir, exist_ok=True)
                ext = os.path.splitext(receipt.filename)[1] or ".bin"
                filename = f"{uuid.uuid4().hex}{ext}"
                file_path = os.path.join(uploads_dir, filename)
                content = await receipt.read()
                with open(file_path, "wb") as f:
                    f.write(content)
                receipt_path = f"/uploads/{BANK_RECEIPTS_SUBDIR}/{filename}"
                metadata["receipt_path"] = receipt_path

            # Call gateway
            result = await gateway.create_payment(
                db,
                user_id=str(current_user.id),
                amount=amount,
                currency=currency,
                description=description,
                transaction_type="bank_deposit",
                customer_name=metadata.get("customer_name", ""),
                customer_email=metadata.get("customer_email", ""),
                external_id=metadata.get("external_id"),
                payment_methods=metadata.get("payment_methods", []),
                metadata=metadata,
            )
            payment_event_bus.publish({
                "event_type": "payment_created",
                "payment_id": result.get("transaction_id") or result.get("id") if isinstance(result, dict) else None,
                "user_id": str(current_user.id),
                "user_name": getattr(current_user, "name", None) or str(current_user.id),
                "amount": amount,
                "currency": currency,
                "description": description,
            })
            return result
        else:
            # JSON body
            body = await request.json()
            if isinstance(body, dict) and ("method" in body or "out_trade_no" in body or "reference_id" in body):
                return await create_legacy_qr_payment(body, current_user=current_user, db=db)
            payload = CreatePaymentPayload(**body)
            result = await gateway.create_payment(
                db,
                user_id=str(current_user.id),
                amount=payload.amount,
                currency=payload.currency,
                description=payload.description,
                transaction_type=payload.transaction_type,
                customer_name=payload.metadata.get("customer_name", ""),
                customer_email=payload.metadata.get("customer_email", ""),
                external_id=payload.metadata.get("external_id"),
                payment_methods=payload.metadata.get("payment_methods"),
                metadata=payload.metadata,
            )
            payment_event_bus.publish({
                "event_type": "payment_created",
                "payment_id": result.get("transaction_id") or result.get("id") if isinstance(result, dict) else None,
                "user_id": str(current_user.id),
                "user_name": getattr(current_user, "name", None) or str(current_user.id),
                "amount": payload.amount,
                "currency": payload.currency,
                "description": payload.description,
            })
            return result
    except ValueError as exc:
        logger.warning("Rejected payment creation: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to create payment")
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{payment_id}")
async def get_payment(
    payment_id: str,
    current_user: UserResponse = Depends(get_payment_user_allow_test("payments:read")),
    db: AsyncSession = Depends(get_db),
):
    processor = PaymentProcessor(db)
    try:
        return await processor.get_payment(payment_id=payment_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{payment_id}/status")
async def update_payment_status(
    payment_id: str,
    payload: UpdatePaymentStatusPayload,
    current_user: UserResponse = Depends(get_payment_user_allow_test("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    processor = PaymentProcessor(db)
    try:
        return await processor.update_payment_status(
            payment_id=payment_id,
            status=payload.status,
            provider_reference=payload.provider_reference or None,
            metadata=payload.metadata,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/checkout/{identifier}/gcash")
async def redirect_hosted_gcash(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Redirect legacy GCash links to the hosted QR payment page."""
    stmt = select(Transactions).where(
        func.lower(Transactions.external_id) == identifier.lower(),
        func.lower(Transactions.currency) == "php",
    ).limit(1)
    result = await db.execute(stmt)
    txn = result.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")

    target = str(txn.qr_code_url or txn.payment_url or "").strip()
    if not target:
        raise HTTPException(status_code=404, detail="GCash app link is not available")
    hosted_url = (
        f"/checkout/{quote(str(txn.external_id), safe='')}/gcash"
        f"?payment_method=qrph&qr={quote(target, safe='')}"
    )
    return RedirectResponse(url=hosted_url, status_code=307)


@router.get("/checkout/{identifier}")
async def get_checkout_payment(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Get payment details for checkout page (unauthenticated public endpoint).
    
    Searches by multiple identifiers:
    - external_id (payment reference from xend)
    - xendit_id (gateway payment ID)
    - transaction ID (numeric)
    - external_id with retry suffix (e.g., REF-8HAOBTRP matches REF-8HAOBTRP-1a700f)
    """
    try:
        # Public checkout identifiers must be opaque provider/reference IDs.
        conditions = [
            func.lower(Transactions.external_id) == identifier.lower(),
            func.lower(Transactions.xendit_id) == identifier.lower(),
            func.lower(Transactions.payment_url) == identifier.lower(),
            func.lower(Transactions.qr_code_url) == identifier.lower(),
        ]
        
        stmt = select(Transactions).where(or_(*conditions)).limit(1)
        result = await db.execute(stmt)
        txn = result.scalars().first()
        
        if not txn:
            logger.warning(f"Checkout payment not found: {identifier}")
            raise HTTPException(status_code=404, detail="Payment not found")
        # The reusable zero-amount link is always public. Individual amounts
        # become approval requests through the open-amount-request endpoint.
        # Fixed links create one independent attempt per new checkout session;
        # the attempt identifier remains stable across refreshes.
        if txn.transaction_type == "payment_link" and not _is_reusable_open_amount_link(txn) and not _is_reusable_payment_attempt(txn):
            txn = await _create_reusable_payment_attempt(db, txn)
            await db.commit()
        
        # Try to fetch merchant branding
        merchant_name = "Merchant"
        merchant_logo_url = None
        bank_name = None
        bank_account_number = None
        bank_account_name = None
        try:
            # 1. Try to find the AdminUser to get organization_id
            admin_stmt = select(AdminUser).where(AdminUser.telegram_id == txn.user_id).limit(1)
            admin_res = await db.execute(admin_stmt)
            admin = admin_res.scalar_one_or_none()

            if admin and admin.organization_id:
                # 2. Get MerchantApiConfig for branding
                cfg_stmt = (
                    select(MerchantApiConfig)
                    .where(
                        MerchantApiConfig.organization_id == admin.organization_id,
                        MerchantApiConfig.user_id == str(txn.user_id),
                    )
                    .order_by(MerchantApiConfig.id.asc())
                    .limit(1)
                )
                cfg_res = await db.execute(cfg_stmt)
                cfg = cfg_res.scalars().first()
                if not cfg:
                    cfg_stmt = (
                        select(MerchantApiConfig)
                        .where(MerchantApiConfig.organization_id == admin.organization_id)
                        .order_by(MerchantApiConfig.id.asc())
                        .limit(1)
                    )
                    cfg_res = await db.execute(cfg_stmt)
                    cfg = cfg_res.scalars().first()
                if cfg:
                    merchant_name = cfg.store_name or admin.organization_name or merchant_name
                    merchant_logo_url = cfg.store_logo_url
                bank_name = admin.bank_name
                bank_account_number = admin.bank_account_number
                bank_account_name = admin.bank_account_name
            elif admin:
                merchant_name = admin.organization_name or merchant_name
                bank_name = admin.bank_name
                bank_account_number = admin.bank_account_number
                bank_account_name = admin.bank_account_name
        except Exception as e:
            logger.error(f"Error fetching merchant branding for txn {txn.id}: {e}")

        if (txn.currency or "").upper() == "PHP" and float(txn.amount or 0) > 50000:
            bank_name = "Security Bank Corporation"
            bank_account_number = "0000068888173"
            bank_account_name = "SwiftPay Ventures Inc."
        elif (txn.currency or "").upper() == "KRW":
            virtual_account = await _get_toss_account_for_transaction(db, txn)
            bank_name = virtual_account["bank_name"]
            bank_account_number = virtual_account["number"]
            bank_account_name = virtual_account["account_name"]

        logger.info(f"Checkout payment retrieved: {identifier} -> txn_id={txn.id}")
        display_amount = float(txn.original_amount if txn.original_amount is not None else txn.amount)
        display_currency = txn.original_currency or txn.currency or "PHP"
        return {
            "success": True,
            "id": txn.id,
            "external_id": txn.external_id,
            "transaction_type": txn.transaction_type,
            "amount": display_amount,
            "currency": display_currency,
            "processing_amount": float(txn.amount),
            "processing_currency": txn.currency or "PHP",
            "status": txn.status,
            "description": txn.description or "",
            "payment_url": txn.payment_url or "",
            "qr_code_url": txn.qr_code_url or "",
            "customer_name": txn.customer_name or "",
            "customer_email": txn.customer_email or "",
            "merchant_name": merchant_name,
            "merchant_logo_url": merchant_logo_url,
            "bank_name": bank_name,
            "bank_account_number": bank_account_number,
            "bank_account_name": bank_account_name,
            "created_at": serialize_utc_datetime(txn.created_at),
            "updated_at": serialize_utc_datetime(txn.updated_at),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error retrieving checkout payment {identifier}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error retrieving payment") from exc


@router.get("/checkout/{identifier}/status")
async def get_checkout_status(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Get payment status for polling (unauthenticated public endpoint).
    
    Returns minimal payment status information for real-time updates on the checkout page.
    Searches by multiple identifiers including retry suffix pattern matching.
    """
    try:
        # Try to match by external_id, xendit_id, or transaction ID (CASE-INSENSITIVE for strings)
        conditions = [
            func.lower(Transactions.external_id) == identifier.lower(),
            func.lower(Transactions.xendit_id) == identifier.lower(),
            func.lower(Transactions.payment_url) == identifier.lower(),
            func.lower(Transactions.qr_code_url) == identifier.lower(),
        ]
        
        stmt = select(Transactions).where(or_(*conditions)).limit(1)
        result = await db.execute(stmt)
        txn = result.scalars().first()
        
        if not txn:
            logger.warning(f"Checkout status not found: {identifier}")
            raise HTTPException(status_code=404, detail="Payment not found")
        
        display_amount = float(txn.original_amount if txn.original_amount is not None else txn.amount)
        display_currency = txn.original_currency or txn.currency or "PHP"
        return {
            "status": txn.status,
            "amount": display_amount,
            "currency": display_currency,
            "processing_amount": float(txn.amount),
            "processing_currency": txn.currency or "PHP",
            "payment_url": txn.payment_url or "",
            "updated_at": serialize_utc_datetime(txn.updated_at),
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error retrieving checkout status {identifier}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error retrieving payment status") from exc


@router.get("/checkout/{identifier}/institutions")
async def get_checkout_institutions(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Fetch available financial institutions for this checkout (public)."""
    try:
        stmt = select(Transactions).where(
            or_(
                func.lower(Transactions.external_id) == identifier.lower(),
                func.lower(Transactions.xendit_id) == identifier.lower(),
                func.lower(Transactions.payment_url) == identifier.lower(),
                func.lower(Transactions.qr_code_url) == identifier.lower(),
            )
        ).limit(1)
        result = await db.execute(stmt)
        txn = result.scalars().first()

        if not txn:
            raise HTTPException(status_code=404, detail="Payment not found")

        # If it's an international wallet routed to Magpie, don't return PH banks
        if txn.transaction_type in ["alipay_qr", "wechat_qr"]:
            # Optionally return specific Magpie wallet info here if needed
            return {"success": True, "data": []}

        if (txn.currency or "").upper() != "PHP":
            return {"success": True, "data": []}

        res = await gateway.swift.get_collection_institutions()
        if not res.get("success"):
            # Keep PHP checkout usable when the provider catalog is temporarily
            # unavailable. The local catalog contains the supported bank codes.
            return {
                "success": True,
                "data": PHBanksService.get_all_banks_dict(),
            }
        if not isinstance(res.get("data"), list) or not res["data"]:
            res["data"] = PHBanksService.get_all_banks_dict()

        if (txn.currency or "").upper() == "PHP":
            channels = await get_payment_channels(db)
            enabled_institutions = channels.get("PHP", {}).get("checkout_institutions")
            if isinstance(enabled_institutions, list):
                enabled_codes = {str(code).upper() for code in enabled_institutions}
                res["data"] = [
                    item for item in res.get("data", [])
                    if _institution_matches_enabled(item.get("code", ""), enabled_codes)
                ]
                returned_codes = {str(item.get("code", "")).upper() for item in res["data"]}
                # QRPH is always available for PHP checkout
                if "QRPH" not in returned_codes:
                    res["data"].insert(0, {"id": "QRPH", "code": "QRPH", "name": "QR Ph", "logoUrl": "/logos/qrph.svg", "enabled": True, "loginMethod": "qr"})
                if "bank_transfer" in channels.get("PHP", {}).get("checkout", []) and "NETBANK" not in returned_codes:
                    res["data"].append({"id": "NETBANK", "code": "NETBANK", "name": "NetBank", "logoUrl": "/logos/netbank.png", "enabled": True, "loginMethod": "redirect"})
                if "BDO" in enabled_codes and "BDO" not in returned_codes:
                    res["data"].append({"id": "BDO", "code": "BDO", "name": "BDO", "logoUrl": "/logos/bdo.svg", "enabled": True, "loginMethod": "redirect"})
                # Alipay is exposed as a SwiftPay institution checkout. Some
                # accounts do not include it in the provider catalog response,
                # even though it is enabled in the merchant channel settings.
                # Alipay is handled through the QR Ph flow below, so it does
                # not need to be present in SwiftPay's bank catalog.
                res["data"] = [
                    item for item in res["data"]
                    if str(item.get("code", "")).upper() != "ALIPAY"
                ]
                if not res["data"]:
                    res["data"] = PHBanksService.get_all_banks_dict()
                res["data"].append({
                    "id": "ALIPAY",
                    "code": "ALIPAY",
                    "name": "Alipay",
                    "logoUrl": "/logos/alipay.png",
                    "enabled": True,
                    "loginMethod": "qr",
                })
        if (txn.currency or "").upper() == "PHP" and not any(
            str(item.get("code", "")).upper() == "ALIPAY"
            for item in (res.get("data") or [])
            if isinstance(item, dict)
        ):
            res.setdefault("data", []).append({
                "id": "ALIPAY",
                "code": "ALIPAY",
                "name": "Alipay",
                "logoUrl": "/logos/alipay.png",
                "enabled": True,
                "loginMethod": "qr",
            })
        return res
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error fetching institutions for {identifier}: {exc}")
        return {"success": False, "error": "Could not fetch payment methods"}


@router.post("/checkout/{identifier}/institution")
async def select_checkout_institution(
    identifier: str,
    payload: CheckoutInstitutionRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create the bank-specific SwiftPay redirect for a public PHP checkout."""
    txn = await db.get(Transactions, int(identifier)) if identifier.isdigit() else None
    if not txn:
        stmt = select(Transactions).where(
            or_(
                func.lower(Transactions.external_id) == identifier.lower(),
                func.lower(Transactions.xendit_id) == identifier.lower(),
                func.lower(Transactions.payment_url) == identifier.lower(),
                func.lower(Transactions.qr_code_url) == identifier.lower(),
            )
        ).limit(1)
        result = await db.execute(stmt)
        txn = result.scalars().first()
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Fixed payment links are reusable templates. Each checkout gets its own
    # transaction so approval and wallet crediting remain independent.
    if txn.transaction_type == "payment_link" and not _is_reusable_open_amount_link(txn) and not _is_reusable_payment_attempt(txn):
        txn = await _create_reusable_payment_attempt(db, txn)

    if (txn.currency or "").upper() != "PHP":
        raise HTTPException(status_code=400, detail="Institution selection is only available for PHP payments")
    amount_php = float(txn.amount or 0)
    if amount_php < SWIFTPAY_MIN_PHP_AMOUNT:
        raise HTTPException(
            status_code=400,
            detail="PHP institution checkout requires an amount of at least PHP 1.",
        )

    institution_code = payload.institution_code.strip().upper()
    channels = await get_payment_channels(db)
    enabled_institutions = channels.get("PHP", {}).get("checkout_institutions")
    bank_transfer_enabled = "bank_transfer" in channels.get("PHP", {}).get("checkout", [])
    enabled_codes = {str(code).strip().upper() for code in enabled_institutions} if isinstance(enabled_institutions, list) else set()
    if (
        isinstance(enabled_institutions, list)
        and institution_code not in {"QRPH", "NETBANK"}
        and not _institution_matches_enabled(institution_code, enabled_codes)
    ):
        raise HTTPException(status_code=400, detail="The selected bank is currently unavailable")
    # QRPH is always available for PHP checkout
    if institution_code == "NETBANK" and not bank_transfer_enabled:
        raise HTTPException(status_code=400, detail="Netbank is currently unavailable")
    service = SwiftPayService()
    if not service.is_configured():
        raise HTTPException(status_code=400, detail="SwiftPay is not configured")

    # SwiftPay can keep an institution in the merchant configuration while
    # temporarily disabling it at the provider level. Do not send provider
    # orders unless the live catalog confirms that the institution is available.
    # NETBANK is a local/manual channel and is not a SwiftPay institution.
    if institution_code not in {"GCASH", "QRPH", "ALIPAY", "NETBANK"}:
        live_institutions = await service.get_collection_institutions()
        live_codes = {
            str(item.get("code") or "").strip().upper()
            for item in (live_institutions.get("data") or [])
            if isinstance(item, dict)
        }
        live_match = any(
            code == institution_code
            or _institution_matches_enabled(code, {institution_code})
            for code in live_codes
        )
        if not live_institutions.get("success") or not live_match:
            logger.warning(
                "SwiftPay %s checkout rejected because the institution is not live for this account: %s",
                institution_code,
                live_institutions.get("error"),
            )
            raise HTTPException(
                status_code=503,
                detail=f"{institution_code} is currently unavailable on SwiftPay. Please choose another payment method or contact the payment administrator.",
            )

    if institution_code in {"GCASH", "QRPH", "ALIPAY"}:
        qr_result = await service.generate_qrph(
            amount=float(txn.amount),
            reference_no=txn.external_id,
            currency="PHP",
            qr_type="P2M",
        )
        if not qr_result.get("success"):
            raise HTTPException(status_code=502, detail=qr_result.get("error", "Could not create GCash QRPH checkout"))

        qr_data = qr_result.get("data") or {}
        if not isinstance(qr_data, dict):
            raise HTTPException(status_code=502, detail="SwiftPay returned an invalid QRPH response")
        qr_code = (
            qr_data.get("qrCode")
            or qr_data.get("qr_code")
            or qr_data.get("qrCodeUrl")
            or qr_data.get("qr_code_url")
            or qr_data.get("qrImage")
            or qr_data.get("qr_image")
            or qr_data.get("paymentUrl")
            or qr_data.get("payment_url")
        )
        qr_content = (
            qr_data.get("qrContent")
            or qr_data.get("qr_content")
            or qr_data.get("qrPayload")
            or qr_data.get("qr_payload")
            or qr_data.get("emvco")
            or qr_data.get("payload")
            or qr_data.get("codeUrl")
            or qr_data.get("code_url")
        )
        deep_link = (
            qr_data.get("gcashDeepLink")
            or qr_data.get("gcash_deep_link")
            or qr_data.get("deepLink")
            or qr_data.get("deep_link")
            or qr_data.get("deeplink")
        )
        if not qr_code and not qr_content and not deep_link:
            raise HTTPException(status_code=502, detail="SwiftPay did not return a QRPH payload")

        direct_gcash_deep_link = (
            deep_link
            if institution_code == "GCASH" and str(deep_link or "").lower().startswith("gcash://")
            else None
        )
        direct_alipay_deep_link = (
            deep_link
            if institution_code == "ALIPAY"
            and str(deep_link or "").lower().startswith(("alipay://", "alipays://"))
            else None
        )

        txn.payment_url = deep_link or qr_code or qr_content
        txn.qr_code_url = qr_code or qr_content
        provider_reference = qr_result.get("reference_no")
        if provider_reference and provider_reference != txn.external_id:
            # A duplicate reference is retried with a provider-safe suffix.
            # Keep the alias locally so the webhook can still resolve this
            # payment back to the public checkout transaction.
            txn.xendit_id = provider_reference
        txn.transaction_type = "alipay_qr" if institution_code == "ALIPAY" else "swiftpay_qr"
        txn.updated_at = datetime.now(timezone.utc)
        await db.commit()

        hosted_gcash_url = (
            f"{checkout_host('PHP')}/"
            f"api/v1/payments/checkout/{quote(str(txn.external_id), safe='')}/gcash"
        )
        hosted_alipay_url = (
            f"{checkout_host('PHP')}/"
            f"checkout/{quote(str(txn.external_id), safe='')}/alipay?payment_method=alipay"
        )

        return {
            "success": True,
            "payment_method": "alipay" if institution_code == "ALIPAY" else ("gcash" if institution_code == "GCASH" else "qrph"),
            "qr_code": qr_code,
            "qr_content": qr_content,
            # Prefer the provider-generated app link so the customer opens this
            # exact QRPH payment in GCash. Keep the hosted redirect as fallback.
            "gcash_deep_link": direct_gcash_deep_link,
            "gcash_hosted_deep_link": hosted_gcash_url if direct_gcash_deep_link else None,
            "alipay_deep_link": direct_alipay_deep_link,
            "alipay_hosted_deep_link": hosted_alipay_url if institution_code == "ALIPAY" else None,
            "redirect_url": (
                f"/checkout/{txn.external_id}/alipay?payment_method=alipay"
                if institution_code == "ALIPAY"
                else f"/checkout/{txn.external_id}?payment_method={'gcash' if institution_code == 'GCASH' else 'qrph'}"
            ),
        }

    order_result = await service.create_order(
        amount=float(txn.amount),
        reference_no=txn.external_id,
        details={
            "description": txn.description or "",
            "customer_name": txn.customer_name or "",
            "customer_email": txn.customer_email or "",
        },
        currency="PHP",
        generate_customer_redirect_url=True,
        institution_code=institution_code,
    )
    if not order_result.get("success"):
        raise HTTPException(status_code=502, detail=order_result.get("error", "Could not create bank checkout"))

    order_data = order_result.get("data") or {}
    redirect_url = (
        order_data.get("institutionRedirectUrl")
        or order_data.get("institution_redirect_url")
        or order_data.get("bankRedirectUrl")
        or order_data.get("bank_redirect_url")
        or order_data.get("customerRedirectUrl")
        or order_data.get("customer_redirect_url")
        or ""
    )
    parsed_redirect = urlparse(str(redirect_url)) if redirect_url else None
    if not redirect_url or not parsed_redirect or parsed_redirect.scheme not in {"http", "https"} or not parsed_redirect.netloc:
        raise HTTPException(status_code=502, detail="SwiftPay did not return a direct bank payment URL")
    if parsed_redirect.path.rstrip("/").endswith(f"/checkout/{txn.external_id}"):
        raise HTTPException(status_code=502, detail="SwiftPay returned its generic checkout URL instead of a bank payment URL")

    gateway_id = order_data.get("paymentId") or order_data.get("payment_id") or order_data.get("id")
    if gateway_id:
        txn.xendit_id = gateway_id
    txn.payment_url = redirect_url
    if institution_code == "ALIPAY":
        # Keep the customer on our checkout page and render the SwiftPay
        # redirect URL as a scannable Alipay QR code. The URL remains the
        # provider's payment authorization target; no secret is exposed.
        txn.qr_code_url = redirect_url
        txn.transaction_type = "alipay_qr"
    txn.updated_at = datetime.now(timezone.utc)
    await db.commit()

    if institution_code == "ALIPAY":
        return {
            "success": True,
            "payment_method": "alipay",
            "qr_content": redirect_url,
            "qr_code": redirect_url,
            "redirect_url": f"/checkout/{txn.external_id}?payment_method=alipay",
        }

    return {"success": True, "redirect_url": redirect_url}
