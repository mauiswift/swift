# Implementation Plan - Admin API Key Management

The goal is to allow "Main Admins" (Super Admins) to reset or regenerate API Secret Keys for merchants. This ensures that if a key is compromised or needs rotation, an administrator can intervene.

## Proposed Changes

### Backend - API Enhancements

#### [MODIFY] [merchant_api.py](file:///C:/Users/DELL/Desktop/swift-main/backend/routers/merchant_api.py)
- Add a helper function or import to check for Super Admin status.
- Add `POST /api/v1/merchant/api-config/{org_id}/generate-secret`:
    - Allows a Super Admin to regenerate a secret key for a specific organization.
- Add `POST /api/v1/merchant/api-config/{org_id}/reset-secret`:
    - Allows a Super Admin to clear (nullify) a secret key for a specific organization, forcing the merchant to generate a new one.

### Frontend - UI Enhancements

#### [MODIFY] [ApiIntegration.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/pages/settings/ApiIntegration.tsx)
- Detect if the current user `isSuperAdmin`.
- If the user is a Super Admin and a secret key is already present:
    - Add a "Reset Key" button next to the "Regenerate" icon.
    - The "Reset Key" button will call the new `reset-secret` endpoint and clear the UI state for that key.
- Add a confirmation dialog for the "Reset" action as it is destructive.

## Verification Plan

### Automated Tests
- Test the new admin endpoints with a Super Admin token and verify they can modify another organization's config.
- Verify that a regular merchant token gets a `403 Forbidden` when trying to access the `{org_id}` prefixed endpoints.

### Manual Verification
- Log in as a Super Admin.
- Navigate to a merchant's API & Integration page (or use the current one if testing on self).
- Verify that "Reset Key" appears next to existing secret keys.
- Click "Reset Key" and confirm. Verify the key disappears and the "Generate API Secret key" button returns.
