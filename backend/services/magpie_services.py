"""Magpie service shim with safe runtime short-circuit and circuit breaker.

This module provides a `MagpieService` class that preserves the public
API expected by the rest of the codebase but avoids making network
requests unless an API key is configured and the runtime short-circuit
is not enabled.
"""

import logging
import time
from typing import Any, Dict, List, Optional

import httpx

from core.config import settings

logger = logging.getLogger(__name__)


class MagpieService:
    """Lightweight shim for removed or optional Magpie integration.

    Public methods return a consistent `{'success': False, 'error': ...}`
    payload by default. When `MAGPIE_API_KEY` is configured the class will
    attempt network requests but still respects an in-process runtime
    short-circuit and a simple circuit breaker to avoid spamming failures.
    """

    def __init__(self) -> None:
        self.api_key: str = (getattr(settings, "magpie_api_key", "") or "").strip()
        base_url = (getattr(settings, "magpie_base_url", "") or "").strip().rstrip("/")
        self.base_url: str = base_url or "https://api.magpie.im"

        # Circuit breaker (class-level state shared across process)
        if not hasattr(MagpieService, "_consecutive_failures"):
            MagpieService._consecutive_failures = 0
            MagpieService._circuit_open_until = 0.0
            MagpieService._circuit_threshold = getattr(settings, "magpie_circuit_threshold", 5)
            MagpieService._circuit_cooldown_seconds = getattr(settings, "magpie_circuit_cooldown_seconds", 60)

        # Runtime short-circuit flag (in-memory toggle)
        if not hasattr(MagpieService, "_runtime_short_circuit"):
            MagpieService._runtime_short_circuit = False

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    @classmethod
    def set_runtime_short_circuit(cls, enabled: bool) -> None:
        cls._runtime_short_circuit = bool(enabled)
        logger.warning("Magpie runtime short-circuit set to %s", cls._runtime_short_circuit)

    @classmethod
    def is_runtime_short_circuited(cls) -> bool:
        return bool(getattr(cls, "_runtime_short_circuit", False))

    def _removed(self) -> Dict[str, Any]:
        return {"success": False, "error": "Magpie integration unavailable; use internal payment processor"}

    async def _get(self, path: str) -> Dict[str, Any]:
        if MagpieService.is_runtime_short_circuited():
            logger.warning("Magpie runtime short-circuit active; blocking GET request to %s", path)
            return {"success": False, "error": "Magpie requests disabled by runtime short-circuit"}

        if not self.api_key:
            return {"success": False, "error": "Magpie API key is not configured"}

        url = f"{self.base_url}{path}"
        logger.debug("Magpie GET request %s", url)

        now = time.time()
        if getattr(MagpieService, "_circuit_open_until", 0.0) > now:
            logger.warning("Magpie circuit open until %s, short-circuiting GET request", MagpieService._circuit_open_until)
            return {"success": False, "error": "Magpie temporarily unavailable (circuit open)"}

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=self._headers())
            response_text = resp.text or ""

            if resp.status_code >= 400:
                logger.warning("Magpie API GET error %s %s response=%s", resp.status_code, url, response_text)
                MagpieService._consecutive_failures = getattr(MagpieService, "_consecutive_failures", 0) + 1
                if MagpieService._consecutive_failures >= MagpieService._circuit_threshold:
                    MagpieService._circuit_open_until = time.time() + MagpieService._circuit_cooldown_seconds
                    logger.warning("Magpie circuit opened until %s due to repeated errors", MagpieService._circuit_open_until)
                return {"success": False, "error": f"Magpie API error ({resp.status_code}): {response_text}"}

            data = resp.json() if response_text else {}
            # Reset consecutive failures on success
            MagpieService._consecutive_failures = 0
            return {"success": True, "data": data}
        except Exception as exc:
            logger.error("Magpie GET request failed: %s", exc, exc_info=True)
            MagpieService._consecutive_failures = getattr(MagpieService, "_consecutive_failures", 0) + 1
            if MagpieService._consecutive_failures >= MagpieService._circuit_threshold:
                MagpieService._circuit_open_until = time.time() + MagpieService._circuit_cooldown_seconds
                logger.warning("Magpie circuit opened until %s due to GET exception", MagpieService._circuit_open_until)
            return {"success": False, "error": str(exc)}

    @staticmethod
    def _pick(data: Any, *keys: str) -> Optional[Any]:
        if not isinstance(data, dict):
            return None
        for key in keys:
            if key in data and data[key] not in (None, ""):
                return data[key]
        return None

    # Public API methods — keep returning a stable failure shape by default.
    async def create_checkout(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def create_invoice(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def create_payment_link(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def create_ewallet_charge(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def create_refund(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def get_checkout_status(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def create_payout(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def get_balance(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def create_qr_payment(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()

    async def create_session(self, *args, **kwargs) -> Dict[str, Any]:
        return self._removed()


async def run_card_settlement_sweep() -> None:
    # Placeholder hook to preserve the previous interface. Keep lightweight.
    logger.info("Magpie settlement sweep hook executed")
