import logging
from typing import Optional, Dict, Any, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.bot_logs import Bot_logs
from services.base import BaseService

logger = logging.getLogger(__name__)


# ------------------ Service Layer ------------------
class Bot_logsService(BaseService[Bot_logs]):
    """Service layer for Bot_logs operations"""

    def __init__(self, db: AsyncSession):
        super().__init__(db, Bot_logs)

    async def get_by_field(self, field_name: str, field_value: Any) -> Optional[Bot_logs]:
        """Get bot_logs by any field"""
        try:
            if not hasattr(Bot_logs, field_name):
                raise ValueError(f"Field {field_name} does not exist on Bot_logs")
            result = await self.db.execute(
                select(Bot_logs).where(getattr(Bot_logs, field_name) == field_value)
            )
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching bot_logs by {field_name}: {str(e)}")
            raise

    async def list_by_field(
        self, field_name: str, field_value: Any, skip: int = 0, limit: int = 20
    ) -> List[Bot_logs]:
        """Get list of bot_logss filtered by field"""
        try:
            if not hasattr(Bot_logs, field_name):
                raise ValueError(f"Field {field_name} does not exist on Bot_logs")
            result = await self.db.execute(
                select(Bot_logs)
                .where(getattr(Bot_logs, field_name) == field_value)
                .offset(skip)
                .limit(limit)
                .order_by(Bot_logs.id.desc())
            )
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching bot_logss by {field_name}: {str(e)}")
            raise
