from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from services.private_receipts import resolve_receipt_path


router = APIRouter(prefix="/api/v1/receipts", tags=["receipts"])


@router.get("/{receipt_ref:path}")
async def get_private_receipt(
    receipt_ref: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not (current_user.permissions and current_user.permissions.is_super_admin):
        raise HTTPException(status_code=403, detail="Receipt review access required")

    path = resolve_receipt_path(receipt_ref)
    if not path:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return FileResponse(
        path,
        headers={
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    )