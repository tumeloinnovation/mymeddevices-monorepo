# MyMedDevices - Vendor Web Implementation Plan

## Overview

This document provides a comprehensive, phased implementation plan for the Vendor Web application. The vendor portal serves as the dedicated platform for vendors to manage their store, products, orders, inventory, and earnings.

## Current State

**Existing:**
- Basic Next.js 16 setup with Turbopack
- Basic structure and configuration
- Tailwind CSS + shadcn/ui components configured
- Authentication system integrated with FastAPI backend (shared with Admin/Customer)
- JWT token-based auth with role-based access (admin/vendor/customer/worker)
- Vendor layout, sidebar, and header components
- Basic API client with token injection
- Session management and route protection

**Backend APIs Available:**
- Analytics (Vendor specific)
- Catalog (Vendor specific products)
- Orders (Vendor specific items)
- Inventory (Vendor stock)
- Payments & Earnings (Vendor payouts)
- Notifications System
- Tickets & Support
- Vendor Management (Self-profile)

---

## Phase 1: Foundation & Infrastructure (Week 1)

### 1.1 Vendor Layout & Navigation System

**Components to Build:**
```
apps/vendor-web/components/layout/
├── VendorLayout.tsx           # Main layout wrapper (✅ Complete)
├── VendorSidebar/
│   ├── VendorSidebar.tsx     # Collapsible sidebar (✅ Complete)
│   ├── SidebarNavItem.tsx    # Navigation items
│   ├── SidebarSection.tsx    # Grouped sections
│   └── SidebarUserMenu.tsx   # User profile dropdown
├── VendorHeader/
│   ├── VendorHeader.tsx      # Top header bar (✅ Complete)
│   ├── SearchCommand.tsx    # Cmd+K global search
│   ├── NotificationBell.tsx  # Notifications indicator
│   └── ThemeToggle.tsx       # Dark/light mode toggle
└── MobileNav/
    └── MobileSidebar.tsx     # Mobile-responsive sidebar
```

**Features:**
- Collapsible sidebar with persistent state
- Vendor-specific navigation items
- Breadcrumb navigation
- Mobile responsive design
- Active route highlighting
- Quick actions menu

**Libraries:**
- `nuqs` - URL state management for search params
- `react-hotkeys-hook` - Keyboard shortcuts
- `sonner` - Toast notifications (already installed)
- `@radix-ui/react-tooltip` - Tooltips (already installed)

### 1.2 Vendor Authentication & Authorization

**Components to Build:**
```
apps/vendor-web/lib/auth/
├── auth.ts                  # Auth utilities (✅ Partial)
├── session.ts               # Session management (✅ Complete)
└── permissions.ts           # Permission checks

apps/vendor-web/middleware.ts # Route protection (✅ Complete)
```

**Features:**
- Protected route middleware
- Session management with refresh tokens
- Role-based access control (RBAC)
- Token refresh logic
- Logout with session cleanup
- Vendor-specific permission checks

### 1.3 API Client & Data Fetching

**Components to Build:**
```
apps/vendor-web/lib/api/
├── client.ts                # Base API client (✅ Complete)
├── endpoints/
│   ├── analytics.ts         # Vendor analytics
│   ├── catalog.ts           # Product management
│   ├── orders.ts            # Order operations
│   ├── inventory.ts         # Stock management
│   ├── earnings.ts          # Payouts & commissions
│   ├── profile.ts           # Store profile
│   └── support.ts           # Tickets & help
├── hooks/
│   ├── useAnalytics.ts
│   ├── useCatalog.ts
│   ├── useOrders.ts
│   ├── useInventory.ts
│   └── useEarnings.ts
└── types/
    └── api-responses.ts     # TypeScript types
```

**Features:**
- Type-safe API client with fetch
- Automatic token injection
- Error handling & retry logic
- Loading states management
- Cache invalidation strategies

---

## Phase 2: Dashboard & Store Analytics (Week 2)

### 2.1 Enhanced Vendor Dashboard

**Route:** `/vendor/dashboard`

**Components to Build:**
```
apps/vendor-web/app/vendor/dashboard/
├── page.tsx                 # Dashboard page (✅ Partial)
└── components/
    ├── VendorStatCard.tsx    # KPI cards (✅ Partial)
    ├── StatCardGrid.tsx     # Grid layout
    ├── RecentOrdersTable.tsx
    ├── LowStockAlerts.tsx    # Stock warnings
    ├── SalesTrendChart.tsx   # Revenue visualization
    ├── TopProductsList.tsx   # Best performers
    └── PendingActions.tsx    # Action queue
```

**Features:**
- Real-time KPI cards (Total Sales, Orders, Products, Low Stock)
- Revenue trends chart (daily/weekly/monthly)
- Recent orders table with quick actions
- Low stock alerts with thresholds
- Pending fulfillments queue
- Top performing products
- Date range picker for filtering
- Quick actions for common tasks

**Libraries:**
- `recharts` - Charts (already installed)
- `@tanstack/react-table` - Data tables (already installed)
- `date-fns` - Date formatting (already installed)
- `react-day-picker` - Date picker (already installed)

### 2.2 Store Analytics Module

**Routes:**
- `/vendor/analytics/overview` - General analytics
- `/vendor/analytics/sales` - Sales deep dive
- `/vendor/analytics/products` - Product performance
- `/vendor/analytics/reports` - Exportable reports

**Components to Build:**
```
apps/vendor-web/app/vendor/analytics/
├── overview/
│   └── page.tsx
├── sales/
│   └── page.tsx
├── products/
│   └── page.tsx
└── components/
    ├── AnalyticsCard.tsx
    ├── TrendChart.tsx
    ├── ComparisonChart.tsx
    ├── MetricCards.tsx
    ├── DateRangeSelector.tsx
    └── ExportButton.tsx
```

**Features:**
- Sales analytics with trends
- Product performance metrics
- Customer acquisition insights
- Conversion metrics
- Period comparisons (WoW, MoM, YoY)
- Exportable reports (CSV, PDF)
- Custom date ranges

---

## Phase 3: Product & Catalog Management (Week 3-4)

### 3.1 Product Management

**Routes:**
- `/vendor/products` - Product listing
- `/vendor/products/new` - Create product
- `/vendor/products/[id]` - Product details/edit
- `/vendor/products/[id]/edit` - Edit product

**Components to Build:**
```
apps/vendor-web/app/vendor/products/
├── page.tsx                 # Product listing (✅ Partial)
├── new/
│   └── page.tsx             # Create product
├── [id]/
│   ├── page.tsx             # Product details
│   └── components/
│       ├── ProductBasicInfo.tsx
│       ├── ProductPricing.tsx
│       ├── ProductInventory.tsx
│       ├── ProductImages.tsx
│       ├── ProductVariants.tsx
│       └── ProductSEO.tsx
└── components/
    ├── ProductsTable.tsx    # Data table (✅ Partial)
    ├── ProductFilters.tsx   # Search & filter
    ├── BulkActionsBar.tsx   # Bulk operations
    ├── ImageUploader.tsx    # Media upload
    ├── StatusBadge.tsx      # Product status
    └── ProductForm.tsx      # Form wrapper
```

**Features:**
- Product listing with search, filters, pagination
- Create/edit product forms
- Image upload with gallery
- Multi-variant support
- Bulk actions (activate, deactivate, delete)
- Category assignment
- SEO metadata management
- Product status (draft, active, inactive)
- Inventory management integration
- Price and margin calculator

### 3.2 Media Management

**Route:** `/vendor/media` - Media library

**Components to Build:**
```
apps/vendor-web/app/vendor/media/
├── page.tsx
└── components/
    ├── MediaGallery.tsx     # Image grid
    ├── MediaUploader.tsx    # Upload interface
    ├── ImageEditor.tsx      # Basic editing
    └── MediaFolder.tsx      # Organization
```

**Features:**
- Image gallery with drag-drop upload
- Image compression and optimization
- Alt text management
- Folder organization
- Bulk image operations

---

## Phase 4: Order & Fulfillment Management (Week 5)

### 4.1 Order Management

**Routes:**
- `/vendor/orders` - Order listing
- `/vendor/orders/[id]` - Order details
- `/vendor/orders/fulfillment` - Fulfillment queue
- `/vendor/orders/returns` - Returns & refunds

**Components to Build:**
```
apps/vendor-web/app/vendor/orders/
├── page.tsx                 # Order listing (✅ Partial)
├── [id]/
│   ├── page.tsx             # Order details
│   └── components/
│       ├── OrderHeader.tsx
│       ├── OrderItems.tsx
│       ├── CustomerInfo.tsx
│       ├── ShippingDetails.tsx
│       ├── PaymentInfo.tsx
│       ├── OrderTimeline.tsx
│       ├── StatusUpdateForm.tsx
│       └── OrderActions.tsx
├── fulfillment/
│   └── page.tsx             # Fulfillment queue
└── components/
    ├── VendorOrdersTable.tsx
    ├── OrderFilters.tsx
    ├── StatusBadge.tsx
    ├── FulfillmentAction.tsx
    └── PackingSlip.tsx
```

**Features:**
- Order listing with advanced filters (date, status, customer)
- Order detail view with all information
- Status update workflow (Pending → Packed → Shipped)
- Fulfillment queue for processing
- Return/refund requests
- Export orders to CSV
- Print packing slips
- Shipping integration display
- Tracking number management

### 4.2 Fulfillment Workflow

**Components to Build:**
```
apps/vendor-web/components/fulfillment/
├── FulfillmentStatusBadge.tsx
├── FulfillmentActionDialog.tsx
├── TrackingInput.tsx
└── PackingSlipGenerator.tsx
```

**Features:**
- Status change workflow
- Tracking number entry
- Shipping label generation
- Bulk fulfillment actions
- Packing slip printing

---

## Phase 5: Inventory & Stock Management (Week 6)

### 5.1 Inventory Management

**Routes:**
- `/vendor/inventory` - Inventory overview
- `/vendor/inventory/products` - Product stock
- `/vendor/inventory/low-stock` - Low stock alerts
- `/vendor/inventory/movements` - Stock movements

**Components to Build:**
```
apps/vendor-web/app/vendor/inventory/
├── page.tsx                 # Inventory overview
├── products/
│   └── page.tsx             # Product stock
├── low-stock/
│   └── page.tsx             # Alerts
├── movements/
│   └── page.tsx             # History
└── components/
    ├── InventoryTable.tsx   # Stock table
    ├── StockLevelCard.tsx    # Status cards
    ├── StockMovementTable.tsx
    ├── LowStockAlert.tsx
    ├── BulkStockUpdate.tsx   # Quick adjustments
    └── StockAdjustDialog.tsx
```

**Features:**
- Inventory overview with stock levels
- Low stock alerts with thresholds
- Stock in/out management
- Stock movement history
- Bulk stock updates
- Warehouse/location tracking
- Forecasting suggestions
- Automatic reorder points

### 5.2 Stock Management Components

**Components to Build:**
```
apps/vendor-web/components/inventory/
├── StockStatusBadge.tsx
├── StockAdjustForm.tsx
├── StockHistory.tsx
└── ReorderSuggestion.tsx
```

**Features:**
- Real-time stock status
- Quick adjust interface
- Historical tracking
- Reorder recommendations

---

## Phase 6: Earnings, Payouts & Finance (Week 7)

### 6.1 Earnings & Payouts

**Routes:**
- `/vendor/earnings` - Earnings overview
- `/vendor/earnings/payouts` - Payout history
- `/vendor/earnings/statements` - Earning statements
- `/vendor/earnings/settings` - Payment methods

**Components to Build:**
```
apps/vendor-web/app/vendor/earnings/
├── page.tsx                 # Earnings overview (✅ Partial)
├── payouts/
│   └── page.tsx             # Payout history
├── statements/
│   └── page.tsx             # Statements
├── settings/
│   └── page.tsx             # Payment settings
└── components/
    ├── EarningsSummary.tsx   # Summary cards (✅ Partial)
    ├── PayoutHistoryTable.tsx
    ├── CommissionBreakdown.tsx
    ├── EarningsChart.tsx
    ├── PaymentMethodForm.tsx
    └── PayoutStatusBadge.tsx
```

**Features:**
- Earnings summary cards (Total, Pending, Available)
- Payout history with status
- Commission transparency
- Platform fee breakdown
- Payment method management (M-Pesa, Bank)
- Payout scheduling
- Earnings statements export
- Tax reporting

### 6.2 Financial Analytics

**Components to Build:**
```
apps/vendor-web/components/finance/
├── RevenueChart.tsx
├── MarginCalculator.tsx
├── CommissionDisplay.tsx
└── PayoutQueue.tsx
```

**Features:**
- Revenue visualization
- Margin analysis
- Commission tracking
- Payout queue management

---

## Phase 7: Store Profile & Support (Week 8)

### 7.1 Store Profile Management

**Routes:**
- `/vendor/settings/profile` - Store profile
- `/vendor/settings/policies` - Store policies
- `/vendor/settings/shipping` - Shipping settings

**Components to Build:**
```
apps/vendor-web/app/vendor/settings/
├── profile/
│   └── page.tsx             # Store profile (✅ Partial)
├── policies/
│   └── page.tsx             # Return/shipping policies
├── shipping/
│   └── page.tsx             # Shipping configuration
└── components/
    ├── StoreProfileForm.tsx   # Profile editor (✅ Partial)
    ├── LogoUploader.tsx
    ├── PolicyEditor.tsx
    ├── ShippingConfig.tsx
    └── BusinessHours.tsx
```

**Features:**
- Store profile editor (Name, Logo, Description)
- Contact information management
- Business hours
- Return policy configuration
- Shipping policy settings
- Store banner image
- SEO settings for store page
- Social media links

### 7.2 Support & Notifications

**Routes:**
- `/vendor/support/tickets` - Support tickets
- `/vendor/support/tickets/[id]` - Ticket detail
- `/vendor/settings/notifications` - Notification preferences
- `/vendor/settings/security` - Security settings

**Components to Build:**
```
apps/vendor-web/app/vendor/support/
├── tickets/
│   ├── page.tsx             # Ticket list
│   └── [id]/page.tsx        # Ticket detail
└── components/
    ├── TicketsTable.tsx
    ├── TicketDetail.tsx
    ├── NewTicketDialog.tsx
    └── ReplyForm.tsx

apps/vendor-web/app/vendor/settings/notifications/
├── page.tsx
└── components/
    ├── NotificationPreferences.tsx
    ├── EmailSettings.tsx
    └── AlertConfig.tsx

apps/vendor-web/app/vendor/settings/security/
├── page.tsx
└── components/
    ├── PasswordChangeForm.tsx
    ├── TwoFactorSetup.tsx
    └── SessionList.tsx
```

**Features:**
- Support ticket creation
- Ticket conversation view
- Notification preferences (Order, Stock, Payout alerts)
- Email/SMS settings
- Password change
- Two-factor authentication
- Active sessions management
- Security logs

---

## UI Components Library

### Shared Components (from shared-ui)
- ✅ Button, Input, Select, Checkbox, Radio
- ✅ Card, Dialog, Sheet, Popover
- ✅ Table, Pagination, Scroll Area
- ✅ Tabs, Accordion, Collapsible
- ✅ Alert, Toast, Skeleton
- ✅ Tooltip, Hover Card
- ✅ Calendar, Date Picker
- ✅ Form components with react-hook-form

### Vendor-Specific Components to Build
```
apps/vendor-web/components/vendor/
├── dashboard/
│   ├── VendorStatCard.tsx
│   ├── SalesTrendChart.tsx
│   └── TopProductsList.tsx
├── products/
│   ├── ProductForm.tsx
│   ├── MediaUploader.tsx
│   └── VariantManager.tsx
├── orders/
│   ├── VendorOrderTable.tsx
│   ├── FulfillmentStatusBadge.tsx
│   └── FulfillmentActionDialog.tsx
├── inventory/
│   ├── StockLevelCard.tsx
│   ├── StockAdjustForm.tsx
│   └── LowStockAlert.tsx
├── finance/
│   ├── EarningsSummary.tsx
│   ├── PayoutStatusTable.tsx
│   └── CommissionBreakdown.tsx
└── shared/
    ├── VendorPageHeader.tsx
    ├── EmptyState.tsx
    └── LoadingState.tsx
```

---

## Technical Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand
- **Form Handling:** react-hook-form + Zod
- **Data Fetching:** Fetch API (base) / Consider React Query
- **Charts:** Recharts
- **Icons:** Lucide React

---

## Recommended Additional Libraries

### Already Installed
- ✅ `next` 16.0.7
- ✅ `react` 19.2.1
- ✅ `@radix-ui/*` - All UI primitives
- ✅ `tailwindcss` 4.1.17
- ✅ `recharts` - Charts
- ✅ `@tanstack/react-table` - Tables
- ✅ `react-hook-form` - Forms
- ✅ `zod` - Validation
- ✅ `date-fns` - Dates
- ✅ `lucide-react` - Icons
- ✅ `sonner` - Toasts
- ✅ `zustand` - State management

### Consider Adding
- `@tanstack/react-query` - Data fetching & caching
  ```bash
  pnpm add @tanstack/react-query
  ```
- `nuqs` - URL state management
  ```bash
  pnpm add nuqs
  ```
- `react-hotkeys-hook` - Keyboard shortcuts
  ```bash
  pnpm add react-hotkeys-hook
  ```
- `xlsx` - Excel export
  ```bash
  pnpm add xlsx
  ```
- `react-dropzone` - File uploads
  ```bash
  pnpm add react-dropzone
  ```

---

## Implementation Priority Matrix

### High Priority (Must Have)
1. ✅ Vendor Layout & Navigation
2. ✅ Authentication & Authorization
3. ✅ API Client Setup
4. ⏳ Enhanced Dashboard
5. ⏳ Product Management
6. ⏳ Order Management
7. ⏳ Inventory Management
8. ⏳ Earnings & Payouts

### Medium Priority (Should Have)
1. Store Analytics
2. Media Management
3. Fulfillment Workflow
4. Stock Movement Tracking
5. Store Profile Management
6. Support Tickets
7. Notification Settings

### Low Priority (Nice to Have)
1. Advanced Analytics
2. Commission Calculator
3. Batch Operations
4. Shipping Integration
5. Two-Factor Authentication

---

## File Structure Overview

```
apps/vendor-web/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── vendor/
│   │   ├── dashboard/
│   │   ├── analytics/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── inventory/
│   │   ├── earnings/
│   │   ├── support/
│   │   └── settings/
│   │       ├── profile/
│   │       ├── notifications/
│   │       └── security/
│   └── layout.tsx
├── components/
│   ├── layout/          # Layout components
│   ├── vendor/          # Vendor-specific components
│   └── ui/              # Import from shared-ui
├── lib/
│   ├── api/             # API client & endpoints
│   ├── auth/            # Auth utilities
│   ├── hooks/           # Custom hooks
│   ├── utils/           # Helper functions
│   └── validations/     # Zod schemas
└── types/
    └── index.ts         # TypeScript types
```

---

## Next Steps

1. **Complete Phase 2** - Enhanced Dashboard with real data
2. **Build Phase 3** - Product & Catalog Management
3. **Implement Phase 4** - Order & Fulfillment Management
4. **Execute Phase 5** - Inventory & Stock Management
5. **Finalize Phase 6** - Earnings, Payouts & Finance
6. **Complete Phase 7** - Store Profile & Support

---

## Notes

- All API routes are already available in the FastAPI backend
- Authentication is JWT-based with refresh token support
- Role-based access control is implemented in the backend
- RLS (Row Level Security) ensures vendors only see their data
- All components should support dark mode (already configured)
- Mobile responsiveness is required for all pages
- Use existing shared-ui components where possible
- Vendor-specific data filtering is applied at API level
