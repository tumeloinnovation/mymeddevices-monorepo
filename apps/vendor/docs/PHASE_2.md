# Phase 2: Dashboard & Store Analytics

This phase focuses on the vendor's primary landing page and their performance overview.

## Overview

Phase 2 creates the vendor's dashboard - their central hub for monitoring store performance, viewing key metrics, and accessing quick actions. A robust dashboard is essential for vendor engagement and operational efficiency.

---

## 2.1 Enhanced Vendor Dashboard

### Route
`/vendor/dashboard`

### Current Status
- ✅ Basic KPI cards for Total Sales, Orders, and Product count
- ✅ Recent Orders summary table
- ✅ Low Stock alert widget (Integrated into KPI cards)
- ⏳ "Recent Activity" feed (Postponed or integrated into orders)
- ⏳ Sales trend chart (Basic implementation)
- ⏳ Top-selling products visualization (Postponed to later phases)
- ⏳ Date range filtering (Placeholder)

### Remaining Tasks

#### Enhanced KPI Cards
**File:** `apps/vendor-web/app/vendor/dashboard/components/`

**Components to Build:**

**1. VendorStatCard.tsx**
```tsx
interface VendorStatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period: string;
  };
  icon: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  loading?: boolean;
  onClick?: () => void;
}

// Usage examples
<VendorStatCard
  title="Total Sales"
  value="$12,450"
  change={{ value: 12.5, type: 'increase', period: 'vs last month' }}
  icon={DollarSign}
  iconColor="text-green-600"
  trend="up"
/>
```

**2. StatCardGrid.tsx**
```tsx
interface StatCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

// Grid layout for responsive KPI cards
<StatCardGrid columns={4}>
  <VendorStatCard title="Total Sales" ... />
  <VendorStatCard title="Orders" ... />
  <VendorStatCard title="Products" ... />
  <VendorStatCard title="Low Stock" ... />
</StatCardGrid>
```

**KPI Cards to Implement:**
- Total Sales (with comparison to previous period)
- Total Orders (with status breakdown)
- Active Products count
- Low Stock Alerts (with threshold)
- Pending Fulfillments
- Current Balance (earnings)

#### Dashboard Sections

**1. RecentOrdersTable.tsx**
```tsx
interface RecentOrdersTableProps {
  limit?: number;
  onViewAll: () => void;
  onOrderClick: (orderId: string) => void;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  item_count: number;
}
```

**Features:**
- Show last 5-10 orders
- Quick status update actions
- Click to view full order
- "View All" link to orders page
- Status badges with colors
- Relative date display

**2. LowStockAlerts.tsx**
```tsx
interface LowStockAlertsProps {
  alerts: LowStockAlert[];
  onProductClick: (productId: string) => void;
  onQuickRestock: (productId: string) => void;
}

interface LowStockAlert {
  product_id: string;
  product_name: string;
  sku: string;
  current_level: number;
  threshold: number;
  status: 'warning' | 'critical';
  image_url?: string;
}
```

**Features:**
- Warning vs Critical distinction
- Quick restock action
- Product link for details
- Visual severity indicators
- Stock level progress bar

**3. PendingActions.tsx**
```tsx
interface PendingActionsProps {
  actions: PendingAction[];
}

interface PendingAction {
  id: string;
  type: 'order_fulfillment' | 'low_stock' | 'payout' | 'product_review';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action_url: string;
  created_at: string;
}
```

**Features:**
- Consolidated action queue
- Priority-based sorting
- Quick action buttons
- Dismiss after action

**4. SalesTrendChart.tsx**
```tsx
interface SalesTrendChartProps {
  data: SalesTrendPoint[];
  period: '7d' | '30d' | '90d';
  onPeriodChange: (period: '7d' | '30d' | '90d') => void;
  height?: number;
}

interface SalesTrendPoint {
  date: string;
  sales: number;
  orders: number;
}
```

**Features:**
- Line chart for sales trend
- Bar chart for orders
- Interactive tooltips
- Period toggle
- Responsive height
- Gradient fill

**5. TopProductsList.tsx**
```tsx
interface TopProductsListProps {
  products: TopProduct[];
  limit?: number;
  period?: '7d' | '30d' | '90d';
  onProductClick: (productId: string) => void;
}

interface TopProduct {
  id: string;
  name: string;
  sku: string;
  image_url?: string;
  total_sold: number;
  revenue: number;
  rank: number;
}
```

**Features:**
- Rank indicator
- Product thumbnail
- Sales and revenue metrics
- Click to product details
- Performance badge

#### Date Range Selector
**File:** `apps/vendor-web/components/dashboard/DateRangeSelector.tsx`

```tsx
interface DateRangeSelectorProps {
  value: DateRangePreset | { from: Date; to: Date };
  onChange: (range: DateRangePreset | { from: Date; to: Date }) => void;
  presets?: DateRangePreset[];
}

type DateRangePreset = 'today' | 'yesterday' | 'last_7_days' | 'last_30_days' | 'this_month' | 'last_month' | 'this_year';
```

**Features:**
- Quick preset buttons
- Custom date picker
- Relative date displays
- Apply button

---

## 2.2 Store Analytics Module

### Routes
- `/vendor/analytics/overview` - General analytics
- `/vendor/analytics/sales` - Sales deep dive
- `/vendor/analytics/products` - Product performance
- `/vendor/analytics/reports` - Exportable reports

### Components to Build

#### Analytics Overview Page
**File:** `apps/vendor-web/app/vendor/analytics/overview/page.tsx`

```tsx
export default function AnalyticsOverviewPage() {
  return (
    <div className="space-y-6">
      <AnalyticsPageHeader
        title="Analytics Overview"
        description="Track your store performance and metrics"
      />
      <DateRangeSelector />
      <MetricCards />
      <div className="grid lg:grid-cols-2 gap-6">
        <RevenueChart />
        <OrdersChart />
      </div>
      <ComparisonCard />
    </div>
  );
}
```

**Components:**

**1. AnalyticsCard.tsx**
```tsx
interface AnalyticsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}
```

**2. TrendChart.tsx**
```tsx
interface TrendChartProps {
  title: string;
  data: TrendDataPoint[];
  metric: 'sales' | 'orders' | 'visitors' | 'conversion';
  compareWithPrevious?: boolean;
  height?: number;
}

interface TrendDataPoint {
  date: string;
  value: number;
  previous_value?: number;
}
```

**3. ComparisonChart.tsx**
```tsx
interface ComparisonChartProps {
  title: string;
  currentData: DataPoint[];
  previousData: DataPoint[];
  metric: string;
  type: 'line' | 'bar';
}
```

**4. MetricCards.tsx**
```tsx
interface MetricCardsProps {
  metrics: MetricCardData[];
}

interface MetricCardData {
  title: string;
  value: string | number;
  change?: number;
  unit?: string;
  icon?: LucideIcon;
}
```

**Metrics to Display:**
- Total Revenue
- Total Orders
- Average Order Value
- Conversion Rate
- Total Visitors
- Return Customer Rate

#### Sales Analytics Page
**File:** `apps/vendor-web/app/vendor/analytics/sales/page.tsx`

```tsx
export default function SalesAnalyticsPage() {
  return (
    <div className="space-y-6">
      <AnalyticsPageHeader title="Sales Analytics" />
      <DateRangeSelector />
      <SalesSummaryCards />
      <SalesTrendChart />
      <SalesByCategory />
      <SalesByTimeOfDay />
    </div>
  );
}
```

**Components:**
- SalesSummaryCards - Total, Average, Growth
- SalesTrendChart - Over time visualization
- SalesByCategory - Pie or donut chart
- SalesByTimeOfDay - Heat map or bar chart

#### Product Analytics Page
**File:** `apps/vendor-web/app/vendor/analytics/products/page.tsx`

```tsx
export default function ProductAnalyticsPage() {
  return (
    <div className="space-y-6">
      <AnalyticsPageHeader title="Product Analytics" />
      <ProductFilters />
      <TopPerformersTable />
      <LowPerformersTable />
      <CategoryPerformance />
      <InventoryTurnover />
    </div>
  );
}
```

**Components:**
- ProductFilters - Category, status, date range
- TopPerformersTable - Best selling products
- LowPerformersTable - Products needing attention
- CategoryPerformance - Performance by category
- InventoryTurnover - Stock movement analysis

#### Reports Page
**File:** `apps/vendor-web/app/vendor/analytics/reports/page.tsx`

```tsx
export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <AnalyticsPageHeader title="Reports" />
      <ReportGenerator />
      <ScheduledReports />
      <ReportHistory />
    </div>
  );
}
```

**Components:**

**ReportGenerator.tsx**
```tsx
interface ReportGeneratorProps {
  onGenerate: (config: ReportConfig) => void;
}

interface ReportConfig {
  type: 'sales' | 'products' | 'inventory' | 'earnings';
  dateRange: { from: Date; to: Date };
  format: 'pdf' | 'csv' | 'xlsx';
  includeCharts?: boolean;
}

// Pre-configured report templates
const reportTemplates = [
  { name: 'Monthly Sales Report', type: 'sales', period: 'this_month' },
  { name: 'Product Performance', type: 'products', period: 'last_30_days' },
  { name: 'Inventory Summary', type: 'inventory', period: 'as_of_today' },
  { name: 'Earnings Statement', type: 'earnings', period: 'last_month' },
];
```

**Features:**
- Template-based generation
- Custom date ranges
- Multiple export formats
- Include/exclude charts
- Email report option

**ScheduledReports.tsx**
```tsx
interface ScheduledReport {
  id: string;
  name: string;
  type: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  next_run: string;
  last_run?: string;
  recipients: string[];
  format: 'pdf' | 'csv';
}
```

**Features:**
- Create scheduled reports
- Manage recipient list
- Configure frequency
- Enable/disable schedules
- View run history

---

## Chart Components

**File:** `apps/vendor-web/components/analytics/charts/`

### 1. LineChart.tsx
```tsx
interface LineChartProps {
  data: ChartData[];
  xAxisKey: string;
  yAxisKey: string;
  color?: string;
  area?: boolean;
  gradient?: boolean;
  height?: number;
}
```

### 2. BarChart.tsx
```tsx
interface BarChartProps {
  data: ChartData[];
  xAxisKey: string;
  yAxisKey: string;
  color?: string;
  horizontal?: boolean;
  height?: number;
}
```

### 3. PieChart.tsx
```tsx
interface PieChartProps {
  data: PieDataPoint[];
  innerRadius?: number;
  outerRadius?: number;
  height?: number;
}

interface PieDataPoint {
  name: string;
  value: number;
  color?: string;
}
```

### 4. AreaChart.tsx
```tsx
interface AreaChartProps {
  data: ChartData[];
  xAxisKey: string;
  yAxisKey: string;
  color?: string;
  height?: number;
}
```

---

## Dashboard Page Layout

```tsx
// apps/vendor-web/app/vendor/dashboard/page.tsx
export default function VendorDashboardPage() {
  return (
    <VendorLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Dashboard"
          description="Welcome back! Here's what's happening with your store."
        >
          <DateRangeSelector />
        </PageHeader>

        {/* KPI Cards */}
        <StatCardGrid columns={4}>
          <VendorStatCard
            title="Total Sales"
            value="$12,450"
            change={{ value: 12.5, type: 'increase', period: 'vs last month' }}
            icon={DollarSign}
            iconColor="text-green-600"
            trend="up"
            onClick={() => navigate('/vendor/analytics/sales')}
          />
          <VendorStatCard
            title="Orders"
            value="48"
            change={{ value: 8, type: 'increase', period: 'vs last month' }}
            icon={ShoppingCart}
            iconColor="text-blue-600"
            trend="up"
            onClick={() => navigate('/vendor/orders')}
          />
          <VendorStatCard
            title="Products"
            value="156"
            icon={Package}
            iconColor="text-purple-600"
            onClick={() => navigate('/vendor/products')}
          />
          <VendorStatCard
            title="Low Stock"
            value="8"
            change={{ value: 3, type: 'decrease', period: 'from last week' }}
            icon={AlertTriangle}
            iconColor="text-orange-600"
            trend="down"
            onClick={() => navigate('/vendor/inventory?filter=low_stock')}
          />
        </StatCardGrid>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sales Trend Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <AnalyticsCard title="Sales Trend">
              <SalesTrendChart
                data={salesData}
                period="30d"
                onPeriodChange={handlePeriodChange}
              />
            </AnalyticsCard>
          </div>

          {/* Pending Actions - Takes 1 column */}
          <div>
            <AnalyticsCard title="Pending Actions">
              <PendingActions actions={pendingActions} />
            </AnalyticsCard>
          </div>
        </div>

        {/* Secondary Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <AnalyticsCard
            title="Recent Orders"
            actions={<Button variant="ghost" onClick={() => navigate('/vendor/orders')}>View All</Button>}
          >
            <RecentOrdersTable
              limit={5}
              onViewAll={() => navigate('/vendor/orders')}
              onOrderClick={(id) => navigate(`/vendor/orders/${id}`)}
            />
          </AnalyticsCard>

          {/* Low Stock Alerts */}
          <AnalyticsCard
            title="Low Stock Alerts"
            actions={<Button variant="ghost" onClick={() => navigate('/vendor/inventory?filter=low_stock')}>View All</Button>}
          >
            <LowStockAlerts
              alerts={lowStockAlerts}
              onProductClick={(id) => navigate(`/vendor/products/${id}`)}
              onQuickRestock={handleQuickRestock}
            />
          </AnalyticsCard>
        </div>

        {/* Top Products */}
        <AnalyticsCard
          title="Top Performing Products"
          actions={<Button variant="ghost" onClick={() => navigate('/vendor/analytics/products')}>View Analytics</Button>}
        >
          <TopProductsList
            products={topProducts}
            limit={5}
            onProductClick={(id) => navigate(`/vendor/products/${id}`)}
          />
        </AnalyticsCard>
      </div>
    </VendorLayout>
  );
}
```

---

## API Integration

### Dashboard Data Hooks

**File:** `apps/vendor-web/lib/api/hooks/useDashboard.ts`

```typescript
export function useDashboard(period: '7d' | '30d' | '90d' = '30d') {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsApi.getDashboardStats(period),
      analyticsApi.getSalesTrend(period),
      analyticsApi.getTopProducts(5),
      ordersApi.getRecentOrders(5),
      inventoryApi.getLowStockAlerts(),
    ])
      .then(([stats, salesTrend, topProducts, recentOrders, lowStock]) => {
        setData({
          stats,
          salesTrend,
          topProducts,
          recentOrders,
          lowStock,
        });
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [period]);

  return { data, loading, error, refetch: () => {} };
}

interface DashboardData {
  stats: DashboardStats;
  salesTrend: SalesTrendPoint[];
  topProducts: TopProduct[];
  recentOrders: VendorOrder[];
  lowStock: LowStockAlert[];
}
```

---

## Success Criteria

- [ ] Dashboard loads within 2 seconds on standard connection
- [ ] All KPI cards display accurate real-time data
- [ ] Sales trend chart renders correctly with zoom/pan
- [ ] Recent orders table shows latest 5 orders
- [ ] Low stock alerts are prominently displayed
- [ ] Date range selector updates all charts
- [ ] Clicking KPI cards navigates to relevant sections
- [ ] Charts are responsive on mobile devices
- [ ] Data refreshes automatically or on manual refresh
- [ ] Export functionality works for reports
- [ ] Scheduled reports can be configured
- [ ] All charts have accessible descriptions
- [ ] Loading states are shown during data fetch

---

## Directory Structure

```
apps/vendor-web/
├── app/
│   └── vendor/
│       ├── dashboard/
│       │   ├── page.tsx                         # ⏳ To Build
│       │   └── components/
│       │       ├── VendorStatCard.tsx            # ✅ Partial
│       │       ├── StatCardGrid.tsx             # ⏳ To Build
│       │       ├── RecentOrdersTable.tsx         # ⏳ To Build
│       │       ├── LowStockAlerts.tsx            # ⏳ To Build
│       │       ├── PendingActions.tsx            # ⏳ To Build
│       │       ├── SalesTrendChart.tsx           # ⏳ To Build
│       │       ├── TopProductsList.tsx           # ⏳ To Build
│       │       └── PageHeader.tsx               # ⏳ To Build
│       └── analytics/
│           ├── overview/
│           │   └── page.tsx                      # ⏳ To Build
│           ├── sales/
│           │   └── page.tsx                      # ⏳ To Build
│           ├── products/
│           │   └── page.tsx                      # ⏳ To Build
│           └── reports/
│               └── page.tsx                      # ⏳ To Build
├── components/
│   ├── analytics/
│   │   ├── AnalyticsCard.tsx                    # ⏳ To Build
│   │   ├── MetricCards.tsx                       # ⏳ To Build
│   │   ├── DateRangeSelector.tsx                # ⏳ To Build
│   │   ├── ExportButton.tsx                      # ⏳ To Build
│   │   ├── charts/
│   │   │   ├── LineChart.tsx                    # ⏳ To Build
│   │   │   ├── BarChart.tsx                     # ⏳ To Build
│   │   │   ├── PieChart.tsx                     # ⏳ To Build
│   │   │   └── AreaChart.tsx                    # ⏳ To Build
│   │   └── reports/
│   │       ├── ReportGenerator.tsx               # ⏳ To Build
│   │       ├── ScheduledReports.tsx             # ⏳ To Build
│   │       └── ReportHistory.tsx                # ⏳ To Build
│   └── dashboard/
│       ├── PageHeader.tsx                        # ⏳ To Build
│       └── PendingActions.tsx                   # ⏳ To Build
└── lib/
    └── api/
        └── hooks/
            └── useDashboard.ts                   # ⏳ To Build
```

---

## Implementation Notes

1. **Performance**: Use React Query for data caching and refetch optimization
2. **Charts**: All charts should use Recharts library for consistency
3. **Responsive**: Test dashboard on 320px to 2560px screen widths
4. **Accessibility**: All charts should have aria-labels and descriptions
5. **Real-time**: Consider WebSocket for real-time order updates
6. **Export**: Use jsPDF for PDF generation, XLSX for Excel exports
7. **Dates**: Display dates in vendor's local timezone
8. **Loading**: Show skeleton screens instead of spinners for better UX
