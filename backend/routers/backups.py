import base64
import json
from datetime import date, datetime, time
from decimal import Decimal
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy import Table
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import Base, get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

router = APIRouter(prefix="/api/v1/admin/backups", tags=["admin-backups"])

BACKUP_VERSION = 1


def _require_super_admin(current_user: UserResponse) -> None:
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required")


def _encode_value(value: Any) -> Any:
    if isinstance(value, datetime):
        return {"__type__": "datetime", "value": value.isoformat()}
    if isinstance(value, date):
        return {"__type__": "date", "value": value.isoformat()}
    if isinstance(value, time):
        return {"__type__": "time", "value": value.isoformat()}
    if isinstance(value, Decimal):
        return {"__type__": "decimal", "value": str(value)}
    if isinstance(value, UUID):
        return {"__type__": "uuid", "value": str(value)}
    if isinstance(value, bytes):
        return {"__type__": "bytes", "value": base64.b64encode(value).decode("ascii")}
    if isinstance(value, dict):
        return {key: _encode_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_encode_value(item) for item in value]
    return value


def _decode_value(value: Any) -> Any:
    if isinstance(value, list):
        return [_decode_value(item) for item in value]
    if not isinstance(value, dict) or "__type__" not in value:
        return {key: _decode_value(item) for key, item in value.items()} if isinstance(value, dict) else value

    value_type = value.get("__type__")
    raw_value = value.get("value")
    try:
        if value_type == "datetime":
            return datetime.fromisoformat(raw_value)
        if value_type == "date":
            return date.fromisoformat(raw_value)
        if value_type == "time":
            return time.fromisoformat(raw_value)
        if value_type == "decimal":
            return Decimal(raw_value)
        if value_type == "uuid":
            return UUID(raw_value)
        if value_type == "bytes":
            return base64.b64decode(raw_value)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Backup contains an invalid typed value")
    raise HTTPException(status_code=400, detail="Backup contains an unsupported typed value")


def _metadata_tables() -> list[Table]:
    return list(Base.metadata.sorted_tables)


@router.get("/download")
async def download_backup(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_super_admin(current_user)
    tables = _metadata_tables()
    snapshot = {
        "format": "swiftpay-database-backup",
        "version": BACKUP_VERSION,
        "tables": {},
    }
    for table in tables:
        result = await db.execute(table.select())
        snapshot["tables"][table.name] = [
            {column.name: _encode_value(value) for column, value in zip(table.columns, row)}
            for row in result.fetchall()
        ]

    filename = f"swiftpay-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    return Response(
        content=json.dumps(snapshot, separators=(",", ":")),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/restore")
async def restore_backup(
    backup: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_super_admin(current_user)
    if backup.content_type not in {"application/json", "application/octet-stream", "text/json", None}:
        raise HTTPException(status_code=400, detail="Upload a JSON backup file")

    try:
        payload = json.loads(await backup.read())
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise HTTPException(status_code=400, detail="Backup file is not valid JSON")

    if (
        not isinstance(payload, dict)
        or payload.get("format") != "swiftpay-database-backup"
        or payload.get("version") != BACKUP_VERSION
        or not isinstance(payload.get("tables"), dict)
    ):
        raise HTTPException(status_code=400, detail="Unsupported or invalid SwiftPay backup")

    tables = _metadata_tables()
    table_map = {table.name: table for table in tables}
    if set(payload["tables"]) != set(table_map):
        raise HTTPException(status_code=400, detail="Backup schema does not match this installation")

    try:
        if db.in_transaction():
            await db.rollback()
        async with db.begin():
            for table in reversed(tables):
                await db.execute(table.delete())
            for table in tables:
                rows = payload["tables"][table.name]
                if not isinstance(rows, list):
                    raise HTTPException(status_code=400, detail=f"Invalid rows for table {table.name}")
                allowed_columns = {column.name for column in table.columns}
                decoded_rows = []
                for row in rows:
                    if not isinstance(row, dict) or set(row) - allowed_columns:
                        raise HTTPException(status_code=400, detail=f"Invalid columns for table {table.name}")
                    decoded_rows.append({key: _decode_value(value) for key, value in row.items()})
                if decoded_rows:
                    await db.execute(table.insert(), decoded_rows)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Restore failed; no changes were applied: {exc}") from exc

    return {"success": True, "message": "Backup restored successfully", "tables": len(tables)}