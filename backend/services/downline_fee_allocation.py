"""Service for allocating payment processing fees to downline uplines."""

import logging
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.admin_users import AdminUser
from models.downline import Downline, DownlineCommission
from services.system_earnings import credit_system_earnings
from core.constants import FEES_ENABLED

logger = logging.getLogger(__name__)


class DownlineFeeAllocationService:
    """Handles service fee calculation and allocation for downline commissions."""

    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _user_id_variants(user_id: str) -> list[str]:
        normalized = str(user_id).strip()
        raw = normalized[3:] if normalized.startswith("tg-") else normalized
        return list(dict.fromkeys((normalized, raw, f"tg-{raw}")))

    @staticmethod
    def get_effective_service_fee_percent(upline_user: Optional[AdminUser]) -> float:
        """Return the fee percent for the given upline.

        The super-admin-configured individual fee becomes the upline's base
        earning rate for downline payments. Relationship-specific fees are
        added separately by ``calculate_upline_commissions``.
        """
        if not FEES_ENABLED or upline_user is None:
            return 0.0

        configured = float(getattr(upline_user, "service_fee_percent", 0.0) or 0.0)
        return max(0.0, min(100.0, configured))

    async def calculate_upline_commissions(
        self,
        downline_user_id: str,
        base_fee_rate: float,
    ) -> Tuple[float, List[Tuple[str, int, float, bool]]]:
        """
        Calculate total fee rate and upline commission breakdown.

        Service fee logic:
        - The configured base fee remains a system fee.
        - Each active referral relationship contributes its configured surcharge.
        - A zero surcharge produces no upline commission.

        Returns:
            (total_fee_rate, [(upline_id, level, commission_rate, is_gold_vip_downline), ...])
        """
        base_fee_rate = max(0.0, min(1.0, float(base_fee_rate)))
        if not FEES_ENABLED:
            return 0.0, []

        upline_commissions: List[Tuple[str, int, float, bool]] = []
        current_user_id = str(downline_user_id)
        visited_user_ids: set[str] = set()
        level = 1

        # Walk the referral chain instead of stopping at the payment owner's
        # direct upline. Each relationship stores the surcharge configured by
        # that upline, so a two-level chain must include both percentages.
        while level <= 100:
            current_variants = self._user_id_variants(current_user_id)
            if any(
                variant in visited_user_ids
                for variant in current_variants
            ):
                break
            visited_user_ids.update(current_variants)

            upline_result = await self.db.execute(
                select(Downline)
                .where(
                    Downline.downline_user_id.in_(current_variants),
                    Downline.status == "active",
                )
                .order_by(Downline.level.asc(), Downline.id.asc())
                .limit(1)
            )
            relationship = upline_result.scalars().first()
            if relationship is None:
                break

            upline_id = str(relationship.upline_user_id)
            if set(self._user_id_variants(upline_id)).intersection(visited_user_ids):
                break

            relationship_level = max(level, int(relationship.level or level))
            additional_rate = max(
                0.0,
                min(100.0, float(relationship.service_fee_percent or 0.0)),
            ) / 100.0
            if additional_rate > 0:
                upline_commissions.append(
                    (upline_id, relationship_level, additional_rate, False)
                )

            current_user_id = upline_id
            level += 1

        # Total fee = base fee + sum of all upline fees
        total_fee_rate = base_fee_rate + sum(rate for _, _, rate, _ in upline_commissions)
        total_fee_rate = max(0.0, min(1.0, total_fee_rate))

        return total_fee_rate, upline_commissions

    async def calculate_fee_breakdown(
        self,
        downline_user_id: str,
        gross_amount: float,
        base_fee_rate: float,
    ) -> Dict[str, Any]:
        """Calculate the exact fee amounts used by both settlement and previews."""
        if gross_amount < 0:
            raise ValueError("Gross amount cannot be negative")
        base_fee_rate = max(0.0, min(1.0, float(base_fee_rate)))

        direct_relationship = await self.db.scalar(
            select(Downline)
            .where(
                Downline.downline_user_id.in_(self._user_id_variants(downline_user_id)),
                Downline.status == "active",
                Downline.level == 1,
            )
            .order_by(Downline.id.asc())
            .limit(1)
        )
        if direct_relationship is not None:
            upline_user = await self.db.scalar(
                select(AdminUser)
                .where(
                    AdminUser.telegram_id.in_(
                        self._user_id_variants(direct_relationship.upline_user_id)
                    )
                )
                .limit(1)
            )
            if upline_user is not None:
                base_fee_rate = max(
                    0.0,
                    min(
                        1.0,
                        float(getattr(upline_user, "service_fee_percent", 0.0) or 0.0)
                        / 100.0,
                    ),
                )

        total_fee_rate, upline_commissions = await self.calculate_upline_commissions(
            downline_user_id,
            base_fee_rate,
        )
        system_fee = round(gross_amount * base_fee_rate, 2)
        upline_fees = [
            {
                "upline_id": upline_id,
                "level": level,
                "rate": round(rate * 100, 2),
                "amount": round(gross_amount * rate, 2),
            }
            for upline_id, level, rate, _ in upline_commissions
            if rate > 0
        ]
        total_fee_amount = round(
            system_fee + sum(item["amount"] for item in upline_fees),
            2,
        )

        return {
            "system_fee": system_fee,
            "system_fee_rate": base_fee_rate,
            "upline_fees": upline_fees,
            "upline_commissions": upline_commissions,
            "total_fee": total_fee_amount,
            "total_fee_rate": (
                total_fee_amount / gross_amount if gross_amount else 0.0
            ),
            "net_amount": round(gross_amount - total_fee_amount, 2),
        }

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
        if not FEES_ENABLED:
            return {
                "system_fee": 0.0,
                "upline_fees": {},
                "total_fee": 0.0,
            }

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
            # A payment-link owner must never earn from their own collection.
            if set(self._user_id_variants(upline_id)).intersection(
                self._user_id_variants(downline_user_id)
            ):
                logger.info(
                    "Skipping self downline commission for payment owner %s",
                    downline_user_id,
                )
                continue
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

            commission_exists = existing_commission.scalars().first() is not None
            if not commission_exists:
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
                        Downline.upline_user_id.in_(self._user_id_variants(upline_id)),
                        Downline.downline_user_id.in_(self._user_id_variants(downline_user_id)),
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

            # Credit the upline only when this commission is newly created.
            if not commission_exists:
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
        if not FEES_ENABLED:
            return {
                "system_fee": 0.0,
                "upline_fees": {},
                "total_fee": 0.0,
                "total_fee_rate": 0.0,
                "upline_commissions": [],
            }

        breakdown = await self.calculate_fee_breakdown(
            downline_user_id,
            gross_amount,
            base_fee_rate,
        )
        upline_commissions = breakdown["upline_commissions"]

        # Allocate commissions to uplines
        allocation_result = await self.allocate_commissions_to_uplines(
            downline_user_id,
            gross_amount,
            upline_commissions,
            breakdown["system_fee_rate"],
            currency,
            reference_id,
        )

        allocation_result["total_fee_rate"] = breakdown["total_fee_rate"]
        allocation_result["upline_commissions"] = upline_commissions

        return allocation_result
