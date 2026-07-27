# Magpie.im QR Code API Documentation

## Overview

The Magpie QR service provides dynamic QR code generation for **Alipay** and **WeChat Pay** payments. It includes built-in **currency conversion** support (PHP ↔ CNY, USD, EUR) and automatic transaction recording.

## Features

✅ **Alipay QR Generation** - Create scannable Alipay QR codes with automatic PHP→CNY conversion
✅ **WeChat Pay QR Generation** - Create WeChat Pay QR codes optimized for Chinese customers
✅ **Currency Conversion** - Real-time conversion between PHP, CNY, USD, EUR
✅ **Auto-Reference IDs** - Unique reference generation or use your own
✅ **Transaction Tracking** - Automatic logging of all QR generation requests
✅ **Exchange Rates API** - View current exchange rates for all supported currencies

---

## Installation & Setup

### 1. Environment Variables

Add to your `.env` file or Railway environment:

```bash
# Required
MAGPIE_API_KEY=your_api_key_here
MAGPIE_BASE_URL=https://api.magpie.im  # Optional, defaults to Magpie production

# Optional
MAGPIE_CIRCUIT_THRESHOLD=5              # Circuit breaker failure threshold
MAGPIE_CIRCUIT_COOLDOWN_SECONDS=60      # Circuit breaker cooldown duration
```

### 2. Register Router

Add to your FastAPI main application (`backend/main.py`):

```python
from routers.magpie_qr import router as magpie_qr_router

app.include_router(magpie_qr_router)
```

### 3. Verify Configuration

Check the health endpoint:

```bash
curl -X GET http://localhost:8000/api/v1/magpie/qr/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## API Endpoints

### Base URL
```
/api/v1/magpie/qr
```

### Authentication
All endpoints require:
- **Header**: `Authorization: Bearer <token>`
- **Scope**: `payments:write` (for creation) or `payments:read` (for queries)

---

## 1. Create Alipay QR Code

**POST** `/api/v1/magpie/qr/alipay`

Generate a scannable QR code for Alipay payments. Automatically converts PHP to CNY.

### Request

```json
{
  "amount": 500,
  "description": "Product payment",
  "currency": "PHP",
  "reference_id": "ORD-2024-001",
  "customer_name": "John Doe",
  "customer_email": "john@example.com"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount` | float | ✅ | Payment amount (must be > 0) |
| `description` | string | ❌ | Payment description (default: "Alipay Payment") |
| `currency` | string | ❌ | Currency code: PHP, CNY, USD, EUR (default: PHP) |
| `reference_id` | string | ❌ | Your unique reference ID (auto-generated if omitted) |
| `customer_name` | string | ❌ | Customer name |
| `customer_email` | string | ❌ | Customer email |

### Response (Success)

```json
{
  "success": true,
  "payment_method": "alipay",
  "qr_code": "base64_encoded_image",
  "qr_url": "https://swiftpay.site/qr/...",
  "qr_content": "00020101051...",
  "reference_id": "alipay-abc123def456",
  "amount": 6.85,
  "currency": "CNY",
  "original_amount": 500,
  "original_currency": "PHP",
  "checkout_url": "https://checkout.magpie.im/...",
  "expires_at": "2026-07-15T11:37:01Z"
}
```

### Response (Error)

```json
{
  "success": false,
  "error": "Magpie API is not configured. Please set MAGPIE_API_KEY in environment variables."
}
```

### Example

```bash
curl -X POST http://localhost:8000/api/v1/magpie/qr/alipay \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "description": "Monthly subscription",
    "currency": "PHP",
    "customer_name": "John Doe"
  }'
```

---

## 2. Create WeChat Pay QR Code

**POST** `/api/v1/magpie/qr/wechat`

Generate a scannable QR code for WeChat Pay. Automatically converts PHP to CNY.

### Request

```json
{
  "amount": 1000,
  "description": "Service payment",
  "currency": "PHP",
  "reference_id": "PAY-2024-789",
  "customer_name": "Jane Smith"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount` | float | ✅ | Payment amount (must be > 0) |
| `description` | string | ❌ | Payment description (default: "WeChat Payment") |
| `currency` | string | ❌ | Currency code: PHP, CNY, USD, EUR (default: PHP) |
| `reference_id` | string | ❌ | Your unique reference ID (auto-generated if omitted) |
| `customer_name` | string | ❌ | Customer name |
| `customer_email` | string | ❌ | Customer email |

### Response (Success)

```json
{
  "success": true,
  "payment_method": "wechat",
  "qr_code": "base64_encoded_image",
  "qr_url": "https://swiftpay.site/qr/...",
  "qr_content": "00020101051...",
  "reference_id": "wechat-xyz789abc123",
  "amount": 13.70,
  "currency": "CNY",
  "original_amount": 1000,
  "original_currency": "PHP",
  "checkout_url": "https://checkout.magpie.im/...",
  "expires_at": "2026-07-15T11:37:01Z"
}
```

### Example

```bash
curl -X POST http://localhost:8000/api/v1/magpie/qr/wechat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "description": "Consultation fee",
    "currency": "PHP"
  }'
```

---

## 3. Create Dynamic QR Code

**POST** `/api/v1/magpie/qr/dynamic`

Create a QR code for either Alipay or WeChat. Automatically selects the best currency.

### Request

```json
{
  "payment_method": "alipay",
  "amount": 750,
  "description": "Order #12345",
  "currency": "PHP"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `payment_method` | string | ✅ | "alipay" or "wechat" |
| `amount` | float | ✅ | Payment amount (must be > 0) |
| `description` | string | ❌ | Payment description |
| `currency` | string | ❌ | Currency code (auto-selected to CNY if omitted) |
| `reference_id` | string | ❌ | Your unique reference ID (auto-generated if omitted) |
| `customer_name` | string | ❌ | Customer name |
| `customer_email` | string | ❌ | Customer email |

### Response

Same as Alipay or WeChat endpoints depending on `payment_method`.

### Example

```bash
curl -X POST http://localhost:8000/api/v1/magpie/qr/dynamic \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "wechat",
    "amount": 2500,
    "description": "Restaurant reservation",
    "currency": "PHP"
  }'
```

---

## 4. Currency Conversion

**POST** `/api/v1/magpie/qr/convert`

Convert amounts between supported currencies.

### Request

```json
{
  "amount": 500,
  "from_currency": "PHP",
  "to_currency": "CNY"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount` | float | ✅ | Amount to convert (must be > 0) |
| `from_currency` | string | ✅ | Source currency: PHP, CNY, USD, EUR |
| `to_currency` | string | ✅ | Target currency: PHP, CNY, USD, EUR |

### Response (Success)

```json
{
  "success": true,
  "amount": 500,
  "from_currency": "PHP",
  "to_currency": "CNY",
  "converted_amount": 6.85,
  "rate": 0.0137
}
```

### Response (Error)

```json
{
  "success": false,
  "amount": 500,
  "from_currency": "PHP",
  "to_currency": "CNY",
  "converted_amount": 0,
  "rate": 0,
  "error": "Currency conversion error"
}
```

### Examples

```bash
# PHP to CNY
curl -X POST http://localhost:8000/api/v1/magpie/qr/convert \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "from_currency": "PHP",
    "to_currency": "CNY"
  }'

# USD to EUR
curl -X POST http://localhost:8000/api/v1/magpie/qr/convert \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "from_currency": "USD",
    "to_currency": "EUR"
  }'
```

---

## 5. Get Exchange Rates

**GET** `/api/v1/magpie/qr/exchange-rates`

Retrieve current exchange rates for all supported currencies.

### Response

```json
{
  "success": true,
  "base_currency": "PHP",
  "rates": {
    "PHP": 1.0,
    "CNY": 0.0137,
    "USD": 0.0184,
    "EUR": 0.0170
  },
  "alipay_currencies": ["CNY", "USD", "EUR", "PHP"],
  "wechat_currencies": ["CNY"],
  "note": "Rates are approximate and for reference only. Use /convert endpoint for accurate conversions."
}
```

### Example

```bash
curl -X GET http://localhost:8000/api/v1/magpie/qr/exchange-rates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 6. Health Check

**GET** `/api/v1/magpie/qr/health`

Check if the Magpie QR service is configured and ready.

### Response (Configured)

```json
{
  "success": true,
  "service": "magpie-qr",
  "configured": true,
  "base_url": "https://api.magpie.im",
  "message": "Magpie QR service is ready"
}
```

### Response (Not Configured)

```json
{
  "success": true,
  "service": "magpie-qr",
  "configured": false,
  "base_url": null,
  "message": "Magpie API key not configured. Set MAGPIE_API_KEY environment variable."
}
```

### Example

```bash
curl -X GET http://localhost:8000/api/v1/magpie/qr/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Currency Support

### Supported Currencies

| Code | Currency | PHP Conversion | Alipay | WeChat |
|------|----------|----------------|--------|--------|
| PHP | Philippine Peso | 1.0 | ✅ | ❌ |
| CNY | Chinese Yuan | 0.0137 | ✅ | ✅ |
| USD | US Dollar | 0.0184 | ✅ | ❌ |
| EUR | Euro | 0.0170 | ✅ | ❌ |

### Automatic Currency Selection

- **Alipay**: Converts to CNY if not already CNY
- **WeChat Pay**: Converts to CNY (required)
- **Dynamic**: Automatically selects CNY for both methods

---

## Error Handling

### Common Errors

#### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```
**Solution**: Provide valid `Authorization` header with bearer token.

#### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```
**Solution**: Ensure your user has `payments:write` or `payments:read` permission.

#### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "amount"],
      "msg": "ensure this value is greater than 0",
      "type": "value_error.number.not_gt"
    }
  ]
}
```
**Solution**: Check your request payload against the schema.

#### 500 Magpie API Not Configured
```json
{
  "success": false,
  "error": "Magpie API is not configured. Please set MAGPIE_API_KEY in environment variables."
}
```
**Solution**: Set the `MAGPIE_API_KEY` environment variable.

---

## Usage Examples

### JavaScript/TypeScript (Frontend)

```typescript
async function createAlipayQR(amount: number, description: string) {
  const response = await fetch('/api/v1/magpie/qr/alipay', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      amount,
      description,
      currency: 'PHP',
      customer_name: 'John Doe',
    }),
  });

  const data = await response.json();
  
  if (data.success) {
    // Display QR code
    displayQR(data.qr_url);
  } else {
    console.error('Error:', data.error);
  }
}
```

### Python (Backend)

```python
import httpx
import asyncio

async def create_wechat_qr(amount: float, token: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            'http://localhost:8000/api/v1/magpie/qr/wechat',
            json={
                'amount': amount,
                'description': 'Purchase',
                'currency': 'PHP',
            },
            headers={
                'Authorization': f'Bearer {token}',
            },
        )
        return response.json()

# Usage
result = asyncio.run(create_wechat_qr(1000, 'your_token'))
print(result)
```

### cURL

```bash
# Create Alipay QR
curl -X POST http://localhost:8000/api/v1/magpie/qr/alipay \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "description": "Purchase",
    "currency": "PHP"
  }' | jq .

# Convert currency
curl -X POST http://localhost:8000/api/v1/magpie/qr/convert \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "from_currency": "PHP",
    "to_currency": "CNY"
  }' | jq .

# Get exchange rates
curl -X GET http://localhost:8000/api/v1/magpie/qr/exchange-rates \
  -H "Authorization: Bearer YOUR_TOKEN" | jq .
```

---

## Transaction Recording

All successful QR code generation requests are automatically recorded in the database as transactions:

- **transaction_type**: `alipay_qr` or `wechat_qr`
- **status**: `pending` (awaiting payment confirmation)
- **amount**: Original amount in source currency
- **currency**: Source currency code
- **qr_code_url**: URL to the generated QR code
- **reference_id**: Unique reference for tracking

You can query these transactions via the standard transaction endpoints.

---

## Rate Limits & Quotas

- No per-endpoint rate limits (depends on Magpie.im API limits)
- Each QR code is valid for **24 hours** by default
- Expired QR codes cannot be used for payment

---

## Troubleshooting

### QR Code Not Generated

**Check 1**: Verify Magpie API is configured
```bash
curl http://localhost:8000/api/v1/magpie/qr/health
```

**Check 2**: Verify API key is correct
```bash
echo $MAGPIE_API_KEY
```

**Check 3**: Check logs for errors
```bash
# Railway logs
railway logs
```

### Currency Conversion Seems Wrong

- Exchange rates are hardcoded approximations
- For production, integrate a real-time exchange rate API
- Update `CurrencyConverter.EXCHANGE_RATES` in `magpie_qr_service.py`

### WeChat QR Not Working for PHP Amounts

- WeChat Pay only supports CNY
- The service automatically converts PHP → CNY
- If conversion fails, check exchange rates are configured

---

## Support & Issues

For issues related to:
- **Magpie.im API**: Contact Magpie support
- **SwiftPay Integration**: Open an issue on the repository
- **Currency Conversion**: Review `backend/services/magpie_qr_service.py`

---

## Migration from PhotonPay

If migrating from the old PhotonPay service:

**Old Endpoint**:
```
POST /api/v1/photonpay/alipay-session
```

**New Endpoint**:
```
POST /api/v1/magpie/qr/alipay
```

**Changes**:
- Request/response format updated
- Auto-generated reference IDs format changed (`alipay-xxx` instead of PhotonPay format)
- Currency support expanded (PHP, CNY, USD, EUR)
- Automatic transaction recording added

---

## Related Documentation

- [Magpie.im API Docs](https://docs.magpie.im)
- [Currency Converter Implementation](./magpie_qr_service.py)
- [Transaction Recording](./routers/magpie_qr.py)
