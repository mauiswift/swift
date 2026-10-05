"""PhotonPay KRW payment notifications."""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.photonpay_service import PhotonPayService
from services.transactions import TransactionsService
from services.webhook_event_log import record_verified_payment_webhook

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/photonpay", tags=["photonpay"])


@router.post("/webhook")
async def photonpay_webhook(request: Request, db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    raw_body = await request.body()
    service = PhotonPayService()
    signature = request.headers.get("X-PD-SIGN", "")
    if not service.verify_notification(raw_body, signature):
        raise HTTPException(status_code=400, detail="Invalid PhotonPay notification signature")

    try:
        payload = await request.json()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid PhotonPay notification JSON") from exc

    if str(payload.get("currency", "")).upper() != "KRW":
        raise HTTPException(status_code=400, detail="PhotonPay webhook is restricted to KRW")

    reference_id = str(payload.get("originReqId") or payload.get("reqId") or "").strip()
    if not reference_id:
        raise HTTPException(status_code=400, detail="PhotonPay notification reference is missing")
    transaction = await TransactionsService(db).find_by_external_or_gateway_id(reference_id)
    if not transaction or str(transaction.currency or "").upper() != "KRW":
        raise HTTPException(status_code=404, detail="KRW transaction not found")

    try:
        if round(float(payload.get("amount")), 2) != round(float(transaction.amount), 2):
            raise HTTPException(status_code=400, detail="PhotonPay notification amount mismatch")
    except (TypeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail="PhotonPay notification amount is invalid") from exc

    status = str(payload.get("status", "")).lower()
    transactions = TransactionsService(db)
    if status == "succeed":
        updated = await transactions.mark_as_paid(transaction, "PhotonPay")
    elif status in {"failed", "cancelled", "expired"}:
        updated = await transactions.mark_as_expired(transaction)
    else:
        updated = True
    await record_verified_payment_webhook(
        db,
        provider="photonpay",
        transaction=transaction,
        external_id=reference_id,
        event_type=f"payment.{status or 'unknown'}",
        signature=signature,
    )
    return {"success": updated, "received": True, "reference_id": reference_id, "status": status}