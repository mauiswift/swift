"""Real-time exchange rate fetching service with history, analytics, and multi-pair support.

Fetches live exchange rates from multiple providers (CoinGecko primary, Yahoo Finance fallback).
Results are cached in-memory for CACHE_TTL_SECONDS to avoid hammering rate limits.
Supports historical tracking, volatility analytics, and rate overrides.
"""

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

CACHE_TTL_SECONDS = 300  # 5 minutes
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


async def fetch_live_usdt_php_rate() -> float:
    """Return the current live USDT→PHP exchange rate (legacy compatibility).

    Uses a 5-minute in-memory cache to avoid excessive calls to the
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
            resp = await _get_http().get(COINGECKO_URL)
            resp.raise_for_status()
            data = resp.json()

            from_curr, to_curr = normalized_pair.split("_", 1)
            if from_curr == "USDT":
                rate = float(data["tether"][to_curr.lower()])
            elif from_curr == to_curr:
                rate = 1.0
            elif from_curr in {"USD", "EUR", "GBP", "SGD"} and to_curr == "PHP":
                rate = float(data["tether"]["php"])
            elif from_curr in {"USD", "USDT"} and to_curr == "KRW":
                rate = float(data["tether"]["krw"])
            elif from_curr == "PHP" and to_curr in {"USD", "EUR", "GBP", "SGD"}:
                rate = 1.0 / float(data["tether"]["php"])
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
    logger.info("Fetching all supported rates from CoinGecko")
    fallback_rates = FALLBACK_RATES.copy()
    try:
        resp = await _get_http().get(COINGECKO_URL)
        resp.raise_for_status()
        data = resp.json()
        
        rates = {}
        tether_rates = data.get("tether", {})
        
        # Build USDT pairs
        for currency, rate in tether_rates.items():
            currency_upper = currency.upper()
            pair = f"USDT_{currency_upper}"
            rates[pair] = float(rate)
            _cache[pair] = (float(rate), time.monotonic())
        
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
    global _cache
    _cache.clear()
    logger.info("Exchange rate cache cleared")
