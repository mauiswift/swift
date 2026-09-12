# Display Refinement Guide - SwiftPay

## Overview
This document outlines all display refinements implemented across the application to improve UI consistency, accessibility, and user experience.

## 1. Design System Foundation

### Spacing Scale (Standardized)
```typescript
// 3-tier system for consistency
const SPACING = {
  padding: {
    sm: 'p-3',    // 0.75rem
    md: 'p-4',    // 1rem
    lg: 'p-6',    // 1.5rem
  }
}

// Usage:
<div className={`${SPACING.responsive.contentPadding}`}>Content</div>
// Outputs: p-3 sm:p-4 md:p-6
```

### Button Variants
- **primary**: Blue background with shadow (main actions)
- **secondary**: Dark background (alternative actions)
- **tertiary**: Light background (tertiary actions)
- **danger**: Red background (destructive actions)
- **success**: Green background (positive feedback)
- **ghost**: Subtle hover effect (less prominent)
- **link**: Underlined text (navigation)

### Card Variants
- **elevated**: Shadow with hover effect (main content)
- **bordered**: 2px border (emphasis)
- **flat**: Subtle background (secondary content)

### Status Indicators
- **completed**: Emerald background with checkmark
- **pending**: Blue background with clock
- **failed**: Red background with X
- **processing**: Amber background with spinner
- **inactive**: Gray background

## 2. Component Improvements

### Enhanced Input Component
```jsx
import { Input } from '@/components/ui/input';

<Input
  placeholder="Type here..."
  className="w-full"
/>
// Features:
// - Rounded-lg corners
// - Blue focus ring with offset
// - Hover border enhancement
// - Disabled state styling
// - Smooth transitions
```

### FormField Wrapper
```jsx
import { FormField } from '@/components/FormComponents';

<FormField
  label="Email"
  required
  error={validationError}
  helperText="We'll never share your email"
>
  <Input type="email" />
</FormField>
```

### Status Badge Component
```jsx
import { StatusBadge } from '@/components/StatusBadge';

<StatusBadge
  status="completed"
  label="Done"
  size="md"
  showDot={true}
/>
// Features:
// - Auto icon selection
// - Animated processing state
// - Consistent sizing
// - Color-coded background
```

### Data Display Components
```jsx
import { DataTable, StatGrid, Timeline, Alert } from '@/components/DataDisplay';

// Data Table with consistent styling
<DataTable
  columns={columns}
  rows={data}
  striped={true}
  hoverable={true}
/>

// Stat cards with icons
<StatGrid
  stats={[
    {
      label: "Total Revenue",
      value: "$1,234.56",
      change: "+12.5% from last month",
      color: "blue"
    }
  ]}
  columns={4}
/>

// Timeline component
<Timeline items={items} />

// Alert boxes
<Alert type="success" message="Operation completed" />
```

## 3. Typography Improvements

### Heading Hierarchy
```css
h1 { @apply text-3xl font-bold tracking-tight text-slate-900 mb-3; }
h2 { @apply text-2xl font-bold tracking-tight text-slate-900 mb-2; }
h3 { @apply text-xl font-semibold text-slate-900 mb-2; }
```

### Text Colors (3-tier system)
```css
.text-primary    /* text-slate-900 - main text */
.text-secondary  /* text-slate-600 - supporting */
.text-muted      /* text-slate-500 - disabled */
```

## 4. Responsive Design Patterns

### Container Width
```jsx
// Automatically centers and constrains width
<div className="max-w-7xl mx-auto">Content</div>
```

### Responsive Padding
```jsx
// Mobile: p-3, Tablet: sm:p-4, Desktop: md:p-6
<div className="p-3 sm:p-4 md:p-6">Content</div>
```

### Grid Layouts
```jsx
// Auto-responsive grid
<div className="grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</div>
```

## 5. Accessibility Enhancements

### Focus States
```css
/* All interactive elements have visible focus ring */
input:focus-visible {
  outline: 2px solid blue;
  outline-offset: 2px;
}
```

### ARIA Labels
```jsx
<button aria-label="Delete item" className="...">✕</button>
```

### Semantic HTML
```jsx
// Use appropriate semantic elements
<form onSubmit={handleSubmit}>
  <FormField label="Name" required>
    <Input type="text" />
  </FormField>
  <Button type="submit">Submit</Button>
</form>
```

### Color Contrast
All text meets WCAG AA standards:
- Primary text (slate-900) on white: 17.5:1
- Secondary text (slate-600) on white: 7.5:1
- Error text (red-600) on white: 6.3:1

## 6. State Display Patterns

### Empty State
```jsx
import { EmptyState } from '@/components/FormComponents';

<EmptyState
  icon="📭"
  title="No items yet"
  description="Create your first item to get started"
  action={<Button>Create Item</Button>}
/>
```

### Loading State
```jsx
import { LoadingState } from '@/components/FormComponents';

<LoadingState message="Loading your data..." />
```

### Error State
```jsx
import { ErrorState } from '@/components/FormComponents';

<ErrorState
  title="Error"
  message="Failed to load. Please try again."
  action={<Button onClick={retry}>Retry</Button>}
/>
```

## 7. Animation Improvements

### Consistent Timing
```css
.duration-150 /* fast interactions: 150ms */
.duration-200 /* normal: 200ms */
.duration-300 /* slow: 300ms */
```

### Interactive Elements
- Buttons: `hover:translate-y-[-1px]` slight lift
- Cards: `hover:shadow-lg` shadow enhancement
- All transitions: `transition-all duration-200`

## 8. Usage Examples

### Refactored Form Page
```jsx
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/FormComponents';
import { Input } from '@/components/ui/input';
import { SPACING } from '@/lib/design-system';

export default function MyPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1>Edit Settings</h1>
        
        <div className={SPACING.responsive.sectionPadding}>
          <FormField label="Email" required>
            <Input type="email" />
          </FormField>
          
          <FormField label="Phone" helperText="Optional">
            <Input type="tel" />
          </FormField>
          
          <Button variant="primary" size="lg">
            Save Changes
          </Button>
        </div>
      </div>
    </Layout>
  );
}
```

### Refactored Data Display Page
```jsx
import { DataTable, StatGrid } from '@/components/DataDisplay';
import { StatusBadge } from '@/components/StatusBadge';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <StatGrid columns={3} stats={stats} />
      
      <DataTable
        columns={columns}
        rows={data}
        striped
        hoverable
      />
    </div>
  );
}
```

## 9. Migration Checklist

When refactoring existing pages:

- [ ] Use new Button variants instead of custom button styles
- [ ] Wrap form inputs with FormField component
- [ ] Replace custom card styling with Card variants
- [ ] Use StatusBadge for all status displays
- [ ] Apply SPACING constants for consistent padding
- [ ] Use FORM_STYLES for label/input consistency
- [ ] Add error/empty/loading states with provided components
- [ ] Verify focus ring visibility on all inputs
- [ ] Test responsive design on mobile (375px) and tablet (768px)
- [ ] Verify color contrast with WCAG AA standard
- [ ] Check animation performance with `prefers-reduced-motion`

## 10. Performance Notes

- All animations respect `prefers-reduced-motion` preference
- Focus rings use minimal painting (outline instead of box-shadow)
- Hover states use GPU-accelerated transforms (`translate`, `scale`)
- Loading spinners use CSS animations (no JS)
- No unnecessary re-renders with proper React patterns

## Resources

- Design System: `/src/lib/design-system.ts`
- Components: `/src/components/`
- UI Components: `/src/components/ui/`
- CSS: `/src/index.css`

## Next Steps

1. Systematically refactor remaining pages using the new components
2. Set up linting rules to enforce design system usage
3. Document component usage in Storybook
4. Create design tokens generation script
5. Monitor accessibility metrics with axe-core
