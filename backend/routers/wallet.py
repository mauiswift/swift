import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.admin_users import AdminUser
from models.disbursements import Disbursements
from models.wallets import Wallets
from models.wallet_transactions import Wallet_transactions
from schemas.auth import UserResponse
from services.swiftpay_service import SwiftPayService
from services.transactions import TransactionsService
from services.admin_notification_service import AdminNotificationService
from services.wallets import WalletsService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/wallet", tags=["wallet-withdrawals"])


class WithdrawRequest(BaseModel):
	request_type: str = "bank"
	currency: str = "PHP"
	amount: float
	bank_name: Optional[str] = None
	account_number: Optional[str] = None
	account_name: Optional[str] = None
	usdt_address: Optional[str] = None
	usdt_platform: Optional[str] = None
	network: Optional[str] = None
	note: Optional[str] = ""


class RejectWithdrawalRequest(BaseModel):
	reason: Optional[str] = "Rejected by admin"


class AdminWalletAdjustRequest(BaseModel):
	amount: float
	note: Optional[str] = ""


def _can_manage_withdrawals(user: UserResponse) -> bool:
	permissions = user.permissions
	return bool(permissions and (permissions.is_super_admin or permissions.can_manage_disbursements))


def _require_super_admin(user: UserResponse) -> None:
	if not user.permissions or not user.permissions.is_super_admin:
		raise HTTPException(status_code=403, detail="Super admin access required.")


async def _list_admin_wallets(db: AsyncSession, currency: str) -> list[dict[str, Any]]:
	"""Return wallet rows for all registered users, including zero-balance wallets."""
	users_result = await db.execute(select(AdminUser).where(AdminUser.is_active.is_(True)))
	for admin in users_result.scalars().all():
		await WalletsService(db).get_or_create_wallet(admin.telegram_id, currency)

	result = await db.execute(
		select(Wallets, AdminUser.telegram_username)
		.outerjoin(AdminUser, AdminUser.telegram_id == Wallets.user_id)
		.where(Wallets.currency == currency)
		.order_by(Wallets.id.desc())
	)
	return [
		{
			"user_id": wallet.user_id,
			"telegram_username": username,
			"balance": float(wallet.balance or 0.0),
			"wallet_id": wallet.id,
			"is_frozen": bool(wallet.is_frozen),
			"freeze_reason": wallet.freeze_reason,
		}
		for wallet, username in result.all()
	]


async def _adjust_admin_wallet(
	db: AsyncSession,
	current_user: UserResponse,
	user_id: str,
	currency: str,
	request: AdminWalletAdjustRequest,
) -> dict[str, Any]:
	_require_super_admin(current_user)
	if request.amount == 0:
		raise HTTPException(status_code=400, detail="Amount must be non-zero")
	try:
		result = await WalletsService(db).adjust_balance(
			target_user_id=user_id,
			amount=request.amount,
			admin_id=str(current_user.id),
			note=request.note or "",
			currency=currency,
		)
	except ValueError as exc:
		raise HTTPException(status_code=400, detail=str(exc)) from exc

	action = "credited" if request.amount > 0 else "debited"
	symbol = {"PHP": "₱", "USD": "$", "KRW": "₩"}.get(currency, "")
	return {
		"success": True,
		"message": f"Successfully {action} {symbol}{abs(request.amount):,.2f} {currency} for {user_id}",
		"balance": result["balance"],
		"transaction_id": result.get("transaction_id"),
	}


@router.get("/balance")
async def get_wallet_balance(
	currency: str = Query("PHP"),
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Return the authenticated user's persisted wallet balance."""
	try:
		return await WalletsService(db).get_balance(str(current_user.id), currency)
	except ValueError as exc:
		raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/transactions")
async def list_wallet_transactions(
	currency: str = Query("PHP"),
	limit: int = Query(20, ge=1, le=100),
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Return the authenticated user's recent wallet transactions."""
	service = WalletsService(db)
	currency_upper = service._normalize_currency(currency)
	effective_user_id = await service._resolve_effective_wallet_user_id(
		str(current_user.id), currency_upper
	)
	result = await db.execute(
		select(Wallet_transactions)
		.join(Wallets, Wallets.id == Wallet_transactions.wallet_id)
		.where(
			Wallet_transactions.user_id == effective_user_id,
			Wallets.currency == currency_upper,
		)
		.order_by(Wallet_transactions.id.desc())
		.limit(limit)
	)
	items = result.scalars().all()
	return {
		"items": [
			{
				"id": item.id,
				"user_id": item.user_id,
				"wallet_id": item.wallet_id,
				"transaction_type": item.transaction_type,
				"amount": float(item.amount or 0.0),
				"balance_before": item.balance_before,
				"balance_after": item.balance_after,
				"recipient": item.recipient,
				"note": item.note,
				"status": item.status,
				"reference_id": item.reference_id,
				"created_at": item.created_at,
			}
			for item in items
		],
		"total": len(items),
		"skip": 0,
		"limit": limit,
	}


@router.get("/admin/php-wallets")
async def list_php_wallets(
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	_require_super_admin(current_user)
	return {"items": await _list_admin_wallets(db, "PHP")}


@router.post("/admin/php-wallets/{user_id}/adjust")
async def adjust_php_wallet(
	user_id: str,
	request: AdminWalletAdjustRequest,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	return await _adjust_admin_wallet(db, current_user, user_id, "PHP", request)


@router.get("/admin/usd-wallets")
async def list_usd_wallets(
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	_require_super_admin(current_user)
	return {"items": await _list_admin_wallets(db, "USD")}


@router.post("/admin/usd-wallets/{user_id}/adjust")
async def adjust_usd_wallet(
	user_id: str,
	request: AdminWalletAdjustRequest,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	return await _adjust_admin_wallet(db, current_user, user_id, "USD", request)


@router.get("/admin/krw-wallets")
async def list_krw_wallets(
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	_require_super_admin(current_user)
	return {"items": await _list_admin_wallets(db, "KRW")}


@router.post("/admin/krw-wallets/{user_id}/adjust")
async def adjust_krw_wallet(
	user_id: str,
	request: AdminWalletAdjustRequest,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	return await _adjust_admin_wallet(db, current_user, user_id, "KRW", request)


async def _notify_withdrawal_request(
	db: AsyncSession,
	request_id: int,
	user: UserResponse,
	amount: float,
	currency: str,
	account_name: str,
) -> None:
	await AdminNotificationService.notify_super_admins(
		db=db,
		notification_type="withdrawal_request",
		title="New withdrawal request",
		message=f"A {currency} withdrawal request for {amount:,.2f} was submitted by {account_name}.",
		user_id=str(user.id),
		user_name=user.name or account_name,
		resource_type="disbursement",
		resource_id=str(request_id),
		priority="high",
		action_url="/withdrawals",
	)


@router.get("/withdraw-requests")
async def list_user_withdrawals(
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	result = await db.execute(
		select(Disbursements)
		.where(Disbursements.user_id == str(current_user.id))
		.order_by(Disbursements.id.desc())
	)
	return {"success": True, "requests": result.scalars().all()}


@router.post("/withdraw-request")
async def create_withdrawal_request(
	request: WithdrawRequest,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	currency = request.currency.strip().upper()
	is_usdt = request.request_type == "usdt_trc20" or currency in {"USD", "USDT"}
	bank_name = request.bank_name or (request.usdt_platform if is_usdt else "Manual")
	account_number = request.account_number or request.usdt_address
	if not bank_name or not account_number:
		raise HTTPException(status_code=422, detail="Bank and account details are required")

	try:
		service = WalletsService(db)
		result = await service.withdraw_request(
			user_id=str(current_user.id),
			amount=request.amount,
			bank_name=bank_name,
			account_number=account_number,
			account_name=request.account_name or str(current_user.name or current_user.id),
			note=request.note or (f"{request.network or 'TRC20'} withdrawal" if is_usdt else ""),
			currency="USD" if is_usdt else currency,
		)
		request_row = await db.scalar(
			select(Disbursements).where(Disbursements.external_id == result["reference_id"])
		)
		if request_row:
			await _notify_withdrawal_request(
				db, request_row.id, current_user, request.amount,
				"USD" if is_usdt else currency, request.account_name or str(current_user.name or current_user.id),
			)
		return result
	except ValueError as exc:
		raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/admin/withdrawals")
async def list_admin_withdrawals(
	status: Optional[str] = Query(None),
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	if not _can_manage_withdrawals(current_user):
		raise HTTPException(status_code=403, detail="Disbursement management permission required")
	query = select(Disbursements).order_by(Disbursements.id.desc())
	if status:
		statuses = ["pending", "transferring"] if status == "pending" else [status]
		query = query.where(Disbursements.status.in_(statuses))
	result = await db.execute(query)
	items = result.scalars().all()
	return {"success": True, "items": items, "total": len(items)}


async def _refund_withdrawal(db: AsyncSession, disb: Disbursements, reason: str) -> None:
	wallet_service = WalletsService(db)
	wallet = await wallet_service.get_or_create_wallet(disb.user_id, disb.currency or "PHP", lock=True)
	wallet.balance = round(float(wallet.balance or 0) + disb.amount, 2)
	wallet.available_balance = round(float(wallet.available_balance or 0) + disb.amount, 2)
	wallet.total_debits = max(0.0, float(wallet.total_debits or 0) - disb.amount)
	disb.status = "failed"
	disb.failure_reason = reason
	disb.updated_at = datetime.now(timezone.utc)
	await db.execute(
		update(Wallet_transactions)
		.where(Wallet_transactions.reference_id == disb.external_id)
		.values(status="failed", note=f"Refunded: {reason}")
	)


@router.post("/admin/withdrawals/{disb_id}/approve")
async def approve_withdrawal(
	disb_id: int,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	if not _can_manage_withdrawals(current_user):
		raise HTTPException(status_code=403, detail="Disbursement management permission required")
	disb = await db.get(Disbursements, disb_id)
	if not disb:
		raise HTTPException(status_code=404, detail="Withdrawal not found")
	if disb.status in {"completed", "failed", "cancelled", "processing"}:
		raise HTTPException(status_code=400, detail=f"Withdrawal is already {disb.status}")
	if (disb.currency or "PHP").upper() != "PHP":
		raise HTTPException(status_code=400, detail="This withdrawal type requires its configured payout provider")

	service = SwiftPayService()
	result = await service.send_disbursement(
		reference_no=disb.external_id,
		amount=disb.amount,
		bank_code=disb.bank_code,
		account_number=disb.account_number,
		account_name=disb.account_name,
		note=disb.description or "Wallet withdrawal",
	)
	if not result.get("success"):
		await _refund_withdrawal(db, disb, result.get("error", "Payout failed"))
		await db.commit()
		raise HTTPException(status_code=502, detail=result.get("error", "Payout failed"))

	gateway_data = result.get("data") or {}
	gateway_status = str(gateway_data.get("status") or "PENDING").upper()
	disb.status = "completed" if gateway_status in {"EXECUTED", "COMPLETED", "SUCCESS"} else "processing"
	gateway_id = gateway_data.get("id") or gateway_data.get("paymentId") or disb.xendit_id or ""
	disb.xendit_id = gateway_id
	disb.processed_at = datetime.now(timezone.utc)
	disb.updated_at = datetime.now(timezone.utc)
	await TransactionsService(db).create_transaction(
		user_id=disb.user_id,
		transaction_type="disbursement",
		amount=disb.amount,
		external_id=disb.external_id,
		gateway_id=gateway_id,
		description=disb.description or "Wallet withdrawal",
		customer_name=disb.account_name or "",
		status="completed" if disb.status == "completed" else "pending",
		currency=disb.currency or "PHP",
		idempotency_key=disb.external_id,
	)
	await db.execute(
		update(Wallet_transactions)
		.where(Wallet_transactions.reference_id == disb.external_id)
		.values(status=disb.status)
	)
	await db.commit()
	return {"success": True, "id": disb.id, "status": disb.status}


@router.post("/admin/withdrawals/{disb_id}/reject")
async def reject_withdrawal(
	disb_id: int,
	body: RejectWithdrawalRequest = RejectWithdrawalRequest(),
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	if not _can_manage_withdrawals(current_user):
		raise HTTPException(status_code=403, detail="Disbursement management permission required")
	disb = await db.get(Disbursements, disb_id)
	if not disb:
		raise HTTPException(status_code=404, detail="Withdrawal not found")
	if disb.status in {"completed", "failed", "cancelled"}:
		raise HTTPException(status_code=400, detail=f"Withdrawal is already {disb.status}")
	await _refund_withdrawal(db, disb, body.reason or "Rejected by admin")
	await db.commit()
	return {"success": True, "id": disb.id, "status": disb.status}