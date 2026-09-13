from datetime import datetime, timezone, timedelta
import logging
import uuid
from typing import Optional, Dict, Any, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from models.disbursements import Disbursements
from models.admin_users import AdminUser
from services.base import BaseService
from services.system_earnings import credit_system_earnings

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class DisbursementsService(BaseService[Disbursements]):
    """Service layer for Disbursements operations"""

    def __init__(self, db: AsyncSession):
        super().__init__(db, Disbursements)

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Disbursements]:
        """Get disbursements by any field"""
        try:
            if not hasattr(Disbursements, field_name):
                raise ValueError(f"Field {field_name} does not exist on Disbursements")
            result = await self.db.execute(
                select(Disbursements).where(getattr(Disbursements, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching disbursements by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Disbursements]:
        """Get list of disbursementss filtered by field"""
        try:
            if not hasattr(Disbursements, field_name):
                raise ValueError(f"Field {field_name} does not exist on Disbursements")
            result = await self.db.execute(
                select(Disbursements)
                .where(getattr(Disbursements, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Disbursements.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching disbursementss by {field_name}: {str(e)}")
            raise

    async def calculate_fee(
        self,
        amount: float,
        bank_code: str,
        disbursement_type: str = "single",
        currency: str = "PHP",
        user_id: str = None,
    ) -> float:
        """
        Calculate the processing fee for a disbursement.

        Uses user-configured withdrawal fees if available, otherwise uses defaults:
        - PHP: 15.0
        - KRW: 1500.0
        - USDT: 1.0
        - CNY: 10.0
        - USD: 1.0
        """
        currency_upper = (currency or "PHP").upper()

        # Get user's configured withdrawal fee if user_id provided
        withdrawal_fee = None
        if user_id:
            try:
                user_result = await self.db.execute(
                    select(AdminUser).where(AdminUser.telegram_id == str(user_id)).limit(1)
                )
                user = user_result.scalars().first()
                if user:
                    if currency_upper == "PHP":
                        withdrawal_fee = user.withdrawal_fee_php
                    elif currency_upper == "KRW":
                        withdrawal_fee = user.withdrawal_fee_krw
                    elif currency_upper == "USDT":
                        withdrawal_fee = user.withdrawal_fee_usdt
                    elif currency_upper == "CNY":
                        withdrawal_fee = user.withdrawal_fee_cny
                    elif currency_upper == "USD":
                        withdrawal_fee = user.withdrawal_fee_usd
            except Exception as e:
                logger.warning(f"Error fetching user withdrawal fees: {e}")

        # Use user's configured fee or fall back to defaults
        if withdrawal_fee is not None:
            return float(withdrawal_fee)

        # Default fees by currency
        default_fees = {
            "PHP": 15.0,
            "KRW": 1500.0,
            "USDT": 1.0,
            "CNY": 10.0,
            "USD": 1.0,
        }
        return default_fees.get(currency_upper, 15.0)

    async def create_settlement_batch(
        self, user_ids: List[str], bank_code: str, priority: str = "normal"
    ) -> Dict[str, Any]:
        """Create a settlement batch for multiple users going to the same bank."""
        batch_id = f"batch-{bank_code}-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)
        
        # Get pending disbursements for specified users to this bank
        result = await self.db.execute(
            select(Disbursements)
            .where(
                Disbursements.user_id.in_(user_ids),
                Disbursements.bank_code == bank_code,
                Disbursements.status.in_(("pending", "processing")),
            )
        )
        disbursements = result.scalars().all()
        
        if not disbursements:
            return {"success": False, "message": "No pending disbursements found"}
        
        total_amount = 0.0
        total_fee = 0.0
        
        # Update all disbursements with batch info
        for disb in disbursements:
            fee = await self.calculate_fee(
                disb.amount,
                bank_code,
                "batch",
                currency=disb.currency or "PHP",
                user_id=disb.user_id,
            )
            disb.settlement_batch_id = batch_id
            disb.settlement_priority = priority
            disb.processing_fee = fee
            disb.net_amount = round(disb.amount - fee, 2)
            disb.updated_at = now

            total_amount += disb.amount
            total_fee += fee
        
        await self.db.commit()
        
        logger.info(
            f"Created settlement batch {batch_id}: {len(disbursements)} disbursements, "
            f"total={total_amount:,.2f}, fee={total_fee:,.2f}"
        )
        
        return {
            "success": True,
            "batch_id": batch_id,
            "count": len(disbursements),
            "total_amount": total_amount,
            "total_fee": total_fee,
            "net_amount": round(total_amount - total_fee, 2),
        }

    async def mark_settlement_completed(self, batch_id: str) -> Dict[str, Any]:
        """Mark all disbursements in a batch as completed."""
        result = await self.db.execute(
            select(Disbursements).where(
                Disbursements.settlement_batch_id == batch_id,
                Disbursements.status.in_(("pending", "processing", "transferring")),
            )
        )
        disbursements = result.scalars().all()
        
        if not disbursements:
            return {"success": False, "message": "Batch not found"}
        
        now = datetime.now(timezone.utc)
        for disb in disbursements:
            disb.status = "completed"
            disb.completed_at = now
            disb.updated_at = now
            if disb.processing_fee:
                await credit_system_earnings(
                    db=self.db,
                    amount=disb.processing_fee,
                    currency=disb.currency or "PHP",
                    reference_id=f"{disb.external_id or disb.id}-system-fee",
                    note=f"Disbursement earnings: {disb.processing_fee:,.2f} {disb.currency or 'PHP'}",
                )
        
        await self.db.commit()
        
        logger.info(f"Marked settlement batch {batch_id} as completed ({len(disbursements)} disbursements)")
        
        return {
            "success": True,
            "batch_id": batch_id,
            "completed_count": len(disbursements),
        }

    async def get_settlement_stats(self) -> Dict[str, Any]:
        """Get settlement statistics for super admin dashboard."""
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        
        # Today's stats
        today_result = await self.db.execute(
            select(
                func.count(Disbursements.id),
                func.coalesce(func.sum(Disbursements.amount), 0.0),
                func.coalesce(func.sum(Disbursements.processing_fee), 0.0),
            ).where(
                Disbursements.created_at >= today_start,
                Disbursements.status.in_(("completed", "processing")),
            )
        )
        today_row = today_result.one()
        
        # Week's stats
        week_result = await self.db.execute(
            select(
                func.count(Disbursements.id),
                func.coalesce(func.sum(Disbursements.amount), 0.0),
                func.coalesce(func.sum(Disbursements.processing_fee), 0.0),
            ).where(
                Disbursements.created_at >= week_start,
                Disbursements.status.in_(("completed", "processing")),
            )
        )
        week_row = week_result.one()
        
        # Pending requests
        pending_result = await self.db.execute(
            select(
                func.count(Disbursements.id),
                func.coalesce(func.sum(Disbursements.amount), 0.0),
            ).where(Disbursements.status == "pending")
        )
        pending_row = pending_result.one()
        
        # Failed requests
        failed_result = await self.db.execute(
            select(
                func.count(Disbursements.id),
                func.coalesce(func.sum(Disbursements.amount), 0.0),
            ).where(Disbursements.status == "failed")
        )
        failed_row = failed_result.one()
        
        return {
            "today": {
                "count": int(today_row[0] or 0),
                "total_amount": float(today_row[1] or 0.0),
                "total_fees": float(today_row[2] or 0.0),
            },
            "week": {
                "count": int(week_row[0] or 0),
                "total_amount": float(week_row[1] or 0.0),
                "total_fees": float(week_row[2] or 0.0),
            },
            "pending": {
                "count": int(pending_row[0] or 0),
                "total_amount": float(pending_row[1] or 0.0),
            },
            "failed": {
                "count": int(failed_row[0] or 0),
                "total_amount": float(failed_row[1] or 0.0),
            },
        }
