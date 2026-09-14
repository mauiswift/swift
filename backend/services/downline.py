"""Services for referral hierarchy and downline commission tracking."""

import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.downline import Downline, DownlineCommission, DownlineNetworkStats

logger = logging.getLogger(__name__)
MAX_DOWNLINE_LEVEL = 3


class DownlineService:
    """Manage referral relationships, commissions, and network summaries."""

    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _user_id_variants(user_id: str) -> list[str]:
        normalized = str(user_id).strip()
        raw = normalized[3:] if normalized.startswith("tg-") else normalized
        return list(dict.fromkeys((normalized, raw, f"tg-{raw}")))

    async def upsert_relationship(
        self,
        upline_user_id: str,
        downline_user_id: str,
        *,
        level: int = 1,
        is_direct: bool = True,
        status: str = "active",
    ) -> Downline:
        """Create or update one referral relationship idempotently."""
        if not upline_user_id or not downline_user_id:
            raise ValueError("Both upline and downline user IDs are required")
        if upline_user_id == downline_user_id:
            raise ValueError("A user cannot refer themselves")
        if level < 1 or level > MAX_DOWNLINE_LEVEL:
            raise ValueError(f"Relationship level must be between 1 and {MAX_DOWNLINE_LEVEL}")

        result = await self.db.execute(
            select(Downline).where(
                or_(*[Downline.upline_user_id == value for value in self._user_id_variants(upline_user_id)]),
                or_(*[Downline.downline_user_id == value for value in self._user_id_variants(downline_user_id)]),
            )
        )
        relationship = result.scalar_one_or_none()
        now = datetime.now(timezone.utc)
        if relationship is None:
            relationship = Downline(
                upline_user_id=str(upline_user_id),
                downline_user_id=str(downline_user_id),
                level=level,
                is_direct=is_direct,
                status=status,
                created_at=now,
                updated_at=now,
            )
            self.db.add(relationship)
        else:
            relationship.level = level
            relationship.is_direct = is_direct
            relationship.status = status
            relationship.updated_at = now

        await self.db.commit()
        await self.db.refresh(relationship)
        return relationship

    async def list_downline(
        self,
        upline_user_id: str,
        *,
        max_level: int = MAX_DOWNLINE_LEVEL,
        active_only: bool = False,
    ) -> list[Downline]:
        """Return the user's reachable downline up to ``max_level``."""
        if max_level < 1:
            return []

        result = await self.db.execute(
            select(Downline)
            .where(
                Downline.upline_user_id.in_(self._user_id_variants(str(upline_user_id))),
                Downline.level <= max_level,
                *([Downline.status == "active"] if active_only else []),
            )
            .order_by(Downline.level.asc(), Downline.created_at.asc(), Downline.id.asc())
        )
        return list(result.scalars().all())

    async def record_commission(
        self,
        *,
        recipient_id: str,
        source_user_id: str,
        commission_type: str,
        amount: float,
        reference_id: Optional[str] = None,
        currency: str = "PHP",
        level: int = 1,
        description: Optional[str] = None,
    ) -> DownlineCommission:
        """Record a pending commission once and update the relationship total."""
        if amount < 0:
            raise ValueError("Commission amount cannot be negative")
        if level < 1:
            raise ValueError("Commission level must be at least 1")

        if reference_id:
            existing_result = await self.db.execute(
                select(DownlineCommission).where(
                    DownlineCommission.recipient_id == str(recipient_id),
                    DownlineCommission.source_user_id == str(source_user_id),
                    DownlineCommission.commission_type == commission_type,
                    DownlineCommission.reference_id == reference_id,
                )
            )
            existing = existing_result.scalar_one_or_none()
            if existing is not None:
                return existing

        commission = DownlineCommission(
            recipient_id=str(recipient_id),
            source_user_id=str(source_user_id),
            commission_type=commission_type,
            amount=round(float(amount), 2),
            currency=currency,
            reference_id=reference_id,
            description=description,
            level=level,
            status="pending",
            created_at=datetime.now(timezone.utc),
        )
        self.db.add(commission)

        relationship_result = await self.db.execute(
            select(Downline).where(
                Downline.upline_user_id == str(recipient_id),
                Downline.downline_user_id == str(source_user_id),
            )
        )
        relationship = relationship_result.scalar_one_or_none()
        if relationship is not None:
            relationship.pending_commissions = round(
                float(relationship.pending_commissions or 0) + commission.amount,
                2,
            )
            relationship.updated_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(commission)
        return commission

    async def get_network_stats(self, user_id: str) -> DownlineNetworkStats:
        """Build and persist current network counts and commission totals."""
        relationships = await self.list_downline(user_id)
        direct_count = sum(1 for item in relationships if item.is_direct)
        active_count = sum(1 for item in relationships if item.status == "active")
        level_counts = {
            level: sum(1 for item in relationships if item.level == level)
            for level in range(1, MAX_DOWNLINE_LEVEL + 1)
        }

        commission_result = await self.db.execute(
            select(
                func.coalesce(func.sum(DownlineCommission.amount), 0),
                func.coalesce(
                    func.sum(
                        DownlineCommission.amount
                    ).filter(DownlineCommission.status == "pending"),
                    0,
                ),
                func.coalesce(
                    func.sum(
                        DownlineCommission.amount
                    ).filter(DownlineCommission.status == "paid"),
                    0,
                ),
            ).where(DownlineCommission.recipient_id.in_(self._user_id_variants(str(user_id))))
        )
        total_earned, pending_earnings, paid_out = commission_result.one()

        stats_result = await self.db.execute(
            select(DownlineNetworkStats).where(DownlineNetworkStats.user_id == str(user_id))
        )
        stats = stats_result.scalar_one_or_none()
        now = datetime.now(timezone.utc)
        if stats is None:
            stats = DownlineNetworkStats(user_id=str(user_id), created_at=now)
            self.db.add(stats)

        stats.direct_referrals = direct_count
        stats.total_network_size = len(relationships)
        stats.active_members = active_count
        stats.total_earned = float(total_earned or 0)
        stats.pending_earnings = float(pending_earnings or 0)
        stats.paid_out = float(paid_out or 0)
        stats.level_1_count = level_counts[1]
        stats.level_2_count = level_counts[2]
        stats.level_3_count = level_counts[3]
        # Keep legacy database columns at zero now that the network is capped
        # at three levels.
        stats.level_4_count = level_counts.get(4, 0)
        stats.level_5_count = level_counts.get(5, 0)
        stats.updated_at = now

        await self.db.commit()
        await self.db.refresh(stats)
        return stats
