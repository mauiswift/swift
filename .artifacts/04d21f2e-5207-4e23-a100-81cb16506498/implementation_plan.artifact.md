# Implementation Plan - Exact Replication of Merchant Portal UI

Replicate the provided reference screenshots (Merchant Portal) with 100% fidelity in terms of label placement, font styles, font sizes, colors, and functionality.

## User Review Required

> [!IMPORTANT]
> The screenshots provided are for a Desktop/Web view. While I will refine the `frontend` (web) project to match these exactly, I will also ensure the `mobile` project's theme and core components are aligned with this new "Gold Standard" design.

> [!WARNING]
> Some existing functionality (like API calls) will be preserved, but UI components will be heavily refactored to match the "Exact placement" requirement.

## Proposed Changes

### 1. Global Styles & Theme
- Update `frontend/src/index.css` to use the exact font weights and colors from the screenshots (primarily `Inter` and `Plus Jakarta Sans`).
- Unify the brand orange across `frontend` and `mobile` to `#FF6B00` (or the exact hex from the screenshots).
- Refine `mobile/src/theme.ts` to match the web portal's typography and color palette for consistency.

### 2. Shared Components (Frontend)
- **[MODIFY] [Layout.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/components/Layout.tsx)**:
    - Sidebar: Exact icon sizes (18px), spacing, and active states.
    - Header: Standardize the business name display, search bar placement, and profile dropdown.
    - Footer: Add "SwiftPay 2021-2026 © All Rights Reserved" and legal links as seen in screenshots.
- **[MODIFY] [WhatsNewBanner.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/components/WhatsNewBanner.tsx)**: Match exact padding and font sizes.

### 3. Page Replications (Frontend)
- **[MODIFY] [Dashboard.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Dashboard.tsx)**:
    - Match chart colors and wave forms.
    - Align Stat cards and Transaction Summary table exactly.
- **[MODIFY] [Approvals.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Approvals.tsx)**:
    - Sync "Pending" vs "History" tab filters ("Show: All" vs "Status: All").
    - Fix the "No results found" illustration and text.
- **[MODIFY] [PaymentsPage.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/PaymentsPage.tsx)**:
    - Align filters and stats grid.
- **[MODIFY] [DisbursementsPage.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/DisbursementsPage.tsx)**:
    - Match the header layout (Balance + Send Funds).
- **[MODIFY] [BatchDisbursement.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/BatchDisbursement.tsx)**:
    - Ensure breadcrumbs and file rules card match exactly.
- **[MODIFY] [SendSingleDisbursement.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/SendSingleDisbursement.tsx)**:
    - Match section headers and input grouping.
- **[MODIFY] [Settings pages](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/settings/)**:
    - Update Store Profile, Banking, API & Integration, and Team pages to match screenshots.

### 4. Mobile App Alignment
- **[MODIFY] [theme.ts](file:///C:/Users/DELL/Desktop/swift/mobile/src/theme.ts)**: Sync design tokens with the refined web portal.
- **[NEW] [ApprovalsScreen.tsx](file:///C:/Users/DELL/Desktop/swift/mobile/src/screens/ApprovalsScreen.tsx)**: (Optional, if missing) Create mobile-adapted version of the approvals UI.

## Verification Plan

### Manual Verification
- Compare each screen side-by-side with the reference images.
- Verify responsiveness (Desktop, Tablet, Mobile) for the frontend.
- Check all interactive elements (tabs, filters, buttons) function correctly.
