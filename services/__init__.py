"""Compatibility package that exposes `backend/services/*` as top-level `services`.

This makes imports like `from services.database import ...` work even when
the code is executed with the repository root on sys.path (common in deployments).
"""
import os
import logging

logger = logging.getLogger(__name__)

# Point the package path to the actual services directory under backend/
_candidate = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services"))
if os.path.isdir(_candidate):
    __path__[:] = [_candidate]
    logger.info("services package redirected to %s", _candidate)
else:
    # Fallback: keep default package path and log a warning
    logger.warning("Expected backend/services at %s not found; services package may be incomplete", _candidate)
