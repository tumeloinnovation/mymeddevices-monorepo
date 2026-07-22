# MyMedDevices Admin Portal (`apps/admin`)

> [!TIP]
> For the complete step-by-step internal governance workflows, vendor application moderation desk, product catalog oversight, and system gateway flows, see [Admin Feature Flow](file:///home/nickm/Developer/company/MyMedDevices/apps/admin/FLOW.md).


The Admin Portal is an internal management application for marketplace governance, vendor onboardings and approvals, global product catalog moderation, financial tracking, and system configuration.

---

## Technical Stack & Configuration

- **Framework**: Next.js 16.2.9 (App Router)
- **Port**: `:3001`
- **React**: 19.2.4
- **State Management**: Zustand 5.0 + TanStack React Query 5.101 + `nuqs` (URL state)
- **Forms & Validation**: `react-hook-form` + Zod v4 (`standardSchemaResolver`)
- **Styling**: Tailwind CSS v4 + Framer Motion 12
- **Theme**: Warm Orange / Olive back-office theme (`#e0752b`, `#a69d61`)
- **Special Libraries**: `@dnd-kit` (drag-and-drop), `dinero.js` (monetary operations), `xlsx` (data exporting), `socket.io-client` (real-time updates)

---

## Page Route Map

```
apps/admin/app/
├── (auth)/
│   ├── login/               # Admin login page
│   ├── forgot-password/     # Password reset request
│   └── reset-password/      # Password reset confirmation
├── dashboard/
│   ├── page.tsx             # Main admin metrics overview
│   ├── catalog/             # Product catalog control
│   │   ├── products/        # Published product listing moderation
│   │   ├── categories/      # Category taxonomy tree management
│   │   ├── brands/          # Brand approval desk
│   │   └── tags/            # Tag management
│   ├── vendors/             # Vendor application approval desk
│   ├── users/               # Customer & staff user account management
│   ├── payments/            # Financial transaction ledgers & gateways
│   ├── shipping/            # Shipping rates & carrier settings
│   └── shopping/            # Global order management
├── system/                  # System health, SMTP mailer settings, rate limits
├── users/                   # Invite new admin staff members
└── settings/                # Admin profile & security settings
```

---

## Core Components & Shared Layouts

- **`DashboardLayout`**: Shared back-office sidebar layout imported from `@mymeddevices/shared-admin`.
- **`AdminMap`**: Geographical vendor distribution map (`components/admin-map.tsx`).
- **`InviteModal`**: Admin invitation modal (`components/invite-modal.tsx`).

---

## Key Development Commands

```sh
# Run dev server standalone on port 3001
pnpm --filter=admin dev

# Type check application
pnpm --filter=admin exec tsc --noEmit

# Build production bundle
pnpm --filter=admin build
```

---

## Environment Variables

Defined in `apps/admin/.env`:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:8000`)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps JavaScript API key
- `NEXT_PUBLIC_GOOGLE_MAP_ID`: Google Maps Map ID for vector styling
