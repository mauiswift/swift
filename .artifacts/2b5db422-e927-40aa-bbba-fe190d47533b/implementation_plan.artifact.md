# Implementation Plan - Fix Magpie Alipay & WeChat Pay Integration

Refactor the Magpie service and router to use the supported `v1/requests` API for Alipay and WeChat Pay, fixing the current placeholder implementation and enabling proper QR and App payments.

## User Review Required

> [!IMPORTANT]
> - **API Shift**: I am moving from internal placeholder endpoints (`/qr/alipay`) to the official Magpie Payment Requests API (`v1/requests`).
> - **Amount Format**: Magpie uses integers for amounts (e.g., 10000 = ₱100.00). I will add automatic conversion.
> - **Redirect Flow**: The "App Payments" fix involves using the `payment_url` from Magpie, which handles deep-linking to wallet apps automatically.

## Proposed Changes

### [MODIFY] [magpie_qr_service.py](file:///C:/Users/DELL/Desktop/swift/backend/services/magpie_qr_service.py)
- **Base URL**: Update to `https://request.magpie.im/api`.
- **Method `create_alipay_qr`**:
    - Convert `amount` to integer cents.
    - Use `POST /v1/requests`.
    - Set `payment_method_types: ["alipay"]`.
- **Method `create_wechat_qr`**:
    - Similar to Alipay but with `["wechat"]`.

### [MODIFY] [magpie_qr.py](file:///C:/Users/DELL/Desktop/swift/backend/routers/magpie_qr.py)
- Update request schemas if necessary (ensure `customer_email` is handled as it might be required for `v1/requests`).
- Map the service response (which now includes `payment_url`) to the internal `QRCodeResponse`.

### [MODIFY] [magpie.py](file:///C:/Users/DELL/Desktop/swift/backend/routers/magpie.py)
- Ensure legacy Magpie endpoints also benefit from the improved service logic if applicable.

## Verification Plan

### Automated Tests
- Create a test script similar to `test_magpie_api.py` but targeting the new `v1/requests` logic.
- Verify that amounts are correctly converted (e.g., 50.50 -> 5050).

### Manual Verification
- **QR Generation**: Create a test Alipay request and ensure the returned `payment_url` shows a valid scannable QR.
- **App Payments**: Open the `payment_url` on a mobile device and verify it prompts to open the Alipay/WeChat app if installed.
