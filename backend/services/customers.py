import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.customers import Customers
from services.base import BaseService

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class CustomersService(BaseService[Customers]):
    """Service layer for Customers operations"""

    def __init__(self, db: AsyncSession):
        super().__init__(db, Customers)

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Customers]:
        """Get customers by any field"""
        try:
            if not hasattr(Customers, field_name):
                raise ValueError(f"Field {field_name} does not exist on Customers")
            result = await self.db.execute(
                select(Customers).where(getattr(Customers, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching customers by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Customers]:
        """Get list of customerss filtered by field"""
        try:
            if not hasattr(Customers, field_name):
                raise ValueError(f"Field {field_name} does not exist on Customers")
            result = await self.db.execute(
                select(Customers)
                .where(getattr(Customers, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Customers.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching customerss by {field_name}: {str(e)}")
            raise
