import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.transactions import Transactions

logger = logging.getLogger(__name__)


class PaymentProcessor:
    """Internal payment processing foundation for the app."""

    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _new_payment_id() -> str:
        return f"pay_{uuid.uuid4().hex[:16]}"

    @staticmethod
    def _serialize_transaction(txn: Transactions) -> Dict[str, Any]:
        return {
            "payment_id": txn.external_id,
            "transaction_id": txn.id,
            "amount": float(txn.amount),
            "currency": txn.currency or "PHP",
            "status": txn.status,
            "description": txn.description or "",
            "provider_reference": txn.xendit_id or "",
            "created_at": txn.created_at.isoformat() if txn.created_at else None,
            "updated_at": txn.updated_at.isoformat() if txn.updated_at else None,
        }

    async def create_payment(
        self,
        *,
        user_id: str,
        amount: float,
        description: str = "",
        currency: str = "PHP",
        metadata: Optional[Dict[str, Any]] = None,
        payment_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if amount is None or amount <= 0:
            raise ValueError("amount must be greater than zero")

        payment_id = payment_id or self._new_payment_id()
        now = datetime.now(timezone.utc)
        txn = Transactions(
            user_id=user_id,
            transaction_type="payment",
            amount=float(amount),
            currency=currency,
            external_id=payment_id,
            xendit_id="",
            status="pending",
            description=description or "Internal payment",
            customer_name="",
            customer_email="",
            payment_url="",
            created_at=now,
            updated_at=now,
        )
        self.db.add(txn)
        await self.db.commit()
        await self.db.refresh(txn)

        response = self._serialize_transaction(txn)
        response.update({
            "success": True,
            "metadata": metadata or {},
        })
        return response

    async def get_payment(self, *, payment_id: str) -> Dict[str, Any]:
        stmt = select(Transactions).where(Transactions.external_id == payment_id).limit(1)
        result = await self.db.execute(stmt)
        txn = result.scalars().first()
        if not txn:
            raise LookupError(f"payment {payment_id} not found")

        return {"success": True, **self._serialize_transaction(txn)}

    async def update_payment_status(
        self,
        *,
        payment_id: str,
        status: str,
        provider_reference: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        stmt = select(Transactions).where(Transactions.external_id == payment_id).limit(1)
        result = await self.db.execute(stmt)
        txn = result.scalars().first()
        if not txn:
            raise LookupError(f"payment {payment_id} not found")

        txn.status = status
        txn.updated_at = datetime.now(timezone.utc)
        if provider_reference:
            txn.xendit_id = provider_reference
        if metadata:
            txn.description = txn.description or ""

        await self.db.commit()
        await self.db.refresh(txn)

        return {"success": True, **self._serialize_transaction(txn)}

    async def get_stats(self, *, user_id: Optional[str] = None) -> Dict[str, Any]:
        stmt = select(Transactions)
        if user_id:
            stmt = stmt.where(Transactions.user_id == user_id)
        result = await self.db.execute(stmt)
        txns = result.scalars().all()

        statuses: Dict[str, int] = {}
        total_amount = 0.0
        for txn in txns:
            statuses[txn.status] = statuses.get(txn.status, 0) + 1
            total_amount += float(txn.amount or 0.0)

        return {
            "success": True,
            "total_payments": len(txns),
            "total_amount": round(total_amount, 2),
            "statuses": statuses,
        }
