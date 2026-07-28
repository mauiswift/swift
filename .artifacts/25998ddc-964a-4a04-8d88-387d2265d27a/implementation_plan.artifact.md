# Implementation Plan - Exact Dashboard Match

This plan outlines the steps to refactor the dashboard and sidebar to match the provided reference screenshot exactly.

## Proposed Changes

### Dashboard Features

#### [MODIFY] [Dashboard.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/pages/Dashboard.tsx)
- **Simplify Layout:** Remove the complex chart sections (Payment Method Distribution and Transaction Volume).
- **Empty State:** Add the large central empty state area with the circular trend icon and the text "No transactions in this period", "No transactions found for the selected date range. Try a different period or check back later."
- **Stat Cards:** Ensure the "Payments" and "Disbursements" cards match the layout, font weights (e.g., ₱0.00 in large bold), and spacing of the reference.
- **Transactions Table:**
    - Change the section title from "Transaction Summary" to "Transactions".
    - Remove the "Expired" status row.
    - Match the status badge styling (colors and dots) exactly with the reference (Executed: Emerald, Pending: Blue, Rejected: Rose).
    - Ensure column headers and alignment match.

### Layout & Navigation

#### [MODIFY] [Layout.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/components/Layout.tsx)
- **Sidebar Logo:** Update the `DRLTechLogo` (or equivalent) to show the "SWIFTPAY PHILIPPINES TECHNOLOGY" branding as seen in the top-left of the reference sidebar.
- **Header Dropdown:** Add the home/building icon inside the business name dropdown at the top right.
- **Sidebar Nav:** Ensure the icons and labels for Home, Approvals, Payments, Payment Links, Disbursements, and Reports match the reference exactly.
- **Footer Cleanup:** Ensure the bottom footer (Powered by SwiftPay) matches the reference's simplified style.

## Verification Plan

### Manual Verification
1.  **Visual Check:** Compare the new dashboard against the reference image side-by-side.
2.  **Data Consistency:** Ensure the dynamic values (₱0.00, etc.) are still correctly fetched from the backend.
3.  **Responsive Check:** Verify that the simplified layout still works well on mobile devices.
