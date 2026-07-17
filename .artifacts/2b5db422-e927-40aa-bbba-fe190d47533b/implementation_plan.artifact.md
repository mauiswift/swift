# Implementation Plan - Final Design Sync & Routing Fix

Reconstruct the homepage to match the provided image exactly and fix the root redirect issue.

## User Review Required

> [!IMPORTANT]
> - **Routing Change**: The root path (`/`) will now point to the public **HomePage**. The **Dashboard** will move to `/dashboard`. This prevents the "always redirected to login" behavior when visiting the site root.
> - **Design Overhaul**: `Index.tsx` will be completely refactored to match the minimalist white design and wavy background seen in the image.

## Proposed Changes

### 1. Routing Fix

#### [MODIFY] [App.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/App.tsx)
- Change root route: `<Route path="/" element={<HomePage />} />`.
- Move Dashboard: `<Route path="/dashboard" element={<ProtectedAdminRoute><Dashboard /></ProtectedAdminRoute>} />`.
- Update fallback: `<Route path="/home" element={<Navigate to="/" replace />} />`.

### 2. Homepage Design (100% Match)

#### [MODIFY] [Index.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Index.tsx)
- **Background**: Apply a soft peach/beige wavy gradient background.
- **Navbar**:
    - Standardize font to a clean sans-serif (Inter/Geist).
    - Align links: Clients, Products, Payment Methods, Why Swiftpay.
    - Add "Merchant Portal" button and "Contact us" link with arrow.
- **Hero**:
    - Left-aligned bold headline: "Payments infrastructure for industry leaders".
    - Right-aligned descriptive paragraph.
    - Circular arrow "Contact Us" link.

### 3. Stability & Cleanup

#### [MODIFY] [Dashboard.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Dashboard.tsx)
- Ensure all icons (`CheckCircle`, `TrendingUp`, etc.) are imported correctly.
- Fix any potential "white page" runtime errors.

## Verification Plan

### Manual Verification
- **Root Visit**: Open `https://swiftpay.site/` and confirm the landing page appears immediately without redirecting to login.
- **Visual Check**: Compare the live site with the provided reference image.
- **Dashboard Access**: Login and ensure `/dashboard` is accessible and functional.
