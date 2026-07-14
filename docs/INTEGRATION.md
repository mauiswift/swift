# Integration Guide — SwiftPay API

This guide helps merchant developers integrate with SwiftPay API (QR, payment links, webhooks).

Base URLs
- OpenAPI / Swagger UI: `/api-docs` (e.g. https://swiftpay.site/api-docs)
- OpenAPI JSON: `/openapi.json`

Authentication
- Most API endpoints require Bearer auth. Add header:

  Authorization: Bearer <token>

- API keys can be managed via admin endpoints (`/api/v1/admin/api-keys`) or the dashboard.

Quick curl examples

- Create an invoice (example):

  curl -X POST https://swiftpay.site/api/v1/xend/invoice \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"amount": 1000, "external_id": "order-123", "description": "Order #123"}'

- Create a payment link:

  curl -X POST https://swiftpay.site/api/v1/xend/create-payment-link \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"amount": 250.00, "external_id":"pay-123","description":"Top up"}'

Node (fetch) example

```js
const res = await fetch('https://swiftpay.site/api/v1/xend/create-payment-link', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 250, external_id: 'pay-123' }),
});
const data = await res.json();
```

Python (requests) example

```py
import requests
resp = requests.post('https://swiftpay.site/api/v1/xend/create-payment-link',
    headers={'Authorization': f'Bearer {TOKEN}'}, json={'amount':250,'external_id':'pay-123'})
print(resp.json())
```

Webhooks
- SwiftPay supports webhook callbacks for payment events (e.g. Magpie, swiftpay callbacks). See `/magpie/webhook` in the OpenAPI spec.
- Recommended: configure a secret (e.g. `MAGPIE_WEBHOOK_SECRET`) and verify HMAC-SHA256 of the raw body.

HMAC verification (Python)

```py
import hmac, hashlib
def verify_signature(secret: str, body: bytes, header_signature: str) -> bool:
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, header_signature)
```

Retries & idempotency
- For webhook and async flows, implement idempotent handlers: check external_id or webhook event id to avoid double-processing.
- Use exponential backoff for retrying failed API calls.

CORS & browser integrations
- Backend allows cross-origin requests (CORS enabled) — merchant SPAs can call the API directly if they have a valid token.

Health & runtime info
- `/health` and `/_runtime_env` endpoints expose basic service health and masked runtime settings — useful for monitoring.

Postman & examples
- There is a Postman collection in `docs/postman/Xend_Integration.postman_collection.json` — import it and set the `base_url` and `Authorization` variables.

More
- For full API reference, see `openapi.json` at the repo root or the running app's `/api-docs`.
- If you want SDK snippets (Node/Python) or sample webhook handlers added to this guide, reply and I'll add them.
