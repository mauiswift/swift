# Implementation Plan - Differentiate Platform and Merchant Logos

This plan ensures that logos uploaded by a Super Admin define the global platform branding (Loading screen, Login page), while logos uploaded by merchants only affect their individual dashboards.

## Proposed Changes

### Backend - Public Branding API

#### [MODIFY] [public_merchant.py](file:///C:/Users/DELL/Desktop/swift-main/backend/routers/public_merchant.py)
- Add a new endpoint `GET /api/v1/public/platform/branding`:
    - Fetches the `MerchantApiConfig` for the platform organization (ID: `swiftpay-ph`).
    - Returns the `store_name` (as platform name) and `store_logo_url` (as platform logo).

### Frontend - State Management

#### [MODIFY] [AuthContext.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/contexts/AuthContext.tsx)
- Add a `platformBranding` state to the context.
- Fetch platform branding on app initialization.
- Provide a `logoUrl` helper that prioritizes the user's store logo, then the platform logo, then the default hardcoded one.

### Frontend - UI Updates

#### [MODIFY] [AppLoadingScreen.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/components/AppLoadingScreen.tsx)
- Fetch and use the platform logo from the new public API instead of a hardcoded path.

#### [MODIFY] [Login.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/pages/Login.tsx)
- Use the platform logo in the `SwiftPayLogo` component (or replace it with the dynamic logo image).

#### [MODIFY] [Layout.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/components/Layout.tsx)
- Update branding logic in sidebar and header to follow the priority: Merchant Logo > Platform Logo > Default.

## Verification Plan

### Manual Verification
1.  **Platform Branding:** Log in as Super Admin and upload a logo.
    - Verify it appears on the Loading screen and Login page.
    - Verify it appears in the sidebar for new merchants who haven't uploaded their own logo yet.
2.  **Merchant Branding:** Log in as a regular Merchant and upload a logo.
    - Verify it appears in *their* sidebar and header.
    - Verify it *does not* affect the Loading screen or other merchants' dashboards.
