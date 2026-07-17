# Typography Unification Walkthrough

I have unified the typography system across the SwiftPay application to ensure consistent branding using **Inter** for body text and **Plus Jakarta Sans** for display elements.

## Changes Made

### 1. Tailwind Configuration
Updated [tailwind.config.ts](file:///C:/Users/DELL/Desktop/swift/frontend/tailwind.config.ts) to define `sans` and `display` font stacks.
- `sans`: Inter, system-ui, -apple-system, sans-serif
- `display`: Plus Jakarta Sans, Inter, system-ui, -apple-system, sans-serif

### 2. Global Styles
Refactored [src/index.css](file:///C:/Users/DELL/Desktop/swift/frontend/src/index.css):
- Unified Google Fonts import to include all necessary weights (400-900).
- Standardized `--font-sans` and `--font-display` CSS variables.
- Applied `font-family: var(--font-sans)` globally to the `body`.

### 3. Brand Constants
Updated [src/lib/brand.ts](file:///C:/Users/DELL/Desktop/swift/frontend/src/lib/brand.ts) to reflect the new standardized font stacks in the `TYPOGRAPHY` constant.

### 4. Component Cleanup
- Removed local `<style>` overrides from [Index.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Index.tsx) to prevent font loading conflicts and ensure the global system is used.
- Updated [index.html](file:///C:/Users/DELL/Desktop/swift/frontend/index.html) to use 'Inter' as the fallback font during initial load.

## Verification Results

### Manual Verification
- Verified that `Inter` is applied to body text.
- Verified that `Plus Jakarta Sans` is applied to headings using the `font-display` class.
- Confirmed that all font weights are correctly loaded via the unified Google Fonts import.
