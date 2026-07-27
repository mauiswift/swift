import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Type, TypeVar, Generic

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import Base

logger = logging.getLogger(__name__)

ModelType = TypeVar("ModelType", bound=Base)


class BaseService(Generic[ModelType]):
    """Base class for services with common CRUD operations."""

    def __init__(self, db: AsyncSession, model: Type[ModelType]):
        self.db = db
        self.model = model

    async def create(self, data: Dict[str, Any], user_id: Optional[str] = None) -> ModelType:
        """Create a new record."""
        try:
            if user_id and hasattr(self.model, "user_id"):
                data["user_id"] = user_id

            now = datetime.now(timezone.utc)
            if hasattr(self.model, "created_at") and "created_at" not in data:
                data["created_at"] = now
            if hasattr(self.model, "updated_at") and "updated_at" not in data:
                data["updated_at"] = now

            obj = self.model(**data)
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error creating {self.model.__name__}: {e}")
            raise

    async def bulk_create(self, items: List[Dict[str, Any]], user_id: Optional[str] = None) -> List[ModelType]:
        """Bulk-create multiple records."""
        try:
            now = datetime.now(timezone.utc)
            objs = []
            for data in items:
                if user_id and hasattr(self.model, "user_id"):
                    data["user_id"] = user_id
                if hasattr(self.model, "created_at") and "created_at" not in data:
                    data["created_at"] = now
                if hasattr(self.model, "updated_at") and "updated_at" not in data:
                    data["updated_at"] = now
                objs.append(self.model(**data))

            self.db.add_all(objs)
            await self.db.commit()
            for obj in objs:
                await self.db.refresh(obj)
            return objs
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error bulk creating {self.model.__name__}: {e}")
            raise

    async def get_by_id(self, obj_id: int, user_id: Optional[str] = None) -> Optional[ModelType]:
        """Get record by ID."""
        try:
            query = select(self.model).where(self.model.id == obj_id)
            if user_id and hasattr(self.model, "user_id"):
                query = query.where(self.model.user_id == user_id)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error(f"Error fetching {self.model.__name__} {obj_id}: {e}")
            raise

    async def get_list(
        self,
        skip: int = 0,
        limit: int = 20,
        user_id: Optional[str] = None,
        query_dict: Optional[Dict[str, Any]] = None,
        sort: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Get paginated list of records."""
        try:
            query = select(self.model)
            count_query = select(func.count(self.model.id))

            if user_id and hasattr(self.model, "user_id"):
                query = query.where(self.model.user_id == user_id)
                count_query = count_query.where(self.model.user_id == user_id)

            if query_dict:
                for field, value in query_dict.items():
                    if hasattr(self.model, field):
                        query = query.where(getattr(self.model, field) == value)
                        count_query = count_query.where(getattr(self.model, field) == value)

            count_result = await self.db.execute(count_query)
            total = count_result.scalar()

            if sort:
                if sort.startswith("-"):
                    field_name = sort[1:]
                    if hasattr(self.model, field_name):
                        query = query.order_by(getattr(self.model, field_name).desc())
                else:
                    if hasattr(self.model, sort):
                        query = query.order_by(getattr(self.model, sort))
            else:
                if hasattr(self.model, "id"):
                    query = query.order_by(self.model.id.desc())

            result = await self.db.execute(query.offset(skip).limit(limit))
            items = result.scalars().all()

            return {
                "items": items,
                "total": total,
                "skip": skip,
                "limit": limit,
            }
        except Exception as e:
            logger.error(f"Error fetching {self.model.__name__} list: {e}")
            raise

    async def update(self, obj_id: int, update_data: Dict[str, Any], user_id: Optional[str] = None) -> Optional[ModelType]:
        """Update record."""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                return None

            for key, value in update_data.items():
                if hasattr(obj, key) and key != "user_id":
                    setattr(obj, key, value)

            if hasattr(obj, "updated_at"):
                obj.updated_at = datetime.now(timezone.utc)

            await self.db.commit()
            await self.db.refresh(obj)
            return obj
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error updating {self.model.__name__} {obj_id}: {e}")
            raise

    async def delete(self, obj_id: int, user_id: Optional[str] = None) -> bool:
        """Delete record."""
        try:
            obj = await self.get_by_id(obj_id, user_id=user_id)
            if not obj:
                return False

            await self.db.delete(obj)
            await self.db.commit()
            return True
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error deleting {self.model.__name__} {obj_id}: {e}")
            raise
