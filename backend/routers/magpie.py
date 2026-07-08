"""Legacy Magpie route compatibility layer.

Keeps old /api/v1/magpie endpoints working by forwarding to the xend router logic.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
import uuid
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_payment_user
from schemas.auth import UserResponse
from services.magpie_service import MagpieService
from services.transactions import TransactionsService
from . import xend

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/magpie", tags=["magpie-legacy"])


class CheckoutSessionRequest(BaseModel):
    payment_method_types: List[str] = Field(default_factory=list)
    payment_methods: List[str] = Field(default_factory=list)
    line_items: Optional[List[Dict[str, Any]]] = None
    mode: str = "payment"
    success_url: str = ""
    cancel_url: str = ""
    currency: str = "php"
    customer_email: str = ""
    external_id: str = ""
    amount: Optional[float] = None
    description: str = ""
    metadata: Optional[Dict[str, Any]] = None


@router.get("/payment-methods")
async def get_supported_payment_methods():
    return await xend.get_supported_payment_methods()


@router.get("/transaction-stats")
async def get_transaction_stats(
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
    db: AsyncSession = Depends(get_db),
):
    return await xend.get_transaction_stats(current_user=current_user, db=db)


@router.post("/create-invoice")
async def create_invoice(
    data: xend.CreatePaymentRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    return await xend.create_invoice(data=data, current_user=current_user, db=db)


@router.post("/create-payment-link")
async def create_payment_link(
    data: xend.CreatePaymentRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    return await xend.create_payment_link(data=data, current_user=current_user, db=db)


@router.post("/create-qr-code")
async def create_qr_code(
    data: xend.CreatePaymentRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    return await xend.create_qr_code(data=data, current_user=current_user, db=db)


@router.post("/pay-qrph")
async def pay_qrph(
    data: xend.PayQRPhRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    return await xend.pay_qrph(data=data, current_user=current_user, db=db)


@router.post("/checkout/sessions")
async def create_checkout_session(
    data: CheckoutSessionRequest,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    """Create a Magpie Checkout Session and record a transaction."""
    try:
        svc = MagpieService()
        resolved_amount = data.amount
        if resolved_amount is None and data.line_items:
            try:
                total_cents = 0
                for item in data.line_items:
                    qty = int(float(item.get("quantity") or 1))
                    item_amount = int(float(item.get("amount") or 0))
                    total_cents += item_amount * qty
                resolved_amount = float(total_cents) / 100.0
            except Exception:
                resolved_amount = None

        payload = {
            "amount": resolved_amount,
            "currency": data.currency,
            "external_id": data.external_id,
            "description": data.description,
            "payment_methods": list(set((data.payment_methods or []) + (data.payment_method_types or []))),
            "line_items": data.line_items,
            "success_url": data.success_url,
            "cancel_url": data.cancel_url,
            "customer_email": data.customer_email,
            "metadata": data.metadata,
            "mode": data.mode,
        }
        res = await svc.create_session(payload=payload)

        if not res.get("success"):
            fallback = None
            if isinstance(res.get("error"), str) and "500" in res.get("error", ""):
                fallback = await svc.create_checkout(
                    amount=resolved_amount or 0.0,
                    description=data.description or "Checkout session",
                    external_id=data.external_id or f"magpie-session-{uuid.uuid4().hex[:12]}",
                    customer_email=data.customer_email,
                    payment_methods=list(set((data.payment_methods or []) + (data.payment_method_types or []))),
                    metadata={**(data.metadata or {}), "source": "magpie_legacy_session_fallback"},
                )
            if not fallback or not fallback.get("success"):
                raise HTTPException(status_code=400, detail=res.get("error", "Failed to create session"))
            res = fallback

        # Record transaction in local database
        txn_svc = TransactionsService(db)
        txn_id = None
        try:
            txn = await txn_svc.create_transaction(
                user_id=str(current_user.id),
                transaction_type="checkout_session",
                amount=res.get("amount") or data.amount or 0.0,  # Fallback to request amount if not in res
                external_id=res.get("external_id"),
                gateway_id=res.get("session_id", ""),
                description=data.description or "Magpie checkout session",
                customer_email=data.customer_email or "",
                payment_url=res.get("payment_url", ""),
            )
            txn_id = txn.id
        except Exception as exc:
            logger.error("Failed to record transaction for Magpie session: %s", exc, exc_info=True)
            # Non-fatal: return success but note transaction not recorded
            return {
                "success": True,
                "data": res.get("raw", {}),
                "warning": "session created but transaction record failed",
                "payment_url": res.get("payment_url", ""),
                "session_id": res.get("session_id", "")
            }

        return {
            "success": True,
            "data": {
                "transaction_id": txn_id,
                "session_id": res.get("session_id", "") or res.get("checkout_id", ""),
                "checkout_id": res.get("checkout_id", "") or res.get("session_id", ""),
                "payment_url": res.get("payment_url", "") or res.get("checkout_url", ""),
                "checkout_url": res.get("checkout_url", "") or res.get("payment_url", ""),
                "external_id": res.get("external_id", ""),
                "raw": res.get("raw", {})
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error in create_checkout_session: %s", e)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")



@router.get("/health")
async def magpie_health():
    """Simple Magpie health and diagnostics endpoint.

    Calls Magpie `account/balance` to verify API credentials and connectivity.
    """
    svc = MagpieService()
    diagnostics = {
        "configured_api_key": bool(svc.api_key),
        "base_url": svc.base_url,
    }
    # Attempt to fetch balance (non-fatal)
    try:
        res = await svc.get_balance()
        diagnostics["magpie_ok"] = bool(res.get("success"))
        diagnostics["magpie_response"] = res.get("available") if res.get("success") else res.get("error")
    except Exception as e:
        diagnostics["magpie_ok"] = False
        diagnostics["magpie_response"] = str(e)
    return {"success": True, "diagnostics": diagnostics}
