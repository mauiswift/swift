import hashlib
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from models.transactions import Transactions
from models.webhook_events import WebhookEvent

logger = logging.getLogger(__name__)


async def record_verified_payment_webhook(
    db: AsyncSession,
    *,
    provider: str,
    transaction: Transactions,
    external_id: str | None,
    event_type: str,
    signature: str,
) -> None:
    """Persist a verified callback without retaining its payload or raw signature."""
    now = datetime.now(timezone.utc)
    event_payload: dict[str, Any] = {
        "transaction_id": transaction.id,
        "signature_verified": True,
        "signature_fingerprint": hashlib.sha256(signature.encode("utf-8")).hexdigest()[:16],
        "transaction_status": transaction.status,
    }
    db.add(
        WebhookEvent(
            id=str(uuid.uuid4()),
            provider=provider[:50],
            event_type=event_type[:100] or "payment.status",
            external_id=(external_id or str(transaction.id))[:255],
            payload=event_payload,
            status="processed",
            retry_count=0,
            created_at=now,
            processed_at=now,
        )
    )
    try:
        await db.commit()
    except SQLAlchemyError:
        await db.rollback()
        logger.exception("Failed to persist verified %s payment webhook for transaction %s", provider, transaction.id)
