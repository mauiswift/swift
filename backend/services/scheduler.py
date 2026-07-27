"""APScheduler-based background job service.

Registers:
  - T+0 / T+1 card settlement sweep  (daily 05:00 Asia/Manila)
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

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


async def _run_card_settlement_sweep() -> None:
    """Legacy scheduled sweep disabled after Magpie cleanup."""
    logger.info("Scheduled card settlement sweep disabled: legacy Magpie settlement support removed.")


async def start_scheduler() -> None:
    """Create and start the APScheduler instance."""
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        logger.warning("Scheduler already running — skipping start")
        return

    _scheduler = AsyncIOScheduler(timezone="Asia/Manila")

    # T+1 card settlement sweep — 05:00 Asia/Manila every day
    _scheduler.add_job(
        _run_card_settlement_sweep,
        trigger=CronTrigger(hour=5, minute=0, timezone="Asia/Manila"),
        id="card_settlement_sweep",
        name="T+1 Card Settlement Sweep",
        replace_existing=True,
        misfire_grace_time=3600,  # allow up to 1 h late if server was down
    )

    _scheduler.start()
    logger.info("APScheduler started — card settlement sweep scheduled at 05:00 Asia/Manila")


async def stop_scheduler() -> None:
    """Gracefully shut down the scheduler on app shutdown."""
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped")
    _scheduler = None
