# Walkthrough - Store Personalization & Permanent Payment Link

I have implemented features allowing merchants to personalize their store branding (Name and Logo) and manage a unique permanent payment link.

## Changes

### 1. Store Branding & Personalization
- **[StoreProfile Page](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/pages/settings/StoreProfile.tsx):**
    - Connected the "Store Profile" settings to the backend API.
    - Merchants can now update their **Shop Name** and provide a **Logo URL**.
    - Changes to the Shop Name automatically synchronize with the organization name in the team member records.
- **[Dashboard Layout](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/components/Layout.tsx):**
    - Updated the sidebar and header to dynamically display the merchant's custom logo and store name.

### 2. Permanent Payment Link
- **Backend Configuration:** Added `permanent_link_slug` to the `MerchantApiConfig` model, allowing each organization to claim a unique URL path (e.g., `swiftpay.ph/pay/my-store`).
- **[Public Merchant API](file:///C:/Users/DELL/Desktop/swift-main/backend/routers/public_merchant.py):** Created a new public endpoint to fetch store details (name/logo) using only the slug, enabling branded public pages without requiring authentication.
- **[Public Payment Page](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/pages/PermanentPayPage.tsx):**
    - Implemented a clean, mobile-optimized public page at `/pay/:slug`.
    - Customers can visit this link, see the merchant's branding, and enter an amount to pay immediately.

### 3. Data Integration & Auth
- **[Auth Context](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/contexts/AuthContext.tsx):** Expanded the user session data to include store branding, ensuring the dashboard reflects personalization immediately after login.
- **[API Router](file:///C:/Users/DELL/Desktop/swift-main/backend/routers/auth.py):** Enhanced login and profile endpoints to join with the API configuration table and return branding data.

## Verification Results

### Functionality
- Verified that updating the Store Name in Settings updates the sidebar branding instantly.
- Verified that setting a "Store Slug" enables the public payment URL.
- Verified that the Public Payment Page (`/pay/:slug`) correctly displays the merchant's logo and name.

### Security
- Public merchant info is limited to non-sensitive fields (name, logo, organization ID).
- Store slugs are enforced as unique to prevent duplicate merchant links.
