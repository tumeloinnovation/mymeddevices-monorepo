# Phase 4: Order & Fulfillment Management

This phase handles the complete lifecycle of orders containing vendor products, from receiving orders to fulfillment and shipping.

## Overview

Phase 4 provides vendors with tools to manage orders, update fulfillment status, add tracking information, and handle returns. Efficient order management is critical for customer satisfaction and vendor operations.

---

## 4.1 Order Management

### Routes
- `/vendor/orders` - Order listing
- `/vendor/orders/[id]` - Order details
- `/vendor/orders/fulfillment` - Fulfillment queue
- `/vendor/orders/returns` - Returns & refunds

### Current Status
- ✅ Vendor-specific order list view created
- ✅ Order status filters integrated into search/filter
- ⏳ Order Detail page placeholder (Integrated into actions)
- ⏳ Status update actions (Mark as Packed, Shipped)
- ⏳ Shipping label/tracking info entry
- ⏳ Printable packing slips

### Remaining Tasks

#### Order Listing Page
**File:** `apps/vendor-web/app/vendor/orders/page.tsx`

```tsx
export default function OrdersPage() {
  return (
    <VendorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Orders"
          description="Manage and fulfill your orders"
          action={
            <Button onClick={() => navigate('/vendor/orders/fulfillment')}>
              <Package className="mr-2 h-4 w-4" />
              Fulfillment Queue
              {pendingFulfillments > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingFulfillments}</Badge>
              )}
            </Button>
          }
        />

        <OrderFilters />

        <VendorOrdersTable />
      </div>
    </VendorLayout>
  );
}
```

#### Order Filters Component
**File:** `apps/vendor-web/app/vendor/orders/components/OrderFilters.tsx`

```tsx
interface OrderFiltersProps {
  filters: OrderFilterState;
  onFiltersChange: (filters: OrderFilterState) => void;
  onReset: () => void;
}

interface OrderFilterState {
  search: string;
  status: OrderStatus[];
  dateRange: { from: Date; to: Date } | null;
  fulfillmentStatus: FulfillmentStatus[];
  paymentStatus: PaymentStatus[];
  sortBy: 'created' | 'total' | 'customer';
  sortOrder: 'asc' | 'desc';
}

type OrderStatus = 'pending' | 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
```

**Features:**
- Order number search
- Customer name/email search
- Status multi-select with badges
- Date range picker
- Fulfillment status filter
- Payment status filter
- Quick date presets (Today, Yesterday, Last 7 days, etc.)
- Active filter display with remove
- Save filter presets

#### Vendor Orders Table
**File:** `apps/vendor-web/app/vendor/orders/components/VendorOrdersTable.tsx`

```tsx
interface VendorOrdersTableProps {
  orders: VendorOrder[];
  loading?: boolean;
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  onBulkAction: (action: string, orderIds: string[]) => void;
  onOrderClick: (orderId: string) => void;
}

// Table columns
const columns = [
  {
    id: 'select',
    header: ({ table }) => <Checkbox {...{ checked: table.getIsAllRowsSelected(), onChange: table.getToggleAllRowsSelectedHandler() }} />,
    cell: ({ row }) => <Checkbox {...{ checked: row.getIsSelected(), onChange: row.getToggleSelectedHandler() }} />,
  },
  {
    id: 'order',
    header: 'Order',
    cell: ({ row }) => (
      <OrderCell
        orderNumber={row.original.order_number}
        customerName={row.original.customer_name}
        createdDate={row.original.created_at}
      />
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
  },
  {
    id: 'fulfillment',
    header: 'Fulfillment',
    cell: ({ row }) => (
      <FulfillmentStatus
        itemCount={row.original.item_count}
        fulfilledCount={row.original.fulfilled_count}
      />
    ),
  },
  {
    id: 'total',
    header: 'Total',
    cell: ({ row }) => (
      <AmountDisplay
        amount={row.original.total_amount}
        vendorAmount={row.original.vendor_amount}
      />
    ),
  },
  {
    id: 'payment',
    header: 'Payment',
    cell: ({ row }) => <PaymentStatusBadge status={row.original.payment_status} />,
  },
  {
    id: 'created',
    header: 'Date',
    cell: ({ row }) => (
      <RelativeDate date={row.original.created_at} />
    ),
  },
  {
    id: 'due',
    header: 'Due By',
    cell: ({ row }) => (
      row.original.due_date ? (
        <DueDate date={row.original.due_date} status={row.original.status} />
      ) : null
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <OrderActionsMenu
        orderId={row.original.id}
        onView={() => navigate(`/vendor/orders/${row.original.id}`)}
        onFulfill={() => handleFulfill(row.original.id)}
        onShip={() => handleShip(row.original.id)}
      />
    ),
  },
];
```

**Features:**
- Checkbox for bulk selection
- Sortable columns
- Order number + customer display
- Status badges with colors
- Fulfillment progress bar
- Total with vendor portion display
- Payment status indicator
- Relative date display
- Due date with urgency indicator
- Row actions menu
- Infinite scroll or pagination

#### Order Cell Components

**OrderCell.tsx**
```tsx
interface OrderCellProps {
  orderNumber: string;
  customerName: string;
  createdDate: string;
  onClick?: () => void;
}
```

**OrderStatusBadge.tsx**
```tsx
interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

// Badge colors
// Pending: Yellow
// Processing: Blue
// Packed: Purple
// Shipped: Indigo
// Delivered: Green
// Cancelled: Gray
// Refunded: Red
```

**FulfillmentStatus.tsx**
```tsx
interface FulfillmentStatusProps {
  itemCount: number;
  fulfilledCount: number;
}

// Visual progress bar
// Shows fraction: "3/5"
// Color based on completion
```

**AmountDisplay.tsx**
```tsx
interface AmountDisplayProps {
  amount: number;
  vendorAmount?: number;
  currency?: string;
}

// Shows total order amount
// Optionally shows vendor portion below
```

**PaymentStatusBadge.tsx**
```tsx
interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md';
}

// Paid: Green checkmark
// Pending: Yellow clock
// Failed: Red X
// Refunded: Gray
```

**DueDate.tsx**
```tsx
interface DueDateProps {
  date: string;
  status: OrderStatus;
}

// Color-coded urgency
// Overdue: Red
// Due today: Yellow
// Due tomorrow: Orange
// Future: Gray
```

---

## 4.2 Order Detail Page

### Order Detail View
**File:** `apps/vendor-web/app/vendor/orders/[id]/page.tsx`

```tsx
export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { data: order, loading, refetch } = useOrder(params.id);

  if (loading) return <OrderDetailSkeleton />;
  if (!order) return <NotFound />;

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Header with status and actions */}
        <OrderHeader order={order} onStatusUpdate={refetch} />

        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Order details */}
          <div className="lg:col-span-2 space-y-6">
            <OrderItems order={order} onUpdate={refetch} />
            <OrderTimeline order={order} />
          </div>

          {/* Right column - Customer and shipping */}
          <div className="space-y-6">
            <CustomerInfo order={order} />
            <ShippingDetails order={order} />
            <PaymentInfo order={order} />
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
```

### Order Detail Components

**1. OrderHeader.tsx**
```tsx
interface OrderHeaderProps {
  order: VendorOrderDetail;
  onStatusUpdate: () => void;
}

// Displays:
// - Order number (large)
// - Current status badge
// - Status update dropdown
// - Quick actions:
//   - Print packing slip
//   - Contact customer
//   - Request refund
//   - Cancel order
```

**2. OrderItems.tsx**
```tsx
interface OrderItemsProps {
  order: VendorOrderDetail;
  onUpdate: () => void;
}

// Table with columns:
// - Product image
// - Product name + SKU
// - Variant info
// - Quantity
// - Unit price
// - Total
// - Item status
// - Tracking number
// - Actions (update status, add tracking)
```

**Features:**
- Item-level status update
- Quick status change dropdown
- Tracking number input with validation
- Save button per row
- Bulk status update for all items
- Print label button per item

**3. CustomerInfo.tsx**
```tsx
interface CustomerInfoProps {
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
}

// Displays customer contact information
// Quick actions:
// - Send email
// - Copy email
// - Copy phone
```

**4. ShippingDetails.tsx**
```tsx
interface ShippingDetailsProps {
  shippingAddress: Address;
  shippingMethod?: string;
  estimatedDelivery?: string;
}

// Displays shipping address in formatted block
// Shows chosen shipping method
// Shows estimated delivery date
// Quick actions:
// - Copy address
// - Open in maps
```

**5. PaymentInfo.tsx**
```tsx
interface PaymentInfoProps {
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  vendorAmount: number;
  platformFee: number;
  paidAt?: string;
}

// Shows payment breakdown
// - Total order amount
// - Platform fee
// - Vendor portion
// - Payment method
// - Payment status
// - Paid date
```

**6. OrderTimeline.tsx**
```tsx
interface OrderTimelineProps {
  timeline: OrderTimelineEvent[];
}

// Vertical timeline showing:
// - Order created
// - Payment confirmed
// - Order packed
// - Order shipped (with tracking)
// - Order delivered
// - Refund processed (if applicable)

// Each event shows:
// - Status
// - Message
// - Timestamp
// - Actor (if available)
```

---

## 4.3 Fulfillment Workflow

### Fulfillment Queue Page
**File:** `apps/vendor-web/app/vendor/orders/fulfillment/page.tsx`

```tsx
export default function FulfillmentQueuePage() {
  return (
    <VendorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Fulfillment Queue"
          description="Orders ready for fulfillment"
        />

        <FulfillmentFilters />

        <FulfillmentQueueTable />
      </div>
    </VendorLayout>
  );
}
```

**Features:**
- Shows only unfulfilled or partially fulfilled orders
- Priority sorting (oldest first, or by due date)
- Batch fulfillment mode
- Quick status update
- Print multiple packing slips

### Fulfillment Components

**1. FulfillmentStatusBadge.tsx**
```tsx
interface FulfillmentStatusBadgeProps {
  status: FulfillmentStatus;
  itemCount: number;
  fulfilledCount: number;
}

type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled';

// Visual indicators
// - Shows progress bar
// - Color-coded
```

**2. FulfillmentActionDialog.tsx**
```tsx
interface FulfillmentActionDialogProps {
  open: boolean;
  onClose: () => void;
  order: VendorOrderDetail;
  onConfirm: (action: FulfillmentAction) => void;
}

interface FulfillmentAction {
  type: 'pack' | 'ship' | 'deliver';
  trackingInfo?: TrackingInfo;
}

// Dialog for:
// - Mark as Packed (no extra info needed)
// - Mark as Shipped (requires tracking info)
// - Mark as Delivered (optional delivery confirmation)
```

**3. TrackingInput.tsx**
```tsx
interface TrackingInputProps {
  value: TrackingInfo;
  onChange: (value: TrackingInfo) => void;
  carriers: Carrier[];
}

interface TrackingInfo {
  carrier: string;
  tracking_number: string;
  tracking_url?: string;
}

interface Carrier {
  id: string;
  name: string;
  trackingUrlTemplate: string; // e.g., "https://carrier.com/track/{number}"
}

// Features:
// - Carrier dropdown
// - Tracking number input
// - Auto-generate tracking URL
// - Validate tracking number format
// - Test tracking link
```

**4. PackingSlipGenerator.tsx**
```tsx
interface PackingSlipGeneratorProps {
  order: VendorOrderDetail;
  onPrint: (blob: Blob) => void;
}

// Generates printable packing slip:
// - Vendor logo
// - Order number
// - Order date
// - Shipping address
// - Items list (with quantity and SKU)
// - Return instructions
// - Barcode/QR code
```

---

## 4.4 Returns & Refunds

### Returns Page
**File:** `apps/vendor-web/app/vendor/orders/returns/page.tsx`

```tsx
export default function ReturnsPage() {
  return (
    <VendorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Returns & Refunds"
          description="Manage return requests and refunds"
        />

        <ReturnsFilters />

        <ReturnsTable />
      </div>
    </VendorLayout>
  );
}
```

**Features:**
- List of return requests
- Filter by status (Requested, Approved, Rejected, Completed)
- Return reason display
- Quick approve/reject actions
- Refund processing

### Returns Components

**1. ReturnRequestCard.tsx**
```tsx
interface ReturnRequestCardProps {
  returnRequest: ReturnRequest;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onComplete: (id: string) => void;
}

interface ReturnRequest {
  id: string;
  order_id: string;
  order_number: string;
  customer_name: string;
  items: ReturnItem[];
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'completed' | 'refunded';
  requested_at: string;
  refund_amount: number;
}

interface ReturnItem {
  product_id: string;
  product_name: string;
  quantity: number;
  reason: string;
}
```

**2. RefundDialog.tsx**
```tsx
interface RefundDialogProps {
  open: boolean;
  order: VendorOrderDetail;
  onClose: () => void;
  onConfirm: (refund: RefundRequest) => void;
}

interface RefundRequest {
  items: Array<{
    item_id: string;
    quantity: number;
    amount: number;
  }>;
  refund_shipping: boolean;
  reason: string;
  notes?: string;
}
```

**Features:**
- Select items to refund
- Enter refund amount
- Option to refund shipping
- Reason selection
- Additional notes
- Refund preview (total amount)
- Confirm with warning

---

## 4.5 Bulk Order Actions

### Bulk Actions Bar
**File:** `apps/vendor-web/app/vendor/orders/components/BulkActionsBar.tsx`

```tsx
interface BulkActionsBarProps {
  selectedCount: number;
  actions: BulkOrderAction[];
  onAction: (action: string) => void;
  onClear: () => void;
}

type BulkOrderAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  confirm?: boolean;
  confirmMessage?: string;
  danger?: boolean;
};

// Available bulk actions
const bulkActions = [
  { id: 'mark_packed', label: 'Mark as Packed', icon: Package },
  { id: 'mark_shipped', label: 'Mark as Shipped', icon: Truck },
  { id: 'print_packing_slips', label: 'Print Packing Slips', icon: Printer },
  { id: 'export_csv', label: 'Export CSV', icon: Download },
  { id: 'send_reminder', label: 'Send Payment Reminder', icon: Bell },
  { id: 'cancel_orders', label: 'Cancel Orders', icon: X, confirm: true, danger: true },
];
```

---

## Success Criteria

- [ ] Order listing loads within 2 seconds
- [ ] Filters work independently and combined
- [ ] Status updates reflect immediately
- [ ] Tracking number input validates format
- [ ] Packing slips print correctly on A4 and Letter
- [ ] Bulk actions process up to 50 orders
- [ ] Order timeline shows all events in order
- [ ] Email copies work on click
- [ ] Shipping addresses format correctly
- [ ] Return requests display correctly
- [ ] Refund amounts calculate correctly
- [ ] Fulfillment queue prioritizes correctly
- [ ] Due date urgency shows correct colors

---

## Directory Structure

```
apps/vendor-web/
├── app/
│   └── vendor/
│       └── orders/
│           ├── page.tsx                         # ✅ Partial
│           ├── fulfillment/
│           │   └── page.tsx                     # ⏳ To Build
│           ├── returns/
│           │   └── page.tsx                     # ⏳ To Build
│           ├── [id]/
│           │   └── page.tsx                     # ⏳ To Build
│           └── components/
│               ├── VendorOrdersTable.tsx        # ✅ Partial
│               ├── OrderFilters.tsx             # ⏳ To Build
│               ├── BulkActionsBar.tsx           # ⏳ To Build
│               ├── detail/
│               │   ├── OrderHeader.tsx          # ⏳ To Build
│               │   ├── OrderItems.tsx           # ⏳ To Build
│               │   ├── OrderTimeline.tsx        # ⏳ To Build
│               │   ├── CustomerInfo.tsx         # ⏳ To Build
│               │   ├── ShippingDetails.tsx      # ⏳ To Build
│               │   ├── PaymentInfo.tsx          # ⏳ To Build
│               │   └── OrderActions.tsx          # ⏳ To Build
│               ├── table-cells/
│               │   ├── OrderCell.tsx            # ⏳ To Build
│               │   ├── OrderStatusBadge.tsx     # ⏳ To Build
│               │   ├── FulfillmentStatus.tsx    # ⏳ To Build
│               │   ├── AmountDisplay.tsx        # ⏳ To Build
│               │   ├── PaymentStatusBadge.tsx  # ⏳ To Build
│               │   └── DueDate.tsx             # ⏳ To Build
│               └── fulfillment/
│                   ├── FulfillmentQueueTable.tsx # ⏳ To Build
│                   ├── FulfillmentStatusBadge.tsx # ⏳ To Build
│                   ├── FulfillmentActionDialog.tsx # ⏳ To Build
│                   ├── TrackingInput.tsx       # ⏳ To Build
│                   └── PackingSlipGenerator.tsx # ⏳ To Build
├── components/
│   └── orders/
│       ├── ReturnsTable.tsx                     # ⏳ To Build
│       ├── ReturnRequestCard.tsx               # ⏳ To Build
│       ├── RefundDialog.tsx                     # ⏳ To Build
│       └── CarrierSelector.tsx                 # ⏳ To Build
└── lib/
    └── utils/
        └── address-formatter.ts                # ⏳ To Build
```

---

## Implementation Notes

1. **Real-time Updates**: Consider WebSocket for live order status updates
2. **Tracking Validation**: Validate tracking numbers per carrier format
3. **Packing Slips**: Generate PDF with jsPDF or html2pdf
4. **Barcode Generation**: Use a library like JsBarcode for order numbers
5. **Address Formatting**: Format addresses according to country standards
6. **Email Integration**: Use mailto: links or integrate with email service
7. **Print Styles**: Ensure print.css handles packing slip printing
8. **Bulk Operations**: Show progress for bulk actions with large datasets
9. **Return Policy**: Display return policy from vendor settings
10. **Refund Calculations**: Show breakdown of refund amounts clearly
