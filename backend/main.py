import asyncio
import importlib
import logging
import os
import pkgutil
import traceback
from contextlib import asynccontextmanager
from pathlib import Path
from pathlib import Path as _Path

from fastapi import FastAPI, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from core.config import settings
from core.database import close_db, db_manager
from services.database import initialize_database
from services.auth import initialize_admin_user, initialize_demo_users
from services.mock_data import initialize_mock_data
from services.scheduler import start_scheduler, stop_scheduler

# --- LOGGING ---
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("swiftpay.main")

try:
    settings.validate_for_startup()
except ValueError as exc:
    if (settings.environment or "").strip().lower() in {"production", "prod", "live"}:
        raise
    logger.warning("Startup configuration warning: %s", exc)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("BOOT: Application lifespan starting...")

    # Debug: Check static assets
    try:
        if _STATIC.exists():
            contents = os.listdir(_STATIC)
            logger.info(f"BOOT: Static directory found at {_STATIC}. Contents: {contents}")
            if "index.html" not in contents:
                logger.error("BOOT: index.html MISSING in static directory!")
        else:
            logger.error(f"BOOT: Static directory NOT FOUND at {_STATIC}")
    except Exception as e:
        logger.error(f"BOOT: Error checking static assets: {e}")

    try:
        # Initialize Core Services
        await initialize_database()
        await initialize_admin_user()

        # Initialize demo users and mock data for local/test environments or when explicitly requested
        should_initialize_demo = os.getenv("INITIALIZE_DEMO_DATA") == "1" or (settings.environment or "").strip().lower() == "test"
        if should_initialize_demo:
            logger.info("BOOT: Initializing demo users/data...")
            await initialize_demo_users()
            await initialize_mock_data()

        # Reset maintenance state
        try:
            from services.app_settings import ensure_maintenance_off
            async with db_manager.async_session_maker() as db:
                await ensure_maintenance_off(db)
        except: pass

        # Background Ops
        if os.getenv("DISABLE_BACKGROUND_TASKS") != "1":
            await start_scheduler()
            from services.background_tasks import background_worker
            asyncio.create_task(background_worker.start_worker())

            if settings.telegram_bot_token and "localhost" not in settings.backend_url:
                try:
                    from services.telegram_service import TelegramService
                    tg = TelegramService()
                    webhook_url = f"{settings.backend_url.rstrip('/')}/api/v1/telegram/webhook"
                    asyncio.create_task(tg.set_webhook(webhook_url))
                except: pass

    except Exception as e:
        logger.error(f"FATAL_BOOT_FAILURE: {e}\n{traceback.format_exc()}")

    yield

    logger.info("SHUTDOWN: Cleaning up services...")
    await stop_scheduler()
    await close_db()

app = FastAPI(title="SwiftPay API", lifespan=lifespan)


def _mask_secret(val: str | None, show=4):
    if not val:
        return None
    s = str(val)
    if len(s) <= show * 2:
        return "*" * len(s)
    return s[:show] + "..." + s[-show:]


@app.get("/_runtime_env", include_in_schema=False)
def runtime_env():
    """Return a masked snapshot of important runtime settings for debugging deployments.

    This endpoint intentionally masks secrets. It's safe to call from your browser.
    """
    try:
        cfg = {
            "environment": getattr(settings, "environment", None),
            "backend_url": getattr(settings, "backend_url", None),
            "database_url": (lambda u: u and (u.split('@')[-1] if '@' in u else u))(getattr(settings, "database_url", None)),
            "jwt_secret_key_set": bool(getattr(settings, "jwt_secret_key", None)),
            "telegram_bot_username": getattr(settings, "telegram_bot_username", None),
            "telegram_bot_token_preview": _mask_secret(getattr(settings, "telegram_bot_token", None)),
            "telegram_admin_ids": getattr(settings, "telegram_admin_ids", None),
            "swiftpay_mode": getattr(settings, "swiftpay_mode", None),
            "swiftpay_access_key_preview": _mask_secret(getattr(settings, "swiftpay_access_key", None)),
            "cloudflare_turnstile_configured": bool(getattr(settings, "cloudflare_turnstile_secret_key", None)),
            "render": getattr(settings, "render", None),
            "railway_public_domain": getattr(settings, "railway_public_domain", None),
        }
    except Exception:
        cfg = {"error": "unable to read settings"}
    return cfg

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SECURITY GATEKEEPER ---
@app.middleware("http")
async def gatekeeper(request: Request, call_next):
    path = request.url.path

    # 1. Bypass logic for health checks, static assets, and essential routes
    # CRITICAL: Path "/" must return 200 for Render health checks to pass.
    bypass_list = (
        "/",
        "/health",
        "/login",
        "/register",
        "/home",
        "/intro",
        "/maintenance",
        "/checkout",
        "/api/",
        "/auth/",
        "/assets/",
        "/images/",
        "/uploads/"
    )

    is_file = "." in path.split("/")[-1]
    is_whitelisted = any(path.startswith(p) for p in bypass_list) or path in bypass_list

    if is_file or is_whitelisted:
        return await call_next(request)

    # 2. Redirect other SPA routes to /login if Turnstile is missing (Protected routes)
    secret = str(getattr(settings, "cloudflare_turnstile_secret_key", "") or "")
    if secret:
        if not request.cookies.get("turnstile_verified"):
            logger.info(f"Gatekeeper: Unverified access to {path} -> Redirecting to /login")
            return RedirectResponse(url="/login")

    return await call_next(request)

# --- ROUTER DISCOVERY ---
def _discover_and_include(package_name: str, prefix: str):
    try:
        pkg = importlib.import_module(package_name)
    except Exception as exc:
        logger.info("Router package %s not importable: %s", package_name, exc)
        return

    for _, modname, ispkg in pkgutil.walk_packages(pkg.__path__, prefix):
        if ispkg:
            continue
        try:
            mod = importlib.import_module(modname)
        except Exception as exc:
            logger.error(
                "ROUTER_DISCOVERY_ERROR: failed to import %s: %s",
                modname,
                exc,
                exc_info=True,
            )
            continue
        for attr in ("router", "admin_router"):
            r = getattr(mod, attr, None)
            if isinstance(r, APIRouter):
                try:
                    app.include_router(r)
                    logger.info("Included router: %s -> %s", modname, attr)
                except Exception:
                    logger.exception("Failed to include router from %s.%s", modname, attr)


# Try the import path that matches the current execution context.
# If the first import succeeds, avoid trying the alternate path to reduce noisy
# startup warnings.
try:
    _discover_and_include("routers", "routers.")
except Exception:
    _discover_and_include("backend.routers", "backend.routers.")

# Write router discovery diagnostics to a local runtime file so deployed logs
# can be inspected even when host log access is limited. The file is created
# under `backend/runtime_logs/router_discovery.log`.
try:
    _LOG_DIR = _Path(__file__).resolve().parent / "runtime_logs"
    _LOG_DIR.mkdir(parents=True, exist_ok=True)
    _LOG_FILE = _LOG_DIR / "router_discovery.log"
    try:
        with open(_LOG_FILE, "a", encoding="utf-8") as _f:
            _f.write("--- Router discovery completed; included routes snapshot ---\n")
            for route in app.routes:
                p = getattr(route, "path", None)
                m = getattr(route, "methods", None)
                _f.write(f"{p} {m}\n")
            _f.write("--- end snapshot ---\n\n")
    except Exception:
        logger.debug("Could not write router discovery log file", exc_info=True)
except Exception:
    pass

@app.get("/health")
def health(): return {"status": "healthy"}

# --- STATIC ASSET SERVING ---
_BASE = Path(__file__).parent.resolve()
_STATIC = _BASE / "static"

# Ensure directories exist for mounting
for d in ("images", "uploads", "assets"):
    (_STATIC / d).mkdir(parents=True, exist_ok=True)

app.mount("/images", StaticFiles(directory=str(_STATIC / "images")), name="images")
app.mount("/uploads", StaticFiles(directory=str(_STATIC / "uploads")), name="uploads")
app.mount("/assets", StaticFiles(directory=str(_STATIC / "assets")), name="assets")

@app.get("/{full_path:path}", include_in_schema=False)
async def catch_all_spa(full_path: str):
    # API 404
    if full_path.startswith("api/"):
        return JSONResponse(status_code=404, content={"detail": "Not found"})

    # Check for direct files (e.g. manifest.json, robots.txt)
    f = _STATIC / full_path
    if f.is_file():
        return FileResponse(f)

    # Fallback to index.html for React
    index = _STATIC / "index.html"
    if index.exists():
        return FileResponse(index, headers={"Cache-Control": "no-cache, no-store, must-revalidate"})

    return HTMLResponse(
        status_code=500,
        content="<html><body style='font-family:sans-serif;padding:40px;background:#0f172a;color:white;'>"
                "<h1>DEPLOYMENT_ERROR: ASSETS_NOT_FOUND</h1>"
                "<p>The frontend build is missing in <code>/app/backend/static</code>.</p>"
                "</body></html>"
    )

if __name__ == "__main__":
    import uvicorn
    # Render binds to PORT
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
