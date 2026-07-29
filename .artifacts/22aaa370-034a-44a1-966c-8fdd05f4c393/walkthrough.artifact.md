# Walkthrough - Magpie Payment Fixes (Domain & Path Correction)

I have applied the final set of fixes to ensure Magpie.im checkout sessions are created successfully, addressing both the `404 Not Found` and `NameError` issues.

## Changes Made

### 1. Fix NameError in Magpie QR Router
#### [magpie_qr.py](file:///C:/Users/DELL/Desktop/swift-main/backend/routers/magpie_qr.py)
- Added explicit `from core.config import settings` imports inside all payment-generating functions.
- This ensures `settings` is always in scope, regardless of how the router is imported or executed.

### 2. Domain & Path Correction for Checkout Sessions
#### [magpie_services.py](file:///C:/Users/DELL/Desktop/swift-main/backend/services/magpie_services.py)
- **Automatic Domain Fallback**: Added logic to automatically switch from `api.magpie.im` to **`pay.magpie.im`** when creating a checkout session. `pay.magpie.im` is the dedicated domain for hosted sessions.
- **Path Correction**: Fixed the session creation endpoint to use `/v2/sessions` (the correct native Magpie V2 path).

#### [magpie_qr_service.py](file:///C:/Users/DELL/Desktop/swift-main/backend/services/magpie_qr_service.py)
- Updated the default base URL to `https://pay.magpie.im` for consistency.
- Added the same automatic domain fallback logic for any requests targeting session endpoints.
- Synchronized the endpoint path to `/v2/sessions`.

## Verification Results

### Automated Verification
- Verified that the code correctly detects `api.magpie.im` in the base URL and replaces it with `pay.magpie.im` for session-related POST requests.
- Confirmed that `/v2/sessions` is now used globally for session creation.

### Manual Verification Required
- Please restart the backend server.
- Attempt to generate an **International Payment Link**.
- Check the logs; you should see an info message: `Overriding Magpie base URL for sessions: https://api.magpie.im -> https://pay.magpie.im`.
- The checkout link should now be generated successfully.

render_diffs(file:///C:/Users/DELL/Desktop/swift-main/backend/routers/magpie_qr.py)
render_diffs(file:///C:/Users/DELL/Desktop/swift-main/backend/services/magpie_services.py)
render_diffs(file:///C:/Users/DELL/Desktop/swift-main/backend/services/magpie_qr_service.py)
