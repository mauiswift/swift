"""Fallback open-amount routes for deployments with a partial router load."""

from datetime import datetime, timezone
from typing import Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.config import settings
from core.constants import PHP_CHECKOUT_INSTITUTIONS
from dependencies.auth import get_payment_user
from models.admin_users import AdminUser
from models.merchant_api_config import MerchantApiConfig
from models.transactions import Transactions
from models.auth import User
from utils.datetime import serialize_utc_datetime
from schemas.auth import UserResponse
from services.magpie_services import MagpieService
from services.app_settings import get_payment_channels
from services.app_settings import get_deposit_accounts
from services.swiftpay_service import SwiftPayService
from services.ph_banks_service import PHBanksService
from services.payment_gateway import _is_security_bank_name, _select_manual_transfer_account
from services.paymentwall_service import PaymentwallService
from services.transactions import publish_payment_link_created
from services.checkout_urls import build_checkout_url

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])
xend_compat_router = APIRouter(prefix="/api/v1/xend", tags=["xend"])

SUPPORTED_CURRENCIES = {"PHP", "KRW", "CNY", "USDT"}
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


def _institution_matches_enabled(code: str, enabled_codes: set[str]) -> bool:
    normalized = str(code or "").strip().upper()
    return normalized in enabled_codes or any(
        normalized.startswith(prefix)
        for enabled in enabled_codes
        for prefix in SWIFTPAY_INSTITUTION_PREFIXES.get(enabled, ())
    )


@router.post("/create-payment-link", include_in_schema=False)
async def create_payment_link_compat(
    payload: dict,
    current_user: UserResponse = Depends(get_payment_user),
    db: AsyncSession = Depends(get_db),
):
    """Support older frontend bundles that post to the legacy payment path."""
    from routers.xend import CreatePaymentRequest, _process_xend_request

    request = CreatePaymentRequest(
        amount=float(payload.get("amount") or 0),
        currency=payload.get("currency"),
        description=payload.get("description") or "Payment link",
        customer_name=payload.get("customer_name") or "",
        customer_email=payload.get("customer_email") or "",
        external_id=payload.get("external_id") or payload.get("reference_no") or "",
        payment_methods=payload.get("payment_methods") or [],
    )
    return await _process_xend_request(
        db=db,
        current_user=current_user,
        request=request,
        transaction_type="payment_link",
    )


@xend_compat_router.post("/create-payment-link", include_in_schema=False)
async def create_xend_payment_link_compat(
    payload: dict,
    current_user: UserResponse = Depends(get_payment_user),
    db: AsyncSession = Depends(get_db),
):
    """Keep payment-link creation available when the full Xend router cannot load."""
    from routers.xend import CreatePaymentRequest, _process_xend_request

    request = CreatePaymentRequest(
        amount=float(payload.get("amount") or 0),
        currency=payload.get("currency"),
        description=payload.get("description") or "Payment link",
        customer_name=payload.get("customer_name") or "",
        customer_email=payload.get("customer_email") or "",
        external_id=payload.get("external_id") or payload.get("reference_no") or "",
        payment_methods=payload.get("payment_methods") or [],
    )
    return await _process_xend_request(
        db=db,
        current_user=current_user,
        request=request,
        transaction_type="payment_link",
    )


@router.get("/checkout/{identifier}/institutions", include_in_schema=False)
async def get_checkout_institutions_compat(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    txn = await _get_checkout_transaction(identifier, db)
    if (txn.currency or "").upper() != "PHP":
        return {"success": True, "data": []}
    channels = await get_payment_channels(db)
    enabled = channels.get("PHP", {}).get("checkout_institutions")
    enabled_codes = {
        str(code).strip().upper()
        for code in (enabled if isinstance(enabled, list) else PHP_CHECKOUT_INSTITUTIONS)
    }
    result = await SwiftPayService().get_collection_institutions()
    data = result.get("data") if result.get("success") else []
    if not isinstance(data, list) or not data:
        data = PHBanksService.get_all_banks_dict()
    institutions = [
        item for item in data
        if isinstance(item, dict) and _institution_matches_enabled(item.get("code"), enabled_codes)
    ]
    returned_codes = {str(item.get("code") or "").upper() for item in institutions}
    if "QRPH" not in returned_codes:
        institutions.insert(0, {
            "id": "QRPH", "code": "QRPH", "name": "QR Ph",
            "logoUrl": "/logos/qrph.svg", "enabled": True, "loginMethod": "qr",
        })
    if "bank_transfer" in channels.get("PHP", {}).get("checkout", []) and "NETBANK" not in returned_codes:
        institutions.append({
            "id": "NETBANK", "code": "NETBANK", "name": "NetBank",
            "logoUrl": "/logos/netbank.png", "enabled": True, "loginMethod": "redirect",
        })
    institutions.append({
        "id": "ALIPAY", "code": "ALIPAY", "name": "Alipay",
        "logoUrl": "/logos/alipay.png", "enabled": True, "loginMethod": "qr",
    })
    return {"success": True, "data": institutions}


@router.post("/checkout/{identifier}/institution", include_in_schema=False)
async def select_checkout_institution_compat(
    identifier: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    txn = await _get_checkout_transaction(identifier, db)
    if (txn.currency or "").upper() != "PHP":
        raise HTTPException(status_code=400, detail="Institution selection is only available for PHP payments")
    institution_code = str(payload.get("institution_code") or "").strip().upper()
    if not institution_code:
        raise HTTPException(status_code=422, detail="Institution code is required")
    service = SwiftPayService()
    if not service.is_configured():
        raise HTTPException(status_code=400, detail="SwiftPay is not configured")

    if institution_code in {"GCASH", "QRPH", "ALIPAY"}:
        qr_result = await service.generate_qrph(
            amount=float(txn.amount),
            reference_no=txn.external_id,
            currency="PHP",
            qr_type="P2M",
        )
        if not qr_result.get("success"):
            raise HTTPException(status_code=502, detail=qr_result.get("error", "Could not create QRPH checkout"))
        data = qr_result.get("data") or {}
        qr_code = data.get("qrCode") or data.get("qr_code") or data.get("qrImage") or data.get("qr_image")
        qr_content = data.get("qrContent") or data.get("qr_content") or data.get("payload")
        deep_link = data.get("gcashDeepLink") or data.get("gcash_deep_link") or data.get("deepLink")
        if not qr_code and not qr_content and not deep_link:
            raise HTTPException(status_code=502, detail="SwiftPay did not return a QRPH payload")
        txn.payment_url = deep_link or qr_code or qr_content
        txn.qr_code_url = qr_code or qr_content
        txn.transaction_type = "alipay_qr" if institution_code == "ALIPAY" else "swiftpay_qr"
        txn.updated_at = datetime.now(timezone.utc)
        await db.commit()
        bank_name = txn.bank_name
        bank_account_number = txn.bank_account_number
        bank_account_name = txn.bank_account_name
        if (txn.currency or "").upper() == "KRW" and not bank_account_number:
            configured_accounts = [
                account for account in await get_deposit_accounts(db)
                if str(account.get("currency", "")).upper() == "KRW"
                and str(account.get("account_number", "")).strip()
                and str(account.get("account_name", "")).strip()
            ]
            if configured_accounts:
                configured_account = configured_accounts[0]
                bank_name = configured_account.get("label") or configured_account.get("value") or bank_name
                bank_account_number = configured_account.get("account_number")
                bank_account_name = configured_account.get("account_name")
        return {
            "success": True,
            "payment_method": "alipay" if institution_code == "ALIPAY" else ("gcash" if institution_code == "GCASH" else "qrph"),
            "qr_code": qr_code,
            "qr_content": qr_content,
            "gcash_deep_link": deep_link if institution_code == "GCASH" else None,
            "alipay_hosted_deep_link": (
                f"/checkout/{txn.external_id}?payment_method=alipay"
                if institution_code == "ALIPAY" else None
            ),
            "redirect_url": f"/checkout/{txn.external_id}?payment_method={'alipay' if institution_code == 'ALIPAY' else ('gcash' if institution_code == 'GCASH' else 'qrph')}",
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
    )
    if not redirect_url:
        raise HTTPException(status_code=502, detail="SwiftPay did not return a direct bank payment URL")
    txn.payment_url = redirect_url
    txn.xendit_id = order_data.get("paymentId") or order_data.get("payment_id") or order_data.get("id")
    txn.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"success": True, "redirect_url": redirect_url}


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
    card_country = str(payload.get("customer_country") or payload.get("country") or card.get("country") or ("KR" if currency == "KRW" else "PH")).strip().upper()
    source = await MagpieService().create_card_source(
        public_key=(getattr(settings, "magpie_public_key", "") or "").strip(),
        currency=currency,
        card={**card, "country": card_country},
        customer_country=card_country,
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
    store_name = (current_user.store_name or current_user.organization_name or "").strip()
    organization_id = current_user.organization_id
    if not organization_id:
        result = await db.execute(
            select(AdminUser).where(AdminUser.telegram_id == str(current_user.id)).limit(1)
        )
        admin = result.scalar_one_or_none()
        if admin:
            organization_id = admin.organization_id
            store_name = (admin.organization_name or store_name).strip()

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
            payment_url=build_checkout_url(reference, currency, {"open_amount": "1"}),
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
            else build_checkout_url(reference, currency, {"open_amount": "1", "currency": currency})
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
    transfer_account = {}
    if str(reusable.currency or "").upper() == "KRW":
        transfer_account = await _select_manual_transfer_account(db, "KRW", amount)
    payment = Transactions(
        user_id=reusable.user_id,
        transaction_type="open_amount_payment",
        amount=round(amount, 2),
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
    admin_result = await db.execute(
        select(AdminUser).where(AdminUser.telegram_id == txn.user_id).limit(1)
    )
    admin = admin_result.scalar_one_or_none()
    if admin:
        merchant_name = admin.organization_name or merchant_name
        if admin.organization_id:
            config_result = await db.execute(
                select(MerchantApiConfig)
                .where(
                    MerchantApiConfig.organization_id == admin.organization_id,
                    MerchantApiConfig.user_id == str(txn.user_id),
                )
                .order_by(MerchantApiConfig.id.asc())
                .limit(1)
            )
            config = config_result.scalars().first()
            if not config:
                config_result = await db.execute(
                    select(MerchantApiConfig)
                    .where(MerchantApiConfig.organization_id == admin.organization_id)
                    .order_by(MerchantApiConfig.id.asc())
                    .limit(1)
                )
                config = config_result.scalars().first()
            if config and config.store_name:
                merchant_name = config.store_name

    bank_name = None
    bank_account_number = None
    bank_account_name = None
    if (txn.currency or "").upper() == "KRW":
        if not txn.bank_account_number or _is_security_bank_name(txn.bank_name):
            configured_account = await _select_manual_transfer_account(db, "KRW", float(txn.amount or 0))
            if configured_account:
                bank_name = configured_account.get("bank_name") or bank_name
                bank_account_number = configured_account.get("bank_account_number")
                bank_account_name = configured_account.get("bank_account_name")
                txn.bank_name = bank_name
                txn.bank_account_number = bank_account_number
                txn.bank_account_name = bank_account_name
                await db.commit()
        virtual_account = PaymentwallService.generate_krw_virtual_account(
            user_id=str(txn.user_id),
            reference_id=str(txn.external_id or txn.id),
        )
        bank_name = txn.bank_name or bank_name or virtual_account["bank_name"]
        bank_account_number = txn.bank_account_number or bank_account_number or virtual_account["number"]
        bank_account_name = txn.bank_account_name or bank_account_name or virtual_account["account_name"]
        if _is_security_bank_name(bank_name):
            bank_name = virtual_account["bank_name"]
            bank_account_number = virtual_account["number"]
            bank_account_name = virtual_account["account_name"]

    return {
        "success": True,
        "id": txn.id,
        "external_id": txn.external_id,
        "transaction_type": txn.transaction_type,
        "amount": float(txn.original_amount if txn.original_amount is not None else txn.amount or 0),
        "currency": txn.original_currency or txn.currency or "PHP",
        "processing_amount": float(txn.amount or 0),
        "processing_currency": txn.currency or "PHP",
        "status": txn.status,
        "description": txn.description or "",
        "payment_url": txn.payment_url or "",
        "qr_code_url": txn.qr_code_url or "",
        "customer_name": txn.customer_name or "",
        "customer_email": txn.customer_email or "",
        "merchant_name": merchant_name,
        "merchant_logo_url": None,
        "bank_name": bank_name if (txn.currency or "").upper() == "KRW" else None,
        "bank_account_number": bank_account_number if (txn.currency or "").upper() == "KRW" else None,
        "bank_account_name": bank_account_name if (txn.currency or "").upper() == "KRW" else None,
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
