"""Minimal PhotonPayService stub used for tests and environments where
the real PhotonPay integration is not installed or configured.

This stub provides the interface expected by `routers.telegram` but does
not perform any external HTTP calls.
"""
from typing import Dict, Any
from core.config import settings


class PhotonPayService:
    def __init__(self):
        # Consider configured when required credentials are present in settings
        self.is_configured = bool(getattr(settings, "photonpay_app_id", "") and getattr(settings, "photonpay_app_secret", ""))

    async def create_alipay_session(self, *args, **kwargs) -> Dict[str, Any]:
        return {"success": False, "error": "PhotonPay not configured"}

    async def create_wechat_session(self, *args, **kwargs) -> Dict[str, Any]:
        return {"success": False, "error": "PhotonPay not configured"}

    async def some_other_method(self, *args, **kwargs) -> Dict[str, Any]:
        return {"success": False, "error": "Not implemented in stub"}
