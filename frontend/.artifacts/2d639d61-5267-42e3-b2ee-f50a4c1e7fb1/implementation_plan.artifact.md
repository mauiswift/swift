# Pixel-Perfect "Absolute Fidelity" Replication Plan

This plan aims to address the remaining visual and behavioral gaps to achieve 100% fidelity with `https://swiftpay.ph/`.

## User Review Required

> [!IMPORTANT]
> - **Typography**: I will force `font-black` and `tracking-[-0.05em]` on headings to match the tight, bold look of the live site.
> - **Logo**: I am updating the logo to the official 3x3 dot grid.
> - **Backgrounds**: I will ensure the transitions between the cream hero and the dark security/stats sections are seamless and use the exact hex codes.

## Proposed Changes

### [Frontend - Global Styles]

#### [MODIFY] [index.css](file:///C:/Users/DELL/Desktop/swift/frontend/src/index.css)
- Set exact `--brand-orange: #FF7A45;`.
- Set exact `--brand-cream: #FCF9F6;`.
- Set exact `--brand-ink: #050A18;` (for dark sections).
- Add `animate-reveal` keyframes for scroll-triggered appearances.
- Refine `.floating-ui-card` with a specific shadow: `box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);`.

### [Frontend - Main Page]

#### [MODIFY] [Index.tsx](file:///C:/Users/DELL/Desktop/swift/frontend/src/pages/Index.tsx)
- **Logo**: Update from 6 to 9 dots (3x3 grid).
- **Navigation**:
    - Update "Solutions" to have a rotating chevron on hover.
    - Style the "Request a Demo" button with a sharp `rounded-lg` and specific padding.
- **Hero Section**:
    - **Headline**: Apply `text-[96px]` (desktop) and `tracking-tighter`.
    - **Checklist**: Use a custom SVG checkmark that exactly matches the live site's green icon.
    - **Visuals**: Use a professional business portrait that closely matches the live site.
    - **Interactive Widget**: Add a pulse effect to the "DONE" badges.
- **Trusted By Bar**:
    - Use the exact sequence: Anson's, IskarTech, Cebuana Lhuillier, RCBC, Smart, Maya, AllBank.
- **Solutions & Case Studies**:
    - Add "Reveal on Scroll" animations to all cards.
- **Footer**:
    - Add the "Manila" clock/time indicator if visible on the live site (or at least the status dot).

## Verification Plan

### Manual Verification
- Pixel-by-pixel comparison with the `swiftpay.ph` live site.
- Check hover states on all interactive elements.
- Verify that the font weights "pop" as they do in the enterprise platform.
