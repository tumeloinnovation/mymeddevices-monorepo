# Customer Sidebar Navigation Design

**Date:** 2026-06-15
**Status:** Approved
**Theme:** Customer Portal Sidebar Redesign

## Overview

Redesign the customer sidebar navigation to use an account-focused grouping with enhanced items relevant to a medical device marketplace. The sidebar will be served by the existing shared `DashboardLayout` component from `@mymeddevices/shared-admin`.

## Goals

- Reorganize navigation items into account-focused categories
- Add new items relevant to medical device marketplace customers
- Maintain existing functionality while improving discoverability
- Use the shared layout infrastructure (no custom sidebar implementation)

## Category Structure

| Category | Items | Icon | Route |
|----------|-------|------|-------|
| **Dashboard** | Dashboard | `LayoutDashboardIcon` | `/dashboard` |
| **My Account** | Profile, Payment Methods, Addresses, Communication | `UsersIcon` | — |
| **My Orders** | Orders, Returns, Order Tracking | `ShoppingCartIcon` | — |
| **My Stuff** | Wishlist, Recently Viewed, Saved Searches | `HeartIcon` | — |
| **Medical** | Prescriptions, Insurance | `FileTextIcon` | — |
| **Settings** | Preferences, Security, Privacy | `SettingsIcon` | — |

## Full Navigation Tree

```
Dashboard
  └── /dashboard

My Account
  ├── Profile → /dashboard/profile
  ├── Payment Methods → /dashboard/payment-methods
  ├── Addresses → /dashboard/addresses
  └── Communication → /dashboard/communication

My Orders
  ├── Orders → /dashboard/orders
  ├── Returns → /dashboard/returns
  └── Order Tracking → /dashboard/tracking

My Stuff
  ├── Wishlist → /dashboard/wishlist
  ├── Recently Viewed → /dashboard/recently-viewed
  └── Saved Searches → /dashboard/saved-searches

Medical
  ├── Prescriptions → /dashboard/prescriptions
  └── Insurance → /dashboard/insurance

Settings
  ├── Preferences → /dashboard/preferences
  ├── Security → /dashboard/security
  └── Privacy → /dashboard/privacy
```

## Changes from Current

### Renamed Categories
- "Overview" → "Dashboard"
- "Shopping" → "My Orders"
- "Account" → "My Account"
- "Settings" → "Settings" (unchanged)

### New Category
- "My Stuff" — Personal collections and saved items
- "Medical" — Medical-specific features (prescriptions, insurance)

### Moved Items
- Wishlist: Account → My Stuff

### New Items Added
1. **Communication** (`/dashboard/communication`) — Email/SMS notification preferences
2. **Order Tracking** (`/dashboard/tracking`) — Active delivery tracking
3. **Recently Viewed** (`/dashboard/recently-viewed`) — Browse history
4. **Saved Searches** (`/dashboard/saved-searches`) — Saved product filters
5. **Prescriptions** (`/dashboard/prescriptions`) — Upload/manage prescriptions
6. **Insurance** (`/dashboard/insurance`) — Insurance information storage
7. **Privacy** (`/dashboard/privacy`) — Data and consent management

## Icon Requirements

Icons from `lucide-react`:
- `LayoutDashboardIcon` — Dashboard
- `UsersIcon` — My Account
- `ShoppingCartIcon` — My Orders
- `HeartIcon` — My Stuff
- `FileTextIcon` — Medical
- `SettingsIcon` — Settings

Sub-item icons (optional but recommended):
- `CreditCardIcon` — Payment Methods
- `MapPinIcon` — Addresses
- `BellIcon` — Communication
- `TruckIcon` — Order Tracking
- `ClockIcon` — Recently Viewed
- `SearchIcon` — Saved Searches
- `FileTextIcon` — Prescriptions
- `ShieldIcon` — Insurance
- `LockIcon` — Security
- `EyeIcon` — Privacy

## Implementation Notes

### Location
The navigation config is in:
```
packages/shared-admin/src/components/dashboard-layout.tsx
```

Specifically, the `DEFAULT_NAV_CONFIG.customer` constant (lines 236-267).

### Current Config
```tsx
customer: [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
    ],
  },
  {
    label: "Shopping",
    items: [
      { label: "Orders", href: "/dashboard/orders", icon: ShoppingCartIcon },
      { label: "Wishlist", href: "/dashboard/wishlist", icon: MessageSquareIcon },
      { label: "Addresses", href: "/dashboard/addresses", icon: StoreIcon },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Profile", href: "/dashboard/profile", icon: UsersIcon },
      { label: "Payment Methods", href: "/dashboard/payment-methods", icon: CreditCardIcon },
      { label: "Returns", href: "/dashboard/returns", icon: AlertCircleIcon },
      { label: "Support", href: "/dashboard/support", icon: MessageSquareIcon },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Preferences", href: "/dashboard/preferences", icon: SettingsIcon },
      { label: "Security", href: "/dashboard/security", icon: CogIcon },
    ],
  },
],
```

### Changes Required

1. Update the `DEFAULT_NAV_CONFIG.customer` constant with the new structure
2. Import any new icons from `lucide-react` (HeartIcon, FileTextIcon for categories, plus sub-item icons)
3. Ensure the customer app's `DashboardLayout` uses the updated shared config

## Pages to Create (Future Work)

The following pages will need to be created. They can show placeholder/to-be-implemented states initially:

- `/dashboard/communication`
- `/dashboard/tracking`
- `/dashboard/recently-viewed`
- `/dashboard/saved-searches`
- `/dashboard/prescriptions`
- `/dashboard/insurance`
- `/dashboard/privacy`

## Success Criteria

- [ ] Navigation config updated with new categories and items
- [ ] All icons imported and displaying correctly
- [ ] Customer sidebar reflects the new structure
- [ ] Active state highlighting works for all routes
- [ ] Collapsible categories (if any items have children) work correctly
- [ ] Navigation is responsive on mobile (sidebar collapse)

## Dependencies

- Shared layout component: `@mymeddevices/shared-admin`
- Icons: `lucide-react`
- Customer app: Next.js 16 with App Router
