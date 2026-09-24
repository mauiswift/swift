# KRW Payments - Quick Reference Guide

## Setup (5 minutes)

### 1. Set Environment Variables

```bash
# Add to .env
SWIFTPAY_ACCESS_KEY=your_access_key
SWIFTPAY_SECRET_KEY=your_secret_key
SWIFTPAY_MODE=sandbox
SWIFTPAY_BASE_URL=https://api.pay.sandbox.live.swiftpay.ph
```

### 2. Restart Application

```bash
# The router is auto-discovered; no manual registration needed
bash start_app_v2.sh
```

### 3. Verify Setup

```bash
# Check if endpoints are available
curl http://localhost:8000/api/v1/krw/banks
```

---

## Quick API Reference

### Payment Link

```bash
# Create payment link
curl -X POST http://localhost:8000/api/v1/krw/payment-links \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "reference_no": "order-123",
    "description": "Payment for goods"
  }'

# Response
{
  "success": true,
  "payment_link": "https://pay.live.swiftpay.ph/checkout/abc123",
  "reference_no": "order-123",
  "amount": 50000,
  "currency": "KRW",
  "status": "pending"
}
```

### Disbursement

```bash
# Create disbursement
curl -X POST http://localhost:8000/api/v1/krw/disbursements \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "reference_no": "payout-456",
    "bank_info": {
      "bank_code": "004",
      "bank_name": "KB Kookmin",
      "account_number": "12345678901",
      "account_name": "Kim Park"
    }
  }'

# Response
{
  "success": true,
  "disbursement_id": 456,
  "reference_no": "payout-456",
  "amount": 50000,
  "currency": "KRW",
  "status": "processing"
}

# Check status
curl -X GET http://localhost:8000/api/v1/krw/disbursements/456 \
  -H "Authorization: Bearer <token>"
```

### Bank Info

```bash
# List supported banks
curl http://localhost:8000/api/v1/krw/banks

# Response
{
  "success": true,
  "banks": [
    {"code": "004", "name": "KB Kookmin", "swift": "KKBKKRSE"},
    {"code": "011", "name": "NH Nonghyup", "swift": "NHMAKRSE"},
    ...
  ],
  "total": 23
}

# Validate bank account
curl -X POST http://localhost:8000/api/v1/krw/validate-bank-account \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bank_code": "004",
    "account_number": "12345678901"
  }'
```

---

## Bank Codes (23 Supported)

| Code | Name | Code | Name |
|------|------|------|------|
| 004 | KB Kookmin | 023 | SC First |
| 011 | NH Nonghyup | 027 | KEB Hana |
| 020 | Woori | 032 | Busan |
| 040 | Shinhan | 034 | Gwangju |
| 050 | Jeju | 037 | Jeonbuk |
| 071 | Post Office | 039 | Jeongbuk |
| 081 | Hanabank | 035 | Jeju |
| 088 | National | 089 | Bank of Korea |
| 090 | Nonghyup | ... | Plus 6 more |

---

## Python Examples

### Using the Service

```python
from services.krw_payment_service import (
    KRWPaymentService,
    KRWPaymentLinkRequest,
    KRWDisbursementRequest,
    KRWBankInfo,
)

# Initialize service
service = KRWPaymentService()
print(f"Configured: {service.is_configured}")

# Create payment link
request = KRWPaymentLinkRequest(
    amount=50000,
    reference_no="order-123",
    description="Test payment"
)
response = await service.create_payment_link(request, "user123")
print(f"Payment Link: {response.payment_link}")

# Create disbursement
bank_info = KRWBankInfo(
    bank_code="004",
    bank_name="KB Kookmin",
    account_number="12345678901",
    account_name="Kim Park"
)
disburse_request = KRWDisbursementRequest(
    amount=50000,
    reference_no="payout-456",
    bank_info=bank_info
)
disburse_response = await service.create_disbursement(
    disburse_request, "user123", db
)
print(f"Disbursement Status: {disburse_response.status}")

# Validate bank account
result = await service.validate_bank_account("004", "12345678901")
print(f"Valid: {result['valid']}, Bank: {result['bank_name']}")
```

---

## Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| UNCONFIGURED | 500 | API not configured |
| UNAUTHORIZED | 401 | Auth failed |
| INSUFFICIENT_BALANCE | 402 | Insufficient KRW |
| INVALID_AMOUNT | 400 | Amount out of range |
| INVALID_BANK | 400 | Unknown bank |
| INVALID_ACCOUNT | 400 | Bad account format |
| API_ERROR | 500+ | SwiftPay error |
| TIMEOUT | 504 | Request timeout |
| INTERNAL_ERROR | 500 | Server error |

---

## Testing

```bash
# Run all KRW payment tests
cd backend
python -m pytest tests/test_krw_payments.py -v

# Run specific test
python -m pytest tests/test_krw_payments.py::TestKRWBankInfo::test_valid_bank_info -v

# Run with coverage
python -m pytest tests/test_krw_payments.py --cov=services.krw_payment_service --cov=routers.krw_payments
```

---

## Limits & Constraints

| Constraint | Value |
|------------|-------|
| Min Amount | ₩1,000 |
| Max Amount | ₩100,000,000 |
| Account Digits | 10-20 |
| Expiry Days | 1-90 |
| API Timeout | 30 seconds |
| Supported Banks | 23 |

---

## Files Location

| File | Path |
|------|------|
| Service | `/backend/services/krw_payment_service.py` |
| Router | `/backend/routers/krw_payments.py` |
| Tests | `/backend/tests/test_krw_payments.py` |
| Docs | `/backend/KRW_PAYMENTS_IMPLEMENTATION.md` |
| Summary | `/backend/KRW_PAYMENTS_SUMMARY.md` |

---

## Troubleshooting

**Q: Routes not found?**
```
A: Restart the app. Auto-discovery runs at startup.
Check logs for: "Included router: routers.krw_payments"
```

**Q: "Invalid amount format"?**
```
A: Use exactly 2 decimal places: 50000.00 (not 50000 or 50000.5)
```

**Q: "Unknown bank code"?**
```
A: Check /api/v1/krw/banks for valid codes
Major banks: 004 (KB), 011 (NH), 020 (Woori), 040 (Shinhan)
```

**Q: Insufficient balance error?**
```
A: User needs KRW in their wallet
Check wallet: GET /api/v1/wallets
Top up if needed
```

---

## Common Workflows

### User Receives Payment

```
1. User clicks "Generate Payment Link"
2. Frontend calls POST /api/v1/krw/payment-links
3. SwiftPay payment link created
4. Customer clicks link, makes payment
5. Webhook notifies backend
6. User wallet credited
```

### User Withdraws Funds

```
1. User requests withdrawal
2. Frontend calls POST /api/v1/krw/disbursements
3. System checks wallet balance
4. SwiftPay processes transfer to bank
5. Webhook updates status
6. User notified when complete (1-2 days)
```

---

## API Documentation

- **Swagger UI:** http://localhost:8000/api/v1/docs
- **ReDoc:** http://localhost:8000/api/v1/redoc
- **SwiftPay Docs:** https://api.pay.live.swiftpay.ph/api/api-documentation

Search for `krw` tag to see all KRW endpoints.

---

## Support

- 📖 Full docs: `KRW_PAYMENTS_IMPLEMENTATION.md`
- 🧪 Tests: `tests/test_krw_payments.py`
- 📋 Summary: `KRW_PAYMENTS_SUMMARY.md`
- 🔗 SwiftPay: https://api.pay.live.swiftpay.ph/api/api-documentation

---

**Last Updated:** 2026-09-24
**Version:** 1.0.0
**Status:** Production Ready ✅
