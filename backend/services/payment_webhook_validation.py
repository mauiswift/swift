from decimal import Decimal, InvalidOperation

from fastapi import HTTPException


def payload_value(payload: dict, *keys: str):
    data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    for key in keys:
        for source in (payload, data):
            value = source.get(key)
            if value not in (None, ""):
                return value
    return ""


def validate_payment_amount(payload: dict, transaction, provider: str) -> None:
    raw_amount = payload_value(payload, "x_amount", "amount", "paid_amount", "paidAmount")
    if raw_amount == "":
        raise HTTPException(status_code=400, detail=f"Missing {provider} payment amount")

    try:
        received_amount = Decimal(str(raw_amount).replace(",", "").strip())
        expected_amount = Decimal(str(transaction.amount))
    except (InvalidOperation, TypeError, ValueError):
        raise HTTPException(status_code=400, detail=f"Invalid {provider} payment amount") from None

    if not received_amount.is_finite() or not expected_amount.is_finite():
        raise HTTPException(status_code=400, detail=f"Invalid {provider} payment amount")
    if received_amount.quantize(Decimal("0.01")) != expected_amount.quantize(Decimal("0.01")):
        raise HTTPException(status_code=400, detail=f"{provider} payment amount does not match transaction")

    received_currency = str(
        payload_value(payload, "x_currency", "currency", "currency_code", "currencyCode") or ""
    ).strip().upper()
    expected_currency = str(getattr(transaction, "currency", "") or "").strip().upper()
    if received_currency and expected_currency and received_currency != expected_currency:
        raise HTTPException(status_code=400, detail=f"{provider} payment currency does not match transaction")