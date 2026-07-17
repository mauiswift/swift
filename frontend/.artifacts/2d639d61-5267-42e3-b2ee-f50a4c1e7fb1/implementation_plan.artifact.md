# Pixel-Perfect "Everything" SwiftPay.ph Replication Plan

The goal is to replicate the entire landing page from `https://swiftpay.ph/` with 100% fidelity, covering all sections from the Hero to the Footer, including advanced UI components, official branding, and complete copy.

## User Review Required

> [!IMPORTANT]
> - **Visual Theme**: I am combining the off-white/cream hero theme from the screenshot with the dark enterprise-grade sections (Security, Stats) found on the live site.
> - **New Sections**: I am adding the **Case Studies** (Retail, Insurance, Logistics) and the **SwiftGuard** branding.
> - **Advanced UI**: I will implement the circular progress bar and "DONE" status badges in the hero using pure Tailwind/CSS.

## Proposed Changes

### [Frontend - Structural Expansion]

#### [MODIFY] [Index.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Index.tsx)
- **Navbar**: Add "Solutions" dropdown chevron and "Request a Demo" high-contrast button.
- **Hero**:
    - High-fidelity layout: Left text, Right visual with photo and floating UI elements.
    - Floating UI: "Transactions Today" (circular progress), "Collections DONE", "Payments DONE".
    - Checklist: Official 3-item checklist with green icons.
- **Stats/Logos Bar**:
    - Stats: ₱57B+, 30M+, 500+ businesses.
    - Logo Grid: QR Ph, GCash, Maya, Visa, Mastercard, BillEase, InstaPay, PESONet (grayscale).
- **Solutions (7 Pillars)**:
    - Include **AI Call Agent** in Reminders.
    - Add **SwiftGuard** branding and **BSP Circular 1213** mention in Fraud Management.
- **[NEW] Case Studies Section**: Cards for Retail, Insurance, and Logistics.
- **Security Section**: Update with all official badges (BSP, ISO 27001, PCI DSS, SOC 2, AES 256).
- **Footer**:
    - Complete hierarchy with all 7 solutions linked.
    - **Status Indicator**: "Manila — All systems operational" with a pulsing green dot.
    - Official BSP regulation disclaimer.

### [Frontend - Styling]

#### [MODIFY] [index.css](file:///C:/Users/DELL/Desktop/swift/frontend/src/index.css)
- Define `--brand-cream: #FCF9F6;` and `--brand-dark: #050A18;`.
- Refine `.text-highlight` to match the exact orange stroke under "Philippine".
- Add `.pulse-emerald` animation for the footer status.
- Ensure `font-display` tracking is tightened for the "font-black" look.

## Verification Plan

### Manual Verification
- Verify every single section matches the content and layout of `swiftpay.ph`.
- Check all links and hover states.
- Ensure the floating hero elements are responsive.
