# Customer Sidebar Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the customer sidebar navigation to use account-focused categories with enhanced items for the medical device marketplace.

**Architecture:** Update the shared `DashboardLayout` component's `DEFAULT_NAV_CONFIG.customer` constant. The customer app already uses this shared layout, so changing the config will automatically apply the new navigation structure.

**Tech Stack:** TypeScript, React, Next.js 16, lucide-react icons, @mymeddevices/shared-admin

---

## Task 1: Add New Icon Imports

**Files:**
- Modify: `packages/shared-admin/src/components/dashboard-layout.tsx:25-56`

The customer config needs these additional icons from lucide-react:
- `HeartIcon` — For "My Stuff" category
- `MapPinIcon` — For Addresses
- `ClockIcon` — For Recently Viewed
- `SearchIcon` — For Saved Searches
- `LockIcon` — For Security (replaces `CogIcon` for security-specific)
- `EyeIcon` — For Privacy

- [ ] **Step 1: Read the current imports section**

The imports are at lines 25-56. Find the closing brace of the lucide-react imports.

- [ ] **Step 2: Add the new icons to the import statement**

Add these icons to the existing lucide-react import:

```typescript
import {
  LayoutDashboardIcon,
  UsersIcon,
  CogIcon,
  SettingsIcon,
  PackageIcon,
  ShoppingCartIcon,
  TagIcon,
  BarChart3Icon,
  StoreIcon,
  FileTextIcon,
  CreditCardIcon,
  TruckIcon,
  AlertCircleIcon,
  LogOutIcon,
  ChevronsUpDownIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  MessageSquareIcon,
  FolderTreeIcon,
  TrendingUpIcon,
  HeadphonesIcon,
  FileEditIcon,
  MegaphoneIcon,
  GitBranchIcon,
  ShieldIcon,
  ActivityIcon,
  HeartIcon,     // NEW
  MapPinIcon,    // NEW
  ClockIcon,     // NEW
  SearchIcon,    // NEW
  LockIcon,      // NEW
  EyeIcon,       // NEW
  type LucideIcon,
} from "lucide-react"
```

- [ ] **Step 3: Verify no TypeScript errors**

Run: `cd packages/shared-admin && pnpm build`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add packages/shared-admin/src/components/dashboard-layout.tsx
git commit -m "feat(admin): add icon imports for customer sidebar redesign"
```

---

## Task 2: Update Customer Navigation Config

**Files:**
- Modify: `packages/shared-admin/src/components/dashboard-layout.tsx:236-267`

Replace the entire `customer` config with the new account-focused structure.

- [ ] **Step 1: Replace the customer config**

Find the `customer: [` array starting at line 236 and replace it with:

```typescript
  customer: [
    {
      label: "Dashboard",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
      ],
    },
    {
      label: "My Account",
      items: [
        { label: "Profile", href: "/dashboard/profile", icon: UsersIcon },
        { label: "Payment Methods", href: "/dashboard/payment-methods", icon: CreditCardIcon },
        { label: "Addresses", href: "/dashboard/addresses", icon: MapPinIcon },
        { label: "Communication", href: "/dashboard/communication", icon: BellIcon },
      ],
    },
    {
      label: "My Orders",
      items: [
        { label: "Orders", href: "/dashboard/orders", icon: ShoppingCartIcon },
        { label: "Returns", href: "/dashboard/returns", icon: AlertCircleIcon },
        { label: "Order Tracking", href: "/dashboard/tracking", icon: TruckIcon },
      ],
    },
    {
      label: "My Stuff",
      items: [
        { label: "Wishlist", href: "/dashboard/wishlist", icon: HeartIcon },
        { label: "Recently Viewed", href: "/dashboard/recently-viewed", icon: ClockIcon },
        { label: "Saved Searches", href: "/dashboard/saved-searches", icon: SearchIcon },
      ],
    },
    {
      label: "Medical",
      items: [
        { label: "Prescriptions", href: "/dashboard/prescriptions", icon: FileTextIcon },
        { label: "Insurance", href: "/dashboard/insurance", icon: ShieldIcon },
      ],
    },
    {
      label: "Settings",
      items: [
        { label: "Preferences", href: "/dashboard/preferences", icon: SettingsIcon },
        { label: "Security", href: "/dashboard/security", icon: LockIcon },
        { label: "Privacy", href: "/dashboard/privacy", icon: EyeIcon },
      ],
    },
  ],
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd packages/shared-admin && pnpm build`
Expected: No TypeScript errors, successful build

- [ ] **Step 3: Commit**

```bash
git add packages/shared-admin/src/components/dashboard-layout.tsx
git commit -m "feat(admin): update customer sidebar to account-focused categories"
```

---

## Task 3: Verify Customer App Uses Shared Layout

**Files:**
- Read: `apps/customer/components/dashboard-layout.tsx`

Verify the customer app is using the shared layout so it picks up the new config.

- [ ] **Step 1: Read the customer dashboard layout**

Read: `apps/customer/components/dashboard-layout.tsx`

Expected content:
```typescript
"use client"

import { DashboardLayout as SharedDashboardLayout } from "@mymeddevices/shared-admin"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <SharedDashboardLayout theme="customer">{children}</SharedDashboardLayout>
}
```

- [ ] **Step 2: Confirm no action needed**

If the file matches the expected content, the customer app will automatically use the new config.

If the file has a custom implementation or uses `navConfig` prop, note the difference:
- [ ] File matches expected → No action needed
- [ ] File differs → Document discrepancy and adjust plan

---

## Task 4: Create Placeholder Pages for New Routes

**Files:**
- Create: `apps/customer/app/dashboard/[route]/page.tsx` (for each new route)

Create placeholder pages for the new navigation items so clicking them doesn't result in 404 errors.

- [ ] **Step 1: Create Communication page**

Create: `apps/customer/app/dashboard/communication/page.tsx`

```typescript
export default function CommunicationPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Communication Preferences</h1>
      <p className="text-muted-foreground">Manage your email and SMS notification preferences.</p>
      <div className="p-8 border rounded-lg bg-muted/50">
        <p className="text-center text-sm">Coming soon...</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create Order Tracking page**

Create: `apps/customer/app/dashboard/tracking/page.tsx`

```typescript
export default function TrackingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Order Tracking</h1>
      <p className="text-muted-foreground">Track your active orders and deliveries.</p>
      <div className="p-8 border rounded-lg bg-muted/50">
        <p className="text-center text-sm">Coming soon...</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create Recently Viewed page**

Create: `apps/customer/app/dashboard/recently-viewed/page.tsx`

```typescript
export default function RecentlyViewedPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Recently Viewed</h1>
      <p className="text-muted-foreground">View and revisit products you've recently browsed.</p>
      <div className="p-8 border rounded-lg bg-muted/50">
        <p className="text-center text-sm">Coming soon...</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create Saved Searches page**

Create: `apps/customer/app/dashboard/saved-searches/page.tsx`

```typescript
export default function SavedSearchesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Saved Searches</h1>
      <p className="text-muted-foreground">Access your saved product filters and searches.</p>
      <div className="p-8 border rounded-lg bg-muted/50">
        <p className="text-center text-sm">Coming soon...</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create Prescriptions page**

Create: `apps/customer/app/dashboard/prescriptions/page.tsx`

```typescript
export default function PrescriptionsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Prescriptions</h1>
      <p className="text-muted-foreground">Upload and manage your medical prescriptions.</p>
      <div className="p-8 border rounded-lg bg-muted/50">
        <p className="text-center text-sm">Coming soon...</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create Insurance page**

Create: `apps/customer/app/dashboard/insurance/page.tsx`

```typescript
export default function InsurancePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Insurance Information</h1>
      <p className="text-muted-foreground">Manage your insurance details for medical purchases.</p>
      <div className="p-8 border rounded-lg bg-muted/50">
        <p className="text-center text-sm">Coming soon...</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create Privacy page**

Create: `apps/customer/app/dashboard/privacy/page.tsx`

```typescript
export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Privacy Settings</h1>
      <p className="text-muted-foreground">Manage your data and consent preferences.</p>
      <div className="p-8 border rounded-lg bg-muted/50">
        <p className="text-center text-sm">Coming soon...</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Commit all placeholder pages**

```bash
git add apps/customer/app/dashboard/communication/page.tsx \
        apps/customer/app/dashboard/tracking/page.tsx \
        apps/customer/app/dashboard/recently-viewed/page.tsx \
        apps/customer/app/dashboard/saved-searches/page.tsx \
        apps/customer/app/dashboard/prescriptions/page.tsx \
        apps/customer/app/dashboard/insurance/page.tsx \
        apps/customer/app/dashboard/privacy/page.tsx
git commit -m "feat(customer): add placeholder pages for new sidebar navigation items"
```

---

## Task 5: Manual Verification

**Files:**
- No file changes — manual testing

- [ ] **Step 1: Start the customer app**

Run: `pnpm dev:customer`
Expected: Customer app starts on http://localhost:3000

- [ ] **Step 2: Navigate to customer dashboard**

Open: http://localhost:3000/dashboard
Expected: Dashboard loads successfully

- [ ] **Step 3: Verify sidebar categories**

Check the sidebar shows these categories in order:
1. Dashboard
2. My Account
3. My Orders
4. My Stuff
5. Medical
6. Settings

- [ ] **Step 4: Verify all menu items are clickable**

Click each menu item and verify:
- Page loads (or shows "Coming soon" placeholder)
- No 404 errors
- Active state highlighting works

- [ ] **Step 5: Verify responsive behavior**

Resize browser to mobile width:
- Sidebar collapses to icon-only
- Hovering/clicking shows full menu

- [ ] **Step 6: Screenshot verification (optional)**

Take screenshots of the sidebar in:
- Expanded state
- Collapsed state
- Mobile view

---

## Task 6: Build Verification

**Files:**
- No file changes — build verification

- [ ] **Step 1: Build shared-admin package**

Run: `cd packages/shared-admin && pnpm build`
Expected: Successful build with no errors

- [ ] **Step 2: Build customer app**

Run: `cd apps/customer && pnpm build`
Expected: Successful build with no errors

- [ ] **Step 3: Type checking**

Run: `cd apps/customer && pnpm tsc --noEmit`
Expected: No TypeScript errors

---

## Task 7: Final Documentation

**Files:**
- Modify: `docs/superpowers/specs/2026-06-15-customer-sidebar-design.md`

Update the spec to mark items as implemented.

- [ ] **Step 1: Update spec with implementation status**

Add to the spec file:

```markdown
## Implementation Status

- [x] Icon imports added
- [x] Customer config updated
- [x] Placeholder pages created
- [x] Manual verification passed
- [x] Build verification passed
```

- [ ] **Step 2: Commit spec update**

```bash
git add docs/superpowers/specs/2026-06-15-customer-sidebar-design.md
git commit -m "docs: mark customer sidebar redesign as implemented"
```

---

## Self-Review Checklist

- [ ] Spec coverage: All categories from spec are implemented
- [ ] No placeholders: Every step has complete code
- [ ] Type consistency: Icon names match imports
- [ ] All new routes have placeholder pages

---

## Success Criteria

- [ ] Customer sidebar shows 6 categories: Dashboard, My Account, My Orders, My Stuff, Medical, Settings
- [ ] All menu items are clickable and navigate to valid routes
- [ ] Icons display correctly for all items
- [ ] Active state highlighting works for current route
- [ ] Build passes with no errors
- [ ] New placeholder pages exist for all new routes
