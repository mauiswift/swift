"""Service for allocating payment processing fees to downline uplines."""

import logging
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.admin_users import AdminUser
from models.downline import Downline, DownlineCommission
from services.system_earnings import credit_system_earnings

logger = logging.getLogger(__name__)


class DownlineFeeAllocationService:
    """Handles service fee calculation and allocation for downline commissions."""

    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def get_effective_service_fee_percent(upline_user: Optional[AdminUser]) -> float:
        """Return the fee percent for the given upline.

        Rule:
        - non-Gold VIP upline: 0.5%
        - Gold VIP upline: 0.4% by default, or the admin-configured VIP rate if it is set
        - this applies to every downline under that upline regardless of the downline's VIP status
        """
        if upline_user is None:
            return 0.5

        if getattr(upline_user, "vip_gold", False):
            configured = float(getattr(upline_user, "service_fee_percent", 0.0) or 0.0)
            if configured > 0:
                return max(0.0, min(100.0, configured))
            return 0.4

        return 0.5

    async def calculate_upline_commissions(
        self,
        downline_user_id: str,
        base_fee_rate: float,
    ) -> Tuple[float, List[Tuple[str, int, float, bool]]]:
        """
        Calculate total fee rate and upline commission breakdown.

        Service fee logic:
        - If the upline is not Gold VIP: use 0.5%
        - If the upline is Gold VIP: use 0.4% by default

        Returns:
            (total_fee_rate, [(upline_id, level, commission_rate, is_gold_vip_downline), ...])
        """
        # Check if downline user is Gold VIP
        downline_result = await self.db.execute(
            select(AdminUser).where(AdminUser.telegram_id == str(downline_user_id)).limit(1)
        )
        downline_user = downline_result.scalars().first()
        is_downline_gold_vip = downline_user and downline_user.vip_gold

        upline_result = await self.db.execute(
            select(Downline)
            .where(
                Downline.downline_user_id == str(downline_user_id),
                Downline.status == "active",
            )
            .order_by(Downline.level.asc(), Downline.id.asc())
        )

        upline_commissions: List[Tuple[str, int, float, bool]] = []
        seen_uplines: set = set()

        for relationship in upline_result.scalars().all():
            upline_id = str(relationship.upline_user_id)
            if upline_id in seen_uplines or upline_id == str(downline_user_id):
                continue

            seen_uplines.add(upline_id)

            # Fetch upline's service fee configuration
            upline_user_result = await self.db.execute(
                select(AdminUser).where(AdminUser.telegram_id == upline_id).limit(1)
            )
            upline_user = upline_user_result.scalars().first()

            # IMPORTANT: the service fee is determined by the upline's VIP status,
            # not by the downline user's own VIP status. A Gold VIP upline keeps the
            # 0.4% rate for its entire downline network; a non-Gold upline stays at 0.5%.
            upline_service_fee = self.get_effective_service_fee_percent(upline_user)

            # Additional fee set on this specific downline relationship
            additional_fee = float(relationship.service_fee_percent or 0.0)

            # Total fee = base + additional (clamped to 0-100%)
            total_upline_fee = upline_service_fee + additional_fee
            service_fee_rate = max(0.0, min(100.0, total_upline_fee)) / 100.0

            upline_commissions.append((upline_id, int(relationship.level or 1), service_fee_rate, is_downline_gold_vip))

        # Total fee = base fee + sum of all upline fees
        total_fee_rate = base_fee_rate + sum(rate for _, _, rate, _ in upline_commissions)
        total_fee_rate = max(0.0, min(100.0, total_fee_rate))

        return total_fee_rate, upline_commissions

    async def allocate_commissions_to_uplines(
        self,
        downline_user_id: str,
        gross_amount: float,
        upline_commissions: List[Tuple[str, int, float, bool]],
        base_fee_rate: float,
        currency: str,
        reference_id: str,
    ) -> Dict[str, Any]:
        """
        Allocate fees to system and create downline commission records.

        Returns:
            {
                "system_fee": float,
                "upline_fees": {upline_id: amount},
                "total_fee": float,
            }
        """
        allocation_result = {
            "system_fee": 0.0,
            "upline_fees": {},
            "total_fee": 0.0,
        }

        # System earns base fee
        system_fee = round(gross_amount * base_fee_rate, 2)
        if system_fee > 0:
            allocation_result["system_fee"] = system_fee
            await credit_system_earnings(
                db=self.db,
                amount=system_fee,
                currency=currency,
                reference_id=f"{reference_id}-system-fee",
                note=(
                    f"Super admin collection commission "
                    f"({base_fee_rate * 100:.2f}%): "
                    f"{system_fee:,.2f} {currency}"
                ),
            )

        # Allocate upline commissions
        for upline_id, level, upline_fee_rate, is_downline_gold_vip in upline_commissions:
            commission_amount = round(gross_amount * upline_fee_rate, 2)
            if commission_amount <= 0:
                continue

            commission_reference = f"{reference_id}-upline-fee-{upline_id}"

            # Check if commission already exists (idempotency)
            existing_commission = await self.db.execute(
                select(DownlineCommission).where(
                    DownlineCommission.recipient_id == upline_id,
                    DownlineCommission.source_user_id == str(downline_user_id),
                    DownlineCommission.commission_type == "payment_processing",
                    DownlineCommission.reference_id == commission_reference,
                ).limit(1)
            )

            if existing_commission.scalars().first() is None:
                # Create new commission record
                commission_record = DownlineCommission(
                    recipient_id=upline_id,
                    source_user_id=str(downline_user_id),
                    commission_type="payment_processing",
                    amount=commission_amount,
                    currency=currency,
                    reference_id=commission_reference,
                    description=(
                        f"Payment link processing commission (level {level}): "
                        f"{commission_amount:,.2f} {currency}"
                    ),
                    level=level,
                    status="pending",
                    created_at=datetime.now(timezone.utc),
                )
                self.db.add(commission_record)
                await self.db.flush()

                # Update downline relationship with pending commission
                relationship_result = await self.db.execute(
                    select(Downline).where(
                        Downline.upline_user_id == upline_id,
                        Downline.downline_user_id == str(downline_user_id),
                    ).limit(1)
                )
                relationship = relationship_result.scalars().first()
                if relationship is not None:
                    relationship.pending_commissions = round(
                        float(relationship.pending_commissions or 0.0) + commission_amount,
                        2,
                    )
                    relationship.updated_at = datetime.now(timezone.utc)
                    relationship.last_activity_at = datetime.now(timezone.utc)

            # Credit upline with their commission
            await credit_system_earnings(
                db=self.db,
                amount=commission_amount,
                currency=currency,
                reference_id=commission_reference,
                note=(
                    f"Upline collection commission (level {level}, "
                    f"{upline_fee_rate * 100:.2f}%): "
                    f"{commission_amount:,.2f} {currency}"
                ),
                recipient_id=upline_id,
            )

            allocation_result["upline_fees"][upline_id] = commission_amount

        allocation_result["total_fee"] = system_fee + sum(allocation_result["upline_fees"].values())
        return allocation_result

    async def calculate_and_allocate_fees(
        self,
        downline_user_id: str,
        gross_amount: float,
        base_fee_rate: float,
        currency: str,
        reference_id: str,
    ) -> Dict[str, Any]:
        """
        Calculate fees and allocate commissions in one operation.

        Returns fee allocation result with breakdown.
        """
        # Calculate upline commissions
        total_fee_rate, upline_commissions = await self.calculate_upline_commissions(
            downline_user_id,
            base_fee_rate,
        )

        # Allocate commissions to uplines
        allocation_result = await self.allocate_commissions_to_uplines(
            downline_user_id,
            gross_amount,
            upline_commissions,
            base_fee_rate,
            currency,
            reference_id,
        )

        allocation_result["total_fee_rate"] = total_fee_rate
        allocation_result["upline_commissions"] = upline_commissions

        return allocation_result
