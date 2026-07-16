import logging
import os
import uuid
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi import Form
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from core.database import get_db
from core.constants import BANK_RECEIPTS_SUBDIR
from dependencies.auth import get_payment_user
from schemas.auth import UserResponse
from services.payment_processing import PaymentProcessor
from models.transactions import Transactions
from services.payment_gateway import gateway

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


class CreatePaymentPayload(BaseModel):
    amount: float
    description: str = ""
    currency: str = "PHP"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class UpdatePaymentStatusPayload(BaseModel):
    status: str = "pending"
    provider_reference: str = ""
    metadata: Dict[str, Any] = Field(default_factory=dict)


@router.post("/create")
async def create_payment(
    request: Request,
    payload: CreatePaymentPayload = None,
    receipt: UploadFile = File(None),
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    """Create payment. Supports JSON body (application/json) or multipart/form-data with an optional `receipt` file.

    If a receipt is provided it will be saved under `static/uploads/{BANK_RECEIPTS_SUBDIR}` and the path
    included in the payment metadata as `receipt_path`.
    """
    try:
        # Determine content type to parse payload accordingly
        content_type = request.headers.get("content-type", "")
        metadata = {}
        if content_type.startswith("multipart/form-data"):
            form = await request.form()
            # FastAPI already exposes `receipt` as UploadFile param when declared, but form may be used
            amount = float(form.get("amount", 0))
            description = form.get("description", "")
            currency = form.get("currency", "PHP")
            # collect any metadata fields prefixed with meta_
            for k, v in form.items():
                if k.startswith("meta_"):
                    metadata[k[5:]] = v

            # Handle receipt file saving
            receipt_path = None
            if receipt and getattr(receipt, "filename", None):
                uploads_dir = os.path.join(os.path.dirname(__file__), "..", "static", "uploads", BANK_RECEIPTS_SUBDIR)
                os.makedirs(uploads_dir, exist_ok=True)
                ext = os.path.splitext(receipt.filename)[1] or ".bin"
                filename = f"{uuid.uuid4().hex}{ext}"
                file_path = os.path.join(uploads_dir, filename)
                content = await receipt.read()
                with open(file_path, "wb") as f:
                    f.write(content)
                receipt_path = f"/uploads/{BANK_RECEIPTS_SUBDIR}/{filename}"
                metadata["receipt_path"] = receipt_path

            # Call gateway
            return await gateway.create_payment(
                db,
                user_id=str(current_user.id),
                amount=amount,
                description=description,
                transaction_type="bank_deposit",
                customer_name=metadata.get("customer_name", ""),
                customer_email=metadata.get("customer_email", ""),
                external_id=metadata.get("external_id"),
                payment_methods=metadata.get("payment_methods", []),
                metadata=metadata,
            )
        else:
            # JSON body
            body = await request.json()
            payload = CreatePaymentPayload(**body)
            return await gateway.create_payment(
                db,
                user_id=str(current_user.id),
                amount=payload.amount,
                description=payload.description,
                transaction_type="invoice",
                customer_name=payload.metadata.get("customer_name", ""),
                customer_email=payload.metadata.get("customer_email", ""),
                external_id=payload.metadata.get("external_id"),
                payment_methods=payload.metadata.get("payment_methods"),
                metadata=payload.metadata,
            )
    except ValueError as exc:
        logger.warning("Rejected payment creation: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Failed to create payment")
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{payment_id}")
async def get_payment(
    payment_id: str,
    current_user: UserResponse = Depends(get_payment_user("payments:read")),
    db: AsyncSession = Depends(get_db),
):
    processor = PaymentProcessor(db)
    try:
        return await processor.get_payment(payment_id=payment_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/{payment_id}/status")
async def update_payment_status(
    payment_id: str,
    payload: UpdatePaymentStatusPayload,
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    processor = PaymentProcessor(db)
    try:
        return await processor.update_payment_status(
            payment_id=payment_id,
            status=payload.status,
            provider_reference=payload.provider_reference or None,
            metadata=payload.metadata,
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/checkout/{identifier}")
async def get_checkout_payment(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Get payment details for checkout page (unauthenticated public endpoint).
    
    Searches by multiple identifiers:
    - external_id (payment reference from xend)
    - xendit_id (gateway payment ID)
    - transaction ID (numeric)
    - external_id with retry suffix (e.g., REF-8HAOBTRP matches REF-8HAOBTRP-1a700f)
    """
    try:
        # Try to match by external_id, xendit_id, or transaction ID
        conditions = [
            Transactions.external_id == identifier,
            Transactions.xendit_id == identifier,
        ]
        
        # Also try numeric ID
        try:
            txn_id = int(identifier)
            conditions.append(Transactions.id == txn_id)
        except ValueError:
            pass
        
        # Also try to match payments that START WITH the identifier (for retry suffix handling)
        # e.g., REF-8HAOBTRP matches REF-8HAOBTRP-1a700f
        conditions.append(Transactions.external_id.like(f"{identifier}-%"))
        
        stmt = select(Transactions).where(or_(*conditions)).limit(1)
        result = await db.execute(stmt)
        txn = result.scalars().first()
        
        if not txn:
            logger.warning(f"Checkout payment not found: {identifier}")
            raise HTTPException(status_code=404, detail="Payment not found")
        
        logger.info(f"Checkout payment retrieved: {identifier} -> txn_id={txn.id}")
        return {
            "success": True,
            "transaction_id": txn.id,
            "payment_id": txn.external_id,
            "amount": float(txn.amount),
            "currency": txn.currency or "PHP",
            "status": txn.status,
            "description": txn.description or "",
            "payment_url": txn.payment_url or "",
            "qr_code_url": txn.qr_code_url or "",
            "customer_name": txn.customer_name or "",
            "customer_email": txn.customer_email or "",
            "created_at": txn.created_at.isoformat() if txn.created_at else None,
            "updated_at": txn.updated_at.isoformat() if txn.updated_at else None,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error retrieving checkout payment {identifier}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error retrieving payment") from exc


@router.get("/checkout/{identifier}/status")
async def get_checkout_status(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Get payment status for polling (unauthenticated public endpoint).
    
    Returns minimal payment status information for real-time updates on the checkout page.
    Searches by multiple identifiers including retry suffix pattern matching.
    """
    try:
        # Try to match by external_id, xendit_id, or transaction ID
        conditions = [
            Transactions.external_id == identifier,
            Transactions.xendit_id == identifier,
        ]
        
        # Also try numeric ID
        try:
            txn_id = int(identifier)
            conditions.append(Transactions.id == txn_id)
        except ValueError:
            pass
        
        # Also try to match payments that START WITH the identifier (for retry suffix handling)
        # e.g., REF-8HAOBTRP matches REF-8HAOBTRP-1a700f
        conditions.append(Transactions.external_id.like(f"{identifier}-%"))
        
        stmt = select(Transactions).where(or_(*conditions)).limit(1)
        result = await db.execute(stmt)
        txn = result.scalars().first()
        
        if not txn:
            logger.warning(f"Checkout status not found: {identifier}")
            raise HTTPException(status_code=404, detail="Payment not found")
        
        return {
            "status": txn.status,
            "amount": float(txn.amount),
            "currency": txn.currency or "PHP",
            "payment_url": txn.payment_url or "",
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Error retrieving checkout status {identifier}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error retrieving payment status") from exc


@router.get("/checkout/{identifier}/institutions")
async def get_checkout_institutions(
    identifier: str,
    db: AsyncSession = Depends(get_db),
):
    """Fetch available financial institutions for this checkout (public)."""
    try:
        # We don't strictly need to find the txn to show institutions,
        # but it validates the checkout session exists.
        stmt = select(Transactions).where(
            or_(
                Transactions.external_id == identifier,
                Transactions.xendit_id == identifier
            )
        ).limit(1)
        result = await db.execute(stmt)
        txn = result.scalars().first()

        if not txn:
            raise HTTPException(status_code=404, detail="Payment not found")

        res = await gateway.swift.get_institutions()
        if not res.get("success"):
            return {"success": False, "error": res.get("error")}

        return res
    except Exception as exc:
        logger.error(f"Error fetching institutions for {identifier}: {exc}")
        return {"success": False, "error": "Could not fetch payment methods"}
