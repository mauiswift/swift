# Implementation Plan - Font Consistency & Style Match

Align the application's font styles exactly with the reference images and `swiftpay.ph`. The primary focus is switching the default font to **Inter** (to match the clean, professional look in the screenshots) and refining font weights/tracking for headings and amounts.

## User Review Required

> [!IMPORTANT]
> I will switch the default `font-sans` from 'Red Hat Text' to **'Inter'** in `index.css`. The screenshots show a more neutral, high-contrast sans-serif font consistent with Inter.

## Proposed Changes

### Global Styles

#### [MODIFY] [index.css](file:///C:/Users/DELL/Desktop/swift/frontend/src/index.css)
- Change `--font-sans` to prioritize `'Inter'`.
- Change `--font-display` to prioritize `'Plus Jakarta Sans'`.
- Ensure `body` and `h1-h6` are using these variables correctly.

### Page-Specific Refinements

#### [MODIFY] [Register.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Register.tsx)
- Update the main heading to `font-black` (900) instead of `font-extrabold` (800) to match the "heavy" look on `swiftpay.ph`.
- Increase tracking tightness to `tracking-[-0.05em]`.

#### [MODIFY] [Dashboard.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Dashboard.tsx)
- Ensure all large amounts use `font-black` and `tracking-tighter`.
- Update small uppercase headers (e.g., in tables) to use `font-bold` and `tracking-[0.1em]` for precise match.

#### [MODIFY] [Layout.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/components/Layout.tsx)
- Refine sidebar font weights (Medium for normal, Bold for active).

#### [MODIFY] [Approvals.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Approvals.tsx)
- Match the heading weight and tab font style.

## Verification Plan

### Manual Verification
- Compare the rendered text in `Register.tsx` against `swiftpay.ph/sign-up-now`.
- Compare the Dashboard stats against `home.png`.
- Check if the "₱" symbol and numbers match the character style in the screenshots.
