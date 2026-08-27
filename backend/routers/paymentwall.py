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
from services.transactions import TransactionsService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/paymentwall", tags=["paymentwall"])


@router.post("/create-payment")
async def create_paymentwall_payment(
    payload: Dict[str, Any],
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    """Create a signed Paymentwall Widget URL for a KRW payment."""
    service = PaymentwallService()
    if not service.is_configured:
        raise HTTPException(status_code=503, detail="Paymentwall is not configured")

    amount = float(payload.get("amount", 0))
    reference_id = str(payload.get("reference_id") or f"paymentwall-{uuid.uuid4().hex[:12]}")
    result = service.create_widget_url(
        user_id=str(current_user.id),
        amount=amount,
        currency=str(payload.get("currency", "KRW")),
        reference_id=reference_id,
        description=str(payload.get("description", "")),
    )
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result["error"])

    txn = await TransactionsService(db).create_transaction(
        user_id=str(current_user.id),
        transaction_type="paymentwall",
        amount=amount,
        currency="KRW",
        external_id=reference_id,
        gateway_id=reference_id,
        description=str(payload.get("description", "")),
        customer_email=str(payload.get("customer_email", "")),
        payment_url=result["payment_url"],
        status="pending",
    )
    return {"success": True, "payment_url": result["payment_url"], "payment_id": txn.external_id, "transaction_id": txn.id, "currency": "KRW", "gateway": "paymentwall"}


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
