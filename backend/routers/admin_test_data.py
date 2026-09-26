"""Super-admin tools for clearing payment test records."""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.admin_users import AdminUser
from models.audit_logs import AuditLog
from models.disbursements import Disbursements
from models.transactions import Transactions
from schemas.auth import UserResponse

router = APIRouter(prefix="/api/v1/admin/test-data", tags=["admin-test-data"])


class ClearTestDataRequest(BaseModel):
    confirmation: Literal["CLEAR TEST RECORDS"]


def _test_mode_merchant_ids():
    return select(AdminUser.telegram_id).where(
        AdminUser.test_mode.is_(True),
        AdminUser.is_super_admin.is_(False),
    )


async def _count_records(
    db: AsyncSession,
    model: type[Transactions] | type[Disbursements],
) -> int:
    result = await db.execute(
        select(func.count()).select_from(model).where(model.user_id.in_(_test_mode_merchant_ids()))
    )
    return int(result.scalar_one())


def _require_super_admin(current_user: UserResponse) -> None:
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin access required.",
        )


@router.get("/preview", include_in_schema=False)
async def preview_test_data(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_super_admin(current_user)
    merchants_result = await db.execute(
        select(func.count()).select_from(AdminUser).where(
            AdminUser.test_mode.is_(True),
            AdminUser.is_super_admin.is_(False),
        )
    )
    return {
        "eligible_test_merchants": int(merchants_result.scalar_one()),
        "payment_transactions": await _count_records(db, Transactions),
        "disbursements": await _count_records(db, Disbursements),
    }


@router.post("/clear", include_in_schema=False)
async def clear_test_data(
    request: ClearTestDataRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_super_admin(current_user)

    transaction_result = await db.execute(
        delete(Transactions)
        .where(Transactions.user_id.in_(_test_mode_merchant_ids()))
        .execution_options(synchronize_session=False)
    )
    disbursement_result = await db.execute(
        delete(Disbursements)
        .where(Disbursements.user_id.in_(_test_mode_merchant_ids()))
        .execution_options(synchronize_session=False)
    )

    payment_transactions = transaction_result.rowcount
    disbursements = disbursement_result.rowcount
    if payment_transactions is None or disbursements is None:
        raise RuntimeError("The database did not report deleted test-record counts.")

    counts = {
        "payment_transactions": payment_transactions,
        "disbursements": disbursements,
    }
    db.add(
        AuditLog(
            admin_id=current_user.id,
            admin_name=current_user.name or current_user.email,
            action="clear_test_transaction_records",
            target_type="test_mode_payment_records",
            details=(
                f"Cleared {payment_transactions} payment transactions and "
                f"{disbursements} disbursements for test-mode merchants."
            ),
            payload=counts,
        )
    )
    await db.commit()
    return {"success": True, **counts}
