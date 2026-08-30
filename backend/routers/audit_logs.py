import csv
import io
import json
import logging
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select, func, desc, text
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.audit_logs import AuditLog
from schemas.auth import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/audit-logs", tags=["audit-logs"])

class AuditLogOut(BaseModel):
    id: int
    admin_id: str
    admin_name: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    details: Optional[str] = None
    payload: Optional[dict] = None
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AuditLogList(BaseModel):
    items: List[AuditLogOut]
    total: int

def _build_audit_query(
    action: Optional[str] = None,
    admin_id: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
):
    query = select(AuditLog)
    if action:
        query = query.where(AuditLog.action == action)
    if admin_id:
        query = query.where(AuditLog.admin_id == admin_id)
    if target_type:
        query = query.where(AuditLog.target_type == target_type)
    if target_id:
        query = query.where(AuditLog.target_id == target_id)
    return query


@router.get("", response_model=AuditLogList)
async def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    admin_id: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all audit logs. Only super admins can view.
    """
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required to view audit logs.",
        )

    query = _build_audit_query(action, admin_id, target_type, target_id)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()

    query = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
    res = await db.execute(query)
    items = res.scalars().all()

    return AuditLogList(items=items, total=total)


@router.get("/export")
async def export_audit_logs_csv(
    action: Optional[str] = None,
    admin_id: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export filtered audit logs as CSV. Super admins only."""
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required to export audit logs.",
        )

    query = _build_audit_query(action, admin_id, target_type, target_id).order_by(desc(AuditLog.created_at))
    res = await db.execute(query)
    rows = res.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id",
        "admin_id",
        "admin_name",
        "action",
        "target_type",
        "target_id",
        "details",
        "payload",
        "ip_address",
        "created_at",
    ])

    for row in rows:
        writer.writerow([
            row.id,
            row.admin_id,
            row.admin_name,
            row.action,
            row.target_type,
            row.target_id,
            row.details,
            json.dumps(row.payload, ensure_ascii=False) if row.payload is not None else "",
            row.ip_address,
            row.created_at.isoformat() if row.created_at else "",
        ])

    filename = "audit_logs.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


async def purge_old_audit_logs(
    db: AsyncSession,
    current_user: UserResponse,
    days: int = 90,
) -> int:
    """Delete stale audit rows older than the configured retention window."""
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required to purge audit logs.",
        )
    if days < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="days must be greater than or equal to 0.",
        )

    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    stmt = text("DELETE FROM audit_logs WHERE created_at < :cutoff")
    result = await db.execute(stmt, {"cutoff": cutoff})
    await db.commit()
    return int(result.rowcount or 0)


@router.delete("/purge")
async def purge_old_audit_logs_route(
    days: int = Query(90, ge=0),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Purge old audit records for a retention window. Super admins only."""
    deleted = await purge_old_audit_logs(db=db, current_user=current_user, days=days)
    return {"success": True, "deleted": deleted}
