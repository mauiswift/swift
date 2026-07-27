# Implementation Plan - Store Personalization & Permanent Payment Link

This plan adds features for merchants to customize their store branding (Name and Logo) and manage a default permanent payment link.

## Proposed Changes

### Backend - Database & Models

#### [MODIFY] [merchant_api_config.py](file:///C:/Users/DELL/Desktop/swift-main/backend/models/merchant_api_config.py)
- Add `store_name` (String, nullable)
- Add `store_logo_url` (String, nullable)
- Add `permanent_link_slug` (String, unique, index, nullable)

#### [NEW] [merchant_branding.py](file:///C:/Users/DELL/Desktop/swift-main/backend/alembic/versions/merchant_branding.py)
- Alembic migration to add the new columns.

### Backend - API Endpoints

#### [MODIFY] [merchant_api.py](file:///C:/Users/DELL/Desktop/swift-main/backend/routers/merchant_api.py)
- Update `ApiConfigResponse` and `ApiConfigUpdate` to includebranding and permanent link fields.
- In `update_merchant_api_config`, if `store_name` is changed, also update `organization_name` in the `admin_users` table for all users belonging to that organization.

#### [MODIFY] [auth.py](file:///C:/Users/DELL/Desktop/swift-main/backend/routers/auth.py)
- Update `UserResponse` construction in login and `/me` endpoints to include `store_name` and `store_logo_url` from the organization's `MerchantApiConfig`.

#### [NEW] [public_merchant.py](file:///C:/Users/DELL/Desktop/swift-main/backend/routers/public_merchant.py)
- `GET /api/v1/public/merchant/{slug}`: Public endpoint to fetch store name and logo by slug (for the permanent pay page).

### Frontend - State & Layout

#### [MODIFY] [AuthContext.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/contexts/AuthContext.tsx)
- Add `store_name` and `store_logo_url` to the `User` interface and response mapping.

#### [MODIFY] [Layout.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/components/Layout.tsx)
- Update the header and sidebar to use the merchant's custom logo and store name if they exist.

### Frontend - Pages

#### [MODIFY] [StoreProfile.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/pages/settings/StoreProfile.tsx)
- Connect to the `merchant/api-config` API to fetch and update branding.
- Implement the "Store Logo" upload/URL input.
- Add a section for the "Permanent Payment Link" where merchants can set their slug and see their public payment URL.

#### [NEW] [PermanentPayPage.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/pages/PermanentPayPage.tsx)
- A public-facing page mapped to `/pay/:slug`.
- Allows customers to enter an amount and description to start a payment to that merchant.

## Verification Plan

### Automated Tests
- Test that updating `store_name` correctly propagates to `AdminUser.organization_name`.
- Test that the public merchant info endpoint works without authentication.

### Manual Verification
- Log in as a merchant and change the Store Name in Settings. Verify the header/sidebar updates.
- Set a permanent link slug (e.g., `drl-solutions`).
- Visit `https://swiftpay.ph/pay/drl-solutions` in an incognito window and verify the branding and payment form.
