"""Paymentwall KRW collection and pingback endpoints."""

import logging
import uuid
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_payment_user
from schemas.auth import UserResponse
from services.paymentwall_service import PaymentwallService
from services.payment_gateway import PaymentGateway
from services.magpie_service import CurrencyConverter
from services.transactions import TransactionsService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/paymentwall", tags=["paymentwall"])


@router.post("/create-payment")
async def create_paymentwall_payment(
    payload: Dict[str, Any],
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    """Create a provider checkout in USD/EUR for a quoted KRW amount."""
    amount = float(payload.get("amount", 0))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="amount must be greater than zero")
    
    reference_id = str(payload.get("reference_id") or f"paymentwall-{uuid.uuid4().hex[:12]}")
    source_currency = str(payload.get("currency", "KRW")).upper()
    settlement_currency = str(payload.get("settlement_currency", "USD")).upper()
    if source_currency != "KRW":
        raise HTTPException(status_code=400, detail="This endpoint accepts a KRW source amount")
    if settlement_currency not in {"USD", "EUR"}:
        raise HTTPException(status_code=400, detail="settlement_currency must be USD or EUR")
    try:
        settlement_amount = await CurrencyConverter.convert_live(
            amount, source_currency, settlement_currency
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if settlement_amount <= 0:
        raise HTTPException(status_code=400, detail="KRW amount converts below the provider minimum")
    
    # Use unified payment gateway routing (SwiftPay first if configured for KRW, else Paymentwall)
    gateway = PaymentGateway(db)
    try:
        # KRW payment link creation is an invoice flow: it is hosted as a payment page,
        # but it must be recorded as an invoice for downstream accounting and reconciliation.
        result = await gateway.create_payment(
            db=db,
            user_id=str(current_user.id),
            amount=settlement_amount,
            currency=settlement_currency,
            external_id=reference_id,
            transaction_type="invoice",
            description=(
                f"{payload.get('description', '')} "
                f"(KRW quote: {amount:,.2f} KRW; charged: {settlement_amount:,.2f} {settlement_currency})"
            ).strip(),
            customer_name=str(payload.get("customer_name", "")),
            customer_email=str(payload.get("customer_email", "")),
            metadata={
                **(payload.get("metadata") if isinstance(payload.get("metadata"), dict) else {}),
                "original_amount": amount,
                "original_currency": "KRW",
            },
        )
    except Exception as exc:
        logger.exception("KRW payment link generation failed")
        raise HTTPException(status_code=502, detail="KRW payment could not be created") from exc
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Payment creation failed"))

    # The live SwiftPay contract does not support KRW orders or virtual
    # accounts. Do not expose the internal/manual fallback as a successful
    # provider payment: it has no provider settlement or webhook guarantee.
    result_data = result.get("data") if isinstance(result.get("data"), dict) else {}
    if result_data.get("gateway") in {"manual_internal", "manual_external_verification"}:
        raise HTTPException(
            status_code=501,
            detail=(
                "A verified USD/EUR provider checkout is required; internal/manual payment "
                "instructions are disabled for this KRW quote."
            ),
        )

    # Return the gateway result directly (already contains success, data with payment_url, etc.)
    result_data["quoted_amount"] = amount
    result_data["quoted_currency"] = "KRW"
    result_data["charged_amount"] = settlement_amount
    result_data["charged_currency"] = settlement_currency
    return result


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
