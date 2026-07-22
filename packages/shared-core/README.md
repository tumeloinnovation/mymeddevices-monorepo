# `@mymeddevices/shared-core`

`@mymeddevices/shared-core` is the primary business logic and state management package in the MyMedDevices monorepo. It exports Zustand stores, API services, token management utilities, authentication route guards, and TypeScript domain models consumed by all frontend applications.

---

## Directory & Package Map

```
packages/shared-core/src/
├── index.ts                 # Package main entry point & re-exports
├── auth/                    # Core Auth Module
│   ├── guards.tsx           # useAuthGuard hook & <AuthGuard> wrapper component
│   ├── store.ts             # Main Zustand authentication store (useAuthStore)
│   ├── token.ts             # Isolated access token accessor (getAccessToken/setAccessToken)
│   └── types.ts             # User roles, AuthUser, and LoginCredentials types
├── hooks/                   # Top-level React hooks (useAuth, useDashboard, useDebounce)
├── services/                # API Service Layer
│   ├── api-client.ts        # Centralized HTTP client (Axios/fetch with refresh)
│   ├── catalog-service.ts   # Products, categories, and brands API
│   ├── shopping-service.ts  # Shopping cart and checkout API
│   ├── users-service.ts     # User management API
│   ├── vendor-service.ts    # Vendor portal services
│   └── system-service.ts    # System status API
├── types/                   # TypeScript Domain Types
│   ├── catalog.ts           # Product, Category, Brand, FilterState interfaces
│   ├── dashboard.ts         # Admin metrics interfaces
│   └── generated/           # OpenAPI / Pydantic generated interfaces
│       ├── api.ts           # 660KB OpenAPI generated TypeScript interface
│       └── pydantic-schemas.ts
└── lib/                     # Stores, validators, and utilities
    ├── store/               # Secondary Zustand stores
    │   ├── useAddressStore.tsx
    │   ├── useCartStore.tsx
    │   ├── useCompareStore.ts
    │   ├── useCustomerStore.tsx
    │   └── useWishlistStore.tsx
    ├── utils/               # Formatters (formatPrice, cn, slugify)
    └── validation/          # Zod validation schemas
```

---

## Key Exported Zustand Stores

### 1. `useAuthStore` (`src/auth/store.ts`)
- **State**: `user`, `accessToken`, `isAuthenticated`, `isLoading`, `isDemo`, `vendorStatus`.
- **Actions**: `login(credentials, role)`, `logout()`, `register()`, `registerVendor()`, `refreshAccessToken()`, `validateSession()`, demo mode handlers (`setDemoCustomer`, `setDemoVendor`).
- **Persistence**: Persisted to `localStorage` under key `"auth-storage"`.

### 2. `useCartStore` (`src/lib/store/useCartStore.tsx`)
- **State**: `items`, `cart` (backend cart entity), `isLoading`, `isSyncing`.
- **Actions**: `addItem`, `updateQuantity`, `removeItem`, `clear`, `syncWithBackend`, `syncLocalItemsToBackend`, `applyCoupon`, `mergeCart`.
- **Persistence**: Persisted under key `"cart-storage"`.

### 3. Additional Stores
- `useAddressStore`: Saved delivery/billing addresses (`"address-storage"`).
- `useCompareStore`: Product comparison items (`"mymed_compare_v1"`).
- `useWishlistStore`: Saved customer wishlists (`"mymed_wishlist_v1"`).

---

## Centralized API Client (`apiClient`)

Located at `src/services/api-client.ts`:
- **Base URL Resolution**:
  - SSR (Server-Side): Uses `process.env.NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`) + `/api/v1`.
  - Browser (Client-Side): Uses relative path `/api/v1` (proxied by Next.js rewrites to prevent CORS).
- **Auto Bearer Token**: Automatically attaches `Authorization: Bearer <token>` from memory.
- **Request Deduplication**: Collapses duplicate simultaneous requests into single in-flight promises.
- **401 Auto Refresh**: Intercepts `401 Unauthorized` responses and executes token refresh automatically (max 1 retry).
