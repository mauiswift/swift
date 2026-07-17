# exact SwiftPay.ph Replication Plan

The goal is to transform the current landing page into an exact replica of `https://swiftpay.ph/`, covering content, hierarchy, and visual style.

## User Review Required

> [!IMPORTANT]
> I will be replacing existing marketing copy with the official copy extracted from `swiftpay.ph`. This includes changing numbers (e.g., $1B to ₱57B+) and feature descriptions.

## Proposed Changes

### [Frontend - Content & Structure]

#### [MODIFY] [Index.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Index.tsx)
- **Navbar**: Update links to match the official site (Solutions, Why SwiftPay, Merchant Portal, Request a demo, Talk with a payments expert).
- **Hero Section**:
    - Headline: "The payment gateway for Philippine enterprises"
    - Sub-headline: "Accept payments, manage subscriptions, and send payouts across all major channels in one unified platform..."
    - Buttons: "Talk with a payments expert" and "Merchant Portal".
- **Stats Bar**: Update values (₱57B+ processed, 30M+ monthly, 500+ businesses).
- **Solutions (7 Pillars)**: Replace the current 5 pillars with the 7 official ones (Online Payments, Payment Reminders, Payment Routing, Subscriptions, Fraud Management, Disbursements, Reconciliation).
- **Industries**: Update the grid to include all 12 industries (Retail, Insurance, Lending, etc.).
- **Security**: Update compliance badges and claims (BSP supervised, ISO 27001, PCI DSS, SOC 2).

#### [MODIFY] [AppFooter.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/components/AppFooter.tsx)
- Update contact info: `sales@swiftpay.ph`, `+63 968 1635754`, Address: Manila.
- Update legal text: "Swift Technology Ventures Inc. is a Bangko Sentral ng Pilipinas (BSP)-regulated Operator of Payment System (OPS)."
- Ensure links match the new site structure.

### [Frontend - Styling & Visuals]

#### [MODIFY] [index.css](file:///C:/Users/DELL/Desktop/swift/frontend/src/index.css)
- Refine the "silken" background effect to be more subtle and professional, matching the high-end enterprise feel of the live site.
- Ensure `font-display` (Plus Jakarta Sans) is used consistently for all large headings.

## Verification Plan

### Manual Verification
- Verify all text content matches the extracted data from `swiftpay.ph`.
- Check responsiveness on mobile and desktop.
- Verify that all 7 pillars are correctly displayed with their respective descriptions and features.
