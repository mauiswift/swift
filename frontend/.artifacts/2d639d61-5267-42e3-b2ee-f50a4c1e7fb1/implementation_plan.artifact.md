# Typography Unification Plan

The goal is to unify the typography across the SwiftPay application to ensure it is a "certified copy" of the brand identity, using **Inter** for body text and **Plus Jakarta Sans** for display/headings.

## User Review Required

> [!IMPORTANT]
> I am standardizing on **Inter** (Sans) and **Plus Jakarta Sans** (Display). If there is a different "certified" font stack (e.g. from a Figma file or brand guide not present in the codebase), please let me know.

## Proposed Changes

### [Frontend Styling]

Summary: Centralize typography definitions in Tailwind config and global CSS, and remove local overrides.

#### [MODIFY] [tailwind.config.ts](file:///C:/Users/DELL/Desktop/swift/frontend/tailwind.config.ts)
- Extend `theme.fontFamily` to include `sans` and `display` stacks.
- Ensure `sans` maps to 'Inter' and `display` maps to 'Plus Jakarta Sans'.

#### [MODIFY] [brand.ts](file:///C:/Users/DELL/Desktop/swift/frontend/src/lib/brand.ts)
- Update `TYPOGRAPHY.fontFamily` constants to match the new standardized stacks.

#### [MODIFY] [index.css](file:///C:/Users/DELL/Desktop/swift/frontend/src/index.css)
- Unify Google Fonts imports to include all necessary weights (400-900).
- Standardize `--font-sans` and `--font-display` CSS variables.
- Ensure `@layer base` styles for `body` and headings use these variables.

#### [MODIFY] [Index.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Index.tsx)
- Remove the local `<style>` block containing font imports and overrides.
- Rely on the global stylesheet and Tailwind classes.

## Verification Plan

### Automated Tests
- N/A (Visual/Styling changes)

### Manual Verification
- Verify that fonts load correctly in the browser.
- Check that headings use 'Plus Jakarta Sans' and body text uses 'Inter'.
- Ensure consistent font weights across the Hero section and other components.
