Postman collection

Import `Xend_Integration.postman_collection.json` (in this folder) into Postman. Set the `base_url` environment variable to your deployment (e.g. `https://swiftpay.site`) and add an `Authorization` environment variable with `Bearer <token>`.

The collection contains example requests for:
- creating invoices and payment links
- listing payment methods
- simulating webhooks
