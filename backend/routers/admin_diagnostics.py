"""Explicitly gated super-admin diagnostics."""

import ipaddress
import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException

from core.config import settings
from dependencies.auth import get_current_user
from schemas.auth import UserResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin/diagnostics", tags=["admin-diagnostics"])


@router.get("/egress-ip", include_in_schema=False)
async def get_egress_ip(
    current_user: UserResponse = Depends(get_current_user),
) -> dict[str, str]:
    """Return the service's public IPv4 for provider allowlisting."""
    if not settings.admin_diagnostics_enabled:
        raise HTTPException(status_code=404, detail="Diagnostics are disabled")
    if not current_user.permissions or not current_user.permissions.is_super_admin:
        raise HTTPException(status_code=403, detail="Super admin access required")

    try:
        async with httpx.AsyncClient(timeout=5.0, follow_redirects=False) as client:
            response = await client.get("https://api.ipify.org")
            response.raise_for_status()
        address = response.text.strip()
        parsed = ipaddress.ip_address(address)
        if parsed.version != 4:
            raise ValueError("The egress provider returned a non-IPv4 address")
        return {"ip": address}
    except (httpx.HTTPError, ValueError) as error:
        logger.warning("Unable to determine service egress IP: %s", error)
        raise HTTPException(status_code=503, detail="Unable to determine service egress IP")
