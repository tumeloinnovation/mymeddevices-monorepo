# Phase 5: Inventory & Stock Management

This phase provides vendors with granular control over product availability through comprehensive stock management tools.

## Overview

Phase 5 enables vendors to manage their inventory levels, track stock movements, receive low stock alerts, and maintain optimal stock levels. Effective inventory management prevents stockouts and overstocking.

---

## 5.1 Inventory Management

### Routes
- `/vendor/inventory` - Inventory overview
- `/vendor/inventory/products` - Product stock list
- `/vendor/inventory/low-stock` - Low stock alerts
- `/vendor/inventory/movements` - Stock movement history
- `/vendor/inventory/adjust` - Quick adjust interface

### Current Status
- ✅ Real-time inventory adjustment UI with quick actions
- ✅ Stock status badges (In Stock, Low Stock, Out of Stock)
- ✅ Threshold alerts for low stock (Visual indicators)
- ✅ Stock movement history log (UI hook implemented)

### Remaining Tasks

#### Inventory Overview Page
**File:** `apps/vendor-web/app/vendor/inventory/page.tsx`

```tsx
export default function InventoryOverviewPage() {
  return (
    <VendorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Inventory"
          description="Manage your stock levels"
          action={
            <Button onClick={() => navigate('/vendor/inventory/adjust')}>
              <Plus className="mr-2 h-4 w-4" />
              Quick Adjust
            </Button>
          }
        />

        {/* Summary Cards */}
        <InventorySummaryCards />

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <InventoryValueChart />
          <StockTrendChart />
        </div>

        {/* Low Stock Alerts */}
        <LowStockAlertsSection />

        {/* Recent Movements */}
        <RecentStockMovements />
      </div>
    </VendorLayout>
  );
}
```

#### Inventory Summary Cards
**File:** `apps/vendor-web/app/vendor/inventory/components/InventorySummaryCards.tsx`

```tsx
interface InventorySummaryCardsProps {
  summary: InventorySummary;
}

interface InventorySummary {
  totalProducts: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalInventoryValue: number;
  totalStock: number;
}

// Cards display:
// 1. Total Products
// 2. In Stock (with percentage)
// 3. Low Stock (with count)
// 4. Out of Stock (with count)
// 5. Total Stock (units)
// 6. Inventory Value (currency)
```

#### Inventory Products Page
**File:** `apps/vendor-web/app/vendor/inventory/products/page.tsx`

```tsx
export default function InventoryProductsPage() {
  return (
    <VendorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Product Stock"
          description="View and manage stock levels for all products"
          action={
            <Button onClick={() => setBulkAdjustOpen(true)}>
              <Package className="mr-2 h-4 w-4" />
              Bulk Adjust
            </Button>
          }
        />

        <InventoryFilters />

        <InventoryTable />
      </div>
    </VendorLayout>
  );
}
```

#### Inventory Table Component
**File:** `apps/vendor-web/app/vendor/inventory/components/InventoryTable.tsx`

```tsx
interface InventoryTableProps {
  inventory: InventoryItem[];
  loading?: boolean;
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  onQuickAdjust: (productId: string, adjustment: StockAdjustment) => void;
  onProductClick: (productId: string) => void;
}

// Table columns
const columns = [
  {
    id: 'select',
    header: ({ table }) => <Checkbox {...{ checked: table.getIsAllRowsSelected(), onChange: table.getToggleAllRowsSelectedHandler() }} />,
    cell: ({ row }) => <Checkbox {...{ checked: row.getIsSelected(), onChange: row.getToggleSelectedHandler() }} />,
  },
  {
    id: 'product',
    header: 'Product',
    cell: ({ row }) => (
      <InventoryProductCell
        name={row.original.product_name}
        sku={row.original.sku}
        image={row.original.image}
        variants={row.original.variants}
        onClick={() => onProductClick(row.original.product_id)}
      />
    ),
  },
  {
    id: 'stock_level',
    header: 'Stock Level',
    cell: ({ row }) => (
      <StockLevelDisplay
        level={row.original.stock_level}
        threshold={row.original.low_stock_threshold}
        trackInventory={row.original.track_inventory}
      />
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <InventoryStatusBadge status={row.original.status} />,
  },
  {
    id: 'value',
    header: 'Inventory Value',
    cell: ({ row }) => (
      <InventoryValueDisplay
        quantity={row.original.stock_level}
        costPrice={row.original.cost_price}
      />
    ),
  },
  {
    id: 'last_updated',
    header: 'Last Updated',
    cell: ({ row }) => <RelativeDate date={row.original.last_updated} />,
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <InventoryActionsMenu
        productId={row.original.product_id}
        onQuickAdjust={() => handleQuickAdjust(row.original)}
        onViewHistory={() => navigate(`/vendor/inventory/movements?product=${row.original.product_id}`)}
        onEditThreshold={() => handleEditThreshold(row.original)}
      />
    ),
  },
];
```

**Features:**
- Checkbox for bulk selection
- Product name with image and SKU
- Stock level with visual indicator
- Status badge (In Stock, Low Stock, Out of Stock)
- Inventory value calculation
- Last updated timestamp
- Quick adjust action
- View history action
- Edit threshold action
- Sortable columns

#### Inventory Cell Components

**InventoryProductCell.tsx**
```tsx
interface InventoryProductCellProps {
  name: string;
  sku: string;
  image?: string;
  variants?: ProductVariant[];
  onClick: () => void;
}
```

**StockLevelDisplay.tsx**
```tsx
interface StockLevelDisplayProps {
  level: number;
  threshold: number;
  trackInventory: boolean;
}

// Shows:
// - Current stock level (large)
// - Threshold (smaller)
// - Visual bar with percentage
// - Color-coded (green, orange, red)
// - "Not tracking" if disabled
```

**InventoryStatusBadge.tsx**
```tsx
interface InventoryStatusBadgeProps {
  status: InventoryStatus;
  size?: 'sm' | 'md';
}

type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

// Badge colors
// In Stock: Green
// Low Stock: Orange
// Out of Stock: Red
```

**InventoryValueDisplay.tsx**
```tsx
interface InventoryValueDisplayProps {
  quantity: number;
  costPrice?: number;
  currency?: string;
}

// Displays inventory value
// Quantity × Cost Price
// Shows "—" if cost price not set
```

---

## 5.2 Low Stock Alerts

### Low Stock Page
**File:** `apps/vendor-web/app/vendor/inventory/low-stock/page.tsx`

```tsx
export default function LowStockPage() {
  return (
    <VendorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Low Stock Alerts"
          description="Products that need restocking"
          action={
            <Button onClick={handleBulkRestock}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Bulk Restock
            </Button>
          }
        />

        <LowStockFilters />

        <LowStockTable />
      </div>
    </VendorLayout>
  );
}
```

#### Low Stock Table
**File:** `apps/vendor-web/app/vendor/inventory/components/LowStockTable.tsx`

```tsx
interface LowStockTableProps {
  alerts: LowStockAlert[];
  onQuickRestock: (productId: string, quantity: number) => void;
  onViewProduct: (productId: string) => void;
}

// Columns similar to inventory table but:
// - Highlighted rows based on severity
// - Severity indicator (warning/critical)
// - Suggested reorder quantity
// - Quick restock button
// - Mark as reviewed button
```

#### Low Stock Severity
**File:** `apps/vendor-web/components/inventory/LowStockSeverity.tsx`

```tsx
interface LowStockSeverityProps {
  currentLevel: number;
  threshold: number;
}

// Severity calculation:
// - Critical: Stock is 0 or below 50% of threshold
// - Warning: Stock is between threshold and 2× threshold
// - Notice: Stock is between 2× and 3× threshold (approaching)

// Visual indicators:
// - Critical: Red, pulsing animation
// - Warning: Orange
// - Notice: Yellow
```

---

## 5.3 Stock Movements

### Stock Movements Page
**File:** `apps/vendor-web/app/vendor/inventory/movements/page.tsx`

```tsx
export default function StockMovementsPage() {
  return (
    <VendorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Stock Movements"
          description="History of all stock adjustments"
        />

        <MovementFilters />

        <StockMovementTable />
      </div>
    </VendorLayout>
  );
}
```

#### Stock Movement Table
**File:** `apps/vendor-web/app/vendor/inventory/components/StockMovementTable.tsx`

```tsx
interface StockMovementTableProps {
  movements: StockMovement[];
  loading?: boolean;
  onSort: (column: string, direction: 'asc' | 'desc') => void;
}

// Table columns
const columns = [
  {
    id: 'date',
    header: 'Date',
    cell: ({ row }) => <DateTimeDisplay date={row.original.created_at} />,
  },
  {
    id: 'product',
    header: 'Product',
    cell: ({ row }) => (
      <MovementProductCell
        name={row.original.product_name}
        sku={row.original.sku}
        productId={row.original.product_id}
      />
    ),
  },
  {
    id: 'type',
    header: 'Type',
    cell: ({ row }) => <MovementTypeBadge type={row.original.type} />,
  },
  {
    id: 'quantity',
    header: 'Quantity Change',
    cell: ({ row }) => (
      <QuantityChangeDisplay
        change={row.original.quantity_change}
        previousLevel={row.original.previous_level}
        newLevel={row.original.new_level}
      />
    ),
  },
  {
    id: 'reason',
    header: 'Reason',
    cell: ({ row }) => row.original.reason,
  },
  {
    id: 'reference',
    header: 'Reference',
    cell: ({ row }) => (
      <ReferenceDisplay
        type={row.original.reference_type}
        id={row.original.reference_id}
      />
    ),
  },
  {
    id: 'performed_by',
    header: 'Performed By',
    cell: ({ row }) => row.original.performed_by_name || 'System',
  },
];
```

#### Movement Types
```typescript
type MovementType =
  | 'sale'           // Stock decreased due to sale
  | 'restock'        // Stock increased (restock)
  | 'return'         // Stock increased (customer return)
  | 'adjustment'     // Manual adjustment
  | 'transfer'       // Stock transfer between locations
  | 'damage'         // Stock decreased (damaged/lost)
  | 'reservation'    // Stock reserved
  | 'reservation_release'; // Reservation released
```

#### Movement Type Badge
```tsx
interface MovementTypeBadgeProps {
  type: MovementType;
}

// Colors:
// Sale: Red (decrease)
// Restock: Green (increase)
// Return: Blue (increase)
// Adjustment: Gray (neutral)
// Transfer: Purple (neutral)
// Damage: Orange (decrease)
// Reservation: Yellow (neutral)
// Reservation Release: Teal (neutral)
```

---

## 5.4 Stock Adjustment Tools

### Quick Adjust Dialog
**File:** `apps/vendor-web/components/inventory/QuickAdjustDialog.tsx`

```tsx
interface QuickAdjustDialogProps {
  open: boolean;
  product: InventoryItem;
  onClose: () => void;
  onConfirm: (adjustment: StockAdjustment) => void;
}

interface StockAdjustment {
  productId: string;
  quantity: number;  // Positive for increase, negative for decrease
  reason: AdjustmentReason | string;
  referenceId?: string;
  notes?: string;
}

type AdjustmentReason =
  | 'restock'
  | 'damage'
  | 'loss'
  | 'correction'
  | 'return'
  | 'other';
```

**Features:**
- Quick add/remove buttons (+10, +50, +100, -10, -50, -100)
- Manual quantity input
- Reason selector
- Reference input (optional - order ID, etc.)
- Notes field
- Preview of new stock level
- Warning if new level is below threshold

### Bulk Adjust Dialog
**File:** `apps/vendor-web/components/inventory/BulkAdjustDialog.tsx`

```tsx
interface BulkAdjustDialogProps {
  open: boolean;
  products: InventoryItem[];
  onClose: () => void;
  onConfirm: (adjustments: BulkAdjustment[]) => void;
}

interface BulkAdjustment {
  productId: string;
  adjustment: number;  // Can be absolute or relative
  adjustType: 'absolute' | 'relative';
  reason: string;
}
```

**Features:**
- Table of selected products
- Set absolute level or adjust by amount
- Bulk reason for all
- Individual override option
- Preview all changes
- Confirmation summary

### Threshold Editor
**File:** `apps/vendor-web/components/inventory/ThresholdEditor.tsx`

```tsx
interface ThresholdEditorProps {
  product: InventoryItem;
  open: boolean;
  onClose: () => void;
  onSave: (productId: string, threshold: number) => void;
}

// Features:
// - Current threshold display
// - Suggested threshold calculation (based on sales velocity)
// - Manual threshold input
// - Save button
// - Explanation of how threshold works
```

---

## 5.5 Inventory Analytics

### Inventory Value Chart
**File:** `apps/vendor-web/app/vendor/inventory/components/InventoryValueChart.tsx`

```tsx
interface InventoryValueChartProps {
  data: InventoryValueData[];
  period: '7d' | '30d' | '90d';
}

interface InventoryValueData {
  date: string;
  value: number;
  productCount: number;
}

// Shows inventory value over time
// Line chart for value
// Area chart for product count
```

### Stock Trend Chart
```tsx
interface StockTrendChartProps {
  data: StockTrendData[];
}

interface StockTrendData {
  date: string;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

// Stacked area chart showing:
// - In Stock products
// - Low Stock products
// - Out of Stock products
// Over time
```

### Reorder Suggestions
**File:** `apps/vendor-web/app/vendor/inventory/components/ReorderSuggestions.tsx`

```tsx
interface ReorderSuggestionsProps {
  suggestions: ReorderSuggestion[];
}

interface ReorderSuggestion {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  suggestedQuantity: number;
  estimatedCost: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  avgDailySales: number;
  daysUntilStockout: number;
}

// Features:
// - Urgency-based sorting
// - Suggested quantity based on:
//   - Historical sales
//   - Lead time
//   - Seasonality
// - Estimated cost calculation
// - Quick reorder button
// - Add to purchase order
```

---

## Success Criteria

- [ ] Inventory listing loads within 2 seconds
- [ ] Stock adjustments reflect immediately
- [ ] Low stock alerts appear for items below threshold
- [ ] Movement history shows all changes
- [ ] Bulk adjust handles up to 100 items
- [ ] Quick adjust updates stock level correctly
- [ ] Threshold changes persist and affect alerts
- [ ] Inventory value calculates correctly
- [ ] Charts render with accurate data
- [ ] Export inventory to CSV works
- [ ] Search returns results within 500ms
- [ ] Severity badges show correct colors
- [ ] Reorder suggestions use actual sales data

---

## Directory Structure

```
apps/vendor-web/
├── app/
│   └── vendor/
│       └── inventory/
│           ├── page.tsx                         # ⏳ To Build
│           ├── products/
│           │   └── page.tsx                    # ⏳ To Build
│           ├── low-stock/
│           │   └── page.tsx                    # ⏳ To Build
│           ├── movements/
│           │   └── page.tsx                    # ⏳ To Build
│           ├── adjust/
│           │   └── page.tsx                    # ⏳ To Build
│           └── components/
│               ├── InventorySummaryCards.tsx   # ⏳ To Build
│               ├── InventoryTable.tsx          # ⏳ To Build
│               ├── InventoryFilters.tsx        # ⏳ To Build
│               ├── LowStockTable.tsx           # ⏳ To Build
│               ├── StockMovementTable.tsx      # ⏳ To Build
│               ├── InventoryValueChart.tsx     # ⏳ To Build
│               ├── StockTrendChart.tsx         # ⏳ To Build
│               ├── ReorderSuggestions.tsx     # ⏳ To Build
│               └── table-cells/
│                   ├── InventoryProductCell.tsx # ⏳ To Build
│                   ├── StockLevelDisplay.tsx   # ⏳ To Build
│                   ├── InventoryStatusBadge.tsx # ⏳ To Build
│                   ├── InventoryValueDisplay.tsx # ⏳ To Build
│                   ├── MovementProductCell.tsx # ⏳ To Build
│                   ├── MovementTypeBadge.tsx   # ⏳ To Build
│                   ├── QuantityChangeDisplay.tsx # ⏳ To Build
│                   └── ReferenceDisplay.tsx    # ⏳ To Build
├── components/
│   └── inventory/
│       ├── QuickAdjustDialog.tsx               # ⏳ To Build
│       ├── BulkAdjustDialog.tsx               # ⏳ To Build
│       ├── ThresholdEditor.tsx                # ⏳ To Build
│       ├── LowStockSeverity.tsx               # ⏳ To Build
│       ├── StockHistory.tsx                    # ⏳ To Build
│       └── ReorderSuggestion.tsx              # ⏳ To Build
└── lib/
    └── utils/
        └── inventory-calculations.ts           # ⏳ To Build
```

---

## Implementation Notes

1. **Real-time Stock**: Consider WebSocket for live stock updates
2. **Optimistic Updates**: Update UI immediately, rollback on error
3. **Movement Pagination**: Stock movements can be extensive, implement pagination
4. **Threshold Calculation**: Auto-calculate based on:
   - Average daily sales
   - Lead time
   - Safety stock factor
5. **Bulk Operations**: Show progress indicator for bulk adjustments
6. **Export**: Include inventory value and status in CSV export
7. **Search**: Search by product name, SKU, or variant SKU
8. **Undo**: Implement undo for recent adjustments (within 5 minutes)
9. **Low Stock Email**: Optional email digest for low stock items
10. **Forecasting**: Use historical data to predict stockouts
