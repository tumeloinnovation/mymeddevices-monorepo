"use client"

import { useState, useTransition } from "react"
import { useQuery } from "@tanstack/react-query"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  DollarSign, 
  Activity, 
  CreditCard, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { adminService, type AdminAnalyticsData } from "@mymeddevices/shared-core"

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState("Last 30 Days")
  const [rowsPerPage, setRowsPerPage] = useState("5")
  const [, startTransition] = useTransition()

  const daysParam = timeRange === "Last 7 Days" ? 7 : timeRange === "Last Year" ? 365 : 30

  const { data: analytics, isLoading, isError, refetch } = useQuery<AdminAnalyticsData>({
    queryKey: ["admin", "analytics", daysParam],
    queryFn: () => adminService.getAnalytics(daysParam),
    staleTime: 60 * 1000,
  })

  const overview = analytics?.overview
  const recentOrders = analytics?.recent_orders || []
  const topProducts = analytics?.top_products || []
  const orderOverview = analytics?.order_overview || []
  const segmentation = analytics?.segmentation || []
  const userActivity = analytics?.user_activity || []

  const formattedRevenue = overview?.total_revenue 
    ? `KES ${overview.total_revenue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "KES 0.00"

  const formattedCurrentWindowRevenue = overview?.current_window_revenue 
    ? `KES ${overview.current_window_revenue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "KES 0.00"

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 pb-12 font-sans bg-slate-50/50 dark:bg-slate-950/50 p-2 md:p-6 rounded-2xl">
        
        {/* Header with Title & Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Executive Operations Dashboard</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time procurement metrics, revenue, regulatory orders, and fulfillment analytics.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select 
              value={timeRange} 
              onValueChange={(val) => startTransition(() => setTimeRange(val))}
            >
              <SelectTrigger className="h-9 text-xs border-slate-200 bg-white dark:bg-slate-900 rounded-lg w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                <SelectItem value="Last Year">Last Year</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()} 
              disabled={isLoading}
              className="h-9 text-xs gap-1.5 bg-white dark:bg-slate-900"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Top Row: 3 Primary KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Total Platform GMV */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Gross Merchandise Volume</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">All Marketplace Orders</p>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                  {isLoading ? "Loading..." : formattedRevenue}
                </h3>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium pt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{overview?.revenue_growth || 0}%</span>
                  <span className="text-slate-400 font-normal">vs previous window</span>
                </div>
              </div>
              <div className="h-16 w-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={orderOverview.length > 0 ? orderOverview : [{ period: "Day 1", orders: 1, revenue: 10, total: 10 }]}>
                    <defs>
                      <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={2} fill="url(#grad1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Period Revenue */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Period Revenue ({timeRange})</p>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white pt-2">
                  {isLoading ? "Loading..." : formattedCurrentWindowRevenue}
                </h3>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium pt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{overview?.revenue_growth || 0}%</span>
                  <span className="text-slate-400 font-normal">pace</span>
                </div>
              </div>
              <div className="h-16 w-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={orderOverview.length > 0 ? orderOverview : [{ period: "Day 1", orders: 1, revenue: 10, total: 10 }]}>
                    <defs>
                      <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#grad2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Total Orders Growth */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Orders Fulfilled</p>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white pt-2">
                  {isLoading ? "Loading..." : `${overview?.total_orders || 0} Orders`}
                </h3>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium pt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{overview?.orders_growth || 0}%</span>
                  <span className="text-slate-400 font-normal">conversion rate: {overview?.conversion_rate || 0}%</span>
                </div>
              </div>
              <div className="h-16 w-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderOverview.length > 0 ? orderOverview : [{ period: "Day 1", orders: 5, revenue: 100, total: 100 }]}>
                    <Bar dataKey="orders" fill="#0f172a" radius={[3, 3, 0, 0]} barSize={8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Grid 1: Analytics Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Card 1: Customer Segmentation */}
          <Card className="lg:col-span-3 shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 flex flex-col justify-between">
            <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Customer Segmentation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative h-44 w-full flex items-center justify-center my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={segmentation}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {segmentation.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-2 rounded shadow">
                            <span className="font-semibold">{item.name}: </span>{item.value} ({item.growth})
                          </div>
                        )
                      }
                      return null;
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {overview?.total_customers || 0}
                  </span>
                  <span className="text-[10px] text-slate-400">Total Buyers</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                {segmentation.map((seg, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{seg.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{seg.value}</span>
                      <span className="text-emerald-600 font-medium">{seg.growth}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Order & Revenue Trend Overview */}
          <Card className="lg:col-span-6 shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Order & Revenue Trends</CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> Growth: +{overview?.revenue_growth || 0}%
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-center gap-6 mb-4 text-xs">
                <div>
                  <p className="text-slate-400">Average Order Value</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    KES {overview?.avg_order_value?.toLocaleString('en-KE', { minimumFractionDigits: 2 }) || "0.00"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Total In-Flight Orders</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{overview?.current_window_orders || 0}</p>
                </div>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={orderOverview} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white text-xs p-2.5 rounded-lg shadow space-y-1">
                            <p className="font-semibold text-slate-300">{label}</p>
                            <p className="text-emerald-400 font-bold">Revenue: KES {Number(payload[0].value).toLocaleString()}</p>
                            <p className="text-slate-200">Orders: {payload[0].payload.orders}</p>
                          </div>
                        )
                      }
                      return null;
                    }} />
                    <Area type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#orderGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: User Activity */}
          <Card className="lg:col-span-3 shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 flex flex-col justify-between">
            <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Procurement Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-44 w-full my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userActivity} barGap={4}>
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="active" fill="#0f172a" radius={[2, 2, 0, 0]} barSize={6} />
                    <Bar dataKey="checkout" fill="#0ea5e9" radius={[2, 2, 0, 0]} barSize={6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <p className="text-slate-400">Total Users</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{overview?.total_users || 0}</p>
                </div>
                <div>
                  <p className="text-slate-400">Active Vendors</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">{overview?.total_vendors || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Grid 2: 4 Fast Metric KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Total Orders</span>
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">{overview?.total_orders || 0}</h4>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-emerald-600 font-medium flex items-center gap-0.5"><TrendingUp className="w-3 h-3"/> +{overview?.orders_growth || 0}%</span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </Card>

          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Verified Vendors</span>
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">{overview?.total_vendors || 0}</h4>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-emerald-600 font-medium flex items-center gap-0.5"><ShieldCheck className="w-3 h-3"/> 100%</span>
              <span className="text-slate-400">PPB Verified</span>
            </div>
          </Card>

          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Gross Revenue</span>
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">{formattedRevenue}</h4>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-emerald-600 font-medium flex items-center gap-0.5"><TrendingUp className="w-3 h-3"/> +{overview?.revenue_growth || 0}%</span>
              <span className="text-slate-400">growth</span>
            </div>
          </Card>

          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Abandoned Carts</span>
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">{overview?.abandoned_carts || 0}</h4>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-slate-500 font-medium">Conversion: {overview?.conversion_rate || 0}%</span>
              <span className="text-slate-400">all time</span>
            </div>
          </Card>
        </div>

        {/* Bottom Row: Table & Side Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Main Table: Recent Procurement Orders */}
          <Card className="lg:col-span-8 shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Customer & Clinic Orders</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentOrders.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No orders found for this period.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                    <TableRow className="border-slate-100 dark:border-slate-800">
                      <TableHead className="text-xs font-semibold text-slate-500 pl-5">Order # / Item</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500">Customer</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500">Qty</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500">Payment</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 pr-5 text-right">Total Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.slice(0, Number(rowsPerPage)).map((order) => (
                      <TableRow key={order.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-900/60">
                        <TableCell className="pl-5 py-3">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{order.order_number}</span>
                            <span className="text-[11px] text-slate-500 truncate max-w-[200px]">{order.product}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-300 font-medium">{order.customer}</TableCell>
                        <TableCell className="text-xs text-slate-500">{order.qty}</TableCell>
                        <TableCell>
                          <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                            order.status.toLowerCase() === "pending" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40" :
                            order.status.toLowerCase() === "shipped" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40" :
                            order.status.toLowerCase() === "delivered" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" :
                            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}>
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            <span>{order.paymentMethod}</span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-5 py-3 text-right text-xs font-bold text-slate-900 dark:text-white">{order.totalPrice}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              
              {/* Pagination controls */}
              <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Show</span>
                  <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
                    <SelectTrigger className="h-7 w-14 text-xs border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>per page</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Showing {Math.min(recentOrders.length, Number(rowsPerPage))} of {recentOrders.length} orders</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Side Column: Top Products & Operations Summary */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Top Products Card */}
            <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-500" />
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Top Selling Products</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3">
                {topProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No product volume recorded yet.</p>
                ) : (
                  topProducts.map((prod) => (
                    <div key={prod.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{prod.name}</p>
                        <p className="text-[10px] text-slate-400">{prod.units_sold} units sold</p>
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">KES {prod.revenue?.toLocaleString() || "0"}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Total Assets & Platform Revenue */}
            <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <DollarSign className="w-4 h-4 text-slate-500" />
                <span>Marketplace Liquidity & Volume</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{formattedRevenue}</h3>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">
                  +{overview?.revenue_growth || 0}% <span className="text-slate-400 font-normal">vs previous period</span>
                </p>
              </div>
              
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-slate-400">Distribution Channels</p>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-slate-900 dark:bg-white w-[65%]" />
                  <div className="h-full bg-blue-500 w-[25%]" />
                  <div className="h-full bg-emerald-500 w-[10%]" />
                </div>
                <div className="flex flex-col gap-1.5 pt-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white" /> Equipment Sales
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">65%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" /> Consumables & Reagents
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">25%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Clinic Direct Logistics
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">10%</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-200/60 dark:border-slate-800">
          <p>© 2026 MyMedDevices Kenya. Healthcare Procurement & Medical Device Marketplace.</p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:underline">Privacy</a>
            <a href="/terms" className="hover:underline">Terms</a>
            <a href="/system" className="hover:underline">System Status</a>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
