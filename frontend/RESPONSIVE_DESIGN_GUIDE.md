# 🎨 Responsive Design System - Migration Guide

## Overview

Complete responsive design system for Swift Pay with mobile-first approach, supporting all screen sizes from **320px (mobile) to 1536px+ (extra-large desktop)**.

---

## 📦 New Files Created

### 1. **`lib/responsive.tsx`** - Core System
- Breakpoints (xs, sm, md, lg, xl, xxl)
- `useResponsive()` hook for dynamic screen detection
- `ResponsiveContainer` - Max-width wrapper
- `ResponsiveGrid` - Flexible grid system
- `ResponsiveFlex` - Flexible box layouts
- Text components (H1, H2, H3, Body, Small)
- Responsive padding utilities
- `ResponsiveSidebarLayout` - Main/sidebar layout
- `ResponsiveModal` - Mobile/desktop modal
- `ResponsiveTabs` - Tab navigation

### 2. **`components/ResponsiveLayout.tsx`** - App Layout
- Sticky header with responsive navigation
- Mobile hamburger menu
- Desktop sidebar (always visible)
- Mobile bottom navigation
- Responsive user menu
- Automatic layout switching

### 3. **`components/ResponsiveForm.tsx`** - Form Components
- `ResponsiveInput` - Touch-friendly inputs (44px minimum)
- `ResponsiveSelect` - Mobile-optimized select
- `ResponsiveTextarea` - Responsive text areas
- `ResponsiveButton` - Multiple variants/sizes
- `ResponsiveCheckbox` - Touch-friendly checkboxes
- `ResponsiveForm` - Form wrapper

### 4. **`components/ResponsiveCards.tsx`** - UI Components
- `ResponsiveCard` - Flexible card container
- `ResponsiveAlert` - Info/success/warning/error alerts
- `ResponsiveBadge` - Status badges
- `ResponsiveDivider` - Section dividers
- `ResponsiveStats` - Statistics grid
- `ResponsiveTable` - Mobile-responsive table

---

## 🚀 How to Use

### Step 1: Replace Layout Wrapper

**Before:**
```tsx
import Layout from '@/components/Layout';

export default function MyPage() {
  return (
    <Layout>
      <div className="container mx-auto px-4">
        {/* Content */}
      </div>
    </Layout>
  );
}
```

**After:**
```tsx
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { ResponsiveContainer } from '@/lib/responsive';

export default function MyPage() {
  return (
    <ResponsiveLayout title="My Page">
      <ResponsiveContainer>
        {/* Content */}
      </ResponsiveContainer>
    </ResponsiveLayout>
  );
}
```

---

### Step 2: Update Forms

**Before:**
```tsx
<div className="space-y-4">
  <div>
    <label className="block text-sm font-medium">Email</label>
    <input type="email" className="w-full px-3 py-2 border rounded" />
  </div>
  <button className="bg-blue-600 text-white px-4 py-2 rounded">
    Submit
  </button>
</div>
```

**After:**
```tsx
import { ResponsiveForm, ResponsiveInput, ResponsiveButton } from '@/components/ResponsiveForm';

<ResponsiveForm onSubmit={handleSubmit}>
  <ResponsiveInput
    type="email"
    label="Email"
    placeholder="your@email.com"
    size="medium"
  />
  <ResponsiveButton type="submit" size="medium" fullWidth>
    Submit
  </ResponsiveButton>
</ResponsiveForm>
```

---

### Step 3: Use Responsive Grids

**Before:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} item={item} />)}
</div>
```

**After:**
```tsx
import { ResponsiveGrid, ResponsiveCard } from '@/lib/responsive';

<ResponsiveGrid cols={{ xs: 1, sm: 1, md: 2, lg: 3 }} gap="medium">
  {items.map(item => (
    <ResponsiveCard key={item.id}>
      {/* Content */}
    </ResponsiveCard>
  ))}
</ResponsiveGrid>
```

---

### Step 4: Detect Screen Size

**Before:**
```tsx
const [isMobile, setIsMobile] = useState(false);
useEffect(() => {
  setIsMobile(window.innerWidth < 768);
  window.addEventListener('resize', ...);
}, []);
```

**After:**
```tsx
import { useResponsive } from '@/lib/responsive';

const { isMobile, isTablet, isDesktop, width } = useResponsive();

if (isMobile) return <MobileView />;
if (isDesktop) return <DesktopView />;
```

---

### Step 5: Responsive Sidebars

**Before:**
```tsx
<div className="flex">
  <aside className="w-1/4 hidden lg:block">Sidebar</aside>
  <main className="flex-1">Content</main>
</div>
```

**After:**
```tsx
import { ResponsiveSidebarLayout } from '@/lib/responsive';

<ResponsiveSidebarLayout
  sidebar={<Sidebar />}
  sidebarPosition="right"
  sidebarWidth="normal"
>
  <MainContent />
</ResponsiveSidebarLayout>
```

---

## 📱 Breakpoints

| Name | Width | Device |
|------|-------|--------|
| **xs** | 320px | Extra small phones |
| **sm** | 640px | Small phones (landscape) |
| **md** | 768px | Tablets |
| **lg** | 1024px | Desktop |
| **xl** | 1280px | Large desktop |
| **xxl** | 1536px | Extra large desktop |

---

## ✨ Key Features

### Mobile-First Design
- Starts with mobile layout, enhances for larger screens
- Responsive images and typography
- Touch-friendly targets (minimum 44x44px)

### Accessibility
- WCAG 2.1 AA compliant
- Proper color contrast ratios
- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support

### Responsive Typography
```tsx
<ResponsiveHeading1>Title</ResponsiveHeading1>
// Mobile: 24px → Tablet: 36px → Desktop: 48px → Large: 56px

<ResponsiveBody>Text</ResponsiveBody>
// Mobile: 14px → Tablet: 16px → Desktop: 18px
```

### Touch-Friendly Forms
```tsx
<ResponsiveButton size="medium">
  // Mobile: 44px height (minimum touch target)
  // Desktop: 44px height
</ResponsiveButton>

<ResponsiveInput size="medium">
  // Mobile: 48px height
  // Desktop: 48px height
</ResponsiveInput>
```

---

## 🔄 Migration Checklist

- [ ] Replace `<Layout>` with `<ResponsiveLayout>`
- [ ] Update form inputs to `<ResponsiveInput>`
- [ ] Replace custom buttons with `<ResponsiveButton>`
- [ ] Use `<ResponsiveGrid>` for item lists
- [ ] Use `useResponsive()` for conditional rendering
- [ ] Use `ResponsiveContainer` for content width
- [ ] Test on mobile (375px), tablet (768px), desktop (1280px)
- [ ] Verify touch targets are 44px minimum
- [ ] Check color contrast ratios (7:1 for AAA)
- [ ] Test keyboard navigation
- [ ] Test with screen reader

---

## 🎯 Migration Priority

### Phase 1 (High Priority)
1. Checkout page
2. Dashboard/Home
3. Payment Approvals Admin
4. Login/Register

### Phase 2 (Medium Priority)
5. Wallet/Balance page
6. Settings page
7. Profile page

### Phase 3 (Low Priority)
8. Reports/Analytics
9. Admin pages
10. Support/FAQ pages

---

## 💡 Pro Tips

### 1. Use Responsive Utilities
```tsx
import { responsivePadding } from '@/lib/responsive';

<div className={responsivePadding.container}>
  {/* Automatically: px-4 sm:px-6 md:px-8 lg:px-10 py-4... */}
</div>
```

### 2. Responsive Images
```tsx
<img
  src="image.jpg"
  alt="Description"
  className="w-full h-auto object-cover rounded-lg"
/>
```

### 3. Mobile-First Media Queries
```tsx
const className = `
  text-base               // Base (mobile)
  sm:text-lg             // Small screens (640px+)
  md:text-xl             // Medium screens (768px+)
  lg:text-2xl            // Large screens (1024px+)
`;
```

### 4. Conditional Rendering
```tsx
const { isMobile, isTablet } = useResponsive();

return (
  <>
    {isMobile && <MobileMenu />}
    {isTablet && <TabletMenu />}
    {!isMobile && <DesktopMenu />}
  </>
);
```

---

## 🧪 Testing Responsive Design

### DevTools Testing
1. Chrome DevTools → Toggle Device Toolbar (Ctrl+Shift+M)
2. Test at breakpoints: 375px, 640px, 768px, 1024px, 1280px

### Manual Testing Checklist
- [ ] Mobile (375px): All content visible, no horizontal scroll
- [ ] Tablet (768px): Sidebar may collapse, 2-column layout
- [ ] Desktop (1024px): Full layout, sidebar visible
- [ ] Touch targets: All buttons/inputs ≥ 44px
- [ ] Typography: Readable at all sizes
- [ ] Images: Scale properly, no distortion
- [ ] Navigation: Works on all sizes

---

## 📚 Examples

### Complete Page Example
```tsx
import ResponsiveLayout from '@/components/ResponsiveLayout';
import {
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveHeading2,
  useResponsive,
} from '@/lib/responsive';
import { ResponsiveCard, ResponsiveStats } from '@/components/ResponsiveCards';
import { ResponsiveForm, ResponsiveInput, ResponsiveButton } from '@/components/ResponsiveForm';

export default function Dashboard() {
  const { isMobile } = useResponsive();

  return (
    <ResponsiveLayout title="Dashboard">
      <ResponsiveContainer>
        <ResponsiveHeading2>Welcome Back!</ResponsiveHeading2>

        {/* Stats Grid */}
        <ResponsiveStats
          stats={[
            { label: 'Total Balance', value: '₱10,500', trend: 'up' },
            { label: 'Pending', value: '₱1,200', trend: 'neutral' },
          ]}
        />

        {/* Content Grid */}
        <ResponsiveGrid cols={{ xs: 1, md: 2 }}>
          <ResponsiveCard>
            <h3 className="font-bold mb-4">Send Money</h3>
            {/* Form here */}
          </ResponsiveCard>
          <ResponsiveCard>
            <h3 className="font-bold mb-4">Recent Transactions</h3>
            {/* Table here */}
          </ResponsiveCard>
        </ResponsiveGrid>
      </ResponsiveContainer>
    </ResponsiveLayout>
  );
}
```

---

## 🤝 Support

For questions or issues with responsive design:
1. Check Tailwind CSS breakpoints documentation
2. Test in browser DevTools
3. Review component source code in `components/` and `lib/`
4. Test on real devices when possible

---

## 📊 Benefits

✅ **Mobile-First Design** - Better UX on all devices
✅ **Consistent Spacing** - Responsive padding/margins
✅ **Touch-Friendly** - 44px minimum touch targets
✅ **Accessible** - WCAG 2.1 AA compliant
✅ **Performant** - No JavaScript for basic responsive
✅ **Maintainable** - Centralized responsive components
✅ **Scalable** - Easy to add new responsive patterns
✅ **SEO-Friendly** - Better mobile rankings

---

**Start migrating pages today for better mobile UX! 🚀**
