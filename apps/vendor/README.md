# MyMedDevices Vendor Portal (`apps/vendor`)

> [!TIP]
> For the complete step-by-step onboarding pipeline, VendorGuard status flow, AI product wizard, inventory, and payout flow diagrams, see [Vendor Feature Flow](file:///home/nickm/Developer/company/MyMedDevices/apps/vendor/FLOW.md).


The Vendor Portal is a dedicated B2B web dashboard for medical equipment vendors to manage product listings, monitor stock levels, execute order item fulfillment, configure store payout settings, and review revenue analytics.

---

## Technical Stack & Configuration

- **Framework**: Next.js 16.0.7 (App Router)
- **Port**: `:3002`
- **React**: 19.2.1
- **State Management**: Zustand 5.0 + TanStack React Query 5.101 + `nuqs`
- **Forms & Validation**: `react-hook-form` + Zod v3/v4 (`standardSchemaResolver`)
- **UI Components**: `shadcn` UI component library primitives installed locally
- **Styling**: Tailwind CSS v4 + Framer Motion 12

---

## Page Route Map

```
apps/vendor/app/
├── (auth)/
│   └── login/               # Vendor login page
├── vendor/                  # Protected Vendor Dashboard (Enforced by VendorGuard)
│   ├── dashboard/           # Store overview, sales metrics, recent orders
│   ├── products/            # Vendor catalog management & creation wizard
│   ├── inventory/           # Stock level adjustment tool
│   ├── orders/              # Order item fulfillment & dispatch status
│   ├── earnings/            # Revenue payouts ledger & M-Pesa/Bank configuration
│   ├── analytics/           # Store traffic & sales analytics charts
│   ├── coupons/             # Vendor-specific promotional codes
│   ├── settings/            # Store profile & business hours
│   └── support/             # Customer support inquiry desk
├── pending-vendor/          # Awaiting platform approval status screen
└── reset-password/          # Password reset workflow
```

---

## Vendor Status Guard Pipeline (`VendorGuard.tsx`)

Access to `/vendor/*` routes is governed by `VendorGuard.tsx`:
- **`pending`**: User redirected to `/pending-vendor` (shows onboarding verification screen).
- **`rejected`**: Access denied with rejection reason.
- **`suspended`**: Access locked with admin contact details.
- **`approved`**: Full access granted to `/vendor/dashboard`.

---

## Key Development Commands

```sh
# Run dev server standalone on port 3002
pnpm --filter=vendor dev

# Type check application
pnpm --filter=vendor exec tsc --noEmit

# Build production bundle
pnpm --filter=vendor build
```

---

## Environment Variables

Defined in `apps/vendor/.env`:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:8000`)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps JavaScript API key
- `NEXT_PUBLIC_GOOGLE_MAP_ID`: Google Maps Map ID
