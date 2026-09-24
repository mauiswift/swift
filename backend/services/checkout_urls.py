from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from core.config import settings

SUPPORTED_CHECKOUT_CURRENCIES = frozenset({"PHP", "KRW", "CNY", "USDT"})


def checkout_host(currency: str | None = None) -> str:
    """Return the shared public checkout host for every payment currency."""
    configured = getattr(settings, "krw_checkout_host", "") or "https://kr.swiftpay.site"
    host = configured.strip().rstrip("/")
    return host if host.startswith(("http://", "https://")) else f"https://{host}"


def build_checkout_url(reference: str, currency: str | None = None, query: dict[str, str] | None = None) -> str:
    """Build an absolute public checkout URL with an optional query string."""
    url = f"{checkout_host(currency)}/checkout/{reference}"
    if query:
        url = f"{url}?{urlencode(query)}"
    return url


def canonicalize_checkout_url(url: str | None, currency: str | None = None) -> str:
    """Move an internal checkout URL to its currency-specific public host."""
    value = str(url or "").strip()
    if not value:
        return value
    parsed = urlsplit(value)
    if parsed.path.rstrip("/").startswith("/checkout/"):
        query = dict(parse_qsl(parsed.query, keep_blank_values=True))
        return urlunsplit((
            urlsplit(checkout_host(currency)).scheme,
            urlsplit(checkout_host(currency)).netloc,
            parsed.path,
            urlencode(query),
            parsed.fragment,
        ))
    return value
