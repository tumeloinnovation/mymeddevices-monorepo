# Phase 1: Foundation & Infrastructure

This phase focuses on establishing the core architecture of the Vendor Portal, including the layout, authentication, and API communication layer.

## Overview

Phase 1 establishes the foundational infrastructure that all subsequent phases will build upon. This includes the vendor-specific layout system, authentication and authorization mechanisms, and the API client layer for backend communication.

---

## 1.1 Vendor Layout & Navigation System

### Current Status
- ✅ `VendorLayout.tsx` main wrapper created
- ✅ `VendorSidebar.tsx` with collapsible states implemented
- ✅ `VendorHeader.tsx` with profile menu created
- ✅ Mobile responsiveness for sidebar implemented
- ✅ Active route highlighting implemented

### Remaining Tasks

#### Enhanced Sidebar Components
**File:** `apps/vendor-web/components/layout/VendorSidebar/`

**Components to Build:**
```tsx
// SidebarNavItem.tsx
interface SidebarNavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  disabled?: boolean;
}

// SidebarSection.tsx
interface SidebarSectionProps {
  title: string;
  items: SidebarNavItemProps[];
  defaultOpen?: boolean;
}

// SidebarUserMenu.tsx
interface SidebarUserMenuProps {
  vendor: {
    name: string;
    storeName: string;
    email: string;
    avatar?: string;
  };
}
```

**Features:**
- Grouped navigation sections
- Notification badges
- Keyboard navigation
- Collapsible sections
- Active state indicators

#### Enhanced Header Components
**File:** `apps/vendor-web/components/layout/VendorHeader/`

**Components to Build:**
```tsx
// SearchCommand.tsx - Cmd+K global search
interface SearchCommandProps {
  onResultClick: (result: SearchResult) => void;
}

// NotificationBell.tsx
interface NotificationBellProps {
  unreadCount: number;
  onOpen: () => void;
}

// ThemeToggle.tsx
interface ThemeToggleProps {}
```

**Features:**
- Global search (Cmd+K) for products, orders
- Notification center with unread count
- Dark/light mode toggle
- Quick action buttons

#### Mobile Navigation
**File:** `apps/vendor-web/components/layout/MobileNav/`

**Components to Build:**
```tsx
// MobileSidebar.tsx
interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}
```

**Features:**
- Full-screen mobile drawer
- Swipe to close gesture
- Touch-friendly navigation

### Navigation Structure

```typescript
const vendorNavItems = [
  {
    section: "Overview",
    items: [
      { href: "/vendor/dashboard", icon: "layout-dashboard", label: "Dashboard" },
      { href: "/vendor/analytics", icon: "bar-chart", label: "Analytics" },
    ]
  },
  {
    section: "Catalog",
    items: [
      { href: "/vendor/products", icon: "package", label: "Products" },
      { href: "/vendor/media", icon: "image", label: "Media Library" },
    ]
  },
  {
    section: "Orders",
    items: [
      { href: "/vendor/orders", icon: "shopping-cart", label: "Orders" },
      { href: "/vendor/fulfillment", icon: "truck", label: "Fulfillment" },
    ]
  },
  {
    section: "Inventory",
    items: [
      { href: "/vendor/inventory", icon: "warehouse", label: "Inventory" },
    ]
  },
  {
    section: "Finance",
    items: [
      { href: "/vendor/earnings", icon: "wallet", label: "Earnings" },
      { href: "/vendor/payouts", icon: "banknote", label: "Payouts" },
    ]
  },
  {
    section: "Settings",
    items: [
      { href: "/vendor/settings/profile", icon: "store", label: "Store Profile" },
      { href: "/vendor/settings/notifications", icon: "bell", label: "Notifications" },
      { href: "/vendor/support", icon: "life-buoy", label: "Support" },
    ]
  },
]
```

---

## 1.2 Authentication & Authorization

### Current Status
- ✅ `middleware.ts` for protected vendor routes configured
- ✅ Session management utilities implemented
- ✅ `PermissionGuard` component handled in useRequireAuth
- ✅ Login redirect and unauthorized handling implemented

### Remaining Tasks

#### Permission System
**File:** `apps/vendor-web/lib/auth/permissions.ts`

```typescript
// Permission definitions
export const VENDOR_PERMISSIONS = {
  // Products
  CREATE_PRODUCT: "vendor:product:create",
  EDIT_PRODUCT: "vendor:product:edit",
  DELETE_PRODUCT: "vendor:product:delete",
  VIEW_PRODUCTS: "vendor:product:view",

  // Orders
  VIEW_ORDERS: "vendor:order:view",
  UPDATE_ORDER_STATUS: "vendor:order:update",
  PROCESS_REFUNDS: "vendor:order:refund",

  // Inventory
  MANAGE_STOCK: "vendor:inventory:manage",
  VIEW_STOCK_MOVEMENTS: "vendor:inventory:view",

  // Finance
  VIEW_EARNINGS: "vendor:finance:view",
  REQUEST_PAYOUT: "vendor:finance:payout",
  VIEW_PAYOUTS: "vendor:finance:payouts:view",

  // Profile
  EDIT_STORE_PROFILE: "vendor:profile:edit",
  MANAGE_NOTIFICATIONS: "vendor:profile:notifications",
} as const;

export type VendorPermission = typeof VENDOR_PERMISSIONS[keyof typeof VENDOR_PERMISSIONS];
```

#### Permission Check Utilities
```typescript
// Permission check functions
export function hasPermission(
  vendor: Vendor | null,
  permission: VendorPermission
): boolean {
  if (!vendor) return false;
  return vendor.permissions.includes(permission);
}

export function requirePermission(
  permission: VendorPermission
): (vendor: Vendor | null) => boolean {
  return (vendor) => hasPermission(vendor, permission);
}
```

### Enhanced Auth Components

**File:** `apps/vendor-web/components/auth/`

```tsx
// PermissionGate.tsx
interface PermissionGateProps {
  permission: VendorPermission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

// Usage example
<PermissionGate permission={VENDOR_PERMISSIONS.EDIT_PRODUCT}>
  <Button>Edit Product</Button>
</PermissionGate>
```

---

## 1.3 API Client & Data Fetching

### Current Status
- ✅ Type-safe `apiClient` with automatic token injection implemented
- ✅ Base API hooks structure created
- ✅ Shared TypeScript interfaces for API responses defined

### Remaining Tasks

#### Endpoint-Specific Clients
**File:** `apps/vendor-web/lib/api/endpoints/`

**1. Analytics Endpoint**
```typescript
// analytics.ts
export const analyticsApi = {
  getDashboard: (period: '7d' | '30d' | '90d') =>
    apiClient.get<DashboardStats>('/vendor/analytics/dashboard', { params: { period } }),

  getSalesTrend: (startDate: string, endDate: string) =>
    apiClient.get<SalesTrendData>('/vendor/analytics/sales', {
      params: { start_date: startDate, end_date: endDate }
    }),

  getTopProducts: (limit = 10) =>
    apiClient.get<TopProduct[]>('/vendor/analytics/top-products', { params: { limit } }),
};
```

**2. Catalog Endpoint**
```typescript
// catalog.ts
export const catalogApi = {
  getProducts: (params: ProductListParams) =>
    apiClient.get<PaginatedResponse<Product>>('/vendor/catalog/products', { params }),

  getProduct: (id: string) =>
    apiClient.get<Product>(`/vendor/catalog/products/${id}`),

  createProduct: (data: CreateProductDto) =>
    apiClient.post<Product>('/vendor/catalog/products', data),

  updateProduct: (id: string, data: UpdateProductDto) =>
    apiClient.patch<Product>(`/vendor/catalog/products/${id}`, data),

  deleteProduct: (id: string) =>
    apiClient.delete(`/vendor/catalog/products/${id}`),

  uploadProductImage: (productId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ProductImage>(
      `/vendor/catalog/products/${productId}/images`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },
};
```

**3. Orders Endpoint**
```typescript
// orders.ts
export const ordersApi = {
  getOrders: (params: OrderListParams) =>
    apiClient.get<PaginatedResponse<VendorOrder>>('/vendor/orders', { params }),

  getOrder: (id: string) =>
    apiClient.get<VendorOrderDetail>(`/vendor/orders/${id}`),

  updateOrderStatus: (orderId: string, itemId: string, status: OrderStatus) =>
    apiClient.patch(`/vendor/orders/${orderId}/items/${itemId}/status`, { status }),

  addTrackingInfo: (orderId: string, itemId: string, tracking: TrackingInfo) =>
    apiClient.post(`/vendor/orders/${orderId}/items/${itemId}/tracking`, tracking),

  generatePackingSlip: (orderId: string) =>
    apiClient.get(`/vendor/orders/${orderId}/packing-slip`, { responseType: 'blob' }),
};
```

**4. Inventory Endpoint**
```typescript
// inventory.ts
export const inventoryApi = {
  getInventory: (params: InventoryParams) =>
    apiClient.get<PaginatedResponse<InventoryItem>>('/vendor/inventory', { params }),

  getStockMovements: (productId?: string) =>
    apiClient.get<StockMovement[]>('/vendor/inventory/movements', {
      params: { product_id: productId }
    }),

  adjustStock: (productId: string, adjustment: StockAdjustment) =>
    apiClient.post(`/vendor/inventory/products/${productId}/adjust`, adjustment),

  bulkAdjustStock: (adjustments: BulkStockAdjustment[]) =>
    apiClient.post('/vendor/inventory/bulk-adjust', { adjustments }),

  getLowStockAlerts: () =>
    apiClient.get<LowStockAlert[]>('/vendor/inventory/low-stock'),
};
```

**5. Earnings Endpoint**
```typescript
// earnings.ts
export const earningsApi = {
  getEarningsSummary: () =>
    apiClient.get<EarningsSummary>('/vendor/earnings/summary'),

  getPayouts: (params: PayoutListParams) =>
    apiClient.get<PaginatedResponse<Payout>>('/vendor/earnings/payouts', { params }),

  requestPayout: (amount: number, method: PayoutMethod) =>
    apiClient.post<PayoutRequest>('/vendor/earnings/payouts/request', {
      amount,
      method
    }),

  getCommissionBreakdown: (orderId: string) =>
    apiClient.get<CommissionBreakdown>(`/vendor/earnings/orders/${orderId}/commission`),

  getEarningsStatement: (startDate: string, endDate: string) =>
    apiClient.get(`/vendor/earnings/statement`, {
      params: { start_date: startDate, end_date: endDate },
      responseType: 'blob'
    }),
};
```

**6. Profile Endpoint**
```typescript
// profile.ts
export const profileApi = {
  getStoreProfile: () =>
    apiClient.get<StoreProfile>('/vendor/settings/profile'),

  updateStoreProfile: (data: UpdateStoreProfileDto) =>
    apiClient.patch<StoreProfile>('/vendor/settings/profile', data),

  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<{ logo_url: string }>('/vendor/settings/profile/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  updatePolicies: (policies: StorePolicies) =>
    apiClient.patch<StorePolicies>('/vendor/settings/profile/policies', policies),
};
```

**7. Support Endpoint**
```typescript
// support.ts
export const supportApi = {
  getTickets: (params: TicketListParams) =>
    apiClient.get<PaginatedResponse<SupportTicket>>('/vendor/support/tickets', { params }),

  getTicket: (id: string) =>
    apiClient.get<SupportTicketDetail>(`/vendor/support/tickets/${id}`),

  createTicket: (data: CreateTicketDto) =>
    apiClient.post<SupportTicket>('/vendor/support/tickets', data),

  replyToTicket: (id: string, message: string) =>
    apiClient.post<TicketReply>(`/vendor/support/tickets/${id}/replies`, { message }),

  getNotificationSettings: () =>
    apiClient.get<NotificationSettings>('/vendor/settings/notifications'),

  updateNotificationSettings: (settings: NotificationSettings) =>
    apiClient.patch<NotificationSettings>('/vendor/settings/notifications', settings),
};
```

#### Custom React Hooks
**File:** `apps/vendor-web/lib/api/hooks/`

**1. useAnalytics**
```typescript
// useAnalytics.ts
export function useAnalytics(period: '7d' | '30d' | '90d' = '30d') {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    analyticsApi.getDashboard(period)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [period]);

  return { data, loading, error, refetch: () => analyticsApi.getDashboard(period).then(setData) };
}
```

**2. useCatalog**
```typescript
// useCatalog.ts
export function useProducts(params: ProductListParams) {
  const [data, setData] = useState<PaginatedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    catalogApi.getProducts(params)
      .then(setData)
      .finally(() => setLoading(false));
  }, [JSON.stringify(params)]);

  const createProduct = useCallback((data: CreateProductDto) => {
    return catalogApi.createProduct(data);
  }, []);

  const updateProduct = useCallback((id: string, data: UpdateProductDto) => {
    return catalogApi.updateProduct(id, data);
  }, []);

  return { data, loading, createProduct, updateProduct };
}
```

**3. useOrders**
```typescript
// useOrders.ts
export function useOrders(params: OrderListParams) {
  const [data, setData] = useState<PaginatedResponse<VendorOrder> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.getOrders(params)
      .then(setData)
      .finally(() => setLoading(false));
  }, [JSON.stringify(params)]);

  const updateStatus = useCallback((orderId: string, itemId: string, status: OrderStatus) => {
    return ordersApi.updateOrderStatus(orderId, itemId, status);
  }, []);

  return { data, loading, updateStatus };
}
```

**4. useInventory**
```typescript
// useInventory.ts
export function useInventory(params: InventoryParams) {
  const [data, setData] = useState<PaginatedResponse<InventoryItem> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    inventoryApi.getInventory(params)
      .then(setData)
      .finally(() => setLoading(false));
  }, [JSON.stringify(params)]);

  const adjustStock = useCallback((productId: string, adjustment: StockAdjustment) => {
    return inventoryApi.adjustStock(productId, adjustment);
  }, []);

  return { data, loading, adjustStock };
}
```

**5. useEarnings**
```typescript
// useEarnings.ts
export function useEarnings() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [payouts, setPayouts] = useState<PaginatedResponse<Payout> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      earningsApi.getEarningsSummary(),
      earningsApi.getPayouts({ page: 1, limit: 10 })
    ])
      .then(([summaryData, payoutsData]) => {
        setSummary(summaryData);
        setPayouts(payoutsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const requestPayout = useCallback((amount: number, method: PayoutMethod) => {
    return earningsApi.requestPayout(amount, method);
  }, []);

  return { summary, payouts, loading, requestPayout };
}
```

---

## Type Definitions

**File:** `apps/vendor-web/lib/api/types/api-responses.ts`

```typescript
// Dashboard & Analytics
export interface DashboardStats {
  total_sales: number;
  total_orders: number;
  total_products: number;
  low_stock_count: number;
  pending_fulfillments: number;
  current_balance: number;
  pending_payouts: number;
  sales_trend: SalesTrendPoint[];
}

export interface SalesTrendPoint {
  date: string;
  sales: number;
  orders: number;
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string;
  image_url?: string;
  total_sold: number;
  revenue: number;
}

// Products
export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  track_inventory: boolean;
  stock_level: number;
  low_stock_threshold: number;
  status: 'active' | 'draft' | 'archived';
  category_id: string;
  category_name: string;
  images: ProductImage[];
  variants?: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt_text?: string;
  position: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_level: number;
}

export interface CreateProductDto {
  name: string;
  sku: string;
  description?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  category_id: string;
  track_inventory: boolean;
  stock_level?: number;
  low_stock_threshold?: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  status?: 'active' | 'draft' | 'archived';
}

// Orders
export interface VendorOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: OrderStatus;
  total_amount: number;
  vendor_amount: number;
  item_count: number;
  created_at: string;
  due_date?: string;
}

export type OrderStatus = 'pending' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface VendorOrderDetail extends VendorOrder {
  shipping_address: Address;
  billing_address: Address;
  items: VendorOrderItem[];
  payment_method: string;
  payment_status: string;
  timeline: OrderTimelineEvent[];
}

export interface VendorOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total: number;
  status: OrderStatus;
  tracking_number?: string;
  tracking_url?: string;
}

export interface Address {
  first_name: string;
  last_name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface OrderTimelineEvent {
  id: string;
  status: OrderStatus;
  message: string;
  created_at: string;
  created_by?: string;
}

export interface TrackingInfo {
  carrier: string;
  tracking_number: string;
  tracking_url?: string;
}

// Inventory
export interface InventoryItem {
  product_id: string;
  product_name: string;
  sku: string;
  stock_level: number;
  low_stock_threshold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  last_updated: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  quantity_change: number;
  previous_level: number;
  new_level: number;
  reason: string;
  reference_id?: string;
  created_at: string;
}

export interface StockAdjustment {
  quantity: number;
  reason: string;
  reference_id?: string;
}

export interface LowStockAlert {
  product_id: string;
  product_name: string;
  sku: string;
  current_level: number;
  threshold: number;
  status: 'warning' | 'critical';
}

// Earnings
export interface EarningsSummary {
  total_balance: number;
  available_for_payout: number;
  pending_payouts: number;
  total_earnings: number;
  current_month_earnings: number;
  last_payout_date?: string;
  next_payout_date?: string;
}

export interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  method: string;
  method_details: Record<string, string>;
  requested_at: string;
  processed_at?: string;
  paid_at?: string;
  failure_reason?: string;
  reference?: string;
}

export interface CommissionBreakdown {
  order_id: string;
  order_number: string;
  total_amount: number;
  platform_fee: number;
  commission_rate: number;
  commission_amount: number;
  vendor_amount: number;
}

export interface PayoutMethod {
  type: 'mpesa' | 'bank';
  details: {
    phone?: string;
    account_name?: string;
    account_number?: string;
    bank_name?: string;
    branch?: string;
  };
}

// Profile
export interface StoreProfile {
  id: string;
  vendor_id: string;
  store_name: string;
  slug: string;
  logo_url?: string;
  banner_url?: string;
  description?: string;
  business_email: string;
  business_phone?: string;
  policies: StorePolicies;
  social_links?: SocialLinks;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface StorePolicies {
  return_policy?: string;
  shipping_policy?: string;
  refund_policy?: string;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
}

export interface UpdateStoreProfileDto {
  store_name?: string;
  description?: string;
  business_email?: string;
  business_phone?: string;
  policies?: StorePolicies;
  social_links?: SocialLinks;
}

// Support
export interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
}

export interface SupportTicketDetail extends SupportTicket {
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  message: string;
  sender: 'vendor' | 'support';
  created_at: string;
  attachments?: string[];
}

export interface NotificationSettings {
  email_notifications: {
    new_orders: boolean;
    low_stock: boolean;
    payout_received: boolean;
    ticket_updates: boolean;
  };
  push_notifications: {
    new_orders: boolean;
    low_stock: boolean;
    payout_received: boolean;
    ticket_updates: boolean;
  };
  sms_notifications: {
    new_orders: boolean;
    payout_received: boolean;
  };
}

// Common
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category_id?: string;
  sort?: 'name' | 'created' | 'price' | 'stock';
  order?: 'asc' | 'desc';
}

export interface OrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort?: 'created' | 'total';
  order?: 'asc' | 'desc';
}

export interface InventoryParams {
  page?: number;
  limit?: number;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  search?: string;
  category_id?: string;
}

export interface PayoutListParams {
  page?: number;
  limit?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
}

export interface TicketListParams {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
}
```

---

## Success Criteria

- [ ] Vendor can successfully log in and access `/vendor/dashboard`
- [ ] Unauthorized users are redirected to `/login`
- [ ] The layout is responsive on mobile, tablet, and desktop
- [ ] Sidebar collapses and persists state
- [ ] API calls include the JWT token automatically
- [ ] Token refresh works seamlessly without user awareness
- [ ] Permission gates correctly hide/show features
- [ ] Navigation highlights active routes
- [ ] Global search (Cmd+K) is functional
- [ ] Notifications bell shows correct unread count
- [ ] Theme toggle switches between dark and light modes

---

## Directory Structure

```
apps/vendor-web/
├── components/
│   ├── layout/
│   │   ├── VendorLayout.tsx                 # ✅ Complete
│   │   ├── VendorSidebar/
│   │   │   ├── VendorSidebar.tsx           # ✅ Complete
│   │   │   ├── SidebarNavItem.tsx          # ⏳ To Build
│   │   │   ├── SidebarSection.tsx           # ⏳ To Build
│   │   │   └── SidebarUserMenu.tsx         # ⏳ To Build
│   │   ├── VendorHeader/
│   │   │   ├── VendorHeader.tsx            # ✅ Complete
│   │   │   ├── SearchCommand.tsx           # ⏳ To Build
│   │   │   ├── NotificationBell.tsx        # ⏳ To Build
│   │   │   └── ThemeToggle.tsx             # ⏳ To Build
│   │   └── MobileNav/
│   │       └── MobileSidebar.tsx            # ⏳ To Build
│   └── auth/
│       └── PermissionGate.tsx              # ⏳ To Build
├── lib/
│   ├── auth/
│   │   ├── auth.ts                          # ✅ Partial
│   │   ├── session.ts                       # ✅ Complete
│   │   └── permissions.ts                   # ⏳ To Build
│   └── api/
│       ├── client.ts                        # ✅ Complete
│       ├── endpoints/
│       │   ├── analytics.ts                 # ⏳ To Build
│       │   ├── catalog.ts                   # ⏳ To Build
│       │   ├── orders.ts                    # ⏳ To Build
│       │   ├── inventory.ts                 # ⏳ To Build
│       │   ├── earnings.ts                   # ⏳ To Build
│       │   ├── profile.ts                    # ⏳ To Build
│       │   └── support.ts                    # ⏳ To Build
│       ├── hooks/
│       │   ├── useAnalytics.ts              # ⏳ To Build
│       │   ├── useCatalog.ts                # ⏳ To Build
│       │   ├── useOrders.ts                 # ⏳ To Build
│       │   ├── useInventory.ts              # ⏳ To Build
│       │   └── useEarnings.ts               # ⏳ To Build
│       └── types/
│           └── api-responses.ts             # ⏳ To Build
└── middleware.ts                             # ✅ Complete
```

---

## Implementation Notes

1. **State Persistence**: Use localStorage for sidebar state and theme preference
2. **Error Handling**: Implement global error boundary for API failures
3. **Loading States**: Show skeleton UI while data is being fetched
4. **Pagination**: Implement consistent pagination across all list views
5. **Search**: Add debounced search inputs for better UX
6. **Accessibility**: Ensure all components meet WCAG 2.1 AA standards
7. **Mobile Optimization**: Test all views on mobile devices
8. **Dark Mode**: Test all components in both light and dark modes

---

## Dependencies to Install

```bash
# URL state management
pnpm add nuqs

# Keyboard shortcuts
pnpm add react-hotkeys-hook

# Excel export (for later phases)
pnpm add xlsx

# File uploads
pnpm add react-dropzone
```
