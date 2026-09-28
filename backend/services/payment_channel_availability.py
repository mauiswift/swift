import math
from typing import Any


SWIFTPAY_INSTITUTION_PREFIXES = {
    "BDO": ("BNORPHM",),
    "BPI": ("BOPIPHM",),
    "RCBC": ("RCBCPHM",),
    "UNIONBANK": ("UBPHPHM",),
    "METROBANK": ("MBTCPHM",),
    "LANDBANK": ("TLBPPHM",),
    "PNB": ("PNBMPHM",),
    "EASTWEST": ("EWB CPHM".replace(" ", ""), "EAWRPHM"),
    "CHINABANK": ("CHSVPHM", "CHBKPHM"),
    "SECURITYBANK": ("SETCPHM",),
    "UBP": ("UBPHPHM",),
    "UCPB": ("UCPVPHM",),
    "PSBANK": ("PSB PPHM".replace(" ", ""),),
    "CIMB": ("CIPHPHM",),
    "MAYBANK": ("MBBEPHM",),
    "ROBINSONS": ("ROBPPHM",),
}


def institution_matches_enabled(provider_code: str, enabled_codes: set[str]) -> bool:
    code = str(provider_code or "").strip().upper()
    return code in enabled_codes or any(
        code.startswith(prefix)
        for enabled in enabled_codes
        for prefix in SWIFTPAY_INSTITUTION_PREFIXES.get(enabled, ())
    )


def php_checkout_institution_is_enabled(
    institution_code: str,
    channels: dict[str, dict[str, Any]],
) -> bool:
    code = str(institution_code or "").strip().upper()
    if code == "NETBANK":
        return False
    channel = {
        "GCASH": "gcash",
        "MAYA": "maya",
        "ALIPAY": "alipay",
        "QRPH": "qr_code",
    }.get(code, "bank_transfer")
    php_channels = channels.get("PHP", {})
    if channel not in php_channels.get("checkout", []):
        return False
    if code == "QRPH":
        return True
    enabled_institutions = php_channels.get("checkout_institutions")
    if not isinstance(enabled_institutions, list):
        return False
    return institution_matches_enabled(
        code,
        {str(enabled).strip().upper() for enabled in enabled_institutions},
    )


def institution_supports_amount(institution: dict[str, Any], amount: float) -> bool:
    if not math.isfinite(amount):
        return False

    for field, is_minimum in (("minAmount", True), ("maxAmount", False)):
        value = institution.get(field)
        if value is None:
            continue
        if isinstance(value, bool):
            return False
        try:
            bound = float(value)
        except (TypeError, ValueError):
            return False
        if not math.isfinite(bound):
            return False
        if (is_minimum and amount < bound) or (not is_minimum and amount > bound):
            return False
    return True
