"""Paymentwall KRW collection and pingback endpoints."""

import logging
import uuid
from typing import Any, Dict
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_payment_user
from schemas.auth import UserResponse
from services.app_settings import get_krw_bank_name, get_krw_account_holder_name
from services.paymentwall_service import PaymentwallService
from services.payment_gateway import PaymentGateway
from services.transactions import TransactionsService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/paymentwall", tags=["paymentwall"])


@router.post("/create-payment")
async def create_paymentwall_payment(
    payload: Dict[str, Any],
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    """Create a payment link for KRW (routes through SwiftPay if configured, otherwise falls back to Paymentwall)."""
    amount = float(payload.get("amount", 0))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be greater than zero")
    
    reference_id = str(payload.get("reference_id") or f"paymentwall-{uuid.uuid4().hex[:12]}")
    currency = str(payload.get("currency", "KRW")).upper()
    
    # Use unified payment gateway routing (SwiftPay first if configured for KRW, else Paymentwall)
    gateway = PaymentGateway(db)
    try:
        result = await gateway.create_payment(
            db=db,
            user_id=str(current_user.id),
            amount=amount,
            currency=currency,
            external_id=reference_id,
            transaction_type="payment_link",
            description=str(payload.get("description", "")),
            customer_name=str(payload.get("customer_name", "")),
            customer_email=str(payload.get("customer_email", "")),
        )
    except Exception as exc:
        logger.exception("KRW payment link generation failed")
        raise HTTPException(status_code=502, detail="SwiftPay KRW QR payment could not be created") from exc
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Payment creation failed"))

    # Return the gateway result directly (already contains success, data with payment_url, etc.)
    return result


@router.get("/hosted/{reference_id}", response_class=HTMLResponse)
async def hosted_krw_payment(reference_id: str, db: AsyncSession = Depends(get_db)):
    """Render a self-hosted KRW bank-transfer page for customer scanning and test payments."""
    txn = await TransactionsService(db).find_by_external_or_gateway_id(reference_id)
    if not txn:
        raise HTTPException(status_code=404, detail="Payment not found")

    service = PaymentwallService()
    is_swiftpay_qr = bool(txn.xendit_id and str(txn.xendit_id).startswith("swiftpay:"))
    if is_swiftpay_qr:
        qr_value = txn.qr_code_url or txn.payment_url
        qr_image_url = qr_value if qr_value.startswith(("http://", "https://")) else (
            f"https://api.qrserver.com/v1/create-qr-code/?size=600x600&data={quote(qr_value, safe='')}"
        )
        account = None
        qr_label = "SwiftPay QR"
    else:
        bank_name = await get_krw_bank_name(db)
        account_holder_name = await get_krw_account_holder_name(db)
        session = service.create_krw_bank_transfer_qr(
            user_id=str(txn.user_id or reference_id),
            amount=float(txn.amount or 0),
            reference_id=reference_id,
            description=txn.description or "KRW payment",
            bank_name=bank_name,
            account_holder_name=account_holder_name,
        )
        account = session["bank_account"]
        qr_image_url = session["qr_code_url"]
        qr_label = "KRW bank transfer QR"
    html = f"""
    <html>
      <head>
        <meta charset="utf-8" />
        <title>KRW Bank Transfer</title>
        <style>
          body {{ font-family: Arial, sans-serif; background: #0f172a; color: #fff; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }}
          .card {{ max-width: 560px; width: 92%; background: #111827; border: 1px solid #334155; border-radius: 18px; padding: 28px; box-shadow: 0 24px 60px rgba(0,0,0,0.5); }}
          h1 {{ margin: 0 0 12px; font-size: 28px; }}
          .amount {{ font-size: 32px; font-weight: bold; color: #fbbf24; margin-bottom: 20px; }}
          img {{ width: 260px; height: 260px; display: block; margin: 20px auto; background: white; border-radius: 12px; padding: 12px; }}
          .info {{ background: #1f2937; border-radius: 12px; padding: 16px; margin-top: 14px; line-height: 1.8; }}
          .label {{ color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }}
          code {{ background: #0f172a; padding: 4px 8px; border-radius: 8px; font-size: 14px; }}
        </style>
      </head>
      <body>
        <div class="card">
          <div class="label">KRW Payment</div>
          <h1>Scan to pay</h1>
          <div class="amount">₩{float(txn.amount or 0):,.0f}</div>
                    <img src="{qr_image_url}" alt="{qr_label}" />
                    <div class="info">
                        {f"<div><span class='label'>Payment rail</span><br /><strong>SwiftPay KRW QR</strong></div>" if is_swiftpay_qr else f"<div><span class='label'>Bank</span><br /><strong>{account['bank_name']}</strong></div><div><span class='label'>Account Number</span><br /><code>{account['number']}</code></div><div><span class='label'>Account Name</span><br /><strong>{account['account_name']}</strong></div>"}
                        <div><span class="label">Reference</span><br /><code>{reference_id}</code></div>
                    </div>
        </div>
      </body>
    </html>
    """
    return HTMLResponse(content=html)


@router.api_route("/pingback", methods=["GET", "POST"])
async def paymentwall_pingback(request: Request, db: AsyncSession = Depends(get_db)):
    """Process a signed Paymentwall pingback."""
    parameters = dict(request.query_params)
    if request.method == "POST":
        parameters.update(dict(await request.form()))

    service = PaymentwallService()
    if not service.validate_pingback(parameters):
        raise HTTPException(status_code=400, detail="Invalid Paymentwall pingback signature")

    reference_id = str(parameters["ref"])
    transaction = await TransactionsService(db).find_by_external_or_gateway_id(reference_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    pingback_type = int(parameters["type"])
    if pingback_type in {0, 1, 201}:
        updated = await TransactionsService(db).mark_as_paid(transaction, "Paymentwall")
    elif pingback_type in {2, 12, 13, 14, 202, 203}:
        updated = await TransactionsService(db).mark_as_expired(transaction)
    else:
        updated = True

    return {"success": updated, "received": True, "reference_id": reference_id}
