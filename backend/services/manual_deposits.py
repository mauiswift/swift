import os
import uuid
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from services.base import BaseService
from models.manual_deposit_receipts import ManualDepositReceipt
from models.transactions import Transactions
from services.transactions import TransactionsService
from services.wallets import WalletsService

logger = logging.getLogger(__name__)

UPLOAD_SUBDIR = "manual-deposits"
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "uploads", UPLOAD_SUBDIR)
os.makedirs(UPLOAD_DIR, exist_ok=True)

AMOUNT_TOLERANCE = getattr(settings, "receipt_match_tolerance", 0.5)

class ManualDepositService(BaseService[ManualDepositReceipt]):
    def __init__(self, db: AsyncSession):
        super().__init__(db, ManualDepositReceipt)

    async def create_receipt(self, uploader_id: str, file_bytes: bytes, filename: str, amount: Optional[float]=None, currency: str="PHP", reference: Optional[str]=None, deposited_at: Optional[datetime]=None, metadata: Optional[Dict]=None, note: Optional[str]=None, user_id: Optional[str]=None) -> ManualDepositReceipt:
        # Save file
        ext = os.path.splitext(filename)[1] or ".bin"
        fname = f"{uuid.uuid4().hex}{ext}"
        path = os.path.join(UPLOAD_DIR, fname)
        with open(path, "wb") as f:
            f.write(file_bytes)
        file_path = f"/uploads/{UPLOAD_SUBDIR}/{fname}"

        now = datetime.now(timezone.utc)
        rec = ManualDepositReceipt(
            user_id=user_id,
            uploaded_by=uploader_id,
            status="pending",
            amount=round(amount, 2) if amount is not None else None,
            currency=currency,
            reference=reference,
            deposited_at=deposited_at,
            file_path=file_path,
            metadata=metadata or {},
            note=note,
            created_at=now,
            updated_at=now
        )
        self.db.add(rec)
        await self.db.commit()
        await self.db.refresh(rec)
        # Kick off immediate auto-match attempt (best-effort)
        try:
            await self.try_auto_match(rec.id)
        except Exception:
            logger.exception("Auto-match attempt failed for receipt %s", rec.id)
        return rec

    async def try_auto_match(self, receipt_id: int) -> Dict[str, Any]:
        rec = await self.db.get(ManualDepositReceipt, receipt_id)
        if not rec:
            return {"success": False, "reason": "not_found"}

        if rec.status not in ("pending", "matched"):
            return {"success": True, "matched": False, "reason": f"already_{rec.status}"}

        candidates: List[Transactions] = []

        # 1) Exact reference match
        if rec.reference:
            stmt = select(Transactions).where(
                or_(Transactions.external_id == rec.reference, Transactions.xendit_id == rec.reference)
            ).order_by(Transactions.created_at.desc()).limit(10)
            result = await self.db.execute(stmt)
            candidates = result.scalars().all()

        # 2) Fallback: amount + recent timeframe
        if not candidates and rec.amount is not None:
            window_start = datetime.now(timezone.utc) - timedelta(days=3)
            low = rec.amount - AMOUNT_TOLERANCE
            high = rec.amount + AMOUNT_TOLERANCE
            stmt = select(Transactions).where(
                Transactions.amount >= low,
                Transactions.amount <= high,
                Transactions.currency == (rec.currency or "PHP"),
                Transactions.created_at >= window_start,
                Transactions.status.in_("pending", "processing")
            ).order_by(Transactions.created_at.desc()).limit(10)
            result = await self.db.execute(stmt)
            candidates = result.scalars().all()

        candidates = [c for c in candidates if c is not None]

        if len(candidates) == 1:
            txn = candidates[0]
            txn_svc = TransactionsService(self.db)
            try:
                await txn_svc.mark_as_paid(txn, gateway_label="manual-deposit")
                rec.transaction_id = txn.id
                rec.status = "approved"
                rec.updated_at = datetime.now(timezone.utc)
                self.db.add(rec)
                await self.db.commit()
                await self.db.refresh(rec)
                return {"success": True, "matched": True, "transaction_id": txn.id}
            except Exception:
                # mark as matched but not approved
                rec.transaction_id = txn.id
                rec.status = "matched"
                rec.updated_at = datetime.now(timezone.utc)
                self.db.add(rec)
                await self.db.commit()
                await self.db.refresh(rec)
                return {"success": True, "matched": False, "reason": "mark_as_paid_failed", "transaction_id": txn.id}

        elif len(candidates) > 1:
            rec.status = "matched"
            rec.updated_at = datetime.now(timezone.utc)
            self.db.add(rec)
            await self.db.commit()
            return {"success": True, "matched": False, "reason": "ambiguous", "candidates": [{"id": c.id, "external_id": c.external_id, "amount": c.amount, "status": c.status} for c in candidates]}
        else:
            return {"success": True, "matched": False, "reason": "no_candidates"}

    async def list_pending(self, limit: int = 50) -> List[ManualDepositReceipt]:
        stmt = select(ManualDepositReceipt).where(ManualDepositReceipt.status.in_("pending", "matched")).order_by(ManualDepositReceipt.created_at.desc()).limit(limit)
        res = await self.db.execute(stmt)
        return res.scalars().all()

    async def approve(self, receipt_id: int, admin_id: str, txn_id: Optional[int] = None) -> Dict[str, Any]:
        rec = await self.db.get(ManualDepositReceipt, receipt_id)
        if not rec:
            return {"success": False, "reason": "not_found"}

        if txn_id:
            stmt = select(Transactions).where(Transactions.id == txn_id)
            result = await self.db.execute(stmt)
            txn = result.scalar_one_or_none()
            if not txn:
                return {"success": False, "reason": "txn_not_found"}
            txn_svc = TransactionsService(self.db)
            ok = await txn_svc.mark_as_paid(txn, gateway_label=f"manual-deposit-approved:{admin_id}")
            if not ok:
                return {"success": False, "reason": "mark_failed"}

            rec.transaction_id = txn.id
            rec.status = "approved"
            rec.updated_at = datetime.now(timezone.utc)
            self.db.add(rec)
            await self.db.commit()
            await self.db.refresh(rec)
            return {"success": True, "transaction_id": txn.id}
        else:
            if not rec.user_id:
                return {"success": False, "reason": "no_user_on_receipt"}
            wallet_svc = WalletsService(self.db)
            amt = rec.amount or 0.0
            await wallet_svc.credit_wallet(
                user_id=rec.user_id,
                amount=amt,
                currency=rec.currency or "PHP",
                transaction_type="admin_credit",
                reference_id=f"manual-appr-{uuid.uuid4().hex[:8]}",
                note=f"Manual receipt approved by {admin_id}"
            )
            rec.status = "approved"
            rec.updated_at = datetime.now(timezone.utc)
            self.db.add(rec)
            await self.db.commit()
            await self.db.refresh(rec)
            return {"success": True}

    async def reject(self, receipt_id: int, admin_id: str, reason: str = "") -> Dict[str, Any]:
        rec = await self.db.get(ManualDepositReceipt, receipt_id)
        if not rec:
            return {"success": False, "reason": "not_found"}
        rec.status = "rejected"
        rec.note = (rec.note or "") + f"\nRejected by {admin_id}: {reason}"
        rec.updated_at = datetime.now(timezone.utc)
        self.db.add(rec)
        await self.db.commit()
        await self.db.refresh(rec)
        return {"success": True}
