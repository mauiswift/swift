# SwiftPay API Postman Collection

The collection is for API exploration and integration testing. Production payment
callbacks still require the normal super-admin approval workflow before merchant
settlement.

Import `Xend_Integration.postman_collection.json` (in this folder) into Postman. Set `base_url` to your deployment (e.g. `https://swiftpay.site`) and `jwt_token` to a valid integration token. The same collection can be downloaded from `/downloads/swiftpay-postman.json`.

The collection contains example requests for:
- creating invoices and payment links
- listing payment methods
- simulating webhooks

For Korea production, use the deployed API host configured for that environment and
never commit live API keys or customer data to the collection.
