"""Compatibility shim for historical imports expecting `services.magpie_service`.

Some modules (deployed code) import `services.magpie_service`. The
implemented shim lives in `magpie_services.py`; this thin shim re-exports
the public symbols so both import paths work during deployment.
"""

from .magpie_services import MagpieService, run_card_settlement_sweep  # noqa: F401

__all__ = ["MagpieService", "run_card_settlement_sweep"]
