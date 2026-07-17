# Implementation Plan - Sync Website Content with swiftpay.ph

Refactor the public website and merchant dashboard to match the content, messaging, and structure of the old `swiftpay.ph` site.

## User Review Required

> [!IMPORTANT]
> - **Copy Refresh**: I will replace existing headlines and feature descriptions with the extracted text from `swiftpay.ph`.
> - **Brand Story**: I will add references to the Clark HQ, Poland Dev Center, and Miquido pedigree to match the old site's trust signals.
> - **Client Logos**: I will update the "Trusted By" section with the specific brands mentioned: Coins.ph, RCBC, Netbank, Flash Express, and Anson’s.

## Proposed Changes

### 1. Homepage & Public Pages

#### [MODIFY] [Index.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Index.tsx)
- Update Hero: "Payments infrastructure for industry leaders".
- Add Sub-headline: "One platform to accept payments, send payouts... with easy to use tools for merchants and customers."
- Refactor Features into 5 pillars:
    1. Online Payments (API, Plugins, Portal)
    2. Online Disbursements (Bulk, Real-time)
    3. Fraud Management (BSP-compliant, Device Fingerprinting)
    4. Bank Orchestration (Multi-rail routing)
    5. AI Payments Assistant (Voice collection, AI KYC)
- Update stats: "$1B+ Transactions", "500+ Businesses".

#### [MODIFY] [Features.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Features.tsx)
- Align detailed feature cards with the 5 pillars.
- Add "AI KYC Screening" and "Voice Collection Reminders" sections.

#### [MODIFY] [Pricing.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Pricing.tsx)
- Emphasize "Most competitive pricing" and "Same-day settlements".
- Keep current fee structure but frame it as "Enterprise-grade rates".

---

### 2. Branding & Trust Signals

#### [MODIFY] [AppFooter.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/components/AppFooter.tsx)
- Add HQ location: "Headquarters: Clark Freeport Zone, Pampanga, Philippines".
- Add Dev Center: "Development Center: Krakow, Poland".
- Add "Built by Miquido" acknowledgement.

---

### 3. Merchant Portal (Dashboard)

#### [MODIFY] [Dashboard.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Dashboard.tsx)
- Ensure the "Welcome" message and "SYSTEM_READY.." label align with the professional/enterprise tone of `swiftpay.ph`.
- Add a "Quick Support" widget linking to the contact channels identified on the old site.

### 4. Payment Routing Fix

#### [MODIFY] [payment_gateway.py](file:///C:/Users/DELL/Desktop/swift/backend/services/payment_gateway.py)
- **Intelligent Routing**: Update `create_payment` to check if `payment_methods` contains `alipay` or `wechat`.
- If Alipay/WeChat is requested, prioritize `MagpieQRService` (which I just fixed) instead of defaulting to SwiftPay.
- Ensure `payment_url` and `checkout_url` are correctly propagated from Magpie for these wallets.

## Verification Plan

### Automated Tests
- Run `npm run build` to ensure no component breakage during copy updates.

### Manual Verification
- **Copy Match**: Side-by-side comparison of the new `Index.tsx` with `swiftpay.ph` extraction.
- **Navigation**: Verify "Banks & Fintechs", "Enterprises", and other industry links in the navigation (even if they point to contact/register for now).
