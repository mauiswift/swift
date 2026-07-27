# Walkthrough - Admin API Key Management

I have implemented the ability for Main Admins (Super Admins) to manage merchant API Secret Keys. This includes both regenerating a new key and resetting (clearing) existing keys to force a fresh generation.

## Changes

### 1. Backend API Enhancements
- **[Merchant API Router](file:///C:/Users/DELL/Desktop/swift-main/backend/routers/merchant_api.py):**
    - Added `POST /api/v1/merchant/api-config/{org_id}/generate-secret`: Allows a Super Admin to directly regenerate a secret key for a specific organization by ID.
    - Added `POST /api/v1/merchant/api-config/{org_id}/reset-secret`: Allows a Super Admin to clear a merchant's secret key. This is useful for security revocations or forcing a merchant to rotate their keys.
    - Both endpoints are strictly guarded by a `is_super_admin` permission check.

### 2. Frontend UI Enhancements
- **[ApiIntegration Page](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/pages/settings/ApiIntegration.tsx):**
    - **Admin Detection:** The page now detects if the logged-in user is a Super Admin.
    - **Reset Action:** If a secret key is present, a "Reset" (trash) icon appears next to the regenerate button for Super Admins.
    - **Safety Confirmation:** Clicking the reset button triggers a confirmation dialog to prevent accidental deletion of production keys.
    - **Dynamic UI Updates:** Once reset, the key is removed from the view, and the "Generate API Secret key" button reappears.

## Verification Results

### Security
- Standard merchants can still only manage their own keys and do not see the "Reset" option.
- API endpoints verify the `is_super_admin` flag in the user's JWT token, returning a `403 Forbidden` if a non-admin attempts to use the `{org_id}` prefixed routes.

### Functionality
- Verified that Super Admins can successfully clear both Test and Live secret keys.
- Verified that regeneration works correctly from the admin context, updating the target organization's configuration.
