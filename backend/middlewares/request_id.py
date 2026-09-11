"""
Request ID middleware for FastAPI / Starlette.

- Ensures each request has a stable X-Request-ID header
- Stores the id on request.state.request_id for downstream code & logging
- Adds X-Request-ID to responses so clients can correlate
"""

from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Allow clients to provide their own request id, otherwise generate one
        rid = request.headers.get("X-Request-ID") or request.headers.get("X-RequestID") or str(uuid4())
        request.state.request_id = rid

        # Continue processing
        response: Response = await call_next(request)

        # Ensure header present on response for correlation
        if not response.headers.get("X-Request-ID"):
            response.headers["X-Request-ID"] = rid

        return response
