# MyMedDevices Monorepo — Agent Guide

## Overview

**MyMedDevices** is a healthcare medical device procurement marketplace operating in Kenya. It connects healthcare providers, clinics, and individual customers with certified medical equipment vendors.

The monorepo consists of **3 Next.js frontend web applications** and **1 Python FastAPI backend service**, supported by shared packages (`@mymeddevices/shared-core`, `@mymeddevices/shared-ui`, `@mymeddevices/shared-admin`, assets).

---

## Quick Start

```sh
pnpm install                          # install all monorepo dependencies
pnpm dev:backend                      # Python FastAPI (uvicorn, :8000)
pnpm dev:customer                     # Next.js customer portal (:3000)
pnpm dev:admin                        # Next.js admin portal (:3001)
pnpm dev:vendor                       # Next.js vendor portal (:3002)
pnpm dev                              # Run all applications concurrently via Turbo
pnpm build                            # Build all applications and packages
pnpm --filter=<app> exec tsc --noEmit # Type-check single frontend app
```

---

## Structure & Topology

```
MyMedDevices/
├── apps/
│   ├── admin/          # Next.js 16 — Internal admin portal (:3001)
│   ├── customer/       # Next.js 16 — B2C & healthcare procurement portal (:3000)
│   ├── vendor/         # Next.js 16 — B2B seller dashboard & inventory management (:3002)
│   ├── driver-mobile/  # Expo React Native — Delivery driver mobile app
│   └── backend/        # Python 3.12 FastAPI + asyncpg + Async SQLAlchemy 2.0 (:8000)
├── packages/
│   ├── shared-core/    # Zustand stores, API client, auth, types, services (@mymeddevices/shared-core)
│   ├── shared-ui/      # Reusable Radix UI primitives, design tokens (@mymeddevices/shared-ui)
│   ├── shared-admin/   # Shared back-office layout shells & admin forms (@mymeddevices/shared-admin)
│   └── assets/         # Source logos & branding assets
└── docs/               # Monorepo architecture, API references, and conventions
    ├── ARCHITECTURE.md # Detailed system design & domain maps
    ├── API_REFERENCE.md# Complete API endpoint specification
    └── CONVENTIONS.md  # Engineering patterns and code standards
```

---

## Framework Quirks & Critical Rules

- **Next.js 16.0.7 / 16.2.9**: Breaking changes present — check `node_modules/next/dist/docs/` before implementing complex server/client patterns.
- **Zod v4 Schema Validation**:
  - `z.infer`, `z.object` work as usual, but `_def` internal structure is updated.
  - **NEVER** import `zodResolver` from `@hookform/resolvers/zod`.
  - **ALWAYS** use `standardSchemaResolver` from `@hookform/resolvers/standard-schema`.
- **Tailwind CSS v4**: Uses `@import "tailwindcss";` in `globals.css` via `@tailwindcss/postcss`. Avoid `@tailwind` directives.
- **Tailwind Class Convention**: Prefer `flex flex-col gap-*` over legacy `space-y-*` helpers.
- **shadcn Scope**: Installed in the **vendor** app and `shared-ui` package primitives. Admin and customer use CSS variable systems. **Do NOT** `pnpm add shadcn` to admin or customer apps directly (breaks resolver package mapping).
- **framer-motion**: Available in all three frontend web applications (`v12`).

---

## Architecture & Data Flow

```
[ Customer Portal :3000 ]  \
[ Admin Portal    :3001 ]  ---> Next.js Proxy (/api/v1/*) ---> [ FastAPI Backend :8000 ]
[ Vendor Portal   :3002 ]  /                                             |
                                                                  +------+------+
                                                                  |             |
                                                             PostgreSQL       Redis
                                                            (or SQLite)   (Limits/Blacklist)
```

- **API Rewrites**: Each Next.js app proxies requests from `/api/v1/*` to `http://localhost:8000/api/v1/*`, eliminating client-side CORS issues in local development.
- **CORS**: Backend explicitly permits requests from origins `:3000`, `:3001`, `:3002`, and `127.0.0.1`.

---

## Backend Domains (Domain-Driven Architecture)

The backend (`apps/backend/app/domains/`) is structured into **12 domain modules**:

1. **`auth`**: Identity, JWT token generation, refresh tokens, OTP SMS/Email, user device sessions.
2. **`catalog`**: Products, medical classifications (KMPDB, PPB, CE/FDA), categories, brands, tags, AI assistant (Google Gemini).
3. **`customers`**: Customer profiles, avatars, delivery addresses, loyalty points ledger, wishlists, reviews.
4. **`payments`**: M-Pesa Daraja STK Push, callbacks, payment methods, transaction ledgers, refunds.
5. **`shopping`**: Guest/customer shopping carts, item snapshots, cart merging, coupon validation, checkout validation, orders, shipments.
6. **`vendor`**: Vendor store profiles, payout options (M-Pesa / Bank), sales analytics, order item fulfillment.
7. **`admin`**: System status, dynamic rate limiting, user stats, vendor application moderation.
8. **`tickets`**: Support ticket management, priority tracking, staff response threads.
9. **`returns`**: Order return requests, approval workflows, refund triggers.
10. **`recommendations`**: AI/trending product recommendation engine.
11. **`users`**: General user profile management.
12. **`shared`**: Base SQLAlchemy mixins (`IDMixin`, `AuditMixin`, `SoftDeleteMixin`, Outbox pattern).

---

## Key Database Models & Status Enums

- **`User`**: Identity model with `role` (`admin`, `worker`, `vendor`, `customer`, `guest`, `driver`).
- **`VendorProfile`**: Store details with `status` (`pending`, `approved`, `suspended`, `rejected`).
- **`Product`**: Medical item with pricing breakdown (`base_price`, `markup_price`, `commission_fee`, `price`) and regulatory fields (`kmpdb_registration_number`, `ppb_classification`, `ce_marking_or_fda_clearance`). Status: `draft`, `pending_review`, `published`, `archived`.
- **`Order`**: Order header with `status` (`pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`).
- **`OrderItem`**: Per-vendor items with `fulfillment_status` (`pending`, `packed`, `shipped`, `delivered`).
- **`Transaction`**: M-Pesa transaction tracking (`merchant_request_id`, `checkout_request_id`, `mpesa_receipt`).

---

## Shared Package Exports (`@mymeddevices/shared-core`)

All frontend applications consume common logic from `@mymeddevices/shared-core`:

- **Zustand Stores**: `useAuthStore` (auth/roles/demo modes), `useCartStore` (hybrid local/backend cart with merging), `useAddressStore`, `useCompareStore`, `useWishlistStore`, `useCustomerStore`.
- **Services**: `apiClient` (deduplication, auto-refresh), `catalogService`, `vendorService`, `shoppingService`, `usersService`, `systemService`.
- **Auth Guard**: `useAuthGuard(allowedRoles)` and `<AuthGuard>` wrapper component.
- **Types**: Shared TypeScript interfaces for products, categories, orders, carts, users, and OpenAPI response types (`src/types/generated/api.ts`).

---

## Key Development Commands

| Command | Working Dir / Scope | Description |
|---|---|---|
| `pnpm dev:backend` | `apps/backend` | Runs `uv run uvicorn app.main:app --reload` |
| `pnpm --filter=customer dev` | `apps/customer` | Single frontend app dev server |
| `turbo build` | Monorepo root | Builds all apps and packages |
| `uv run alembic upgrade head` | `apps/backend` | Executes database migrations |
| `uv run python scripts/seed_db.py` | `apps/backend` | Seeds development database |
| `cd apps/backend && uv run pytest` | `apps/backend` | Runs backend pytest suite |
| `pnpm --filter=vendor exec tsc --noEmit` | Monorepo root | Type-checks single package/app |

---

## Conventions & Standards

- **Auth Call Pattern**: Call the shared Zustand auth store with role scoping: `login(credentials, "customer")` or `login(credentials, "admin")`.
- **Form Pattern**: Combine `react-hook-form` + `standardSchemaResolver(schema)` using Zod.
- **Logos & Assets**: Source logos reside at `packages/assets/logos/logo-landscape.png`. Reference copied assets as `<img src="/logo.png" />`.
- **File Uploads**: Product images upload to `/static/uploads/products/`, avatars to `/static/uploads/avatars/`. Max file size is 10 MB.
- **Transactional Emails**: Source MJML templates in `apps/backend/templates/` compile to HTML in `compiled_emails/`, rendered via Jinja2.

---

## Deep Documentation Links

- 🏛️ [Architecture & System Design](file:///home/nickm/Developer/company/MyMedDevices/docs/ARCHITECTURE.md)
- 🔌 [Complete API Reference Map](file:///home/nickm/Developer/company/MyMedDevices/docs/API_REFERENCE.md)
- 📐 [Engineering Conventions & Code Standards](file:///home/nickm/Developer/company/MyMedDevices/docs/CONVENTIONS.md)
- 🛒 [Customer Feature Flow](file:///home/nickm/Developer/company/MyMedDevices/apps/customer/FLOW.md)
- 🏪 [Vendor Feature Flow](file:///home/nickm/Developer/company/MyMedDevices/apps/vendor/FLOW.md)
- 🛡️ [Admin Feature Flow](file:///home/nickm/Developer/company/MyMedDevices/apps/admin/FLOW.md)
- ⚙️ [Backend Infrastructure Flow](file:///home/nickm/Developer/company/MyMedDevices/apps/backend/FLOW.md)
- ⚙️ [Backend README](file:///home/nickm/Developer/company/MyMedDevices/apps/backend/README.md)
- 🛍️ [Customer Portal README](file:///home/nickm/Developer/company/MyMedDevices/apps/customer/README.md)
- 🛡️ [Admin Portal README](file:///home/nickm/Developer/company/MyMedDevices/apps/admin/README.md)
- 🏪 [Vendor Portal README](file:///home/nickm/Developer/company/MyMedDevices/apps/vendor/README.md)
- 📦 [Shared Core Package README](file:///home/nickm/Developer/company/MyMedDevices/packages/shared-core/README.md)
- 🎨 [Shared UI Package README](file:///home/nickm/Developer/company/MyMedDevices/packages/shared-ui/README.md)

