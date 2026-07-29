# Walkthrough - Fix NameError in Magpie QR Router

I have resolved the `NameError: name 'settings' is not defined` that was occurring when generating international payment links.

## Changes Made

### [Backend Routers]

#### [magpie_qr.py](file:///C:/Users/DELL/Desktop/swift-main/backend/routers/magpie_qr.py)
- Added explicit `from core.config import settings` imports inside the following functions to ensure `settings` is always available in the function scope:
    - `create_alipay_qr`
    - `create_wechat_qr`
    - `create_dynamic_qr`
    - `create_magpie_checkout_session` (the specific point of failure)

This change makes the code more robust against potential scope-related issues or shadowed globals in the execution environment.

## Verification Results

### Automated Verification
- Verified that `settings` is now imported in all endpoints that use it.
- Confirmed with `grep` that the imports are correctly placed.

### Manual Verification Required
- Please restart the backend server to apply the changes.
- Attempt to generate an "International Payment Link" again from the dashboard.
- The red error message "name 'settings' is not defined" should no longer appear.

render_diffs(file:///C:/Users/DELL/Desktop/swift-main/backend/routers/magpie_qr.py)
