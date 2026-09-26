"""Super-admin tools for clearing payment test records."""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import cast, delete, func, select, String
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.admin_users import AdminUser
from models.audit_logs import AuditLog
from models.disbursements import Disbursements
from models.manual_deposit_receipts import ManualDepositReceipt
from models.refunds import Refunds
from models.transactions import Transactions
from models.wallet_transactions import Wallet_transactions
from schemas.auth import UserResponse

router = APIRouter(prefix="/api/v1/admin/test-data", tags=["admin-test-data"])


class ClearTestDataRequest(BaseModel):
    confirmation: Literal["CLEAR TEST RECORDS"]


def _test_mode_merchant_ids():
    eligible_test_merchants = (
        AdminUser.test_mode.is_(True),
        AdminUser.is_super_admin.is_(False),
    )
    return select(AdminUser.telegram_id.label("user_id")).where(
        *eligible_test_merchants
    ).union(
        select(cast(AdminUser.id, String).label("user_id")).where(
            *eligible_test_merchants
        )
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
        "wallet_transactions": await _count_records(db, Wallet_transactions),
        "refunds": await _count_records(db, Refunds),
        "deposit_receipts": await _count_records(db, ManualDepositReceipt),
    }


@router.post("/clear", include_in_schema=False)
async def clear_test_data(
    request: ClearTestDataRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _require_super_admin(current_user)

    receipt_result = await db.execute(
        delete(ManualDepositReceipt)
        .where(ManualDepositReceipt.user_id.in_(_test_mode_merchant_ids()))
        .execution_options(synchronize_session=False)
    )
    refund_result = await db.execute(
        delete(Refunds)
        .where(Refunds.user_id.in_(_test_mode_merchant_ids()))
        .execution_options(synchronize_session=False)
    )
    wallet_transaction_result = await db.execute(
        delete(Wallet_transactions)
        .where(Wallet_transactions.user_id.in_(_test_mode_merchant_ids()))
        .execution_options(synchronize_session=False)
    )
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
    wallet_transactions = wallet_transaction_result.rowcount
    refunds = refund_result.rowcount
    deposit_receipts = receipt_result.rowcount
    if any(
        count is None
        for count in (payment_transactions, disbursements, wallet_transactions, refunds, deposit_receipts)
    ):
        raise RuntimeError("The database did not report deleted test-record counts.")

    counts = {
        "payment_transactions": payment_transactions,
        "disbursements": disbursements,
        "wallet_transactions": wallet_transactions,
        "refunds": refunds,
        "deposit_receipts": deposit_receipts,
    }
    db.add(
        AuditLog(
            admin_id=current_user.id,
            admin_name=current_user.name or current_user.email,
            action="clear_test_transaction_records",
            target_type="test_mode_payment_records",
            details=(
                f"Cleared payment transactions={payment_transactions}, disbursements={disbursements}, "
                f"wallet transactions={wallet_transactions}, refunds={refunds}, "
                f"deposit receipts={deposit_receipts} for test-mode merchants."
            ),
            payload=counts,
        )
    )
    await db.commit()
    return {"success": True, **counts}
