"""
Error handling middleware for FastAPI.

- Catches RequestValidationError -> 422 with validation details
- Passthroughs HTTPException (returns the same status/detail)
- Catches other exceptions -> 500 with non-sensitive message in production
- Logs full traceback for diagnosis (use Sentry/other if configured)
"""

import logging
import traceback
from typing import Callable

from fastapi.exceptions import RequestValidationError, HTTPException
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from core.config import settings

# Optional Sentry SDK (defensive import)
try:
    import sentry_sdk
except Exception:
    sentry_sdk = None

logger = logging.getLogger("swiftpay.error_middleware")


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        try:
            response = await call_next(request)
            return response
        except RequestValidationError as exc:
            # Validation errors from Pydantic/FastAPI
            logger.info("Request validation error: %s %s", request.method, request.url.path)
            logger.debug("Validation error details: %s", exc.errors())
            return JSONResponse(status_code=422, content={"detail": exc.errors()})
        except HTTPException as exc:
            # Explicit HTTPExceptions raised by handlers
            logger.info("HTTPException handled: %s %s -> %s", request.method, request.url.path, exc.status_code)
            return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
        except Exception as exc:
            # Unhandled exceptions
            tb = traceback.format_exc()
            logger.exception("Unhandled exception while processing request %s %s: %s", request.method, request.url.path, exc)

            # Report to Sentry if configured (non-fatal if Sentry not present)
            try:
                if sentry_sdk is not None:
                    # attach request id if present (best-effort)
                    rid = getattr(request.state, "request_id", None)
                    if rid:
                        with sentry_sdk.configure_scope() as scope:
                            scope.set_tag("request_id", rid)
                    sentry_sdk.capture_exception(exc)
            except Exception:
                logger.debug("Failed to send exception to Sentry", exc_info=True)

            # In production avoid leaking internals; include trace only in non-prod debug environments
            if (settings.environment or "").strip().lower() in {"development", "dev", "local", "test"}:
                return JSONResponse(
                    status_code=500,
                    content={
                        "detail": "Internal server error",
                        "exception": str(exc),
                        "traceback": tb,
                    },
                )

            return JSONResponse(status_code=500, content={"detail": "Internal server error"})
