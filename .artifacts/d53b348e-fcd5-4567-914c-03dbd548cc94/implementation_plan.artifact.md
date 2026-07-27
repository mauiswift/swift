# Implementation Plan - Sidebar Fix

Fix the sidebar to be an exact copy of the provided reference images. This involves restructuring the `Layout` component, moving the logo into the sidebar, removing the full-width top bar, and matching the styling (colors, fonts, layout).

## User Review Required

> [!IMPORTANT]
> The sidebar width will be increased to approximately 240px to match the reference images.
> The full-width top bar will be removed in favor of a content-area header.
> The active navigation color will be set to Orange (`#FF6B00`).

## Proposed Changes

### [Component] Layout & Sidebar

#### [MODIFY] [Layout.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/components/Layout.tsx)
- **Restructure Layout**:
    - Change the main container to a `flex` layout.
    - The Sidebar will be a fixed-width, full-height element on the left.
    - The Main Content will be a `flex-1` scrollable area on the right.
- **Sidebar Updates**:
    - Move the logo into the top of the sidebar.
    - Use the "DRL TECHNOLOGY" branding as seen in the screenshots.
    - Update navigation items and sections:
        - Sections: (Home/Approvals), TRANSACTIONS, INSIGHTS, SYSTEM.
        - Items: Home, Approvals, Payments, Payment Links, Disbursements, Reports, Test Mode, Settings, Logout.
    - Style updates:
        - Active item: Orange text/icon (`#FF6B00`), bold font.
        - Section labels: `text-[10px]`, bold, uppercase, gray.
        - Background: Solid dark (black/dark gray).
    - Remove "Merchant Settings" from the sidebar.
    - Match the "Powered by SwiftPay" footer at the bottom.
- **Header Updates**:
    - Create a sticky header bar at the top of the content area.
    - Include the "Live Mode" indicator and Merchant Dropdown ("DRL Solutions").
- **Mobile Support**:
    - Adjust the mobile sidebar (Sheet/Drawer) to match the new dark theme and logo placement.

## Verification Plan

### Manual Verification
- Verify the sidebar layout on desktop (fixed left, full height).
- Verify the active state color is orange for all nav items.
- Verify the section labels match the screenshot styling.
- Verify the merchant name dropdown is correctly positioned in the content header.
- Verify the mobile sidebar opens correctly and matches the desktop theme.
- Compare specific pages (Home, Approvals, Payments) against the provided reference images.
