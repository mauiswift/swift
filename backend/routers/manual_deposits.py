from datetime import datetime
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from services.manual_deposits import ManualDepositService

router = APIRouter(prefix="/api/v1/manual-deposits", tags=["manual-deposits"])

class UploadResponse(BaseModel):
    id: int
    status: str
    file_path: str
    match_result: dict


@router.post("/upload", response_model=UploadResponse)
async def upload_receipt(
    receipt: UploadFile = File(...),
    amount: float = Form(None),
    currency: str = Form("PHP"),
    reference: str = Form(None),
    deposited_at: str = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user),
):
    if receipt.content_type and not (receipt.content_type.startswith("image/") or receipt.content_type == "application/pdf"):
        raise HTTPException(status_code=400, detail="Receipt must be image or PDF")

    data = await receipt.read()
    deposited_dt = None
    if deposited_at:
        deposited_dt = datetime.fromisoformat(deposited_at)
    svc = ManualDepositService(db)
    rec = await svc.create_receipt(
        uploader_id=str(current_user.id),
        file_bytes=data,
        filename=receipt.filename or "receipt",
        amount=amount,
        currency=currency,
        reference=reference,
        deposited_at=deposited_dt,
        metadata=None,
        note=None,
        user_id=str(current_user.id)
    )
    match_result = await svc.try_auto_match(rec.id)
    return UploadResponse(id=rec.id, status=rec.status, file_path=rec.file_path, match_result=match_result)


# Admin endpoints
@router.get("")
async def list_pending(db: AsyncSession = Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    perms = getattr(current_user, "permissions", None)
    if not perms or not getattr(perms, "is_super_admin", False):
        raise HTTPException(status_code=403, detail="Super admin access required")
    svc = ManualDepositService(db)
    items = await svc.list_pending()
    return {"items": [dict(id=i.id, status=i.status, amount=i.amount, reference=i.reference, file_path=i.file_path, created_at=i.created_at) for i in items], "total": len(items)}


@router.get("/{receipt_id}")
async def get_receipt(receipt_id: int, db: AsyncSession = Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    perms = getattr(current_user, "permissions", None)
    if not perms or not getattr(perms, "is_super_admin", False):
        raise HTTPException(status_code=403, detail="Super admin access required")
    rec = await db.get(ManualDepositService.__orig_bases__[0].__args__[0].__mro__[0].__name__, receipt_id)
    # Above reflection hack is not ideal; instead load by model
    from models.manual_deposit_receipts import ManualDepositReceipt
    rec = await db.get(ManualDepositReceipt, receipt_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Not found")
    return rec


class ApproveRequest(BaseModel):
    transaction_id: Optional[int] = None


@router.post("/{receipt_id}/approve")
async def approve_receipt(receipt_id: int, body: ApproveRequest, db: AsyncSession = Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    perms = getattr(current_user, "permissions", None)
    if not perms or not getattr(perms, "is_super_admin", False):
        raise HTTPException(status_code=403, detail="Super admin access required")
    svc = ManualDepositService(db)
    res = await svc.approve(receipt_id, admin_id=str(current_user.id), txn_id=body.transaction_id)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("reason"))
    return res


class RejectRequest(BaseModel):
    reason: str = "Rejected by admin"


@router.post("/{receipt_id}/reject")
async def reject_receipt(receipt_id: int, body: RejectRequest, db: AsyncSession = Depends(get_db), current_user: UserResponse = Depends(get_current_user)):
    perms = getattr(current_user, "permissions", None)
    if not perms or not getattr(perms, "is_super_admin", False):
        raise HTTPException(status_code=403, detail="Super admin access required")
    svc = ManualDepositService(db)
    res = await svc.reject(receipt_id, admin_id=str(current_user.id), reason=body.reason)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("reason"))
    return res
