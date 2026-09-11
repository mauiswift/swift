"""
Request ID middleware with optional Sentry per-request context.

- Ensures each request has a stable X-Request-ID header
- Stores the id on request.state.request_id for downstream code & logging
- Adds X-Request-ID to responses so clients can correlate
- If sentry-sdk is available and initialized, attach request_id and http context to Sentry scope
"""

from uuid import uuid4

# Optional Sentry SDK (defensive import)
try:
    import sentry_sdk
except Exception:
    sentry_sdk = None

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Allow clients to provide their own request id, otherwise generate one
        rid = request.headers.get("X-Request-ID") or request.headers.get("X-RequestID") or str(uuid4())
        request.state.request_id = rid

        # Add Sentry per-request context (best-effort)
        try:
            if sentry_sdk is not None:
                with sentry_sdk.configure_scope() as scope:
                    scope.set_tag("request_id", rid)
                    scope.set_context("http", {"method": request.method, "path": str(request.url.path)})
        except Exception:
            # don't fail requests if Sentry integration has issues
            pass

        # Continue processing
        response: Response = await call_next(request)

        # Ensure header present on response for correlation
        if not response.headers.get("X-Request-ID"):
            response.headers["X-Request-ID"] = rid

        return response
