import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

import httpx
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import (
    TATUM_API_KEY_KEY,
    TATUM_BASE_URL_KEY,
    TATUM_ENABLED_KEY,
    TATUM_TRON_XPUB_KEY,
    TATUM_WEBHOOK_SECRET_KEY,
)
from models.usdt_deposit_addresses import UsdtChainTransfer, UsdtDepositAddress
from services.app_settings import _get_setting, _set_setting
from services.wallets import WalletsService

logger = logging.getLogger(__name__)
DEFAULT_TATUM_BASE_URL = "https://api.tatum.io"
DEFAULT_USDT_TRC20_CONTRACT = "TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj"


class TatumConfigurationError(ValueError):
    pass


async def get_tatum_config(db: AsyncSession) -> dict[str, Any]:
    values = {
        "enabled": await _get_setting(db, TATUM_ENABLED_KEY),
        "api_key": await _get_setting(db, TATUM_API_KEY_KEY),
        "base_url": await _get_setting(db, TATUM_BASE_URL_KEY),
        "tron_xpub": await _get_setting(db, TATUM_TRON_XPUB_KEY),
        "webhook_secret": await _get_setting(db, TATUM_WEBHOOK_SECRET_KEY),
    }
    return {
        "enabled": values["enabled"] == "true",
        "configured": bool(values["api_key"] and values["tron_xpub"]),
        "base_url": (values["base_url"] or DEFAULT_TATUM_BASE_URL).rstrip("/"),
        "tron_xpub": values["tron_xpub"] or "",
        "has_api_key": bool(values["api_key"]),
        "has_webhook_secret": bool(values["webhook_secret"]),
        "api_key": values["api_key"] or "",
        "webhook_secret": values["webhook_secret"] or "",
    }


async def save_tatum_config(db: AsyncSession, payload: dict[str, Any]) -> dict[str, Any]:
    api_key = str(payload.get("api_key") or "").strip()
    current = await get_tatum_config(db)
    if not api_key:
        api_key = current["api_key"]
    tron_xpub = str(payload.get("tron_xpub") or "").strip()
    if not tron_xpub:
        raise TatumConfigurationError("Tron xpub is required for unique user address assignment")
    base_url = str(payload.get("base_url") or DEFAULT_TATUM_BASE_URL).strip().rstrip("/")
    if not base_url.startswith(("http://", "https://")):
        raise TatumConfigurationError("Tatum base URL must use http:// or https://")
    if not api_key:
        raise TatumConfigurationError("Tatum API key is required")

    await _set_setting(db, TATUM_ENABLED_KEY, "true" if bool(payload.get("enabled", True)) else "false")
    await _set_setting(db, TATUM_API_KEY_KEY, api_key)
    await _set_setting(db, TATUM_BASE_URL_KEY, base_url)
    await _set_setting(db, TATUM_TRON_XPUB_KEY, tron_xpub)
    webhook_secret = str(payload.get("webhook_secret") or "").strip()
    if webhook_secret:
        await _set_setting(db, TATUM_WEBHOOK_SECRET_KEY, webhook_secret)
    return await get_tatum_config(db)


async def _tatum_request(db: AsyncSession, method: str, path: str, **kwargs: Any) -> Any:
    config = await get_tatum_config(db)
    if not config["enabled"] or not config["configured"]:
        raise TatumConfigurationError("Tatum integration is not enabled or configured")
    headers = dict(kwargs.pop("headers", {}) or {})
    headers["x-api-key"] = config["api_key"]
    headers.setdefault("accept", "application/json")
    async with httpx.AsyncClient(base_url=config["base_url"], timeout=20.0) as client:
        response = await client.request(method, path, headers=headers, **kwargs)
        response.raise_for_status()
        return response.json()


async def assign_usdt_address(db: AsyncSession, user_id: str) -> UsdtDepositAddress:
    existing = await db.scalar(select(UsdtDepositAddress).where(UsdtDepositAddress.user_id == str(user_id)))
    if existing:
        return existing

    config = await get_tatum_config(db)
    if not config["enabled"] or not config["configured"]:
        raise TatumConfigurationError("Configure and enable Tatum before assigning user addresses")

    latest_index = await db.scalar(select(func.max(UsdtDepositAddress.derivation_index)))
    derivation_index = int(latest_index or -1) + 1
    address_result = await _tatum_request(db, "GET", f"/v3/tron/address/{config['tron_xpub']}/{derivation_index}")
    address = str((address_result or {}).get("address") or "").strip()
    if not address.startswith("T") or len(address) != 34:
        raise TatumConfigurationError("Tatum returned an invalid TRON address")

    record = UsdtDepositAddress(
        user_id=str(user_id),
        address=address,
        derivation_index=derivation_index,
        network="TRON",
        active=True,
    )
    db.add(record)
    await db.flush()
    return record


def _transfer_items(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    if isinstance(payload, dict):
        for key in ("transactions", "data", "result"):
            if isinstance(payload.get(key), list):
                return [item for item in payload[key] if isinstance(item, dict)]
    return []


def _parse_transfer(item: dict[str, Any], address: str) -> Optional[dict[str, Any]]:
    token = item.get("tokenTransfer") or item.get("token_transfer") or item.get("token")
    if not isinstance(token, dict):
        return None
    contract = str(token.get("tokenAddress") or token.get("contractAddress") or token.get("contract_address") or "")
    if contract and contract != DEFAULT_USDT_TRC20_CONTRACT:
        return None
    from_address = str(token.get("from") or token.get("fromAddress") or item.get("from") or "")
    to_address = str(token.get("to") or token.get("toAddress") or item.get("to") or "")
    if address not in {from_address, to_address}:
        return None
    raw_amount = token.get("amount") or token.get("value") or item.get("amount") or item.get("value")
    try:
        amount = float(raw_amount)
    except (TypeError, ValueError):
        return None
    if amount > 1_000_000:
        amount /= 1_000_000
    if amount <= 0:
        return None
    tx_hash = str(item.get("txID") or item.get("txId") or item.get("hash") or item.get("id") or "").strip()
    if not tx_hash:
        return None
    return {
        "tx_hash": tx_hash,
        "direction": "incoming" if to_address == address else "outgoing",
        "amount_usdt": amount,
        "from_address": from_address or None,
        "to_address": to_address or None,
        "raw_payload": json.dumps(item, sort_keys=True, default=str),
    }


async def monitor_user_address(db: AsyncSession, record: UsdtDepositAddress) -> list[UsdtChainTransfer]:
    payload = await _tatum_request(db, "GET", f"/v3/tron/transaction/account/{record.address}", params={"pageSize": 50})
    observed: list[UsdtChainTransfer] = []
    for item in _transfer_items(payload):
        parsed = _parse_transfer(item, record.address)
        if not parsed:
            continue
        exists = await db.scalar(select(UsdtChainTransfer).where(UsdtChainTransfer.tx_hash == parsed["tx_hash"]))
        if exists:
            continue
        transfer = UsdtChainTransfer(user_id=record.user_id, address=record.address, **parsed)
        db.add(transfer)
        observed.append(transfer)
        if parsed["direction"] == "incoming":
            await WalletsService(db).credit_wallet(
                record.user_id,
                parsed["amount_usdt"],
                "USDT",
                "crypto_topup",
                parsed["tx_hash"],
                note=f"Tatum TRC20 deposit to {record.address}",
            )
    record.last_scanned_at = datetime.now(timezone.utc)
    await db.flush()
    return observed


async def monitor_all_addresses(db: AsyncSession) -> dict[str, int]:
    result = await db.execute(select(UsdtDepositAddress).where(UsdtDepositAddress.active.is_(True)))
    incoming = outgoing = 0
    for record in result.scalars().all():
        for transfer in await monitor_user_address(db, record):
            if transfer.direction == "incoming":
                incoming += 1
            else:
                outgoing += 1
    await db.commit()
    return {"addresses": incoming + outgoing, "incoming": incoming, "outgoing": outgoing}
