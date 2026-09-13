# Payment Approvals Page - Route Wrapper Example

This directory demonstrates the responsive route wrapper pattern for pages with significant desktop/mobile differences.

## File Structure

- **index.tsx** - Route wrapper that automatically displays device-specific components
- **Desktop.tsx** - Desktop-optimized component (table view)
- **Mobile.tsx** - Mobile-optimized component (card view)

## How It Works

The `ResponsiveRoute` component automatically detects the device screen size and renders the appropriate component:

```
index.tsx (ResponsiveRoute)
    ↓ (isMobile < 768px)    ↓ (isDesktop ≥ 1024px)
  Mobile.tsx              Desktop.tsx
```

## Usage

In App.tsx, the route simply imports from this directory:

```typescript
const SuperAdminPaymentApproval = React.lazy(() => import('./pages/payment-approvals'));
```

React Router will render the index.tsx, which automatically handles device detection.

## Component Details

### Desktop View (Desktop.tsx)
- Full-featured table layout
- All columns visible (ID, Amount, Type, Description, Created, Actions)
- Inline input fields for sender name/bank
- Compact, efficient use of space
- Optimized for mouse interaction

### Mobile View (Mobile.tsx)
- Card-based layout
- Vertical stacking
- Large, touch-friendly buttons (44px minimum)
- Expandable sections
- Full-width inputs
- Optimized for touch interaction

## Key Differences

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Layout | Table | Cards |
| Column Visibility | All | Essential only |
| Input Fields | Inline | Stacked |
| Buttons | Compact | Full-width |
| Touch Targets | 32-36px | 44px+ |
| Spacing | Tight | Loose |

## Adding New Pages Using This Pattern

1. Create a folder: `src/pages/your-page/`
2. Create `Desktop.tsx` and `Mobile.tsx` with your components
3. Create `index.tsx`:
   ```typescript
   import ResponsiveRoute from '@/components/ResponsiveRoute';
   import Desktop from './Desktop';
   import Mobile from './Mobile';

   export default function YourPage() {
     return <ResponsiveRoute desktopComponent={Desktop} mobileComponent={Mobile} />;
   }
   ```
4. Update App.tsx to import from the new directory

## Testing

When testing responsive behavior:
- **Desktop**: Test at 1920px, 1440px, 1024px
- **Tablet**: Test at 1023px, 768px, 800px
- **Mobile**: Test at 767px, 480px, 375px (iPhone SE)

Use Chrome DevTools' device emulation for accurate testing.
