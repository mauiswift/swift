"""Fallback open-amount routes for deployments with a partial router load."""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from dependencies.auth import get_payment_user
from models.admin_users import AdminUser
from models.merchant_api_config import MerchantApiConfig
from models.transactions import Transactions
from schemas.auth import UserResponse

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])

SUPPORTED_CURRENCIES = {"PHP", "KRW", "CNY", "USDT"}


def _link_currency(requested: Optional[str], configured: Optional[str]) -> str:
    candidate = (requested or configured or "PHP").strip().upper()
    if candidate not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail="Unsupported permanent-link currency")
    return candidate


async def _get_open_amount_link(
    current_user: UserResponse,
    db: AsyncSession,
    requested_currency: Optional[str],
) -> dict:
    currency = (requested_currency or "PHP").strip().upper()
    if currency not in SUPPORTED_CURRENCIES:
        raise HTTPException(status_code=400, detail="Unsupported permanent-link currency")

    reference = f"OPEN-AMOUNT-{current_user.id}-{currency}"
    store_name = (current_user.organization_name or current_user.name or "").strip()
    organization_id = current_user.organization_id
    if not organization_id:
        result = await db.execute(
            select(AdminUser).where(AdminUser.telegram_id == str(current_user.id)).limit(1)
        )
        admin = result.scalar_one_or_none()
        if admin:
            organization_id = admin.organization_id
            store_name = (admin.organization_name or admin.name or store_name).strip()

    permanent_link_slug = None
    if organization_id:
        result = await db.execute(
            select(MerchantApiConfig)
            .where(
                MerchantApiConfig.organization_id == organization_id,
                or_(
                    MerchantApiConfig.user_id == str(current_user.id),
                    MerchantApiConfig.user_id.is_(None),
                ),
            )
            .order_by(
                (MerchantApiConfig.user_id == str(current_user.id)).desc(),
                MerchantApiConfig.id.asc(),
            )
            .limit(1)
        )
        config = result.scalars().first()
        if config:
            configured_currency = (config.collection_currency or "").upper()
            if not requested_currency and configured_currency in SUPPORTED_CURRENCIES:
                currency = configured_currency
            store_name = (config.store_name or store_name).strip()
            permanent_link_slug = config.permanent_link_slug

    result = await db.execute(
        select(Transactions).where(Transactions.external_id == reference).limit(1)
    )
    txn = result.scalars().first()
    if not txn:
        txn = Transactions(
            user_id=str(current_user.id),
            transaction_type="open_amount_link",
            amount=0,
            currency=currency,
            external_id=reference,
            status="pending",
            description=store_name or "Open amount payment",
            payment_url=f"/checkout/{reference}?open_amount=1",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(txn)
        await db.commit()
    elif txn.currency != currency:
        txn.currency = currency
        txn.updated_at = datetime.now(timezone.utc)
        await db.commit()

    store_name = txn.description if txn.description and txn.description != "Open amount payment" else store_name
    return {
        "success": True,
        "url": (
            f"/pay/{permanent_link_slug}-{currency}"
            if permanent_link_slug
            else f"/checkout/{reference}?open_amount=1&currency={currency}"
        ),
        "reference": reference,
        "store_name": store_name or None,
        "permanent_link_slug": permanent_link_slug,
    }


@router.get("/open-amount-link", include_in_schema=False)
async def get_open_amount_link_compat(
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
    requested_currency: Optional[str] = Query(None, alias="currency"),
):
    return await _get_open_amount_link(current_user, db, requested_currency)


@router.get("/open-amount-links", include_in_schema=False)
async def get_open_amount_links_compat(
    current_user: UserResponse = Depends(get_payment_user("payments:write")),
    db: AsyncSession = Depends(get_db),
):
    links = [
        await _get_open_amount_link(current_user, db, currency)
        for currency in ("PHP", "KRW", "CNY", "USDT")
    ]
    return {
        "success": True,
        "links": [
            {
                "currency": currency,
                "url": link["url"],
                "reference": link["reference"],
                "store_name": link["store_name"],
            }
            for currency, link in zip(("PHP", "KRW", "CNY", "USDT"), links)
        ],
    }
