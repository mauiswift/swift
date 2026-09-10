import logging
import math
import re
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
from models.usdt_send_requests import UsdtSendRequest
from models.crypto_topup import CryptoTopupRequest
from schemas.auth import UserResponse
from services.swiftpay_service import SwiftPayService
from services.transactions import TransactionsService
from services.admin_notification_service import AdminNotificationService
from services.wallets import WalletsService
from services.system_earnings import credit_system_earnings
from services.currency_service import CurrencyService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/wallet", tags=["wallet-withdrawals"])


def _normalize_swiftpay_phone(value: Optional[str]) -> Optional[str]:
	"""Normalize Philippine mobile numbers to SwiftPay's required format."""
	digits = re.sub(r"\D", "", value or "")
	if digits.startswith("63"):
		digits = digits[2:]
	if digits.startswith("0"):
		digits = digits[1:]
	if len(digits) != 10 or not digits.startswith("9"):
		return None
	return f"+63-{digits[:2]}-{digits[2:5]}-{digits[5:]}"


class WithdrawRequest(BaseModel):
	request_type: str = "bank"
	currency: str = "PHP"
	amount: float
	bank_name: Optional[str] = None
	account_number: Optional[str] = None
	account_name: Optional[str] = None
	recipient_phone: Optional[str] = None
	usdt_address: Optional[str] = None
	usdt_platform: Optional[str] = None
	network: Optional[str] = None
	note: Optional[str] = ""


class RejectWithdrawalRequest(BaseModel):
	reason: Optional[str] = "Rejected by admin"


class AdminWalletAdjustRequest(BaseModel):
	amount: float
	note: Optional[str] = ""


class WalletConversionRequest(BaseModel):
	from_currency: str
	to_currency: str = "USDT"
	from_amount: float


class DenyUsdtSendRequest(BaseModel):
	reason: str


class CreateUsdtSendRequest(BaseModel):
	amount: float
	to_address: str
	platform: Optional[str] = None
	note: Optional[str] = None


MIN_USDT_CONVERSION_AMOUNT = 100.0


def _can_manage_withdrawals(user: UserResponse) -> bool:
	permissions = user.permissions
	return bool(permissions and (permissions.is_super_admin or permissions.can_manage_disbursements))


def _is_super_admin(user: UserResponse) -> bool:
	return bool(user.permissions and user.permissions.is_super_admin)


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
				"currency": currency_upper,
				"balance_before": item.balance_before,
				"balance_after": item.balance_after,
				"recipient": item.recipient,
				"note": item.note,
				"description": item.note,
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


@router.get("/organization-balance")
async def get_organization_balance(
	currency: str = Query("PHP"),
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Return the current user's organization wallet balance."""
	organization_id = getattr(current_user, "organization_id", None)
	if not organization_id:
		raise HTTPException(status_code=404, detail="Organization wallet not found")

	service = WalletsService(db)
	wallet = await service.get_or_create_wallet(f"org:{organization_id}", currency)
	return {
		"organization_id": organization_id,
		"wallet_id": wallet.id,
		"currency": wallet.currency,
		"balance": float(wallet.balance or 0.0),
		"available_balance": float(wallet.available_balance or 0.0),
		"pending_balance": float(wallet.pending_balance or 0.0),
	}


@router.get("/usdt-send-requests")
async def list_usdt_send_requests(
	status: Optional[str] = Query(None),
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	if not _is_super_admin(current_user):
		raise HTTPException(status_code=403, detail="Super admin review required")
	stmt = select(UsdtSendRequest).order_by(UsdtSendRequest.created_at.desc())
	if status:
		stmt = stmt.where(UsdtSendRequest.status == status)
	result = await db.execute(stmt)
	return {
		"items": [
			{
				"id": item.id,
				"user_id": item.user_id,
				"wallet_id": item.wallet_id,
				"to_address": item.to_address,
				"amount": float(item.amount or 0.0),
				"note": item.note,
				"status": item.status,
				"denial_reason": item.denial_reason,
				"reviewed_by": item.reviewed_by,
				"reviewed_at": item.reviewed_at,
				"created_at": item.created_at,
			}
			for item in result.scalars().all()
		]
	}


@router.get("/crypto-topup-requests")
async def list_crypto_topup_requests(
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	if not _is_super_admin(current_user):
		raise HTTPException(status_code=403, detail="Super admin review required")
	result = await db.execute(select(CryptoTopupRequest).order_by(CryptoTopupRequest.created_at.desc()))
	return {"items": [
		{
			"id": item.id, "user_id": item.user_id, "wallet_id": item.wallet_id,
			"amount_usdt": float(item.amount_usdt or 0), "tx_hash": item.tx_hash,
			"network": item.network, "status": item.status, "notes": item.notes,
			"reviewed_by": item.reviewed_by, "reviewed_at": item.reviewed_at,
			"created_at": item.created_at,
		}
		for item in result.scalars().all()
	]}


@router.post("/crypto-topup-requests/{request_id}/{action}")
async def review_crypto_topup_request(
	request_id: int,
	action: str,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	if not _is_super_admin(current_user):
		raise HTTPException(status_code=403, detail="Super admin review required")
	if action not in {"approve", "reject"}:
		raise HTTPException(status_code=400, detail="Action must be approve or reject")
	result = await db.execute(select(CryptoTopupRequest).where(CryptoTopupRequest.id == request_id).with_for_update())
	request = result.scalar_one_or_none()
	if not request:
		raise HTTPException(status_code=404, detail="Crypto top-up request not found")
	if request.status != "pending":
		raise HTTPException(status_code=400, detail=f"Request is already {request.status}")

	now = datetime.now(timezone.utc)
	if action == "reject":
		request.status = "rejected"
	else:
		await WalletsService(db).credit_wallet(
			user_id=request.user_id,
			amount=float(request.amount_usdt),
			currency="USD",
			transaction_type="crypto_topup",
			reference_id=f"crypto-topup-{request.id}",
			note=f"Crypto top-up approved: {request.tx_hash}",
		)
		request.status = "approved"
	request.reviewed_by = str(current_user.id)
	request.reviewed_at = now
	request.updated_at = now
	await db.commit()
	return {"success": True, "id": request.id, "status": request.status}


@router.post("/usdt-send-requests")
async def create_usdt_send_request(
	request: CreateUsdtSendRequest,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	if not math.isfinite(request.amount) or request.amount <= 0:
		raise HTTPException(status_code=400, detail="Amount must be a positive finite number")
	address = request.to_address.strip()
	if not address.startswith("T") or len(address) != 34:
		raise HTTPException(status_code=400, detail="Invalid USDT TRC-20 address")

	service = WalletsService(db)
	wallet = await service.get_or_create_wallet(str(current_user.id), "USD", lock=True)
	await service._ensure_wallet_active(wallet, "submit a USDT transfer")
	available = float(wallet.available_balance or wallet.balance or 0.0)
	if available < request.amount:
		raise HTTPException(status_code=400, detail="Insufficient available USDT balance")

	now = datetime.now(timezone.utc)
	row = UsdtSendRequest(
		user_id=str(current_user.id),
		wallet_id=wallet.id,
		to_address=address,
		amount=round(request.amount, 2),
		platform=request.platform,
		note=request.note,
		status="pending",
		created_at=now,
		updated_at=now,
	)
	db.add(row)
	await db.commit()
	await db.refresh(row)
	return {"success": True, "id": row.id, "status": row.status}


@router.post("/usdt-send-requests/{request_id}/approve")
async def approve_usdt_send_request(
	request_id: int,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	if not _is_super_admin(current_user):
		raise HTTPException(status_code=403, detail="Super admin approval required")
	result = await db.execute(select(UsdtSendRequest).where(UsdtSendRequest.id == request_id).with_for_update())
	request = result.scalar_one_or_none()
	if not request:
		raise HTTPException(status_code=404, detail="USDT send request not found")
	if request.status != "pending":
		raise HTTPException(status_code=400, detail=f"Request is already {request.status}")

	service = WalletsService(db)
	try:
		wallet = await service.debit_wallet(
			user_id=request.user_id,
			amount=request.amount,
			currency="USD",
			transaction_type="usdt_send",
			reference_id=f"usdt-send-{request.id}",
			note=f"USDT send to {request.to_address}",
		)
	except ValueError as exc:
		await db.rollback()
		raise HTTPException(status_code=400, detail=str(exc)) from exc

	now = datetime.now(timezone.utc)
	request.status = "approved"
	request.reviewed_by = str(current_user.id)
	request.reviewed_at = now
	request.updated_at = now
	await db.commit()
	return {
		"success": True,
		"request": {
			"id": request.id,
			"status": request.status,
			"reviewed_by": request.reviewed_by,
			"reviewed_at": request.reviewed_at,
		},
		"balance": float(wallet.balance or 0.0),
	}


@router.post("/usdt-send-requests/{request_id}/deny")
async def deny_usdt_send_request(
	request_id: int,
	body: DenyUsdtSendRequest,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	if not _is_super_admin(current_user):
		raise HTTPException(status_code=403, detail="Super admin approval required")
	result = await db.execute(select(UsdtSendRequest).where(UsdtSendRequest.id == request_id).with_for_update())
	request = result.scalar_one_or_none()
	if not request:
		raise HTTPException(status_code=404, detail="USDT send request not found")
	if request.status != "pending":
		raise HTTPException(status_code=400, detail=f"Request is already {request.status}")
	if not body.reason.strip():
		raise HTTPException(status_code=400, detail="Denial reason is required")

	now = datetime.now(timezone.utc)
	request.status = "denied"
	request.denial_reason = body.reason.strip()
	request.reviewed_by = str(current_user.id)
	request.reviewed_at = now
	request.updated_at = now
	await db.commit()
	return {
		"success": True,
		"request": {
			"id": request.id,
			"status": request.status,
			"denial_reason": request.denial_reason,
			"reviewed_by": request.reviewed_by,
			"reviewed_at": request.reviewed_at,
		},
	}


@router.post("/convert")
async def convert_wallet_balance(
	request: WalletConversionRequest,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Convert PHP, KRW, or USDT in either direction with symmetric earnings."""
	from_currency = request.from_currency.strip().upper()
	to_currency = request.to_currency.strip().upper()
	supported_currencies = {"PHP", "CNY", "KRW", "USD", "USDT"}
	if from_currency not in supported_currencies or to_currency not in supported_currencies:
		raise HTTPException(status_code=400, detail="Only PHP, CNY, KRW, and USDT conversion is supported")
	if from_currency == to_currency:
		raise HTTPException(status_code=400, detail="Source and target currencies must be different")
	if request.from_amount <= 0:
		raise HTTPException(status_code=400, detail="Conversion amount must be positive")
	if not math.isfinite(request.from_amount):
		raise HTTPException(status_code=400, detail="Conversion amount must be finite")

	normalized_from = "USD" if from_currency == "USDT" else from_currency
	normalized_to = "USD" if to_currency == "USDT" else to_currency
	if normalized_from == normalized_to:
		raise HTTPException(status_code=400, detail="Source and target currencies must be different")

	service = WalletsService(db)
	owner_id = str(current_user.id)
	try:
		quote = await CurrencyService(db).get_conversion_quote(
			wallet_id=0,
			from_currency=normalized_from,
			to_currency=normalized_to,
			from_amount=request.from_amount,
		)
		if normalized_to == "USD" and quote["to_amount"] < MIN_USDT_CONVERSION_AMOUNT:
			raise ValueError(f"Minimum purchase is {MIN_USDT_CONVERSION_AMOUNT:,.0f} USDT")

		from_wallet = await service.get_or_create_wallet(owner_id, normalized_from, lock=True)
		to_wallet = await service.get_or_create_wallet(owner_id, normalized_to, lock=True)
		conversion = await CurrencyService(db).convert_currency(
			from_wallet=from_wallet,
			to_wallet=to_wallet,
			from_amount=request.from_amount,
			user_id=owner_id,
			rate=quote["rate"],
		)
		await db.commit()
	except ValueError as exc:
		await db.rollback()
		raise HTTPException(status_code=400, detail=str(exc)) from exc

	return {
		"success": True,
		"from_currency": normalized_from,
		"to_currency": normalized_to,
		"from_amount": request.from_amount,
		"to_amount": conversion.to_amount,
		"rate": conversion.rate_applied,
		"fee_amount": conversion.conversion_fee_amount,
		"fee_rate": conversion.conversion_fee_rate,
		"reference_id": conversion.reference_id,
	}


@router.post("/quote")
@router.post("/conversion-quote", include_in_schema=False)
async def quote_wallet_conversion(
	request: WalletConversionRequest,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Return a directional wallet conversion quote without changing balances."""
	from_currency = request.from_currency.strip().upper()
	to_currency = request.to_currency.strip().upper()
	if not math.isfinite(request.from_amount) or request.from_amount <= 0:
		raise HTTPException(status_code=400, detail="Conversion amount must be a positive finite number")
	try:
		quote = await CurrencyService(db).get_conversion_quote(
			wallet_id=0,
			from_currency=from_currency,
			to_currency=to_currency,
			from_amount=request.from_amount,
		)
	except ValueError as exc:
		raise HTTPException(status_code=400, detail=str(exc)) from exc
	return {"success": True, **quote}


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
	if not is_usdt and currency not in {"PHP", "KRW"}:
		raise HTTPException(status_code=400, detail="Bank withdrawals currently support PHP and KRW")
	if is_usdt:
		raise HTTPException(status_code=400, detail="Use the USDT transfer request flow for USDT withdrawals")
	bank_name = request.bank_name or (request.usdt_platform if is_usdt else "Manual")
	account_number = request.account_number or request.usdt_address
	if not bank_name or not account_number:
		raise HTTPException(status_code=422, detail="Bank and account details are required")
	if currency == "PHP" and not _normalize_swiftpay_phone(request.recipient_phone):
		raise HTTPException(status_code=422, detail="A valid Philippine mobile number is required (format: +63-XX-XXX-XXXXX)")

	try:
		service = WalletsService(db)
		result = await service.withdraw_request(
			user_id=str(current_user.id),
			amount=request.amount,
			bank_name=bank_name,
			account_number=account_number,
			account_name=request.account_name or str(current_user.name or current_user.id),
			recipient_phone=_normalize_swiftpay_phone(request.recipient_phone) if currency == "PHP" else None,
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
	if not _is_super_admin(current_user):
		raise HTTPException(status_code=403, detail="Super admin review required")
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
	refund_amount = round(float(disb.amount or 0) + float(disb.processing_fee or 0), 2)
	balance_before = float(wallet.balance or 0.0)
	wallet.balance = round(float(wallet.balance or 0) + refund_amount, 2)
	wallet.available_balance = round(float(wallet.available_balance or 0) + refund_amount, 2)
	wallet.total_debits = max(0.0, float(wallet.total_debits or 0) - refund_amount)
	disb.status = "failed"
	disb.failure_reason = reason
	disb.updated_at = datetime.now(timezone.utc)
	await db.execute(
		update(Wallet_transactions)
		.where(Wallet_transactions.reference_id == disb.external_id)
		.values(status="failed", note=f"Refunded: {reason}")
	)
	db.add(Wallet_transactions(
		user_id=wallet.user_id,
		wallet_id=wallet.id,
		transaction_type="refund",
		amount=refund_amount,
		balance_before=balance_before,
		balance_after=wallet.balance,
		status="completed",
		reference_id=f"{disb.external_id}-refund",
		note=f"Withdrawal refund: {reason}",
		created_at=datetime.now(timezone.utc),
	))
	await db.execute(
		update(Wallet_transactions)
		.where(Wallet_transactions.reference_id == f"{disb.external_id}-fee")
		.values(status="failed", note=f"Fee refunded: {reason}")
	)


@router.post("/admin/withdrawals/{disb_id}/approve")
async def approve_withdrawal(
	disb_id: int,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	if not _is_super_admin(current_user):
		raise HTTPException(status_code=403, detail="Super admin approval required")
	disb_result = await db.execute(
		select(Disbursements).where(Disbursements.id == disb_id).with_for_update()
	)
	disb = disb_result.scalar_one_or_none()
	if not disb:
		raise HTTPException(status_code=404, detail="Withdrawal not found")
	if disb.status in {"completed", "failed", "cancelled", "processing"}:
		raise HTTPException(status_code=400, detail=f"Withdrawal is already {disb.status}")
	if (disb.currency or "PHP").upper() == "KRW":
		disb.status = "processing"
		disb.processed_at = datetime.now(timezone.utc)
		disb.updated_at = datetime.now(timezone.utc)
		await db.execute(
			update(Wallet_transactions)
			.where(Wallet_transactions.reference_id == disb.external_id)
			.values(status="processing")
		)
		await db.commit()
		return {"success": True, "id": disb.id, "status": disb.status, "message": "KRW withdrawal approved for manual processing"}

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
	if disb.status == "completed" and disb.processing_fee:
		await credit_system_earnings(
			db=db,
			amount=disb.processing_fee,
			currency=disb.currency or "PHP",
			reference_id=f"{disb.external_id}-system-fee",
			note=f"Withdrawal earnings: {disb.processing_fee:,.2f} {disb.currency or 'PHP'}",
		)
		await db.execute(
			update(Wallet_transactions)
			.where(Wallet_transactions.reference_id == f"{disb.external_id}-fee")
			.values(status="completed")
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
	if not _is_super_admin(current_user):
		raise HTTPException(status_code=403, detail="Super admin approval required")
	disb = await db.get(Disbursements, disb_id)
	if not disb:
		raise HTTPException(status_code=404, detail="Withdrawal not found")
	if disb.status in {"completed", "failed", "cancelled"}:
		raise HTTPException(status_code=400, detail=f"Withdrawal is already {disb.status}")
	await _refund_withdrawal(db, disb, body.reason or "Rejected by admin")
	await db.commit()
	return {"success": True, "id": disb.id, "status": disb.status}