import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.wallet_transactions import Wallet_transactions
from services.base import BaseService

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Wallet_transactionsService(BaseService[Wallet_transactions]):
    """Service layer for Wallet_transactions operations"""

    def __init__(self, db: AsyncSession):
        super().__init__(db, Wallet_transactions)

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Wallet_transactions]:
        """Get wallet_transactions by any field"""
        try:
            if not hasattr(Wallet_transactions, field_name):
                raise ValueError(f"Field {field_name} does not exist on Wallet_transactions")
            result = await self.db.execute(
                select(Wallet_transactions).where(getattr(Wallet_transactions, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching wallet_transactions by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Wallet_transactions]:
        """Get list of wallet_transactionss filtered by field"""
        try:
            if not hasattr(Wallet_transactions, field_name):
                raise ValueError(f"Field {field_name} does not exist on Wallet_transactions")
            result = await self.db.execute(
                select(Wallet_transactions)
                .where(getattr(Wallet_transactions, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Wallet_transactions.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching wallet_transactionss by {field_name}: {str(e)}")
            raise
