import hmac
import hashlib
import logging
from fastapi import APIRouter, Request, Header, HTTPException, status

from core.config import settings
from core.database import db_manager
from services.transactions import TransactionsService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/magpie", tags=["magpie"])


@router.post("/webhook")
async def magpie_webhook(request: Request, x_magpie_signature: str | None = Header(None)):
    """Receive Magpie webhook notifications, verify HMAC, and reconcile transactions.

    If `MAGPIE_WEBHOOK_SECRET` is set the request must include a matching
    `X-Magpie-Signature` HMAC-SHA256 header. When a payment event is received
    the local transaction record will be looked up by `external_id` or
    `checkout_id` and transitioned to `paid` or `expired` as appropriate.
    """
    body = await request.body()
    secret = getattr(settings, "magpie_webhook_secret", "") or ""
    if secret:
        if not x_magpie_signature:
            logger.warning("Magpie webhook received without signature header")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing signature")
        try:
            computed = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
        except Exception as e:
            logger.exception("Failed to compute HMAC for Magpie webhook: %s", e)
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Signature verification error")
        if not hmac.compare_digest(computed, x_magpie_signature):
            logger.warning("Magpie webhook signature mismatch: expected=%s received=%s", computed, x_magpie_signature)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature")
    else:
        logger.warning("MAGPIE_WEBHOOK_SECRET not set — skipping signature verification (only for testing)")

    try:
        payload = await request.json()
    except Exception:
        logger.exception("Magpie webhook: failed to parse JSON payload")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")

    event_type = (payload.get("event") or payload.get("type") or payload.get("event_type") or "").lower()
    data = payload.get("data") or payload
    logger.info("Magpie webhook received: event=%s data=%s", event_type, data)

    # Extract identifiers
    external_id = data.get("external_id") or data.get("externalId") or ""
    checkout_id = data.get("checkout_id") or data.get("session_id") or data.get("checkoutId") or data.get("id") or ""
    status_text = (data.get("status") or "").upper()

    try:
        async with db_manager.async_session_maker() as db:
            txn_svc = TransactionsService(db)
            txn = None
            if external_id:
                txn = await txn_svc.find_by_external_or_gateway_id(external_id)
            if not txn and checkout_id:
                txn = await txn_svc.find_by_external_or_gateway_id(checkout_id)

            if not txn:
                logger.info("Magpie webhook: no matching transaction found for external_id=%s checkout_id=%s", external_id, checkout_id)
                return {"success": True, "note": "no matching transaction"}

            # Determine desired state
            paid_indicators = ("completed", "success", "payment_success", "paid")
            expired_indicators = ("expired", "cancelled", "failed")

            # Prefer explicit status field, but also check event_type
            desired_paid = any(x in status_text for x in [s.upper() for s in paid_indicators]) or any(k in event_type for k in paid_indicators)
            desired_expired = any(x in status_text for x in [s.upper() for s in expired_indicators]) or any(k in event_type for k in expired_indicators)

            if desired_paid:
                await txn_svc.mark_as_paid(txn, gateway_label="Magpie Webhook")
                logger.info("Magpie webhook: marked txn %s as paid", txn.id)
            elif desired_expired:
                await txn_svc.mark_as_expired(txn)
                logger.info("Magpie webhook: marked txn %s as expired", txn.id)
            else:
                logger.info("Magpie webhook: event does not indicate terminal state; ignored (event=%s status=%s)", event_type, status_text)

    except Exception as e:
        logger.exception("Magpie webhook processing failed: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Webhook processing error")

    return {"success": True}
