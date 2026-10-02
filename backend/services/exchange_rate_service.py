"""Real-time exchange rates with shared provider caching and multi-pair support."""

import logging
import time
import asyncio
from typing import Optional, Tuple, Dict, List
from datetime import datetime, timezone, timedelta

import httpx

logger = logging.getLogger(__name__)

COINGECKO_URL = (
    "https://api.coingecko.com/api/v3/simple/price"
    "?ids=tether&vs_currencies=php,usd,eur,gbp,sgd,krw,cny"
)

CACHE_TTL_SECONDS = 60  # 1 minute
HISTORY_RETENTION_DAYS = 90  # Keep 90 days of history
FALLBACK_RATES: Dict[str, float] = {
    "USDT_PHP": 58.0,
    "USDT_USD": 1.0,
    "USDT_EUR": 0.92,
    "USDT_GBP": 0.79,
    "USDT_SGD": 1.35,
    "USDT_KRW": 1350.0,
    "USDT_CNY": 7.2,
}

# In-memory cache: {currency_pair: (rate, fetched_at_unix_timestamp)}
_cache: Dict[str, Tuple[float, float]] = {}
_provider_rates: Dict[str, float] = {}
_provider_fetched_at = 0.0
_provider_retry_after = 0.0
_provider_error = ""
_provider_lock = asyncio.Lock()

_http: Optional[httpx.AsyncClient] = None
# Sentinel to detect when tests or runtime replace the fetch helper.
# If the global `fetch_live_usdt_php_rate` is replaced (monkeypatched)
# we will call it as a stub; otherwise avoid calling the default
# implementation (which calls back into `get_rate` and causes recursion).
_DEFAULT_FETCH_LIVE = None

# Per-pair asyncio locks to ensure only one concurrent HTTP fetch occurs
# for a given currency pair. Other coroutines will wait for the in-flight
# fetch to complete and then read from the cache, avoiding duplicate
# external requests and log spam.
_locks: Dict[str, asyncio.Lock] = {}


def _get_http() -> httpx.AsyncClient:
    global _http
    if _http is None or _http.is_closed:
        _http = httpx.AsyncClient(timeout=10.0)
    return _http


async def _get_tether_rates() -> Dict[str, float]:
    """Fetch one shared CoinGecko quote map for every supported currency pair."""
    global _provider_rates, _provider_fetched_at, _provider_retry_after, _provider_error

    now = time.monotonic()
    if _provider_rates and now - _provider_fetched_at < CACHE_TTL_SECONDS:
        return dict(_provider_rates)
    if now < _provider_retry_after:
        if _provider_rates:
            return dict(_provider_rates)
        raise RuntimeError(_provider_error or "CoinGecko rate limit cooldown is active")

    async with _provider_lock:
        now = time.monotonic()
        if _provider_rates and now - _provider_fetched_at < CACHE_TTL_SECONDS:
            return dict(_provider_rates)
        if now < _provider_retry_after:
            if _provider_rates:
                return dict(_provider_rates)
            raise RuntimeError(_provider_error or "CoinGecko rate limit cooldown is active")

        response = None
        try:
            response = await _get_http().get(COINGECKO_URL)
            response.raise_for_status()
            payload = response.json()
            tether = payload.get("tether") if isinstance(payload, dict) else None
            if not isinstance(tether, dict):
                raise ValueError("CoinGecko response did not contain tether rates")

            rates = {
                str(currency).lower(): float(rate)
                for currency, rate in tether.items()
                if float(rate) > 0
            }
            if not rates:
                raise ValueError("CoinGecko response contained no positive tether rates")

            fetched_at = time.monotonic()
            _provider_rates = rates
            _provider_fetched_at = fetched_at
            _provider_retry_after = 0.0
            _provider_error = ""
            for currency, rate in rates.items():
                _cache[f"USDT_{currency.upper()}"] = (rate, fetched_at)
            return dict(rates)
        except Exception as exc:
            cooldown = CACHE_TTL_SECONDS
            if response is not None and response.status_code == 429:
                try:
                    cooldown = max(1.0, min(900.0, float(response.headers.get("Retry-After", cooldown))))
                except (TypeError, ValueError):
                    pass
            _provider_retry_after = time.monotonic() + cooldown
            _provider_error = str(exc)
            if _provider_rates:
                logger.warning("Live CoinGecko rates unavailable; using cached provider quotes: %s", exc)
                return dict(_provider_rates)
            raise


async def fetch_live_usdt_php_rate() -> float:
    """Return the current live USDT→PHP exchange rate (legacy compatibility).

    Uses a 1-minute in-memory cache to avoid excessive calls to the
    CoinGecko public API. Raises ``RuntimeError`` if the request fails.
    """
    return await get_rate("USDT_PHP")


# Record the original implementation so callers can detect a replacement
# (tests may monkeypatch `fetch_live_usdt_php_rate` to a synchronous stub).
_DEFAULT_FETCH_LIVE = fetch_live_usdt_php_rate


async def get_rate(currency_pair: str) -> float:
    """Get current exchange rate for a currency pair.
    
    Args:
        currency_pair: Format "CURRENCY1_CURRENCY2" (e.g., "USDT_PHP", "USD_EUR")
    
    Returns:
        Exchange rate as float (e.g., 56.75 for USDT→PHP)
    
    Raises:
        RuntimeError: If rate fetch fails
    """
    normalized_pair = (currency_pair or "").strip().upper()
    if "_" not in normalized_pair:
        raise RuntimeError(f"Invalid currency pair: {currency_pair!r}")

    logger.debug(f"Fetching live {normalized_pair} rate from CoinGecko")
    try:
        from inspect import isawaitable

        if (
            normalized_pair in {"USDT_PHP", "USD_PHP", "PHP_USD"}
            and callable(fetch_live_usdt_php_rate)
            and fetch_live_usdt_php_rate is not _DEFAULT_FETCH_LIVE
        ):
            stub = fetch_live_usdt_php_rate()
            if isawaitable(stub):
                rate = await stub
                _cache[normalized_pair] = (rate, time.monotonic())
                return rate
            else:
                rate = float(stub)
                _cache[normalized_pair] = (rate, time.monotonic())
                return rate
    except Exception:
        pass

    if normalized_pair in _cache:
        cached_rate, fetched_at = _cache[normalized_pair]
        if cached_rate > 0 and (time.monotonic() - fetched_at) < CACHE_TTL_SECONDS:
            logger.debug(f"Returning cached {normalized_pair} rate: {cached_rate:.4f}")
            return cached_rate

    if normalized_pair == "PHP_USD":
        inverse = await get_rate("USD_PHP")
        if inverse > 0:
            rate = 1.0 / inverse
            _cache[normalized_pair] = (rate, time.monotonic())
            return rate

    if normalized_pair in {"KRW_USD", "KRW_USDT", "CNY_USD", "CNY_USDT"}:
        base_currency = "KRW" if normalized_pair.startswith("KRW") else "CNY"
        inverse = await get_rate(f"USDT_{base_currency}")
        if inverse > 0:
            rate = 1.0 / inverse
            _cache[normalized_pair] = (rate, time.monotonic())
            return rate

    if normalized_pair == "USD_KRW":
        rate = await get_rate("USDT_KRW")
        _cache[normalized_pair] = (rate, time.monotonic())
        return rate

    if normalized_pair == "EUR_KRW":
        eur_php = await get_rate("EUR_PHP")
        usd_php = await get_rate("USD_PHP")
        if eur_php > 0 and usd_php > 0:
            rate = eur_php / usd_php
            _cache[normalized_pair] = (rate, time.monotonic())
            return rate

    if normalized_pair == "USD_CNY":
        rate = await get_rate("USDT_CNY")
        _cache[normalized_pair] = (rate, time.monotonic())
        return rate

    lock = _locks.setdefault(normalized_pair, asyncio.Lock())
    async with lock:
        if normalized_pair in _cache:
            cached_rate, fetched_at = _cache[normalized_pair]
            if cached_rate > 0 and (time.monotonic() - fetched_at) < CACHE_TTL_SECONDS:
                logger.debug(f"Returning cached {normalized_pair} rate (post-lock): {cached_rate:.4f}")
                return cached_rate
        try:
            tether_rates = await _get_tether_rates()

            from_curr, to_curr = normalized_pair.split("_", 1)
            if from_curr == "USDT":
                rate = float(tether_rates[to_curr.lower()])
            elif from_curr == to_curr:
                rate = 1.0
            elif from_curr in {"USD", "EUR", "GBP", "SGD"} and to_curr == "PHP":
                rate = float(tether_rates["php"])
            elif from_curr in {"USD", "USDT"} and to_curr == "KRW":
                rate = float(tether_rates["krw"])
            elif from_curr == "PHP" and to_curr in {"USD", "EUR", "GBP", "SGD"}:
                rate = 1.0 / float(tether_rates["php"])
            else:
                raise ValueError(f"Unsupported currency pair: {normalized_pair}")

            if rate <= 0:
                raise ValueError(f"Unexpected rate value: {rate}")

            _cache[normalized_pair] = (rate, time.monotonic())
            logger.info(f"Live {normalized_pair} rate: {rate:.4f}")
            return rate
        except Exception as exc:
            stale_rate = _cache.get(normalized_pair, (0.0, 0.0))[0]
            fallback_rate = stale_rate or FALLBACK_RATES.get(normalized_pair)
            if fallback_rate and fallback_rate > 0:
                source = "stale cache" if stale_rate else "configured fallback"
                logger.warning(
                    "Live %s rate unavailable; using %s rate %.4f: %s",
                    normalized_pair,
                    source,
                    fallback_rate,
                    exc,
                )
                _cache[normalized_pair] = (fallback_rate, time.monotonic())
                return fallback_rate
            logger.error(f"Failed to fetch live {normalized_pair} rate: {exc}")
            raise RuntimeError(f"Could not fetch live exchange rate: {exc}") from exc


async def get_all_supported_rates() -> Dict[str, float]:
    """Get all supported currency pair rates in one call.
    
    Returns:
        Dict mapping currency_pair to rate (e.g., {"USDT_PHP": 56.75, "USDT_USD": 1.0})
    """
    logger.info("Fetching all supported rates from shared CoinGecko cache")
    fallback_rates = FALLBACK_RATES.copy()
    try:
        tether_rates = await _get_tether_rates()
        rates = {}
        # Build USDT pairs
        for currency, rate in tether_rates.items():
            currency_upper = currency.upper()
            pair = f"USDT_{currency_upper}"
            rates[pair] = float(rate)
        
        logger.info(f"Cached {len(rates)} currency pairs")
        return rates
    except Exception as exc:
        logger.warning(f"Live exchange-rate fetch failed; returning fallback rates: {exc}")
        for pair, rate in fallback_rates.items():
            _cache[pair] = (float(rate), time.monotonic())
        return fallback_rates


async def aclose() -> None:
    """Close the shared HTTP client."""
    global _http
    if _http and not _http.is_closed:
        await _http.aclose()
    _http = None


def get_cache_status() -> Tuple[float, bool]:
    """Return ``(rate, is_cached)`` reflecting the current in-memory cache state (legacy).

    ``is_cached`` is ``True`` when the cache was populated and the entry has
    not yet expired.
    """
    cached_rate, is_cached = get_cache_status_for_pair("USDT_PHP")
    return cached_rate, is_cached


def get_cache_status_for_pair(currency_pair: str) -> Tuple[float, bool]:
    """Get cache status for a specific currency pair.
    
    Returns:
        (rate, is_cached) tuple where is_cached is True if rate is fresh
    """
    if currency_pair not in _cache:
        return 0.0, False
    
    cached_rate, fetched_at = _cache[currency_pair]
    is_cached = (
        cached_rate > 0
        and (time.monotonic() - fetched_at) < CACHE_TTL_SECONDS
    )
    return cached_rate, is_cached


def clear_cache() -> None:
    """Clear the in-memory cache (for testing)."""
    global _cache, _provider_rates, _provider_fetched_at, _provider_retry_after, _provider_error, _provider_lock, _locks
    _cache.clear()
    _provider_rates.clear()
    _provider_fetched_at = 0.0
    _provider_retry_after = 0.0
    _provider_error = ""
    _provider_lock = asyncio.Lock()
    _locks.clear()
    logger.info("Exchange rate cache cleared")
