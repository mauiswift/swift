# Implementation Plan - Branded Self-Hosted Payment Links & Fixes

I have implemented branded, self-hosted payment links and fixed the logo upload issue.

## Proposed Changes

### Backend

#### [MODIFY] [payments.py](file:///C:/Users/DELL/Desktop/swift-main/backend/routers/payments.py)
- Merged duplicate router definitions into a single object.
- Updated `get_checkout_payment` to fetch and return the `merchant_logo_url` and `merchant_name` from the `MerchantApiConfig` and `AdminUser` tables.

#### [MODIFY] [merchant_api.py](file:///C:/Users/DELL/Desktop/swift-main/backend/routers/merchant_api.py)
- Fixed missing `logging` import that was causing a `NameError` and preventing the router from being registered (causing the 405 Method Not Allowed error on upload).

### Frontend

#### [MODIFY] [Checkout.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/pages/Checkout.tsx)
- Refactored the UI to include a branded header showing the merchant logo and name.
- Modernized the layout to look more professional and trustworthy.

#### [MODIFY] [CreatePaymentLink.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/pages/paylink/CreatePaymentLink.tsx)
- Updated the generated `paymentUrl` to use the local `/checkout/${reference_no}` path, creating short, branded links.

## Verification Plan

### Manual Verification
1. **Logo Upload**: Navigate to "Settings" -> "Store Profile" and upload a logo. Verify it no longer returns a 405 error and the logo appears.
2. **Short Links**: Create a new Payment Link. Verify the link is now a local URL (e.g., `swiftpay.ph/checkout/...`).
3. **Checkout Branding**: Open the generated link. Verify the checkout page shows the uploaded logo and merchant name.
