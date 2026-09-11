1| import asyncio
2| import importlib
3| import logging
4| import os
5| import pkgutil
6| import sys
7| import traceback
8| from contextlib import asynccontextmanager
9| from pathlib import Path
10| from pathlib import Path as _Path
11| 
12| from fastapi import FastAPI, Request, APIRouter
13| from fastapi.middleware.cors import CORSMiddleware
14| from fastapi.responses import FileResponse, JSONResponse, HTMLResponse, RedirectResponse
15| from fastapi.staticfiles import StaticFiles
16| 
17| from core.config import settings
18| from core.database import close_db, db_manager
19| from services.database import initialize_database
20| from services.auth import initialize_admin_user, initialize_demo_users
21| from services.scheduler import start_scheduler, stop_scheduler
22| from sync_frontend_assets import build_frontend_if_needed
23| from middlewares.error_handler import ErrorHandlingMiddleware
24| 
25| # --- LOGGING ---
26| logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
27| logger = logging.getLogger("swiftpay.main")
28| 
29| try:
30|     settings.validate_for_startup()
31| except ValueError as exc:
32|     if (settings.environment or "").strip().lower() in {"production", "prod", "live"}:
33|         raise
34|     logger.warning("Startup configuration warning: %s", exc)
35| 
36| @asynccontextmanager
37| async def lifespan(app: FastAPI):
38|     logger.info("BOOT: Application lifespan starting...")
39| 
40|     try:
41|         from services.admin_notification_handlers import register_notification_handlers
42|         register_notification_handlers()
43|     except Exception:
44|         logger.exception("Failed to register admin notification handlers")
45| 
46|     # Debug: Check static assets
47|     try:
48|         if _STATIC.exists():
49|             contents = os.listdir(_STATIC)
50|             logger.info(f"BOOT: Static directory found at {_STATIC}. Contents: {contents}")
51|             if "index.html" not in contents:
52|                 logger.error("BOOT: index.html MISSING in static directory!")
53|         else:
54|             logger.error(f"BOOT: Static directory NOT FOUND at {_STATIC}")
55|     except Exception as e:
56|         logger.error(f"BOOT: Error checking static assets: {e}")
57| 
58|     try:
59|         # Initialize Core Services
60|         await initialize_database()
61|         await initialize_admin_user()
62| 
63|         # Ensure built-in system roles exist (locked permission templates)
64|         try:
65|             from services.roles import initialize_system_roles
66|             await initialize_system_roles()
67|         except Exception:
68|             logger.exception("Failed to initialize system roles")
69| 
70|         # Initialize demo users and mock/demo data when explicitly requested for local/test environments
71|         # Also support seeding previous/demo users in production via SEED_PREVIOUS_USERS env (default: enabled)
72|         should_initialize_demo = (
73|             os.getenv("INITIALIZE_DEMO_DATA") == "1"
74|             or (settings.environment or "").strip().lower() == "test"
75|             or (settings.environment or "").strip().lower() in {"production", "prod", "live"} and os.getenv("SEED_PREVIOUS_USERS", "1") == "1"
76|         )
77|         if should_initialize_demo:
78|             logger.info("BOOT: Initializing demo users and mock/demo data...")
79|             await initialize_demo_users()
80|             try:
81|                 from services.mock_data import initialize_mock_data
82|                 await initialize_mock_data()
83|             except Exception:
84|                 logger.exception("Failed to initialize mock/demo data")
85| 
86|         # Keep the service in maintenance mode until the scheduled resume time.
87|         try:
88|             from services.scheduler import enable_maintenance_mode_now
89|             await enable_maintenance_mode_now()
90|         except Exception:
91|             logger.exception("Failed to enable maintenance mode on startup")
92| 
93|         # Background Ops
94|         if os.getenv("DISABLE_BACKGROUND_TASKS") != "1":
95|             await start_scheduler()
96|             from services.background_tasks import background_worker
97|             asyncio.create_task(background_worker.start_worker())
98| 
99|             if settings.telegram_bot_token and "localhost" not in settings.backend_url:
100|                 try:
101|                     from services.telegram_service import TelegramService
102|                     tg = TelegramService()
103|                     webhook_url = f"{settings.backend_url.rstrip('/')}/api/v1/telegram/webhook"
104|                     asyncio.create_task(tg.set_webhook(webhook_url))
105|                 except: pass
106| 
107|     except Exception as e:
108|         logger.error(f"FATAL_BOOT_FAILURE: {e}\n{traceback.format_exc()}")
109| 
110|     yield
111| 
112|     logger.info("SHUTDOWN: Cleaning up services...")
113|     await stop_scheduler()
114|     await close_db()
115| 
116| app = FastAPI(
117|     title="SwiftPay API",
118|     lifespan=lifespan,
119|     docs_url="/api-docs",
120|     redoc_url="/redoc",
121|     openapi_url="/openapi.json",
122| )
123| 
124| # Add centralized error handling middleware as outermost to catch downstream exceptions
125| app.add_middleware(ErrorHandlingMiddleware)
126| 
127| 
128| def _mask_secret(val: str | None, show=4):
129|     if not val:
130|         return None
131|     s = str(val)
132|     if len(s) <= show * 2:
133|         return "*" * len(s)
134|     return s[:show] + "..." + s[-show:]
135| 
136| 
137| @app.get("/_runtime_env", include_in_schema=False)
138| def runtime_env():
139|     """Return a masked snapshot of important runtime settings for debugging deployments.
140| 
141|     This endpoint intentionally masks secrets. It's safe to call from your browser.
142|     """
143|     try:
144|         cfg = {
145|             "environment": getattr(settings, "environment", None),
146|             "backend_url": getattr(settings, "backend_url", None),
147|             "database_url": (lambda u: u and (u.split('@')[-1] if '@' in u else u))(getattr(settings, "database_url", None)),
148|             "jwt_secret_key_set": bool(getattr(settings, "jwt_secret_key", None)),
149|             "telegram_bot_username": getattr(settings, "telegram_bot_username", None),
150|             "telegram_bot_token_preview": _mask_secret(getattr(settings, "telegram_bot_token", None)),
151|             "telegram_admin_ids": getattr(settings, "telegram_admin_ids", None),
152|             "swiftpay_mode": getattr(settings, "swiftpay_mode", None),
153|             "swiftpay_access_key_preview": _mask_secret(getattr(settings, "swiftpay_access_key", None)),
154|             "cloudflare_turnstile_configured": bool(getattr(settings, "cloudflare_turnstile_secret_key", None)),
155|             "render": getattr(settings, "render", None),
156|             "railway_public_domain": getattr(settings, "railway_public_domain", None),
157|         }
158|     except Exception:
159|         cfg = {"error": "unable to read settings"}
160|     return cfg
161| 
162| # --- CORS ---
163| app.add_middleware(
164|     CORSMiddleware,
165|     allow_origins=["*"],
166|     allow_credentials=True,
167|     allow_methods=["*"],
168|     allow_headers=["*"],
169| )
170| 
171| # --- SECURITY GATEKEEPER ---
172| @app.middleware("http")
173| async def gatekeeper(request: Request, call_next):
174|     path = request.url.path
175| 
176|     # 1. Bypass logic for health checks, static assets, and essential routes
177|     # CRITICAL: Path "/" must return 200 for Render health checks to pass.
178|     bypass_list = (
179|         "/",
180|         "/health",
181|         "/login",
182|         "/register",
183|         "/home",
184|         "/intro",
185|         "/maintenance",
186|         "/checkout",
187|         "/api/",
188|         "/auth/",
189|         "/assets/",
190|         "/images/",
191|         "/uploads/"
192|     )
193| 
194|     is_file = "." in path.split("/")[-1]
195|     is_whitelisted = any(path.startswith(p) for p in bypass_list) or path in bypass_list
196| 
197|     if is_file or is_whitelisted:
198|         return await call_next(request)
199| 
200|     # 2. Redirect other SPA routes to /login if Turnstile is missing (Protected routes)
201|     secret = str(getattr(settings, "cloudflare_turnstile_secret_key", "") or "")
202|     if secret:
203|         if not request.cookies.get("turnstile_verified"):
204|             logger.info(f"Gatekeeper: Unverified access to {path} -> Redirecting to /login")
205|             return RedirectResponse(url="/login")
206| 
207|     return await call_next(request)
208| 
209| # --- ROUTER DISCOVERY ---
210| def _discover_and_include(package_name: str, prefix: str):
211|     try:
212|         pkg = importlib.import_module(package_name)
213|     except Exception as exc:
214|         logger.info("Router package %s not importable: %s", package_name, exc)
215|         return
216| 
217|     for _, modname, ispkg in pkgutil.walk_packages(pkg.__path__, prefix):
218|         if ispkg:
219|             continue
220|         try:
221|             mod = importlib.import_module(modname)
222|         except Exception as exc:
223|             logger.error(
224|                 "ROUTER_DISCOVERY_ERROR: failed to import %s: %s",
225|                 modname,
226|                 exc,
227|                 exc_info=True,
228|             )
229|             continue
230|         for attr in ("router", "admin_router"):
231|             r = getattr(mod, attr, None)
232|             if isinstance(r, APIRouter):
233|                 try:
234|                     app.include_router(r)
235|                     logger.info("Included router: %s -> %s", modname, attr)
236|                 except Exception:
237|                     logger.exception("Failed to include router from %s.%s", modname, attr)
238| 
239| 
240| # Try the import path that matches the current execution context.
241| # If the first import succeeds, avoid trying the alternate path to reduce noisy
242| # startup warnings.
243| try:
244|     _discover_and_include("routers", "routers.")
245| except Exception:
246|     backend_dir = str(Path(__file__).resolve().parent)
247|     if backend_dir not in sys.path:
248|         sys.path.insert(0, backend_dir)
249|     _discover_and_include("backend.routers", "backend.routers.")
250| 
251| # Write router discovery diagnostics to a local runtime file so deployed logs
252| # can be inspected even when host log access is limited. The file is created
253| # under `backend/runtime_logs/router_discovery.log`.
254| try:
255|     _LOG_DIR = _Path(__file__).resolve().parent / "runtime_logs"
256|     _LOG_DIR.mkdir(parents=True, exist_ok=True)
257|     _LOG_FILE = _LOG_DIR / "router_discovery.log"
258|     try:
259|         with open(_LOG_FILE, "a", encoding="utf-8") as _f:
260|             _f.write("--- Router discovery completed; included routes snapshot ---\n")
261|             for route in app.routes:
262|                 p = getattr(route, "path", None)
263|                 m = getattr(route, "methods", None)
264|                 _f.write(f"{p} {m}\n")
265|             _f.write("--- end snapshot ---\n\n")
266|     except Exception:
267|         logger.debug("Could not write router discovery log file", exc_info=True)
268| except Exception:
269|     pass
270| 
271| @app.get("/health")
272| def health(): return {"status": "healthy"}
273| 
274| # --- STATIC ASSET SERVING ---
275| _BASE = Path(__file__).parent.resolve()
276| _STATIC = _BASE / "static"
277| 
278| # Ensure the built frontend is present before serving the SPA.
279| try:
280|     if not (_STATIC / "index.html").exists():
281|         build_frontend_if_needed()
282| except Exception:
283|     logger.warning("Frontend asset sync skipped; static UI may still be served by an external build step.")
284| 
285| # Ensure directories exist for mounting
286| for d in ("images", "uploads", "assets"):
287|     (_STATIC / d).mkdir(parents=True, exist_ok=True)
288| 
289| app.mount("/images", StaticFiles(directory=str(_STATIC / "images")), name="images")
290| app.mount("/uploads", StaticFiles(directory=str(_STATIC / "uploads")), name="uploads")
291| app.mount("/assets", StaticFiles(directory=str(_STATIC / "assets")), name="assets")
292| 
293| 
294| @app.get("/downloads/swiftpay-openapi.json", include_in_schema=False)
295| async def download_openapi():
296|     """Download the current API contract as an OpenAPI JSON document."""
297|     return JSONResponse(
298|         content=app.openapi(),
299|         headers={"Content-Disposition": 'attachment; filename="swiftpay-openapi.json"'},
300|     )
301| 
302| 
303| @app.get("/downloads/swiftpay-postman.json", include_in_schema=False)
304| async def download_postman_collection():
305|     """Download the maintained Postman collection for payment integrations."""
306|     collection = _BASE.parent / "docs" / "postman" / "Xend_Integration.postman_collection.json"
307|     if not collection.is_file():
308|         return JSONResponse(status_code=404, content={"detail": "Postman collection not found"})
309|     return FileResponse(
310|         collection,
311|         media_type="application/json",
312|         filename="swiftpay-postman.json",
313|     )
314| 
315| 
316| @app.get("/downloads/swiftpay-api-guide.md", include_in_schema=False)
317| async def download_api_guide():
318|     """Download the complete merchant API and integration guide."""
319|     guide = _BASE.parent / "docs" / "API_DOCUMENTATION_GUIDE.md"
320|     if not guide.is_file():
321|         return JSONResponse(status_code=404, content={"detail": "API guide not found"})
322|     return FileResponse(
323|         guide,
324|         media_type="text/markdown",
325|         filename="swiftpay-api-guide.md",
326|     )
327| 
328| 
329| @app.get("/{full_path:path}", include_in_schema=False)
330| async def catch_all_spa(full_path: str):
331|     # API 404
332|     if full_path.startswith("api/"):
333|         return JSONResponse(status_code=404, content={"detail": "Not found"})
334| 
335|     # Check for direct files (e.g. manifest.json, robots.txt)
336|     f = _STATIC / full_path
337|     if f.is_file():
338|         return FileResponse(f)
339| 
340|     # Fallback to index.html for React
341|     index = _STATIC / "index.html"
342|     if index.exists():
343|         return FileResponse(index, headers={"Cache-Control": "no-cache, no-store, must-revalidate"})
344| 
345|     return HTMLResponse(
346|         status_code=500,
347|         content="<html><body style='font-family:sans-serif;padding:40px;background:#0f172a;color:white;'>"
348|                 "<h1>DEPLOYMENT_ERROR: ASSETS_NOT_FOUND</h1>"
349|                 "<p>The frontend build is missing in <code>/app/backend/static</code>.</p>"
350|                 "</body></html>"
351|     )
352| 
353| if __name__ == "__main__":
354|     import uvicorn
355|     # Render binds to PORT
356|     port = int(os.environ.get("PORT", 8000))
357|     uvicorn.run(app, host="0.0.0.0", port=port)
