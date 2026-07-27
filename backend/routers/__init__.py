"""Package initializer for backend.routers

This module attempts to import common legacy router modules so that
imports like `from routers import xendit` or `import routers.xendit`
do not fail during startup. If a specific router module is missing,
we provide a minimal `APIRouter` stub and log a warning.
"""
import logging
from fastapi import APIRouter

logger = logging.getLogger(__name__)


def _import_or_stub(mod_name: str):
    # Try importing relatively or without backend prefix first to support container environments
    try:
        # 1. Try relative import
        module = __import__(mod_name, globals(), locals(), ["*"], 1)
        return module
    except (ImportError, ValueError):
        try:
            # 2. Try direct import (for container where backend is the root)
            module = __import__(f"routers.{mod_name}", fromlist=["*"])
            return module
        except ImportError:
            try:
                # 3. Try full path
                module = __import__(f"backend.routers.{mod_name}", fromlist=["*"])
                return module
            except Exception:
                logger.warning("router module %s not found; creating stub", mod_name)
                stub = type("StubModule", (), {"router": APIRouter()})()
                return stub


# Common router modules we want to ensure are importable
magpie = _import_or_stub("magpie")
swiftpay = _import_or_stub("swiftpay")
xend = _import_or_stub("xend")
paymongo = _import_or_stub("paymongo")
photon = _import_or_stub("photon")

__all__ = ["magpie", "swiftpay", "xend", "paymongo", "photon"]
"""Routers package"""

# Backwards-compatible aliases for renamed router modules
from . import xend as xendit  # tests and older code expect `routers.xendit`
