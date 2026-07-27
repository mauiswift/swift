# Implementation Plan - Refactor Admin Management Navigation

Refactor the Admin Management navigation to be more visible and accessible, both from the main dashboard sidebar and within the Admin Management page itself.

## User Review Required

> [!IMPORTANT]
> This refactor will move Admin Management sub-sections (Users, Roles, Wallets, etc.) into the main sidebar for Super Admins, providing direct access from any page. The internal layout of the Admin Management page will also change from a horizontal tab bar to a vertical sidebar layout on desktop.

## Proposed Changes

### 1. Main Navigation (Sidebar)
#### [MODIFY] [Layout.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/components/Layout.tsx)
- Add a new `ADMIN_SECTIONS` constant to define the sub-navigation for Super Admins.
- Group admin tasks under an "ADMINISTRATION" header in the sidebar.
- Items to include: Admin Users, User Management, Role Management, Crypto Requests, PHP Wallets, USD Wallets, Team Management.

### 2. Admin Management Page
#### [MODIFY] [AdminManagement.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/AdminManagement.tsx)
- Use `useSearchParams` from `react-router-dom` to manage the `activeTab` state.
- This enables direct navigation to `/admin-management?tab=users` from the sidebar.
- Replace the horizontal `TabBar` with a `NavSidebar` component for desktop.
- Update the main layout to use a flexible grid/flexbox:
    - **Desktop**: Left Sidebar (fixed width) + Right Content (expanded).
    - **Mobile**: Improved card-grid navigation at the top.
- Add descriptive text for each navigation item to improve "visibility" and clarity.
- Update styling to align with the main dashboard theme (using `#FF6B00` and `slate` colors).

## Verification Plan

### Automated Tests
- None planned for UI refactor, will rely on manual verification.

### Manual Verification
- Log in as a Super Admin and verify the new "ADMINISTRATION" section in the sidebar.
- Verify that all links in the sidebar navigate correctly to the corresponding tabs in `AdminManagement`.
- Resize the window to verify that the `AdminManagement` page adapts correctly (Sidebar on desktop, Grid on mobile).
- Verify that all admin actions (adding, deleting, updating permissions) still function as expected within each tab.
