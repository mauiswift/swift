import json
import logging
from typing import Any, Dict, List, Optional, Type, TypeVar, Generic

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from services.base import BaseService

logger = logging.getLogger(__name__)

ServiceType = TypeVar("ServiceType", bound=BaseService)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)
ResponseSchemaType = TypeVar("ResponseSchemaType", bound=BaseModel)
ListResponseSchemaType = TypeVar("ListResponseSchemaType", bound=BaseModel)


class BaseEntityRouter(Generic[ServiceType, CreateSchemaType, UpdateSchemaType, ResponseSchemaType, ListResponseSchemaType]):
    """Base class for entity routers with common CRUD endpoints."""

    def __init__(
        self,
        prefix: str,
        tags: List[str],
        service_class: Type[ServiceType],
        create_schema: Type[CreateSchemaType],
        update_schema: Type[UpdateSchemaType],
        response_schema: Type[ResponseSchemaType],
        list_response_schema: Type[ListResponseSchemaType],
        batch_create_schema: Optional[Type[BaseModel]] = None,
    ):
        self.router = APIRouter(prefix=prefix, tags=tags)
        self.service_class = service_class
        self.create_schema = create_schema
        self.update_schema = update_schema
        self.response_schema = response_schema
        self.list_response_schema = list_response_schema
        self.batch_create_schema = batch_create_schema

        self._add_routes()

    def _add_routes(self):
        @self.router.get("", response_model=self.list_response_schema)
        async def query_entities(
            query: str = Query(None, description="Query conditions (JSON string)"),
            sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
            skip: int = Query(0, ge=0),
            limit: int = Query(20, ge=1, le=2000),
            current_user: UserResponse = Depends(get_current_user),
            db: AsyncSession = Depends(get_db),
        ):
            service = self.service_class(db)
            query_dict = None
            if query:
                try:
                    query_dict = json.loads(query)
                except json.JSONDecodeError:
                    raise HTTPException(status_code=400, detail="Invalid query JSON format")
            try:
                return await service.get_list(skip=skip, limit=limit, query_dict=query_dict, sort=sort, user_id=str(current_user.id))
            except Exception as e:
                logger.error(f"Error querying entities: {e}")
                raise HTTPException(status_code=500, detail="Internal server error")

        @self.router.get("/all", response_model=self.list_response_schema)
        async def query_entities_all(
            query: str = Query(None, description="Query conditions (JSON string)"),
            sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
            skip: int = Query(0, ge=0),
            limit: int = Query(20, ge=1, le=2000),
            current_user: UserResponse = Depends(get_current_user),
            db: AsyncSession = Depends(get_db),
        ):
            if not current_user.permissions or not current_user.permissions.is_super_admin:
                raise HTTPException(status_code=403, detail="Super admin access required.")
            service = self.service_class(db)
            query_dict = None
            if query:
                try:
                    query_dict = json.loads(query)
                except json.JSONDecodeError:
                    raise HTTPException(status_code=400, detail="Invalid query JSON format")
            try:
                return await service.get_list(skip=skip, limit=limit, query_dict=query_dict, sort=sort)
            except Exception as e:
                logger.error(f"Error querying entities all: {e}")
                raise HTTPException(status_code=500, detail="Internal server error")

        @self.router.get("/{id}", response_model=self.response_schema)
        async def get_entity(
            id: int,
            current_user: UserResponse = Depends(get_current_user),
            db: AsyncSession = Depends(get_db),
        ):
            service = self.service_class(db)
            try:
                result = await service.get_by_id(id, user_id=str(current_user.id))
                if not result:
                    raise HTTPException(status_code=404, detail="Resource not found")
                return result
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error getting entity {id}: {e}")
                raise HTTPException(status_code=500, detail="Internal server error")

        @self.router.post("", response_model=self.response_schema, status_code=201)
        async def create_entity(
            data: self.create_schema,
            current_user: UserResponse = Depends(get_current_user),
            db: AsyncSession = Depends(get_db),
        ):
            service = self.service_class(db)
            try:
                return await service.create(data.model_dump(), user_id=str(current_user.id))
            except Exception as e:
                logger.error(f"Error creating entity: {e}")
                raise HTTPException(status_code=500, detail="Internal server error")

        if self.batch_create_schema:
            @self.router.post("/batch", response_model=List[self.response_schema], status_code=201)
            async def create_batch(
                request: self.batch_create_schema,
                current_user: UserResponse = Depends(get_current_user),
                db: AsyncSession = Depends(get_db),
            ):
                service = self.service_class(db)
                try:
                    return await service.bulk_create([item.model_dump() for item in request.items], user_id=str(current_user.id))
                except Exception as e:
                    logger.error(f"Error in batch create: {e}")
                    raise HTTPException(status_code=500, detail=f"Batch create failed: {e}")

        @self.router.put("/{id}", response_model=self.response_schema)
        async def update_entity(
            id: int,
            data: self.update_schema,
            current_user: UserResponse = Depends(get_current_user),
            db: AsyncSession = Depends(get_db),
        ):
            service = self.service_class(db)
            try:
                update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
                result = await service.update(id, update_dict, user_id=str(current_user.id))
                if not result:
                    raise HTTPException(status_code=404, detail="Resource not found")
                return result
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error updating entity {id}: {e}")
                raise HTTPException(status_code=500, detail="Internal server error")

        @self.router.delete("/{id}")
        async def delete_entity(
            id: int,
            current_user: UserResponse = Depends(get_current_user),
            db: AsyncSession = Depends(get_db),
        ):
            service = self.service_class(db)
            try:
                if not await service.delete(id, user_id=str(current_user.id)):
                    raise HTTPException(status_code=404, detail="Resource not found")
                return {"success": True, "id": id}
            except HTTPException:
                raise
            except Exception as e:
                logger.error(f"Error deleting entity {id}: {e}")
                raise HTTPException(status_code=500, detail="Internal server error")
