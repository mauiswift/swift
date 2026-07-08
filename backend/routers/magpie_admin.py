from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel

from core.config import settings
from services.magpie_service import MagpieService

router = APIRouter(prefix="/admin/magpie", tags=["admin-magpie"])


class TogglePayload(BaseModel):
    enabled: bool


def _get_expected_token() -> str:
    return getattr(settings, "magpie_admin_token", "") or ""


async def _verify_token(x_magpie_admin_token: str | None = Header(None)) -> None:
    expected = _get_expected_token()
    if not expected:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin token not configured")
    if not x_magpie_admin_token or x_magpie_admin_token != expected:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


@router.post("/short_circuit")
async def set_short_circuit(payload: TogglePayload, _=Depends(_verify_token)):
    MagpieService.set_runtime_short_circuit(payload.enabled)
    return {"success": True, "enabled": MagpieService.is_runtime_short_circuited()}


@router.get("/short_circuit")
async def get_short_circuit_status(_=Depends(_verify_token)):
    return {"success": True, "enabled": MagpieService.is_runtime_short_circuited()}
