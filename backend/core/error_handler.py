"""
EMERGENCY HOTFIX: Global Error Handler for Page Crashes
Prevents AttributeError and schema mismatches from crashing pages
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging
import traceback
from datetime import datetime

logger = logging.getLogger(__name__)


class ErrorHandler:
    """Global error handler to prevent page crashes"""
    
    @staticmethod
    def setup_error_handlers(app: FastAPI):
        """Setup all error handlers for the application"""
        
        @app.exception_handler(RequestValidationError)
        async def validation_exception_handler(request: Request, exc: RequestValidationError):
            """Handle Pydantic validation errors gracefully"""
            logger.error(f"Validation error on {request.url.path}: {exc}")
            return JSONResponse(
                status_code=422,
                content={
                    "detail": "Invalid request data",
                    "errors": [
                        {
                            "loc": list(error["loc"]),
                            "msg": error["msg"],
                            "type": error["type"]
                        } for error in exc.errors()
                    ],
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        @app.exception_handler(AttributeError)
        async def attribute_error_handler(request: Request, exc: AttributeError):
            """Handle AttributeError - prevent crashes from missing attributes"""
            logger.error(f"AttributeError on {request.url.path}: {str(exc)}")
            logger.error(traceback.format_exc())
            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Server configuration error - attribute missing",
                    "error": str(exc),
                    "timestamp": datetime.utcnow().isoformat(),
                    "path": str(request.url.path)
                }
            )
        
        @app.exception_handler(Exception)
        async def general_exception_handler(request: Request, exc: Exception):
            """Handle all uncaught exceptions"""
            logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}")
            logger.error(traceback.format_exc())
            
            # Determine appropriate status code
            status_code = 500
            if isinstance(exc, ValueError):
                status_code = 400
            elif isinstance(exc, KeyError):
                status_code = 404
            
            return JSONResponse(
                status_code=status_code,
                content={
                    "detail": "An error occurred processing your request",
                    "error_type": exc.__class__.__name__,
                    "timestamp": datetime.utcnow().isoformat(),
                    "path": str(request.url.path)
                }
            )


def add_error_handlers(app: FastAPI):
    """Register error handlers with the FastAPI app"""
    ErrorHandler.setup_error_handlers(app)
    logger.info("✓ Global error handlers registered")
