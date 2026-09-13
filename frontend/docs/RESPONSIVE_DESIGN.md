# Responsive Design Pattern Guide

All pages should have separate, optimized layouts for desktop and mobile browsers.

## Quick Start

### 1. Import the responsive hook in your page:

```typescript
import { useResponsive } from '@/hooks/useResponsive';

export default function YourPage() {
  const { isMobile, isDesktop } = useResponsive();
  // ...
}
```

### 2. Create separate JSX blocks:

```typescript
return (
  <>
    {/* Desktop View */}
    {isDesktop && (
      <div className="desktop-layout">
        {/* Full featured desktop UI */}
      </div>
    )}

    {/* Mobile View */}
    {isMobile && (
      <div className="mobile-layout">
        {/* Optimized mobile UI */}
      </div>
    )}
  </>
);
```

## Design Principles

### Desktop Layout (1024px+)
- **Comprehensive**: Show all information and options
- **Table/Grid**: Use tables for data display
- **Compact**: Efficient use of space
- **Complex interactions**: Multi-step workflows, inline editing
- **Sidebar navigation**: Side-by-side layouts
- **Examples**: Full admin dashboards, detailed analytics

### Mobile Layout (< 768px)
- **Focused**: Show only essential information
- **Cards/Stacked**: Vertical stacking with cards
- **Touch-friendly**: Large buttons (44px minimum)
- **Simplified**: Linear workflows, modal dialogs
- **Full-width**: Take advantage of full screen width
- **Examples**: Payment cards, simple approval forms

## Implementation Approaches

### Option 1: Conditional Rendering (Simple Pages)
For simple pages, use conditional rendering within a single component:

```typescript
import { useResponsive } from '@/hooks/useResponsive';

export default function YourPage() {
  const { isMobile, isDesktop } = useResponsive();

  return (
    <>
      {isDesktop && <DesktopLayout />}
      {isMobile && <MobileLayout />}
    </>
  );
}
```

### Option 2: Separate Components with Route Wrapper (Complex Pages)
For complex pages with significant differences, split into separate components:

**File structure:**
```
src/pages/payment-approvals/
  ├── index.tsx (route wrapper)
  ├── Desktop.tsx
  └── Mobile.tsx
```

**index.tsx:**
```typescript
import ResponsiveRoute from '@/components/ResponsiveRoute';
import Desktop from './Desktop';
import Mobile from './Mobile';

export default function PaymentApprovals() {
  return (
    <ResponsiveRoute
      desktopComponent={Desktop}
      mobileComponent={Mobile}
      tabletComponent={Tablet} // optional
    />
  );
}
```

Then in App.tsx:
```typescript
const PaymentApprovals = React.lazy(() => import('./pages/payment-approvals'));
<Route path="/payment-approvals" element={<RequireSuperAdmin><PaymentApprovals /></RequireSuperAdmin>} />
```

### Option 3: Using useDeviceRoute Hook (For Direct Substitution)
```typescript
import { useDeviceRoute } from '@/hooks/useDeviceRoute';

export default function YourPage() {
  const Component = useDeviceRoute({
    mobile: MobileComponent,
    tablet: TabletComponent,
    desktop: DesktopComponent,
  });

  return <Component {...props} />;
}
```

## Implementation Examples

### Checkout Page
**Desktop**: Side-by-side layout with product details left, payment form right
**Mobile**: Stacked vertically, accordion-style sections

### Admin Dashboard
**Desktop**: Multi-column grid with charts and tables
**Mobile**: Single-column cards with essential metrics only

### Payment Approvals (Reference Implementation)
**Desktop**: Full table with inline actions and sender detail inputs
**Mobile**: Card-based layout with stacked sections
See: `src/pages/payment-approvals/` for complete example

## Mobile Best Practices

✅ Do:
- Use full-width buttons and inputs
- Provide minimum 44px touch targets
- Stack content vertically
- Hide secondary information (use collapsible sections)
- Use modal dialogs for complex forms
- Large, readable text (16px+ for body)
- Tap-friendly spacing (12px+ between elements)

❌ Don't:
- Use hovertips (not available on touch)
- Create tables with small text
- Horizontal scrolling
- Nested menus
- Pinch-to-zoom interactions
- Multiple columns with thin spacing

## Checklist

- [ ] Page has separate `{isMobile && ...}` and `{isDesktop && ...}` blocks
- [ ] Mobile layout tested on 375px width (iPhone SE)
- [ ] Desktop layout tested on 1920px+ width
- [ ] Touch targets are 44px minimum on mobile
- [ ] Font sizes are readable without zoom (16px+ on mobile)
- [ ] No horizontal scrolling on mobile
- [ ] All functionality works on both layouts

## Responsive Hook API

```typescript
const {
  screenSize,        // 'mobile' | 'tablet' | 'desktop'
  isMobile,         // true if width < 768px
  isTablet,         // true if 768px ≤ width < 1024px
  isDesktop,        // true if width ≥ 1024px
  isMobileOrTablet, // true if width < 1024px
  isClient,         // true after hydration (prevents SSR mismatch)
} = useResponsive();
```

## Pages to Update

Priority order:
1. ✅ SuperAdminPaymentApproval (Done - uses ResponsiveRoute wrapper)
2. Checkout page
3. Admin dashboard
4. Wallet/Balance page
5. Transaction history
6. KYB registrations
7. Withdrawal requests
8. All other admin pages

---

**Commit**: 979ec2d1
