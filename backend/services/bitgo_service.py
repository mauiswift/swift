"""BitGo-backed TRON USDT address allocation and monitoring."""

import hashlib
import json
import logging
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Optional

import httpx
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.constants import (
    BITGO_ACCESS_TOKEN_KEY, BITGO_BASE_URL_KEY, BITGO_COIN_KEY,
    BITGO_ENABLED_KEY, BITGO_USDT_CONTRACT_KEY, BITGO_WALLET_ID_KEY,
    DEFAULT_BITGO_BASE_URL, DEFAULT_BITGO_COIN, DEFAULT_BITGO_USDT_CONTRACT,
)
from models.usdt_deposit_addresses import UsdtChainTransfer, UsdtDepositAddress
from services.app_settings import _get_setting, _set_setting
from services.wallets import WalletsService

logger = logging.getLogger(__name__)


class BitGoConfigurationError(ValueError):
    pass


class BitGoRequestError(RuntimeError):
    pass


def is_valid_tron_address(address: str) -> bool:
    """Validate a base58check TRON mainnet address (not merely its prefix)."""
    alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    try:
        raw = 0
        for char in address:
            raw = raw * 58 + alphabet.index(char)
        decoded = raw.to_bytes(25, "big")
        return len(address) == 34 and decoded[0] == 0x41 and hashlib.sha256(
            hashlib.sha256(decoded[:21]).digest()).digest()[:4] == decoded[21:]
    except (ValueError, OverflowError):
        return False


async def get_bitgo_config(db: AsyncSession) -> dict[str, Any]:
    values = {key: await _get_setting(db, key) for key in (
        BITGO_ENABLED_KEY, BITGO_ACCESS_TOKEN_KEY, BITGO_BASE_URL_KEY,
        BITGO_WALLET_ID_KEY, BITGO_COIN_KEY, BITGO_USDT_CONTRACT_KEY,
    )}
    return {
        "enabled": values[BITGO_ENABLED_KEY] == "true",
        "configured": bool(values[BITGO_ACCESS_TOKEN_KEY] and values[BITGO_WALLET_ID_KEY]),
        "base_url": (values[BITGO_BASE_URL_KEY] or DEFAULT_BITGO_BASE_URL).rstrip("/"),
        "wallet_id": values[BITGO_WALLET_ID_KEY] or "",
        "coin": values[BITGO_COIN_KEY] or DEFAULT_BITGO_COIN,
        "usdt_contract": values[BITGO_USDT_CONTRACT_KEY] or DEFAULT_BITGO_USDT_CONTRACT,
        "has_access_token": bool(values[BITGO_ACCESS_TOKEN_KEY]),
        "has_api_key": bool(values[BITGO_ACCESS_TOKEN_KEY]),
    }


async def save_bitgo_config(db: AsyncSession, payload: dict[str, Any]) -> dict[str, Any]:
    stored_token = await _get_setting(db, BITGO_ACCESS_TOKEN_KEY)
    token = str(payload.get("access_token") or "").strip() or stored_token or ""
    wallet_id = str(payload.get("wallet_id") or "").strip()
    if not wallet_id:
        raise BitGoConfigurationError("BitGo wallet ID is required")
    if not token:
        raise BitGoConfigurationError("BitGo access token is required")
    base_url = str(payload.get("base_url") or DEFAULT_BITGO_BASE_URL).strip().rstrip("/")
    if not base_url.startswith(("http://", "https://")):
        raise BitGoConfigurationError("BitGo base URL must use http:// or https://")
    coin = str(payload.get("coin") or DEFAULT_BITGO_COIN).strip().lower()
    contract = str(payload.get("usdt_contract") or DEFAULT_BITGO_USDT_CONTRACT).strip()
    for key, value in ((BITGO_ENABLED_KEY, "true" if payload.get("enabled", True) else "false"),
                       (BITGO_ACCESS_TOKEN_KEY, token), (BITGO_BASE_URL_KEY, base_url),
                       (BITGO_WALLET_ID_KEY, wallet_id), (BITGO_COIN_KEY, coin),
                       (BITGO_USDT_CONTRACT_KEY, contract)):
        await _set_setting(db, key, value)
    return await get_bitgo_config(db)


async def _bitgo_request(db: AsyncSession, method: str, path: str, **kwargs: Any) -> Any:
    config = await get_bitgo_config(db)
    if not config["enabled"] or not config["configured"]:
        raise BitGoConfigurationError("BitGo integration is not enabled or configured")
    headers = dict(kwargs.pop("headers", {}) or {})
    token = await _get_setting(db, BITGO_ACCESS_TOKEN_KEY)
    headers["Authorization"] = f"Bearer {token}"
    headers.setdefault("accept", "application/json")
    headers["Authorization"] = "Bearer " + token
    try:
        async with httpx.AsyncClient(base_url=config["base_url"], timeout=20.0) as client:
            response = await client.request(method, path, headers=headers, **kwargs)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text[:300].strip()
        request_id = ""
        try:
            error_body = exc.response.json()
            request_id = str(error_body.get("requestId") or "").strip()
            if error_body.get("error") == "Attempt to use IP-restricted token from an unauthorized IP address":
                detail = (
                    "BitGo token IP restriction rejected this server's outbound IP. "
                    "Add the deployment egress IP to the token allowlist in BitGo."
                )
        except (ValueError, TypeError):
            pass
        suffix = f": {detail}" if detail else ""
        if request_id:
            suffix += f" (BitGo request ID: {request_id})"
        raise BitGoRequestError(
            f"BitGo rejected the request ({exc.response.status_code}){suffix}"
        ) from exc
    except httpx.RequestError as exc:
        raise BitGoRequestError("Unable to connect to BitGo. Check the base URL and IP allowlist.") from exc
    except ValueError as exc:
        raise BitGoRequestError("BitGo returned an invalid JSON response.") from exc


async def assign_usdt_address(db: AsyncSession, user_id: str) -> UsdtDepositAddress:
    user_id = str(user_id)
    existing = await db.scalar(select(UsdtDepositAddress).where(UsdtDepositAddress.user_id == user_id))
    if existing:
        return existing
    config = await get_bitgo_config(db)
    if not config["enabled"] or not config["configured"]:
        raise BitGoConfigurationError("Configure and enable BitGo before assigning user addresses")

    # Address assignment can be requested concurrently (for example, the admin
    # bulk-assignment endpoint and a user's first dashboard request). Reserve the
    # database row in a savepoint so a unique-index race can be retried safely.
    for attempt in range(3):
        latest = await db.scalar(select(func.max(UsdtDepositAddress.derivation_index)))
        index = int(latest or -1) + 1
        result = await _bitgo_request(
            db, "POST", f"/api/v2/{config['coin']}/wallet/{config['wallet_id']}/address",
            json={"label": f"usdt-{user_id}-{index}", "address": str(index)},
        )
        if not isinstance(result, dict):
            raise BitGoRequestError("BitGo returned an unexpected address response.")
        wallet_address = result.get("walletAddress")
        if wallet_address is not None and not isinstance(wallet_address, dict):
            raise BitGoRequestError("BitGo returned an invalid wallet address response.")
        address = str(result.get("address") or (wallet_address or {}).get("address") or "").strip()
        if not is_valid_tron_address(address):
            raise BitGoConfigurationError("BitGo returned an invalid TRON address")

        record = UsdtDepositAddress(
            user_id=user_id,
            address=address,
            derivation_index=index,
            network="TRON",
            active=True,
        )
        try:
            async with db.begin_nested():
                db.add(record)
                await db.flush()
            return record
        except IntegrityError:
            concurrent_record = await db.scalar(
                select(UsdtDepositAddress).where(UsdtDepositAddress.user_id == user_id)
            )
            if concurrent_record:
                return concurrent_record
            if attempt == 2:
                logger.exception("Unable to reserve BitGo address index after concurrent assignment retries")
                raise BitGoRequestError(
                    "Unable to store the BitGo address because another assignment is in progress. "
                    "Please retry the assignment."
                )
            logger.warning(
                "BitGo address index %s was already reserved; retrying assignment (%s/3)",
                index,
                attempt + 1,
            )

    raise BitGoRequestError("Unable to store the BitGo address.")


def _transfer_items(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [x for x in payload if isinstance(x, dict)]
    if isinstance(payload, dict):
        for key in ("transfers", "transactions", "data", "result"):
            value = payload.get(key)
            if isinstance(value, list):
                return [x for x in value if isinstance(x, dict)]
    return []


def _parse_transfer(item: dict[str, Any], address: str, contract: str = DEFAULT_BITGO_USDT_CONTRACT) -> Optional[dict[str, Any]]:
    token = item.get("tokenTransfer") or item.get("token_transfer") or item.get("token") or {}
    outputs = item.get("outputs") or item.get("output") or []
    if not isinstance(token, dict):
        token = {}
    if isinstance(outputs, dict):
        outputs = [outputs]
    token_contract = str(token.get("tokenAddress") or token.get("contractAddress") or token.get("contract_address")
                          or item.get("tokenAddress") or "")
    if token_contract and token_contract != contract:
        return None
    from_address = str(token.get("from") or token.get("fromAddress") or item.get("from") or "").strip()
    to_address = str(token.get("to") or token.get("toAddress") or item.get("to") or "").strip()
    raw_amount: Any = token.get("amount") or token.get("value") or item.get("amount") or item.get("value")
    for output in outputs if isinstance(outputs, list) else []:
        if not isinstance(output, dict):
            continue
        out_address = str(output.get("address") or output.get("address1") or "").strip()
        if out_address == address:
            to_address = out_address
            raw_amount = output.get("value") or output.get("amount") or raw_amount
            token_contract = str(output.get("tokenAddress") or output.get("contractAddress") or token_contract)
    if token_contract != contract or to_address != address:
        return None
    try:
        amount = Decimal(str(raw_amount))
        if amount > 1_000_000:
            amount /= Decimal(1_000_000)
    except (InvalidOperation, TypeError, ValueError):
        return None
    tx_hash = str(item.get("txID") or item.get("txId") or item.get("txHash") or item.get("hash") or item.get("id") or "").strip()
    if not tx_hash or amount <= 0:
        return None
    return {"tx_hash": tx_hash, "direction": "incoming", "amount_usdt": float(amount),
            "from_address": from_address or None, "to_address": to_address,
            "raw_payload": json.dumps(item, sort_keys=True, default=str)}


async def monitor_user_address(db: AsyncSession, record: UsdtDepositAddress) -> list[UsdtChainTransfer]:
    config = await get_bitgo_config(db)
    payload = await _bitgo_request(db, "GET", f"/api/v2/{config['coin']}/wallet/{config['wallet_id']}/transfer",
                                    params={"address": record.address, "limit": 100})
    observed = []
    for item in _transfer_items(payload):
        parsed = _parse_transfer(item, record.address, config["usdt_contract"])
        if not parsed or await db.scalar(select(UsdtChainTransfer).where(UsdtChainTransfer.tx_hash == parsed["tx_hash"])):
            continue
        transfer = UsdtChainTransfer(user_id=record.user_id, address=record.address, **parsed)
        db.add(transfer); observed.append(transfer)
        await WalletsService(db).credit_wallet(record.user_id, parsed["amount_usdt"], "USDT", "crypto_topup",
                                                parsed["tx_hash"], note=f"BitGo TRC20 deposit to {record.address}")
    record.last_scanned_at = datetime.now(timezone.utc)
    await db.flush()
    return observed


async def monitor_all_addresses(db: AsyncSession) -> dict[str, int]:
    result = await db.execute(select(UsdtDepositAddress).where(UsdtDepositAddress.active.is_(True)))
    incoming = 0
    for record in result.scalars().all():
        incoming += len(await monitor_user_address(db, record))
    await db.commit()
    return {"addresses": incoming, "incoming": incoming, "outgoing": 0}
