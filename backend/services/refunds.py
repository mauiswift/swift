import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.refunds import Refunds
from services.base import BaseService

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class RefundsService(BaseService[Refunds]):
    """Service layer for Refunds operations"""

    def __init__(self, db: AsyncSession):
        super().__init__(db, Refunds)

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Refunds]:
        """Get refunds by any field"""
        try:
            if not hasattr(Refunds, field_name):
                raise ValueError(f"Field {field_name} does not exist on Refunds")
            result = await self.db.execute(
                select(Refunds).where(getattr(Refunds, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching refunds by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Refunds]:
        """Get list of refundss filtered by field"""
        try:
            if not hasattr(Refunds, field_name):
                raise ValueError(f"Field {field_name} does not exist on Refunds")
            result = await self.db.execute(
                select(Refunds)
                .where(getattr(Refunds, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Refunds.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching refundss by {field_name}: {str(e)}")
            raise
