# Phase 6: Earnings, Payouts & Finance

This phase focuses on financial transparency, providing vendors with complete visibility into their earnings, commission breakdown, payout history, and payment management.

## Overview

Phase 6 delivers the financial side of the vendor portal. Vendors can view their earnings, understand commission structures, track payout status, manage payment methods, and access financial statements.

---

## 6.1 Earnings Overview

### Route
`/vendor/earnings`

### Current Status
- ✅ Earnings summary cards (Total balance, Pending, Earned)
- ✅ Detailed payout history table with status badges
- ✅ Commission/platform fee transparency UI
- ✅ Payout settings overview (M-Pesa, Bank)

### Remaining Tasks

#### Earnings Page
**File:** `apps/vendor-web/app/vendor/earnings/page.tsx`

```tsx
export default function EarningsPage() {
  return (
    <VendorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Earnings"
          description="Track your revenue and payouts"
          action={
            <Button onClick={() => navigate('/vendor/earnings/payouts/request')}>
              <Wallet className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          }
        />

        {/* Earnings Summary Cards */}
        <EarningsSummaryCards />

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <EarningsTrendChart />
          <PayoutTimeline />
        </div>

        {/* Recent Payouts */}
        <RecentPayouts />

        {/* Commission Summary */}
        <CommissionSummary />
      </div>
    </VendorLayout>
  );
}
```

#### Earnings Summary Cards
**File:** `apps/vendor-web/app/vendor/earnings/components/EarningsSummaryCards.tsx`

```tsx
interface EarningsSummaryCardsProps {
  summary: EarningsSummary;
}

interface EarningsSummary {
  // Balances
  total_balance: number;          // Total earned
  available_for_payout: number;   // Ready to withdraw
  pending_payouts: number;       // In transit

  // Earnings metrics
  total_earnings: number;         // All-time earnings
  current_month_earnings: number; // This month
  last_month_earnings: number;    // Last month

  // Payout info
  last_payout_date?: string;
  last_payout_amount?: number;
  next_payout_date?: string;
  next_payout_amount?: number;

  // Commission info
  average_commission_rate: number;
  total_platform_fees: number;
}

// Cards display:
// 1. Available Balance (with "Request Payout" button)
// 2. Pending Payouts
// 3. This Month Earnings (vs last month)
// 4. Total Earnings (all-time)
```

**Features:**
- Click "Available" to request payout
- Show comparison to last month
- Display pending payout date
- Visual trend indicators (up/down)
- Currency formatting

#### Earnings Trend Chart
**File:** `apps/vendor-web/app/vendor/earnings/components/EarningsTrendChart.tsx`

```tsx
interface EarningsTrendChartProps {
  data: EarningsTrendData[];
  period: '7d' | '30d' | '90d' | '12m';
  onPeriodChange: (period: '7d' | '30d' | '90d' | '12m') => void;
}

interface EarningsTrendData {
  date: string;
  earnings: number;
  payouts: number;
  fees: number;
  net_earnings: number;
}

// Features:
// - Line chart for earnings
// - Bar chart for payouts
// - Area for fees
// - Interactive tooltips
// - Period toggle
// - Zoom capability
```

#### Commission Summary
**File:** `apps/vendor-web/app/vendor/earnings/components/CommissionSummary.tsx`

```tsx
interface CommissionSummaryProps {
  summary: CommissionSummary;
}

interface CommissionSummary {
  total_orders: number;
  total_revenue: number;
  total_commission: number;
  total_fees: number;
  net_earnings: number;
  average_rate: number;
  rate_tier: string;
  breakdown: CommissionBreakdownItem[];
}

interface CommissionBreakdownItem {
  category_id: string;
  category_name: string;
  total_revenue: number;
  commission_rate: number;
  commission_amount: number;
  platform_fee: number;
  net_amount: number;
  order_count: number;
}

// Displays:
// - Overall commission rate
// - Platform fee percentage
// - Effective rate (after fees)
// - Breakdown by category
// - Rate tier information
// - Progress to next tier
```

**Features:**
- Commission rate display
- Platform fee transparency
- Category breakdown table
- Rate tier explanation
- "How rates work" info tooltip
- Link to rate structure

---

## 6.2 Payouts Management

### Payouts Page
**File:** `apps/vendor-web/app/vendor/earnings/payouts/page.tsx`

```tsx
export default function PayoutsPage() {
  return (
    <VendorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Payouts"
          description="Manage your payout requests and history"
          action={
            <Button onClick={() => setRequestDialogOpen(true)}>
              <Wallet className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          }
        />

        {/* Payout Summary */}
        <PayoutSummaryCards />

        {/* Payout History Table */}
        <PayoutHistoryTable />
      </div>
    </VendorLayout>
  );
}
```

#### Payout Summary Cards
**File:** `apps/vendor-web/app/vendor/earnings/payouts/components/PayoutSummaryCards.tsx`

```tsx
interface PayoutSummaryCardsProps {
  summary: PayoutSummary;
}

interface PayoutSummary {
  available_balance: number;
  minimum_payout: number;
  pending_payouts: number;
  processing_payouts: number;
  last_payout_date?: string;
  next_payout_date?: string;
  scheduled_payouts: ScheduledPayout[];
}

// Cards display:
// 1. Available Balance
// 2. Minimum Payout Threshold (with progress)
// 3. Pending Payouts
// 4. Last Payout
// 5. Next Scheduled Payout
```

#### Payout History Table
**File:** `apps/vendor-web/app/vendor/earnings/payouts/components/PayoutHistoryTable.tsx`

```tsx
interface PayoutHistoryTableProps {
  payouts: Payout[];
  loading?: boolean;
  onSort: (column: string, direction: 'asc' | 'desc') => void;
  onViewDetails: (payoutId: string) => void;
  onDownloadReceipt: (payoutId: string) => void;
}

// Table columns
const columns = [
  {
    id: 'payout_id',
    header: 'Payout ID',
    cell: ({ row }) => (
      <PayoutIdCell
        id={row.original.id}
        reference={row.original.reference}
        onClick={() => onViewDetails(row.original.id)}
      />
    ),
  },
  {
    id: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <CurrencyDisplay
        amount={row.original.amount}
        currency={row.original.currency}
      />
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <PayoutStatusBadge status={row.original.status} />,
  },
  {
    id: 'method',
    header: 'Method',
    cell: ({ row }) => (
      <PayoutMethodDisplay
        type={row.original.method}
        details={row.original.method_details}
      />
    ),
  },
  {
    id: 'requested',
    header: 'Requested',
    cell: ({ row }) => <DateTimeDisplay date={row.original.requested_at} />,
  },
  {
    id: 'processed',
    header: 'Processed',
    cell: ({ row }) => (
      row.original.processed_at ? (
        <DateTimeDisplay date={row.original.processed_at} />
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    ),
  },
  {
    id: 'paid',
    header: 'Paid Date',
    cell: ({ row }) => (
      row.original.paid_at ? (
        <DateTimeDisplay date={row.original.paid_at} />
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <PayoutActionsMenu
        payout={row.original}
        onViewDetails={() => onViewDetails(row.original.id)}
        onDownloadReceipt={() => onDownloadReceipt(row.original.id)}
        onCancel={row.original.status === 'pending' ? () => handleCancel(row.original.id) : undefined}
      />
    ),
  },
];
```

**Features:**
- Sortable columns
- Status badges with colors
- Method display with icon
- Date formatting
- Action menu per row
- Download receipt
- Cancel pending payouts
- View details

#### Payout Status Badge
```tsx
interface PayoutStatusBadgeProps {
  status: PayoutStatus;
  size?: 'sm' | 'md';
  withIcon?: boolean;
}

type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';

// Badge colors and icons
// Pending: Yellow + Clock icon
// Processing: Blue + Spinner icon
// Paid: Green + Check icon
// Failed: Red + X icon
// Cancelled: Gray + Minus icon
```

#### Payout Method Display
```tsx
interface PayoutMethodDisplayProps {
  type: PayoutMethodType;
  details: PayoutMethodDetails;
}

type PayoutMethodType = 'mpesa' | 'bank' | 'paypal' | 'stripe';

interface PayoutMethodDetails {
  // For M-Pesa
  phone?: string;

  // For Bank
  account_name?: string;
  account_number?: string;
  bank_name?: string;
  branch?: string;

  // For PayPal
  email?: string;

  // For Stripe
  last4?: string;
}

// Displays:
// - Method icon
// - Method name
// - Masked details (e.g., ****1234)
// - Full details on hover
```

---

## 6.3 Request Payout

### Request Payout Dialog
**File:** `apps/vendor-web/components/finance/RequestPayoutDialog.tsx`

```tsx
interface RequestPayoutDialogProps {
  open: boolean;
  availableBalance: number;
  minimumPayout: number;
  paymentMethods: PaymentMethod[];
  onClose: () => void;
  onConfirm: (request: PayoutRequest) => Promise<void>;
}

interface PayoutRequest {
  amount: number;
  method_id: string;
  notes?: string;
}

interface PaymentMethod {
  id: string;
  type: PayoutMethodType;
  details: PayoutMethodDetails;
  is_default: boolean;
  is_verified: boolean;
}
```

**Features:**
- Display available balance
- Minimum payout threshold notice
- Amount input with max button
- Payment method selection
- Add new payment method option
- Processing time estimate
- Fee display (if any)
- Confirm with summary
- Success/error messages

#### Payout Confirmation
```tsx
interface PayoutConfirmationProps {
  request: PayoutRequest;
  balance: number;
  method: PaymentMethod;
  estimatedTime: string;
  fee?: number;
}

// Shows:
// - Payout amount
// - Payout method
// - Estimated arrival
// - Fee (if applicable)
// - Net amount
// - Confirm button
// - Terms checkbox
```

---

## 6.4 Payout Details

### Payout Detail Page
**File:** `apps/vendor-web/app/vendor/earnings/payouts/[id]/page.tsx`

```tsx
export default function PayoutDetailPage({ params }: { params: { id: string } }) {
  const { data: payout, loading } = usePayout(params.id);

  if (loading) return <PayoutDetailSkeleton />;
  if (!payout) return <NotFound />;

  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Header */}
        <PayoutDetailHeader payout={payout} />

        {/* Status Timeline */}
        <PayoutStatusTimeline payout={payout} />

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left - Details */}
          <div className="lg:col-span-2 space-y-6">
            <PayoutBreakdown payout={payout} />
            <IncludedOrders payout={payout} />
          </div>

          {/* Right - Payment Info */}
          <div className="space-y-6">
            <PaymentMethodInfo payout={payout} />
            <PayoutReceipt payout={payout} />
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
```

#### Payout Detail Components

**1. PayoutDetailHeader.tsx**
```tsx
interface PayoutDetailHeaderProps {
  payout: PayoutDetail;
}

// Displays:
// - Payout ID
// - Reference number (if available)
// - Status badge
// - Amount (large)
// - Actions:
//   - Download receipt
//   - Contact support (if failed)
//   - Cancel (if pending)
```

**2. PayoutStatusTimeline.tsx**
```tsx
interface PayoutStatusTimelineProps {
  events: PayoutStatusEvent[];
}

interface PayoutStatusEvent {
  status: PayoutStatus;
  message: string;
  timestamp: string;
  actor?: string;
}

// Vertical timeline showing:
// 1. Requested
// 2. Processing
// 3. In Transit (if applicable)
// 4. Paid / Failed
```

**3. PayoutBreakdown.tsx**
```tsx
interface PayoutBreakdownProps {
  payout: PayoutDetail;
}

// Shows:
// - Gross earnings
// - Platform fees
// - Adjustments (if any)
// - Net payout amount
// - Processing fees
// - Final amount
```

**4. IncludedOrders.tsx**
```tsx
interface IncludedOrdersProps {
  orders: PayoutOrder[];
}

interface PayoutOrder {
  id: string;
  order_number: string;
  date: string;
  amount: number;
  commission_rate: number;
  commission_amount: number;
  net_amount: number;
}

// Table of orders included in this payout
```

**5. PaymentMethodInfo.tsx**
```tsx
interface PaymentMethodInfoProps {
  method: PaymentMethod;
  details: PayoutTransferDetails;
}

interface PayoutTransferDetails {
  transaction_id?: string;
  account_name?: string;
  account_number?: string;
  bank_name?: string;
  reference?: string;
}

// Shows where money was sent
// Masked account number
// Transaction ID for tracking
```

**6. PayoutReceipt.tsx**
```tsx
interface PayoutReceiptProps {
  payout: PayoutDetail;
  onDownload: () => void;
}

// Preview of receipt
// Download button
// Email receipt option
```

---

## 6.5 Payment Methods

### Payment Methods Page
**File:** `apps/vendor-web/app/vendor/earnings/settings/payment-methods/page.tsx`

```tsx
export default function PaymentMethodsPage() {
  return (
    <VendorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Payment Methods"
          description="Manage where you receive your payouts"
          action={
            <Button onClick={() => setAddMethodOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          }
        />

        <PaymentMethodsList />
      </div>
    </VendorLayout>
  );
}
```

#### Payment Methods List
**File:** `apps/vendor-web/app/vendor/earnings/settings/payment-methods/components/PaymentMethodsList.tsx`

```tsx
interface PaymentMethodsListProps {
  methods: PaymentMethod[];
  onSetDefault: (methodId: string) => void;
  onRemove: (methodId: string) => void;
  onVerify: (methodId: string) => void;
}

// Cards for each payment method:
// - M-Pesa
// - Bank Account
// - PayPal
// - Stripe Connect

// Each card shows:
// - Method type with icon
// - Account details (masked)
// - Verification status
// - Default indicator
// - Actions:
//   - Set as default
//   - Verify
//   - Remove
//   - Edit
```

#### Add Payment Method Dialog
**File:** `apps/vendor-web/components/finance/AddPaymentMethodDialog.tsx`

```tsx
interface AddPaymentMethodDialogProps {
  open: boolean;
  type: PayoutMethodType;
  onClose: () => void;
  onAdd: (method: NewPaymentMethod) => Promise<void>;
}

// Form varies by type:
// M-Pesa: Phone number
// Bank: Account number, bank, branch
// PayPal: Email
// Stripe: OAuth flow
```

---

## 6.6 Earnings Statements

### Statements Page
**File:** `apps/vendor-web/app/vendor/earnings/statements/page.tsx`

```tsx
export default function StatementsPage() {
  return (
    <VendorLayout>
      <div className="space-y-6">
        <PageHeader
          title="Earnings Statements"
          description="Download your financial statements"
        />

        <StatementGenerator />

        <StatementHistory />
      </div>
    </VendorLayout>
  );
}
```

#### Statement Generator
**File:** `apps/vendor-web/app/vendor/earnings/statements/components/StatementGenerator.tsx`

```tsx
interface StatementGeneratorProps {
  onGenerate: (config: StatementConfig) => void;
}

interface StatementConfig {
  type: 'earnings' | 'payouts' | 'commissions' | 'tax';
  period: 'month' | 'quarter' | 'year' | 'custom';
  dateRange?: { from: Date; to: Date };
  format: 'pdf' | 'csv' | 'xlsx';
}

// Quick presets:
// - This Month
// - Last Month
// - This Quarter
// - This Year (YTD)
// - Last Year
// - Custom Range
```

#### Statement History
```tsx
interface StatementHistoryProps {
  statements: Statement[];
}

interface Statement {
  id: string;
  type: string;
  period: string;
  generated_at: string;
  download_url: string;
  file_size: number;
}
```

---

## Success Criteria

- [ ] Earnings display correct balances
- [ ] Commission breakdown shows all fees
- [ ] Payout request validates minimum amount
- [ ] Payout status updates correctly
- [ ] Payment method addition works
- [ ] Receipt downloads successfully
- [ ] Statement generation completes
- [ ] Commission rates display accurately
- [ ] Payout history shows all records
- [ ] Currency formatting is correct
- [ ] Date displays are in vendor timezone
- [ ] Cancel payout works for pending requests

---

## Directory Structure

```
apps/vendor-web/
├── app/
│   └── vendor/
│       └── earnings/
│           ├── page.tsx                         # ⏳ To Build
│           ├── payouts/
│           │   ├── page.tsx                    # ⏳ To Build
│           │   ├── request/
│           │   │   └── page.tsx                # ⏳ To Build
│           │   └── [id]/
│           │       └── page.tsx                # ⏳ To Build
│           ├── statements/
│           │   └── page.tsx                    # ⏳ To Build
│           └── settings/
│               └── payment-methods/
│                   └── page.tsx                # ⏳ To Build
├── components/
│   └── finance/
│       ├── EarningsSummary.tsx                 # ✅ Partial
│       ├── PayoutStatusTable.tsx               # ✅ Partial
│       ├── CommissionBreakdown.tsx             # ✅ Partial
│       ├── RequestPayoutDialog.tsx             # ⏳ To Build
│       ├── AddPaymentMethodDialog.tsx         # ⏳ To Build
│       ├── PayoutReceipt.tsx                   # ⏳ To Build
│       ├── PayoutStatusBadge.tsx              # ⏳ To Build
│       ├── PayoutMethodDisplay.tsx             # ⏳ To Build
│       └── MarginCalculator.tsx                # ⏳ To Build
└── lib/
    └── utils/
        └── currency-formatter.ts               # ⏳ To Build
```

---

## Implementation Notes

1. **Currency Formatting**: Use vendor's configured currency
2. **Commission Rates**: Fetch from vendor profile (tier-based)
3. **Payout Thresholds**: Display minimum clearly
4. **Processing Time**: Show estimated days for payout
5. **Receipt PDF**: Generate with vendor branding
6. **Bank Verification**: May require micro-deposit verification
7. **M-Pesa**: Use STK push for verification
8. **Statements**: Include all required tax information
9. **Pending Payouts**: Show countdown to processing
10. **Failed Payouts**: Clear error messages and retry options
