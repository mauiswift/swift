"""APScheduler-based background job service.

Registers:
  - daily maintenance resume at 03:00 Asia/Manila (GMT+8)
  - legacy card settlement sweep at 05:00 Asia/Manila
  - Any future periodic jobs

Usage (in main.py lifespan):
    from services.scheduler import start_scheduler, stop_scheduler
    await start_scheduler()
    ...
    await stop_scheduler()
"""

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


async def _set_maintenance_mode(enabled: bool) -> None:
    """Persist the maintenance-mode flag in app settings."""
    try:
        from core.database import db_manager
        from services.app_settings import set_maintenance_mode

        async with db_manager.async_session_maker() as db:
            await set_maintenance_mode(db, enabled)
        logger.info("Maintenance mode set to %s", enabled)
    except Exception:
        logger.exception("Failed to set maintenance mode to %s", enabled)


async def enable_maintenance_mode_now() -> None:
    """Enable maintenance immediately for the current maintenance window."""
    await _set_maintenance_mode(True)


async def _resume_services_at_03_00() -> None:
    """Resume services by turning maintenance mode off at 03:00 Asia/Manila (GMT+8)."""
    logger.info("Maintenance window ended: resuming services")
    await _set_maintenance_mode(False)


async def _run_card_settlement_sweep() -> None:
    """Legacy scheduled sweep disabled after Magpie cleanup."""
    logger.info("Scheduled card settlement sweep disabled: legacy Magpie settlement support removed.")


async def _monitor_tatum_usdt() -> None:
    """Poll assigned TRC20 addresses and credit newly observed deposits."""
    try:
        from core.database import db_manager
        from services.tatum_service import monitor_all_addresses

        async with db_manager.async_session_maker() as db:
            result = await monitor_all_addresses(db)
        if result["incoming"] or result["outgoing"]:
            logger.info("Tatum monitor observed %s incoming and %s outgoing transfers", result["incoming"], result["outgoing"])
    except Exception:
        logger.exception("Scheduled Tatum USDT monitoring failed")


async def start_scheduler() -> None:
    """Create and start the APScheduler instance."""
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        logger.warning("Scheduler already running — skipping start")
        return

    _scheduler = AsyncIOScheduler(timezone="Asia/Manila")

    _scheduler.add_job(
        _resume_services_at_03_00,
        trigger=CronTrigger(hour=3, minute=0, timezone="Asia/Manila"),
        id="maintenance_resume",
        name="Maintenance resume at 03:00 GMT+8",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    # T+1 card settlement sweep — 05:00 Asia/Manila every day
    _scheduler.add_job(
        _run_card_settlement_sweep,
        trigger=CronTrigger(hour=5, minute=0, timezone="Asia/Manila"),
        id="card_settlement_sweep",
        name="T+1 Card Settlement Sweep",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    _scheduler.add_job(
        _monitor_tatum_usdt,
        trigger=IntervalTrigger(minutes=5),
        id="tatum_usdt_monitor",
        name="Tatum USDT address monitor",
        replace_existing=True,
        misfire_grace_time=300,
    )

    _scheduler.start()
    logger.info("APScheduler started — maintenance resumes at 03:00 Asia/Manila and settlement sweep at 05:00 Asia/Manila")


async def stop_scheduler() -> None:
    """Gracefully shut down the scheduler on app shutdown."""
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped")
    _scheduler = None
