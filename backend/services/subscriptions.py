import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.subscriptions import Subscriptions
from services.base import BaseService

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class SubscriptionsService(BaseService[Subscriptions]):
    """Service layer for Subscriptions operations"""

    def __init__(self, db: AsyncSession):
        super().__init__(db, Subscriptions)

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Subscriptions]:
        """Get subscriptions by any field"""
        try:
            if not hasattr(Subscriptions, field_name):
                raise ValueError(f"Field {field_name} does not exist on Subscriptions")
            result = await self.db.execute(
                select(Subscriptions).where(getattr(Subscriptions, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching subscriptions by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Subscriptions]:
        """Get list of subscriptionss filtered by field"""
        try:
            if not hasattr(Subscriptions, field_name):
                raise ValueError(f"Field {field_name} does not exist on Subscriptions")
            result = await self.db.execute(
                select(Subscriptions)
                .where(getattr(Subscriptions, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Subscriptions.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching subscriptionss by {field_name}: {str(e)}")
            raise
