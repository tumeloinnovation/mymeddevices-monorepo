# MyMedDevices Customer Portal (`apps/customer`)

> [!TIP]
> For the complete step-by-step user journey, prescription gate, checkout, and M-Pesa payment flow diagrams, see [Customer Feature Flow](file:///home/nickm/Developer/company/MyMedDevices/apps/customer/FLOW.md).


The Customer Portal is the primary B2C and healthcare procurement e-commerce web application where customers browse medical equipment catalogs, add items to cart, checkout with M-Pesa, manage prescriptions, and track orders.

---

## Technical Stack & Configuration

- **Framework**: Next.js 16.0.7 (App Router)
- **Port**: `:3000`
- **React**: 19.2.1
- **State Management**: Zustand 5.0 (`useAuthStore`, `useCartStore`) + TanStack React Query 5.100 + `nuqs`
- **Forms & Validation**: `react-hook-form` + Zod v3/v4 (`standardSchemaResolver`)
- **Styling**: Tailwind CSS v4 + `@import "tw-animate-css";` + Framer Motion 12
- **Integrations**: Google Maps JS API (Address picker), Sonner (Toasts)

---

## Page Route Map

```
apps/customer/app/
├── (shop)/                  # Storefront catalog routes
│   ├── page.tsx             # Home page (Hero, Categories, Best Sellers)
│   ├── products/            # Catalog search & filtered grid
│   ├── products/[slug]/     # Public product detail page
│   ├── categories/          # Category browser
│   ├── brands/              # Brand browser
│   ├── cart/                # Active shopping cart
│   └── wishlist/            # Saved wishlist items
├── checkout/                # Multi-step checkout (Address, Shipping, M-Pesa)
├── dashboard/               # Customer Account Portal
│   ├── overview             # Account summary & stats
│   ├── orders               # Order history & status timeline
│   ├── prescriptions        # Uploaded medical prescriptions
│   ├── addresses            # Saved delivery & billing addresses
│   ├── payment-methods      # Tokenized payment methods
│   ├── insurance            # Insurance policy details
│   ├── loyalty              # Loyalty tier & points ledger
│   ├── coupons              # Active promotional codes
│   ├── tickets              # Support tickets portal
│   └── returns              # Order return requests
├── (website)/               # Marketing & legal pages
│   ├── about-us, contact-us, privacy-policy, return-policy, terms
└── login/                   # Redirects to home page inline login modal (?login=true)
```

---

## Auth & Hybrid Cart Behavior

1. **Inline Login Modal**: Visiting `/login` opens the standard authentication modal overlay on top of the storefront (`/?login=true`).
2. **Hybrid Cart Management**:
   - Guest items are maintained locally in Zustand `useCartStore` (`localStorage`).
   - Upon successful login/registration, `syncLocalItemsToBackend()` merges guest items into the customer's remote backend cart seamlessly.

---

## Key Development Commands

```sh
# Run dev server standalone on port 3000
pnpm --filter=customer dev

# Type check application
pnpm --filter=customer exec tsc --noEmit

# Build production bundle
pnpm --filter=customer build
```

---

## Environment Variables

Defined in `apps/customer/.env`:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:8000`)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps JavaScript API key
- `NEXT_PUBLIC_GOOGLE_MAP_ID`: Google Maps Map ID
