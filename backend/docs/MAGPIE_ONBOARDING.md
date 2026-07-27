MAGPIE (legacy) — RETIRED

This document has been archived because Magpie integration was removed.

This document lists the steps and artifacts required to request Magpie to whitelist your platform and enable production access.

1. Provide the following information to Magpie support:
   - Platform name and contact person (email + phone).
   - Production callback URLs:
     - Webhook endpoint: https://swiftpay.site/api/v1/magpie/webhook
     - Checkout return URL(s): https://swiftpay.site/magpie-success and https://swiftpay.site/magpie-cancel
   - Public IPs (if applicable): list of outbound IPs used by your platform for webhooks and API calls.
   - Expected volume: estimated transactions per day and peak TPS.
   - Business details: legal name, incorporation, and payment settlement details.

2. Technical checklist (to be completed before requesting whitelisting):
   - API credentials: ensure `MAGPIE_API_KEY` is provisioned and stored in `backend/.env`.
   - Webhook verification: `MAGPIE_WEBHOOK_SECRET` must be configured and the endpoint must verify HMAC-SHA256 signatures.
   - HTTPS: public endpoints must be reachable via HTTPS and have valid certs.
   - Idempotency: API calls that create payments should include an `Idempotency-Key` header.
   - Error handling & retries: transient 5xx errors should be retried with exponential backoff.
   - Monitoring: enable logging around Magpie requests and errors; send alerts on repeated 5xx or timeouts.

3. Sample payloads and headers to include in the request to Magpie support:
   - Example create QR payload: {"amount":111.0, "description":"magpie payment", "external_id":"xend-qr-...", "payment_methods":["qrph"]}
   - Example Checkout Session payload: {"amount":500.0, "currency":"php", "payment_methods":["visa", "mastercard"], "line_items":[{"name":"Product A", "amount":50000, "quantity":1}]}
   - Example webhook signature header: `X-Magpie-Signature: <hexdigest>` (HMAC-SHA256 of raw body using `MAGPIE_WEBHOOK_SECRET`).

4. Developer Integration Guide:
   - **Service Layer**: All Magpie interactions are encapsulated in `backend/services/magpie_service.py`.
   - **Checkout Sessions**: Use `MagpieService.create_session()`. It handles:
     - Automatic amount calculation from `line_items` (values in cents).
     - Fallback to legacy checkout if the Sessions API is unavailable.
     - Response normalization for consistent UI handling.
   - **Webhook Verification**: HMAC signature verification is implemented in `backend/routers/magpie_webhook.py`.

5. Contact template (email to Magpie support):

Subject: Request to whitelist platform: <your-platform-name>

Body:
- See attached technical checklist and sample webhook/callback URLs.
- We will use the following production webhook URL: https://swiftpay.site/api/v1/magpie/webhook
- Please whitelist our platform and provide production API credentials.

Attachments:
- Technical checklist (this file)
- Example webhook payloads and sample signing secret verification code snippet (HMAC-SHA256)

5. After Magpie confirms whitelisting:
   - Replace `MAGPIE_API_KEY` with the production key in environment.
   - Update `MAGPIE_BASE_URL` if Magpie provides a different API base.
   - Configure `MAGPIE_WEBHOOK_SECRET` and verify webhooks in staging before production.

6. Support
- If Magpie requests any additional headers or verification method, add them to `backend/services/magpie_service.py` and `backend/routers/magpie_webhook.py` accordingly.
