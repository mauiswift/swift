import os
import logging

try:
    import sentry_sdk
    from sentry_sdk.integrations.logging import LoggingIntegration
except Exception:
    sentry_sdk = None

logger = logging.getLogger("swiftpay.sentry")


def initialize_sentry(settings):
    """Initialize Sentry if SENTRY_DSN is configured. Safe no-op if sentry-sdk not installed."""
    dsn = getattr(settings, "sentry_dsn", None) or os.getenv("SENTRY_DSN")
    if not dsn or sentry_sdk is None:
        logger.debug("Sentry not configured or sentry-sdk missing; skipping Sentry init")
        return False

    logging_integration = LoggingIntegration(
        level=None,           # don't send info logs as events by default
        event_level="ERROR",  # send errors as events
    )

    sentry_sdk.init(
        dsn=dsn,
        integrations=[logging_integration],
        environment=getattr(settings, "environment", None) or os.getenv("ENVIRONMENT"),
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.0")),
        send_default_pii=False,
    )

    logger.info("Sentry initialized")
    return True
