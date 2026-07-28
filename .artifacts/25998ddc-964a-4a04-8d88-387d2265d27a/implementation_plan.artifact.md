# Implementation Plan - Fix White Page Issue

The "white page" issue on `swiftpay.site` likely stems from a combination of a hydration error in the new `AppLoadingScreen`, a potential CSS syntax error with the variable font, and incomplete user data mapping in the authentication API.

## Proposed Changes

### Frontend - CSS & Assets

#### [MODIFY] [index.css](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/index.css)
- Clean up the `@font-face` declaration for 'DM Sans'.
- Use standard `format("truetype")` or `format("woff2")` and remove the experimental `tech("variations")` which may cause parsing errors in some browsers or build tools.
- Ensure `@import` for Inter font is moved back to the top (best practice).

### Frontend - Authentication & Data

#### [MODIFY] [auth.ts](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/lib/auth.ts)
- Update `getCurrentUser` mapping to include the new branding fields: `store_name`, `store_logo_url`, and `permanent_link_slug`. This ensures the application state is consistent with the backend model.

#### [MODIFY] [AuthContext.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/contexts/AuthContext.tsx)
- Add a safety check in `fetchPlatformBranding` to handle potential JSON parsing errors or non-standard responses from the branding endpoint.

### Frontend - UI & Stability

#### [MODIFY] [AppLoadingScreen.tsx](file:///C:/Users/DELL/Desktop/swift-main/frontend/src/components/AppLoadingScreen.tsx)
- Remove the direct `useAuth()` call inside the loading screen. Since this screen is often used as a fallback *while* the auth state is being determined, accessing the context can create race conditions or re-render loops.
- Pass branding as an optional prop or fallback to standard SwiftPay branding if the context isn't ready.

## Verification Plan

### Automated Tests
- I will run `pnpm build` in the frontend directory (if environment allows) to verify that the build succeeds without errors.

### Manual Verification
- Deploy the fixes to GitHub.
- Verify that the "white page" is replaced by the branded loading screen.
- Verify that the dashboard loads correctly after initialization.
