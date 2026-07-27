"""Compatibility shim: re-export backend.services.magpie_service

Some deployed code imports `services.magpie_service`. This shim ensures that
those imports resolve by delegating to `backend.services.magpie_service`.
"""
from backend.services.magpie_service import MagpieService, run_card_settlement_sweep  # noqa: F401

__all__ = ["MagpieService", "run_card_settlement_sweep"]
