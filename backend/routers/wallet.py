import logging
import math
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel
from sqlalchemy import or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_current_user
from models.admin_users import AdminUser
from models.disbursements import Disbursements
from models.wallets import Wallets
from models.wallet_transactions import Wallet_transactions
from models.transactions import Transactions
from models.usdt_send_requests import UsdtSendRequest
from models.crypto_topup import CryptoTopupRequest
from models.usdt_trades import UsdtTrade
from models.usdt_deposit_addresses import UsdtDepositAddress
from schemas.auth import UserResponse
from services.swiftpay_service import SwiftPayService
from services.transactions import TransactionsService
from services.admin_notification_service import AdminNotificationService
from services.wallets import WalletsService
from services.user_benefits import unlock_krw_benefits
from services.system_earnings import credit_system_earnings
from services.currency_service import CurrencyService
from services.magpie_service import MagpieService
from services.usdt_trade_service import UsdtTradeService
from core.constants import public_currency

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/wallet", tags=["wallet-withdrawals"])


def _normalize_swiftpay_phone(value: Optional[str]) -> Optional[str]:
	"""Normalize Philippine mobile numbers to SwiftPay's required format."""
	return SwiftPayService.normalize_philippine_mobile(value)


class WithdrawRequest(BaseModel):
	request_type: str = "bank"
	currency: str = "PHP"
	amount: float
	bank_name: Optional[str] = None
	bank_code: Optional[str] = None
	account_number: Optional[str] = None
	account_name: Optional[str] = None
	recipient_phone: Optional[str] = None
	usdt_address: Optional[str] = None
	usdt_platform: Optional[str] = None
	network: Optional[str] = None
	note: Optional[str] = ""
	passkey_credential: Optional[dict] = None
	otp_reference: Optional[str] = None
	otp_code: Optional[str] = None


class RejectWithdrawalRequest(BaseModel):
	reason: Optional[str] = "Rejected by admin"


class AdminWalletAdjustRequest(BaseModel):
	amount: float
	note: Optional[str] = ""


class UnifiedAdminWalletAdjustRequest(BaseModel):
	user_id: str
	currency: str
	amount: float
	note: str


class WalletConversionRequest(BaseModel):
	from_currency: str
	to_currency: str = "USDT"
	from_amount: float
	passkey_credential: Optional[dict] = None
	idempotency_key: Optional[str] = None


class DenyUsdtSendRequest(BaseModel):
	reason: str


class RejectUsdtTradeRequest(BaseModel):
	reason: str


class CreateUsdtSendRequest(BaseModel):
	amount: float
	to_address: str
	platform: Optional[str] = None
	note: Optional[str] = None
	passkey_credential: Optional[dict] = None
	otp_reference: Optional[str] = None
	otp_code: Optional[str] = None


def _can_manage_withdrawals(user: UserResponse) -> bool:
	permissions = user.permissions
	return bool(permissions and (permissions.is_super_admin or permissions.can_manage_disbursements))


def _is_super_admin(user: UserResponse) -> bool:
	return bool(user.permissions and user.permissions.is_super_admin)


def _require_super_admin(user: UserResponse) -> None:
	if not user.permissions or not user.permissions.is_super_admin:
		raise HTTPException(status_code=403, detail="Super admin access required.")


PUBLIC_ADMIN_WALLET_CURRENCIES = ("PHP", "USDT", "CNY", "KRW")
INTERNAL_ADMIN_WALLET_CURRENCIES = ("PHP", "USD", "CNY", "KRW")


async def _list_all_admin_wallets(db: AsyncSession) -> list[dict[str, Any]]:
	"""Return one row per supported wallet for every active user."""
	service = WalletsService(db)
	users_result = await db.execute(select(AdminUser).where(AdminUser.is_active.is_(True)))
	active_admins = users_result.scalars().all()
	active_user_ids = [admin.telegram_id for admin in active_admins]
	active_organization_ids = list({
		admin.organization_id for admin in active_admins if admin.organization_id
	})
	for admin in active_admins:
		for currency in PUBLIC_ADMIN_WALLET_CURRENCIES:
			await service.get_or_create_wallet(admin.telegram_id, currency)

	result = await db.execute(
		select(Wallets)
		.where(
			or_(
				Wallets.user_id.in_(active_user_ids),
				Wallets.organization_id.in_(active_organization_ids),
			),
			Wallets.currency.in_(INTERNAL_ADMIN_WALLET_CURRENCIES),
		)
		.order_by(Wallets.organization_id, Wallets.user_id, Wallets.currency)
	)
	admin_by_user = {admin.telegram_id: admin for admin in active_admins}
	admin_by_organization = {
		admin.organization_id: admin
		for admin in active_admins
		if admin.organization_id
	}
	return [
		{
			"user_id": wallet.user_id,
			"telegram_username": admin.telegram_username if admin else None,
			"name": admin.name if admin else None,
			"email": admin.email if admin else None,
			"currency": public_currency(wallet.currency),
			"balance": float(wallet.balance or 0.0),
			"wallet_id": wallet.id,
			"is_frozen": bool(wallet.is_frozen),
			"freeze_reason": wallet.freeze_reason,
		}
		for wallet in result.scalars().all()
		for admin in [admin_by_user.get(wallet.user_id) or admin_by_organization.get(wallet.organization_id)]
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
	symbol = {"PHP": "₱", "CNY": "¥", "KRW": "₩", "USDT": "₮"}.get(currency, "")
	return {
		"success": True,
		"message": f"Successfully {action} {symbol}{abs(request.amount):,.2f} {currency} for {user_id}",
		"balance": result["balance"],
		"transaction_id": result.get("transaction_id"),
	}


@router.get("/admin/wallets")
async def list_all_admin_wallets(
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""List all supported wallets for active users. Super admin only."""
	_require_super_admin(current_user)
	return {"items": await _list_all_admin_wallets(db)}


@router.post("/admin/wallets/adjust")
async def adjust_unified_admin_wallet(
	request: UnifiedAdminWalletAdjustRequest,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Credit or debit any supported user wallet. Super admin only."""
	_require_super_admin(current_user)
	currency = request.currency.strip().upper()
	if currency not in PUBLIC_ADMIN_WALLET_CURRENCIES:
		raise HTTPException(status_code=400, detail="Unsupported wallet currency")
	if not math.isfinite(request.amount) or request.amount == 0:
		raise HTTPException(status_code=400, detail="Amount must be a non-zero finite number")
	if not request.user_id.strip():
		raise HTTPException(status_code=400, detail="user_id is required")
	if not request.note.strip():
		raise HTTPException(status_code=400, detail="note is required")
	return await _adjust_admin_wallet(
		db,
		current_user,
		request.user_id,
		currency,
		AdminWalletAdjustRequest(amount=request.amount, note=request.note),
	)


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


@router.get("/rates")
async def get_wallet_rates(
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Return the supported wallet exchange-rate snapshot for the current app state."""
	from services.app_settings import get_usdt_php_rate, get_usdt_php_rate_details

	rates = {
		"PHP": 1.0,
		"USDT": await get_usdt_php_rate(db),
		"CNY": 8.5,
		"KRW": 0.00063,
	}
	try:
		details = await get_usdt_php_rate_details(db)
		rates["USDT"] = float(details.get("rate", rates["USDT"]))
	except Exception:
		pass
	return {
		"rates": rates,
		"supported_currencies": ["PHP", "CNY", "KRW", "USDT"],
		"source": "app_settings",
	}


@router.post("/topup")
async def create_wallet_topup(
	payload: dict,
	current_user: UserResponse = Depends(get_current_user),
):
	"""Compatibility endpoint for wallet topups using checkout-style invoice payloads."""
	amount = float(payload.get("amount") or 0)
	if not math.isfinite(amount) or amount <= 0:
		raise HTTPException(status_code=400, detail="Amount must be a positive finite number")

	magpie = MagpieService()
	result = await magpie.create_invoice(
		amount=amount,
		description=payload.get("description") or "Wallet funding",
		customer_name=payload.get("customer_name") or getattr(current_user, "name", None) or "Customer",
		customer_email=payload.get("customer_email") or "",
	)

	if not result or result.get("success") is False:
		raise HTTPException(status_code=400, detail=result.get("error") if isinstance(result, dict) else "Top-up invoice could not be created")

	invoice_id = result.get("checkout_id") or result.get("invoice_id") or result.get("payment_id") or result.get("id")
	invoice_url = result.get("checkout_url") or result.get("invoice_url") or result.get("payment_url")
	return {
		"success": True,
		"invoice_id": invoice_id,
		"invoice_url": invoice_url,
		"external_id": result.get("external_id"),
		"raw": result,
	}


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
	effective_user_id, organization_id = await service._resolve_effective_wallet_owner(
		str(current_user.id), currency_upper
	)
	result = await db.execute(
		select(Wallet_transactions)
		.join(Wallets, Wallets.id == Wallet_transactions.wallet_id)
		.where(
						(
							Wallets.organization_id == organization_id
							if organization_id
							else Wallet_transactions.user_id == effective_user_id
						),
			Wallets.currency == currency_upper,
		)
		.order_by(Wallet_transactions.id.desc())
		.limit(limit)
	)
	items = result.scalars().all()
	transaction_refs = {
		str(item.reference_id)
		for item in items
		if item.reference_id
	}
	payment_transaction_ids: dict[str, int] = {}
	if transaction_refs:
		payment_result = await db.execute(
			select(Transactions.id, Transactions.external_id, Transactions.xendit_id).where(
				Transactions.user_id.in_({str(current_user.id), effective_user_id}),
				or_(
					Transactions.external_id.in_(transaction_refs),
					Transactions.xendit_id.in_(transaction_refs),
				),
			)
		)
		for transaction_id, external_id, xendit_id in payment_result.all():
			if external_id:
				payment_transaction_ids[str(external_id)] = transaction_id
			if xendit_id:
				payment_transaction_ids[str(xendit_id)] = transaction_id

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
				"payment_transaction_id": payment_transaction_ids.get(str(item.reference_id)) if item.reference_id else None,
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
	wallet = await service.get_or_create_wallet(current_user.id, currency)
	return {
		"organization_id": organization_id,
		"organization_name": current_user.organization_name,
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
			currency="USDT",
			transaction_type="crypto_topup",
			reference_id=f"crypto-topup-{request.id}",
			note=f"Crypto top-up approved: {request.tx_hash}",
		)
		request.status = "approved"
		await unlock_krw_benefits(db, str(request.user_id), source=f"crypto_topup:{request.id}")
	request.reviewed_by = str(current_user.id)
	request.reviewed_at = now
	request.updated_at = now
	await db.commit()
	return {"success": True, "id": request.id, "status": request.status}


@router.post("/usdt-send-requests")
async def create_usdt_send_request(
	request: CreateUsdtSendRequest,
	http_request: Request,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	from routers.auth import verify_transaction_passkey, verify_transaction_otp
	if request.passkey_credential:
		await verify_transaction_passkey(request.passkey_credential, "withdrawal", http_request, current_user, db)
	else:
		await verify_transaction_otp(request.otp_reference or "", request.otp_code or "", "withdrawal", current_user, db)
	if not math.isfinite(request.amount) or request.amount <= 0:
		raise HTTPException(status_code=400, detail="Amount must be a positive finite number")
	address = request.to_address.strip()
	if not address.startswith("T") or len(address) != 34:
		raise HTTPException(status_code=400, detail="Invalid USDT TRC-20 address")

	service = WalletsService(db)
	wallet = await service.get_or_create_wallet(str(current_user.id), "USDT", lock=True)
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
	http_request: Request,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Convert PHP, KRW, or USDT in either direction with symmetric earnings."""
	from_currency = request.from_currency.strip().upper()
	to_currency = request.to_currency.strip().upper()
	supported_currencies = {"PHP", "CNY", "KRW", "USDT"}
	if from_currency not in supported_currencies or to_currency not in supported_currencies:
		raise HTTPException(status_code=400, detail="Only PHP, CNY, KRW, and USDT conversion is supported")
	if from_currency == to_currency:
		raise HTTPException(status_code=400, detail="Source and target currencies must be different")
	if "USDT" in {from_currency, to_currency} and not (request.idempotency_key or "").strip():
		raise HTTPException(status_code=400, detail="An idempotency key is required for USDT trades")
	if request.from_amount <= 0:
		raise HTTPException(status_code=400, detail="Conversion amount must be positive")
	if not math.isfinite(request.from_amount):
		raise HTTPException(status_code=400, detail="Conversion amount must be finite")
	if "USDT" in {from_currency, to_currency}:
		from routers.auth import verify_transaction_passkey
		await verify_transaction_passkey(request.passkey_credential or {}, "usdt_trade", http_request, current_user, db)

	normalized_from = "USD" if from_currency == "USDT" else from_currency
	normalized_to = "USD" if to_currency == "USDT" else to_currency
	if "USD" in {normalized_from, normalized_to} and {normalized_from, normalized_to} != {"PHP", "USD"}:
		raise HTTPException(status_code=400, detail="USDT buy and sell are available against PHP only")
	if normalized_from == normalized_to:
		raise HTTPException(status_code=400, detail="Source and target currencies must be different")

	owner_id = str(current_user.id)
	service = WalletsService(db)
	trade_service = UsdtTradeService()
	provider_name = trade_service.provider_name(normalized_from, normalized_to)
	if "USDT" in {from_currency, to_currency}:
		try:
			provider_name = trade_service.require_real_provider(normalized_from, normalized_to)
		except RuntimeError as exc:
			raise HTTPException(status_code=503, detail=str(exc)) from exc
	provider_order_id = None
	provider_amount = None
	request_rate = None
	trade = None
	reservation_reference = None
	if "USDT" in {from_currency, to_currency}:
		trade_key = (request.idempotency_key or uuid.uuid4().hex).strip()
		if len(trade_key) > 128:
			raise HTTPException(status_code=400, detail="Idempotency key is too long")
		trade = await db.scalar(
			select(UsdtTrade).where(UsdtTrade.idempotency_key == trade_key)
		)
		if trade:
			if trade.user_id != owner_id:
				raise HTTPException(status_code=409, detail="This idempotency key is already in use.")
			if (
				trade.source_currency != normalized_from
				or trade.target_currency != normalized_to
				or float(trade.requested_amount) != request.from_amount
			):
				raise HTTPException(
					status_code=409,
					detail="The idempotency key was already used for a different USDT trade.",
				)
			if trade.status == "settled":
				return {
					"success": True,
					"from_currency": public_currency(trade.source_currency),
					"to_currency": public_currency(trade.target_currency),
					"from_amount": float(trade.requested_amount),
					"to_amount": float(trade.settled_amount or 0),
					"rate": None,
					"fee_amount": float(trade.fee or 0),
					"fee_rate": 0,
					"reference_id": f"usdt-trade-{trade.id}",
					"provider": trade.provider,
					"provider_order_id": trade.provider_order_id,
					"provider_amount": float(trade.settled_amount or 0),
					"execution_rate": None,
				}
			if trade.status == "failed":
				raise HTTPException(
					status_code=409,
					detail="This USDT trade failed. Use a new idempotency key to retry it.",
				)
			raise HTTPException(status_code=409, detail="This USDT trade is already being processed.")
		trade = UsdtTrade(
			user_id=owner_id,
			side="buy" if normalized_to == "USD" else "sell",
			source_currency=normalized_from,
			target_currency=normalized_to,
			requested_amount=request.from_amount,
			provider=provider_name,
			idempotency_key=trade_key,
			status="pending",
		)
		db.add(trade)
		await db.flush()
	try:
		from_wallet = await service.get_or_create_wallet(owner_id, normalized_from, lock=True)
		quote = await CurrencyService(db).get_conversion_quote(
			wallet_id=from_wallet.id,
			from_currency=normalized_from,
			to_currency=normalized_to,
			from_amount=request.from_amount,
		)
		if trade:
			trade.quoted_amount = quote["to_amount"]

		available = float(from_wallet.available_balance or from_wallet.balance or 0.0)
		if available < request.from_amount:
			raise ValueError(f"Insufficient balance: {available:.2f} {from_currency} available")

		# PHP purchases are real-money flows and must not touch a provider or wallet
		# until a super admin has reviewed them.
		if trade and normalized_from == "PHP" and normalized_to == "USD":
			trade.status = "pending_approval"
			await db.commit()
			return {
				"success": True,
				"pending": True,
				"status": trade.status,
				"from_currency": "PHP",
				"to_currency": "USDT",
				"from_amount": request.from_amount,
				"to_amount": quote["to_amount"],
				"rate": quote["rate"],
				"fee_amount": quote.get("conversion_fee_amount", 0),
				"fee_rate": quote.get("fee_rate", 0),
				"reference_id": f"usdt-trade-{trade.id}",
				"provider": provider_name,
			}

		if trade and normalized_from == "USD" and normalized_to == "PHP":
			reservation_reference = f"usdt-trade-{trade.id}"
			await service.reserve_wallet(
				user_id=owner_id,
				amount=request.from_amount,
				currency="USD",
				reference_id=reservation_reference,
			)
			trade.status = "provider_pending"
			await db.commit()

		if provider_name == "coins.ph":
			if trade:
				trade.status = "provider_pending"
			if normalized_from == "PHP" and normalized_to == "USD":
				provider_result = await trade_service.buy_with_php(
					php_amount=request.from_amount,
					user_id=owner_id,
					client_order_id=f"swiftpay-trade-{trade.id}" if trade else None,
				)
			else:
				provider_result = await trade_service.sell_for_php(
					usdt_amount=request.from_amount,
					user_id=owner_id,
					client_order_id=f"swiftpay-trade-{trade.id}" if trade else None,
				)
			provider_amount = float(provider_result.get("amount") or 0)
			if not provider_result.get("success") or provider_amount <= 0:
				if trade:
					if reservation_reference:
						await service.release_wallet_reservation(reservation_reference)
					trade.status = "failed"
					trade.failure_reason = provider_result.get("error", "Provider order was not filled")
					await db.commit()
				raise HTTPException(status_code=502, detail=provider_result.get("error", "Coins.ph order was not filled"))
			provider_order_id = provider_result.get("order_id")
			if trade:
				trade.provider_order_id = provider_order_id
				trade.status = "provider_filled"
				if reservation_reference:
					await db.commit()
			fee_rate = float(quote.get("fee_rate") or 0.0)
			request_rate = provider_amount / request.from_amount / max(1.0 - fee_rate, 0.000001)

		if trade and normalized_from == "USD" and normalized_to == "PHP" and provider_name == "coins.ph":
			await service.consume_wallet_reservation(
				reference_id=reservation_reference,
				transaction_type="usdt_sale",
				note="USDT sold through Coins.ph",
			)
			await service.credit_wallet(
				user_id=owner_id,
				amount=provider_amount,
				currency="PHP",
				transaction_type="usdt_sale",
				reference_id=f"{reservation_reference}-php",
				note="PHP proceeds from Coins.ph USDT sale",
			)
			trade.settled_amount = provider_amount
			trade.fee = 0
			trade.status = "settled"
			await db.commit()
			return {
				"success": True,
				"from_currency": "USDT",
				"to_currency": "PHP",
				"from_amount": request.from_amount,
				"to_amount": provider_amount,
				"rate": request_rate,
				"fee_amount": 0,
				"fee_rate": 0,
				"reference_id": f"usdt-trade-{trade.id}",
				"provider": provider_name,
				"provider_order_id": provider_order_id,
				"provider_amount": provider_amount,
				"execution_rate": request_rate,
			}

		if trade and normalized_from == "PHP" and normalized_to == "USD" and provider_name == "coins.ph":
			deposit_address = await db.scalar(
				select(UsdtDepositAddress).where(
					UsdtDepositAddress.user_id == owner_id,
					UsdtDepositAddress.active.is_(True),
				)
			)
			if not deposit_address:
				from services.bitgo_service import assign_usdt_address
				deposit_address = await assign_usdt_address(db, owner_id)
			withdrawal_order_id = f"swiftpay-w-{trade.id}"
			withdrawal_result = await trade_service.withdraw_to_bitgo(
				usdt_amount=provider_amount,
				address=deposit_address.address,
				withdraw_order_id=withdrawal_order_id,
			)
			if not withdrawal_result.get("success"):
				trade.status = "withdrawal_failed"
				trade.failure_reason = withdrawal_result.get("error", "USDT withdrawal was not submitted")
				await db.commit()
				raise HTTPException(status_code=502, detail=trade.failure_reason)
			await service.debit_wallet(
				owner_id,
				request.from_amount,
				"PHP",
				"usdt_purchase",
				f"usdt-trade-{trade.id}",
				note=f"PHP used to purchase USDT; sent to BitGo address {deposit_address.address}",
			)
			trade.destination_address = deposit_address.address
			trade.provider_withdrawal_id = withdrawal_result["withdrawal_id"]
			trade.withdrawal_status = "processing"
			trade.settled_amount = provider_amount
			trade.status = "withdrawal_submitted"
			await db.commit()
			return {
				"success": True,
				"from_currency": "PHP",
				"to_currency": "USDT",
				"from_amount": request.from_amount,
				"to_amount": provider_amount,
				"rate": request_rate,
				"fee_amount": 0,
				"fee_rate": 0,
				"reference_id": f"usdt-trade-{trade.id}",
				"provider": provider_name,
				"provider_order_id": provider_order_id,
				"provider_withdrawal_id": trade.provider_withdrawal_id,
				"destination_address": deposit_address.address,
				"pending": True,
			}

		to_wallet = await service.get_or_create_wallet(owner_id, normalized_to, lock=True)
		conversion = await CurrencyService(db).convert_currency(
			from_wallet=from_wallet,
			to_wallet=to_wallet,
			from_amount=request.from_amount,
			user_id=owner_id,
			rate=request_rate or quote["rate"],
		)
		if trade:
			trade.settled_amount = conversion.to_amount
			trade.fee = conversion.conversion_fee_amount
			trade.status = "settled"
		await db.commit()
	except ValueError as exc:
		await db.rollback()
		raise HTTPException(status_code=400, detail=str(exc)) from exc
	except HTTPException:
		await db.rollback()
		raise
	except Exception:
		await db.rollback()
		if trade and trade.provider_order_id:
			manual_review_trade = await db.scalar(
				select(UsdtTrade).where(UsdtTrade.id == trade.id)
			)
			if manual_review_trade and manual_review_trade.status not in {"settled", "failed"}:
				manual_review_trade.status = "manual_review"
				manual_review_trade.failure_reason = (
					"Provider order filled but wallet settlement requires manual reconciliation"
				)
				await db.commit()
		logger.exception("USDT conversion failed unexpectedly for user %s", owner_id)
		raise HTTPException(status_code=500, detail="USDT conversion could not be completed")

	return {
		"success": True,
		"from_currency": public_currency(normalized_from),
		"to_currency": public_currency(normalized_to),
		"from_amount": request.from_amount,
		"to_amount": conversion.to_amount,
		"rate": conversion.rate_applied,
		"fee_amount": conversion.conversion_fee_amount,
		"fee_rate": conversion.conversion_fee_rate,
		"reference_id": conversion.reference_id,
		"provider": provider_name,
		"provider_order_id": provider_order_id,
		"provider_amount": provider_amount,
		"execution_rate": request_rate,
	}


@router.get("/admin/usdt-trades")
async def list_admin_usdt_trades(
	status_filter: Optional[str] = Query(None, alias="status"),
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""List USDT trades for super-admin approval and audit."""
	_require_super_admin(current_user)
	stmt = select(UsdtTrade).order_by(UsdtTrade.id.desc()).limit(500)
	if status_filter:
		stmt = stmt.where(UsdtTrade.status == status_filter.strip().lower())
	result = await db.execute(stmt)
	return {
		"trades": [
			{
				"id": item.id,
				"user_id": item.user_id,
				"side": item.side,
				"source_currency": public_currency(item.source_currency),
				"target_currency": public_currency(item.target_currency),
				"requested_amount": float(item.requested_amount),
				"quoted_amount": float(item.quoted_amount or 0),
				"settled_amount": float(item.settled_amount or 0) if item.settled_amount is not None else None,
				"provider": item.provider,
				"status": item.status,
				"failure_reason": item.failure_reason,
				"rejection_reason": item.rejection_reason,
				"reviewed_by": item.reviewed_by,
				"reviewed_at": item.reviewed_at,
				"created_at": item.created_at,
			}
			for item in result.scalars().all()
		]
	}


@router.post("/admin/usdt-trades/{trade_id}/reject")
async def reject_admin_usdt_trade(
	trade_id: int,
	body: RejectUsdtTradeRequest,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	_require_super_admin(current_user)
	if not body.reason.strip():
		raise HTTPException(status_code=400, detail="Rejection reason is required")
	trade = await db.scalar(select(UsdtTrade).where(UsdtTrade.id == trade_id).with_for_update())
	if not trade:
		raise HTTPException(status_code=404, detail="USDT trade not found")
	if trade.status != "pending_approval":
		raise HTTPException(status_code=400, detail=f"Trade is already {trade.status}")
	trade.status = "rejected"
	trade.rejection_reason = body.reason.strip()
	trade.reviewed_by = str(current_user.id)
	trade.reviewed_at = datetime.now(timezone.utc)
	await db.commit()
	return {"success": True, "trade_id": trade.id, "status": trade.status}


@router.post("/admin/usdt-trades/{trade_id}/approve")
async def approve_admin_usdt_trade(
	trade_id: int,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	"""Execute a PHP→USDT trade only after super-admin approval."""
	_require_super_admin(current_user)
	trade = await db.scalar(select(UsdtTrade).where(UsdtTrade.id == trade_id).with_for_update())
	if not trade:
		raise HTTPException(status_code=404, detail="USDT trade not found")
	if trade.status != "pending_approval":
		raise HTTPException(status_code=400, detail=f"Trade is already {trade.status}")
	if trade.side != "buy" or trade.source_currency != "PHP" or trade.target_currency != "USD":
		raise HTTPException(status_code=400, detail="Only PHP to USDT trades require this approval flow")
	if trade.provider != "coins.ph":
		raise HTTPException(
			status_code=400,
			detail="Coins.ph must be configured before a real-money USDT purchase can be approved",
		)

	service = WalletsService(db)
	trade_service = UsdtTradeService()
	provider_started = False
	try:
		from_wallet = await service.get_or_create_wallet(trade.user_id, "PHP", lock=True)
		quote = await CurrencyService(db).get_conversion_quote(
			wallet_id=from_wallet.id,
			from_currency="PHP",
			to_currency="USD",
			from_amount=float(trade.requested_amount),
		)
		if float(from_wallet.available_balance or from_wallet.balance or 0) < float(trade.requested_amount):
			raise ValueError("Insufficient PHP balance to approve this trade")

		reservation_reference = f"usdt-trade-{trade.id}"
		await service.reserve_wallet(
			user_id=trade.user_id,
			amount=float(trade.requested_amount),
			currency="PHP",
			reference_id=reservation_reference,
		)
		trade.reviewed_by = str(current_user.id)
		trade.reviewed_at = datetime.now(timezone.utc)
		trade.status = "provider_pending"
		await db.commit()

		provider_amount = None
		if trade.provider == "coins.ph":
			provider_started = True
			provider_result = await trade_service.buy_with_php(
				php_amount=float(trade.requested_amount),
				user_id=trade.user_id,
				client_order_id=f"swiftpay-trade-{trade.id}",
			)
			provider_amount = float(provider_result.get("amount") or 0)
			if not provider_result.get("success") or provider_amount <= 0:
				raise RuntimeError(provider_result.get("error", "Coins.ph order was not filled"))
			trade.provider_order_id = provider_result.get("order_id")
			trade.status = "provider_filled"
			deposit_address = await db.scalar(
				select(UsdtDepositAddress).where(
					UsdtDepositAddress.user_id == trade.user_id,
					UsdtDepositAddress.active.is_(True),
				)
			)
			if not deposit_address:
				from services.bitgo_service import assign_usdt_address
				deposit_address = await assign_usdt_address(db, trade.user_id)
			withdrawal_result = await trade_service.withdraw_to_bitgo(
				usdt_amount=provider_amount,
				address=deposit_address.address,
				withdraw_order_id=f"swiftpay-w-{trade.id}",
			)
			if not withdrawal_result.get("success"):
				raise RuntimeError(withdrawal_result.get("error", "USDT withdrawal was not submitted"))
			trade.destination_address = deposit_address.address
			trade.provider_withdrawal_id = withdrawal_result["withdrawal_id"]
			trade.withdrawal_status = "processing"
			trade.settled_amount = provider_amount
			trade.status = "withdrawal_submitted"

		await service.consume_wallet_reservation(
			reference_id=reservation_reference,
			transaction_type="usdt_purchase",
			note="Approved USDT purchase settled from PHP wallet",
		)
		await db.commit()
	except (ValueError, RuntimeError) as exc:
		await db.rollback()
		trade = await db.scalar(select(UsdtTrade).where(UsdtTrade.id == trade_id))
		if trade and trade.status in {"pending_approval", "provider_pending", "provider_filled"}:
			trade.status = "manual_review" if provider_started else "failed"
			trade.failure_reason = str(exc)
			trade.reviewed_by = str(current_user.id)
			trade.reviewed_at = datetime.now(timezone.utc)
			await db.commit()
		raise HTTPException(status_code=400 if isinstance(exc, ValueError) else 502, detail=str(exc)) from exc
	except Exception:
		await db.rollback()
		logger.exception("Approved USDT trade %s failed", trade_id)
		raise HTTPException(status_code=500, detail="Approved USDT trade could not be completed")
	return {"success": True, "trade_id": trade.id, "status": trade.status, "provider": trade.provider}


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
	normalized_from = "USD" if from_currency == "USDT" else from_currency
	normalized_to = "USD" if to_currency == "USDT" else to_currency
	if "USD" in {normalized_from, normalized_to} and {normalized_from, normalized_to} != {"PHP", "USD"}:
		raise HTTPException(status_code=400, detail="USDT buy and sell are available against PHP only")
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
	http_request: Request,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	from routers.auth import verify_transaction_passkey, verify_transaction_otp
	if request.passkey_credential:
		await verify_transaction_passkey(request.passkey_credential, "withdrawal", http_request, current_user, db)
	else:
		await verify_transaction_otp(request.otp_reference or "", request.otp_code or "", "withdrawal", current_user, db)
	currency = request.currency.strip().upper()
	is_usdt = request.request_type == "usdt_trc20" or currency in {"USD", "USDT"}
	if not is_usdt and currency not in {"PHP", "KRW"}:
		raise HTTPException(status_code=400, detail="Bank withdrawals currently support PHP and KRW")
	if is_usdt:
		raise HTTPException(status_code=400, detail="Use the USDT transfer request flow for USDT withdrawals")
	bank_code = (request.bank_code or request.bank_name or (request.usdt_platform if is_usdt else "Manual")).strip()
	bank_name = request.bank_name or bank_code
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
			bank_code=bank_code,
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
			try:
				await _notify_withdrawal_request(
					db, request_row.id, current_user, request.amount,
					"USDT" if is_usdt else currency, request.account_name or str(current_user.name or current_user.id),
				)
			except Exception:
				logger.warning(
					"Withdrawal %s was saved but admin notification failed",
					result["reference_id"],
					exc_info=True,
				)
		return {
			**result,
			"message": (
				f"{request.amount:,.2f} {'USDT' if is_usdt else currency} withdrawal submitted "
				"and is being processed by SwiftPay"
			),
			"currency": "USDT" if is_usdt else currency,
			"request_id": request_row.id if request_row else None,
			"reference_id": result.get("reference_id"),
			"status": "processing",
		}
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
		statuses = ["pending", "processing", "transferring"] if status == "pending" else [status]
		query = query.where(Disbursements.status.in_(statuses))
	result = await db.execute(query)
	items = result.scalars().all()
	return {
		"success": True,
		"items": [
			{
				"id": item.id,
				"user_id": item.user_id,
				"amount": float(item.amount or 0),
				"processing_fee": float(item.processing_fee or 0),
				"total_debit": round(float(item.amount or 0) + float(item.processing_fee or 0), 2),
				"currency": public_currency(item.currency or "PHP"),
				"status": item.status,
				"bank_code": item.bank_code,
				"account_number": item.account_number,
				"account_name": item.account_name,
				"description": item.description,
				"external_id": item.external_id,
				"created_at": item.created_at,
				"updated_at": item.updated_at,
				"processed_at": item.processed_at,
				"failure_reason": item.failure_reason,
				"note": item.note,
				"approved_by": item.approved_by,
			}
			for item in items
		],
		"total": len(items),
	}


async def _refund_withdrawal(db: AsyncSession, disb: Disbursements, reason: str) -> None:
	wallet_service = WalletsService(db)
	refund_amount = round(float(disb.amount or 0) + float(disb.processing_fee or 0), 2)
	await wallet_service.refund_wallet_debit(
		disb.user_id,
		refund_amount,
		disb.currency or "PHP",
		f"{disb.external_id}-refund",
		f"Withdrawal refund: {reason}",
	)
	disb.status = "failed"
	disb.failure_reason = reason
	disb.updated_at = datetime.now(timezone.utc)
	await db.execute(
		update(Wallet_transactions)
		.where(Wallet_transactions.reference_id == disb.external_id)
		.values(status="failed", note=f"Refunded: {reason}")
	)
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
	note: Optional[str] = None,
):
	if not _is_super_admin(current_user):
		raise HTTPException(status_code=403, detail="Super admin approval required")
	disb_result = await db.execute(
		select(Disbursements).where(Disbursements.id == disb_id).with_for_update()
	)
	disb = disb_result.scalar_one_or_none()
	if not disb:
		raise HTTPException(status_code=404, detail="Withdrawal not found")
	if disb.status not in {"pending", "processing"}:
		raise HTTPException(status_code=400, detail=f"Withdrawal is already {disb.status}")
	currency = (disb.currency or "PHP").upper()
	if currency == "PHP":
		from services.swiftpay_service import SwiftPayService

		provider_result = await SwiftPayService().send_disbursement(
			reference_no=disb.external_id or f"withdrawal-{disb.id}",
			amount=float(disb.amount or 0),
			bank_code=disb.bank_code or "",
			account_number=disb.account_number or "",
			full_name=disb.account_name or "Customer",
			phone=disb.recipient_phone,
			note=disb.description or "Super admin PHP disbursement",
			currency="PHP",
			transfer_type=disb.swiftpay_transfer_type,
			merchant_information=disb.swiftpay_merchant_information,
		)
		already_submitted = (
			provider_result.get("code") == "DUPLICATE_MERCHANT_REFERENCE_NO"
			and provider_result.get("already_submitted") is True
		)
		reconciliation_required = bool(
			already_submitted
			or provider_result.get("submission_unknown")
			or provider_result.get("reconciliation_required")
		)
		if not provider_result.get("success"):
			if reconciliation_required:
				logger.warning(
					"SwiftPay PHP withdrawal reference %s requires reconciliation; keeping funds reserved",
					disb.external_id,
				)
			else:
				provider_error = provider_result.get("error", "SwiftPay disbursement failed")
				await _refund_withdrawal(db, disb, provider_error)
				await db.commit()
				raise HTTPException(status_code=502, detail=provider_error)
		provider_reference = provider_result.get("reference_no")
		if provider_reference and provider_reference != disb.external_id:
			original_reference = disb.external_id
			disb.external_id = provider_reference
			await db.execute(
				update(Wallet_transactions)
				.where(Wallet_transactions.reference_id == original_reference)
				.values(reference_id=provider_reference)
			)
			await db.execute(
				update(Wallet_transactions)
				.where(Wallet_transactions.reference_id == f"{original_reference}-fee")
				.values(reference_id=f"{provider_reference}-fee")
			)
		provider_data = provider_result.get("data")
		provider_id = provider_data.get("id") if isinstance(provider_data, dict) else None
		if provider_id:
			disb.xendit_id = str(provider_id)
		disb.status = "transferring"
	elif currency == "KRW":
		from services.krw_payment_service import (
			KRWBankInfo,
			KRWDisbursementRequest,
			KRWPaymentService,
		)

		provider_result = await KRWPaymentService().create_disbursement(
			request=KRWDisbursementRequest(
				amount=float(disb.amount or 0),
				reference_no=disb.external_id or f"withdrawal-{disb.id}",
				bank_info=KRWBankInfo(
					bank_code=disb.bank_code or "",
					bank_name=disb.bank_code or "",
					account_number=disb.account_number or "",
					account_name=disb.account_name or "",
				),
				description=disb.description or "Super admin KRW disbursement",
			),
			user_id=disb.user_id,
		)
		if not provider_result.success:
			provider_error = provider_result.error or "SwiftPay KRW disbursement failed"
			await _refund_withdrawal(db, disb, provider_error)
			await db.commit()
			raise HTTPException(status_code=502, detail=provider_error)
		if provider_result.provider_reference:
			disb.xendit_id = provider_result.provider_reference
		provider_status = str(provider_result.status or "").strip().lower()
		disb.status = (
			"completed"
			if provider_status in {"completed", "complete", "success", "successful", "succeeded", "settled"}
			else "transferring"
		)
	else:
		raise HTTPException(status_code=400, detail=f"Unsupported withdrawal currency: {currency}")
	disb.processed_at = datetime.now(timezone.utc)
	disb.updated_at = datetime.now(timezone.utc)
	disb.approved_by = current_user.id
	disb.note = note or "Approved by admin"
	await TransactionsService(db).create_transaction(
		user_id=disb.user_id,
		transaction_type="disbursement",
		amount=disb.amount,
		external_id=disb.external_id,
		gateway_id=disb.xendit_id or disb.external_id,
		description=disb.description or "Wallet withdrawal",
		customer_name=disb.account_name or "",
		status=disb.status,
		currency=currency,
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
	return {
		"success": True,
		"id": disb.id,
		"status": disb.status,
		"message": (
			f"{disb.amount:,.2f} {currency} withdrawal is awaiting SwiftPay reconciliation"
			if currency == "PHP" and reconciliation_required
			else f"{disb.amount:,.2f} {currency} withdrawal processed successfully"
		),
		"amount": disb.amount,
		"currency": currency,
		"reference_id": disb.external_id,
	}


@router.post("/admin/withdrawals/{disb_id}/reconcile")
async def reconcile_php_withdrawal(
	disb_id: int,
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	if not _is_super_admin(current_user):
		raise HTTPException(status_code=403, detail="Super admin review required")
	disb_result = await db.execute(
		select(Disbursements).where(Disbursements.id == disb_id).with_for_update()
	)
	disb = disb_result.scalar_one_or_none()
	if not disb:
		raise HTTPException(status_code=404, detail="Withdrawal not found")
	if (disb.currency or "").upper() != "PHP":
		raise HTTPException(status_code=400, detail="Provider reconciliation is only available for PHP withdrawals")
	if disb.status != "transferring":
		raise HTTPException(status_code=400, detail=f"Withdrawal is not awaiting provider reconciliation ({disb.status})")

	service = SwiftPayService()
	if not service.is_configured():
		raise HTTPException(status_code=503, detail="SwiftPay is not configured")
	if disb.xendit_id:
		provider_result = await service.get_disbursement_by_id(disb.xendit_id)
	else:
		provider_result = await service.get_disbursement_by_reference(disb.external_id or "")
		if provider_result.get("not_found"):
			provider_result = await service.send_disbursement(
				reference_no=disb.external_id or f"withdrawal-{disb.id}",
				amount=float(disb.amount or 0),
				bank_code=disb.bank_code or "",
				account_number=disb.account_number or "",
				full_name=disb.account_name or "Customer",
				phone=disb.recipient_phone,
				note=disb.description or "Super admin PHP disbursement",
				currency="PHP",
				transfer_type=disb.swiftpay_transfer_type,
				merchant_information=disb.swiftpay_merchant_information,
			)
	if not provider_result.get("success"):
		raise HTTPException(
			status_code=502,
			detail=provider_result.get("error", "Could not reconcile the SwiftPay disbursement"),
		)

	provider_data = provider_result.get("data")
	if not isinstance(provider_data, dict):
		raise HTTPException(status_code=502, detail="SwiftPay returned an invalid disbursement record")
	provider_id = provider_data.get("id")
	if provider_id:
		disb.xendit_id = str(provider_id)
	provider_status = str(provider_data.get("status") or "").strip().upper()
	now = datetime.now(timezone.utc)
	if provider_status in {"PENDING"}:
		disb.status = "transferring"
	elif provider_status == "EXECUTED":
		disb.status = "completed"
		disb.completed_at = now
		disb.failure_reason = None
	elif provider_status in {"REJECTED", "ERROR"}:
		reason = str(provider_data.get("errorMessage") or f"SwiftPay disbursement {provider_status.lower()}")
		await _refund_withdrawal(db, disb, reason)
	else:
		raise HTTPException(
			status_code=502,
			detail=f"SwiftPay returned an unsupported disbursement status: {provider_status or 'empty'}",
		)

	disb.updated_at = now
	await db.execute(
		update(Transactions)
		.where(Transactions.external_id == disb.external_id)
		.values(status=disb.status, xendit_id=disb.xendit_id)
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
	return {
		"success": True,
		"id": disb.id,
		"status": disb.status,
		"provider_status": provider_status,
		"provider_id": disb.xendit_id,
		"message": (
			f"{disb.amount:,.2f} PHP withdrawal completed"
			if disb.status == "completed"
			else "Withdrawal failed and reserved funds were refunded"
			if disb.status == "failed"
			else "Withdrawal is still processing at SwiftPay"
		),
	}


@router.post("/admin/withdrawals/{disb_id}/reject")
async def reject_withdrawal(
	disb_id: int,
	body: RejectWithdrawalRequest = RejectWithdrawalRequest(),
	current_user: UserResponse = Depends(get_current_user),
	db: AsyncSession = Depends(get_db),
):
	if not _is_super_admin(current_user):
		raise HTTPException(status_code=403, detail="Super admin approval required")
	disb_result = await db.execute(
	    select(Disbursements)
	    .where(Disbursements.id == disb_id)
	    .with_for_update()
	)
	disb = disb_result.scalar_one_or_none()
	if not disb:
		raise HTTPException(status_code=404, detail="Withdrawal not found")
	if disb.status not in {"pending", "processing"}:
		raise HTTPException(status_code=400, detail=f"Withdrawal is already {disb.status}")
	disb.approved_by = current_user.id
	disb.note = body.reason or "Rejected by admin"
	await _refund_withdrawal(db, disb, body.reason or "Rejected by admin")
	await db.commit()
	return {
		"success": True,
		"id": disb.id,
		"status": disb.status,
		"message": f"{disb.amount:,.2f} {disb.currency or 'PHP'} withdrawal rejected and funds refunded",
		"amount": disb.amount,
		"currency": disb.currency or "PHP",
		"reference_id": disb.external_id,
	}