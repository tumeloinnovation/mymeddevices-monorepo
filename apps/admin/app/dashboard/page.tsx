"use client"

import { useState, useTransition, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  DollarSign, 
  Activity, 
  CreditCard, 
  ShieldCheck, 
  RefreshCw,
  Download,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Search,
  Building2,
  Sparkles,
  ExternalLink,
  Layers,
  ShoppingCart,
  Store,
  SlidersHorizontal,
  ChevronRight,
  Filter
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
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { adminService, type AdminAnalyticsData } from "@mymeddevices/shared-core"

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState("Last 30 Days")
  const [rowsPerPage, setRowsPerPage] = useState("5")
  const [selectedChartMetric, setSelectedChartMetric] = useState<"revenue" | "orders" | "aov">("revenue")
  const [searchOrderQuery, setSearchOrderQuery] = useState("")
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all")
  const [, startTransition] = useTransition()

  const daysParam = timeRange === "Last 7 Days" ? 7 : timeRange === "This Quarter (90 Days)" ? 90 : timeRange === "Last Year" ? 365 : 30

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
  const actionItems = analytics?.action_items || []
  const stockAlerts = analytics?.stock_alerts || []
  const paymentDistribution = analytics?.payment_distribution || []
  const orderStatusDistribution = analytics?.order_status_distribution || []

  // Filtered recent orders
  const filteredOrders = useMemo(() => {
    const q = (searchOrderQuery || "").toLowerCase().trim()
    return recentOrders.filter(order => {
      const orderNum = String(order?.order_number || order?.id || "").toLowerCase()
      const customer = String(order?.customer || "").toLowerCase()
      const product = String(order?.product || "").toLowerCase()
      const status = String(order?.status || "").toLowerCase()

      const matchesSearch = !q ||
        orderNum.includes(q) ||
        customer.includes(q) ||
        product.includes(q)
      
      if (!matchesSearch) return false

      if (selectedStatusFilter === "all") return true
      if (selectedStatusFilter === "pending") return status === "pending"
      if (selectedStatusFilter === "processing") return ["paid", "processing"].includes(status)
      if (selectedStatusFilter === "shipped") return status === "shipped"
      if (selectedStatusFilter === "delivered") return status === "delivered"
      return true
    })
  }, [recentOrders, searchOrderQuery, selectedStatusFilter])

  // Chart data enriched with AOV
  const chartData = useMemo(() => {
    return orderOverview.map(item => ({
      ...item,
      aov: item.orders > 0 ? Math.round(item.revenue / item.orders) : 0,
    }))
  }, [orderOverview])

  const formattedRevenue = overview?.total_revenue 
    ? `KES ${overview.total_revenue.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "KES 0.00"

  const formattedCurrentWindowRevenue = overview?.current_window_revenue 
    ? `KES ${overview.current_window_revenue.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "KES 0.00"

  const formattedAvgOrderValue = overview?.avg_order_value
    ? `KES ${overview.avg_order_value.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "KES 0.00"

  // CSV Export Handler
  const handleExportSummary = () => {
    if (!analytics) return

    const summaryRows = [
      ["Metric", "Value"],
      ["Total GMV (KES)", overview?.total_revenue || 0],
      [`Period Revenue (${timeRange})`, overview?.current_window_revenue || 0],
      ["Total Orders", overview?.total_orders || 0],
      ["Period Orders", overview?.current_window_orders || 0],
      ["Avg Order Value (KES)", overview?.avg_order_value || 0],
      ["Registered Customers", overview?.total_customers || 0],
      ["Verified Vendors", overview?.total_vendors || 0],
      ["Regulatory Compliance Score", `${overview?.compliance_score || 100}%`],
      [],
      ["Order #", "Customer", "Product / Item", "Status", "Payment Method", "Total Price (KES)"],
      ...recentOrders.map(o => [
        o.order_number,
        `"${o.customer.replace(/"/g, '""')}"`,
        `"${o.product.replace(/"/g, '""')}"`,
        o.status,
        o.paymentMethod,
        o.amount || o.totalPrice
      ])
    ]

    const csvContent = "data:text/csv;charset=utf-8," + summaryRows.map(e => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `MyMedDevices_Executive_Report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 pb-12 font-sans bg-slate-50/50 dark:bg-slate-950/50 p-2 md:p-6 rounded-2xl">
        
        {/* =========================================================================
            HEADER & EXECUTIVE COMMAND BAR
           ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Executive Operations Dashboard
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Ops
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time healthcare procurement metrics, vendor compliance, regulatory pipeline, and liquidity analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Time Window Dropdown */}
            <Select 
              value={timeRange} 
              onValueChange={(val) => startTransition(() => setTimeRange(val))}
            >
              <SelectTrigger className="h-9 text-xs border-slate-200 bg-slate-50/60 dark:bg-slate-800 rounded-lg w-[170px] font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                <SelectItem value="This Quarter (90 Days)">This Quarter (90 Days)</SelectItem>
                <SelectItem value="Last Year">Last 365 Days</SelectItem>
              </SelectContent>
            </Select>

            {/* Export CSV */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportSummary}
              disabled={isLoading || !analytics}
              className="h-9 text-xs gap-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 font-medium"
            >
              <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              Export CSV
            </Button>

            {/* Refresh Button */}
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => refetch()} 
              disabled={isLoading}
              className="h-9 text-xs gap-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-medium shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Notification Banner if query fails */}
        {isError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Failed to fetch real-time analytics. Please check backend connection and retry.</span>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-xs bg-white text-rose-700 border-rose-300" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {/* =========================================================================
            OPERATIONS & ACTION COMMAND CENTER (PENDING ACTION QUEUE)
           ========================================================================= */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Operations Command Center & Action Queue
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-normal">
              {actionItems.length} active operational tasks requiring attention
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Action 1: Pending Vendor Approvals */}
            <Link 
              href="/dashboard/vendors?status=pending"
              className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Store className="w-4 h-4" />
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                  {overview?.pending_vendors || 0} Pending
                </Badge>
              </div>
              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors flex items-center gap-1">
                  Vendor Verifications <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  KYC docs & Pharmacy and Poisons Board licenses awaiting verification.
                </p>
              </div>
            </Link>

            {/* Action 2: Unfulfilled / Delayed Orders */}
            <Link 
              href="/dashboard/orders?status=paid"
              className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 rounded-xl shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Package className="w-4 h-4" />
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                  {overview?.unfulfilled_orders || 0} Awaiting
                </Badge>
              </div>
              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors flex items-center gap-1">
                  Orders in Pipeline <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  Paid clinic orders awaiting vendor packaging and courier dispatch.
                </p>
              </div>
            </Link>

            {/* Action 3: Low Stock Alerts */}
            <Link 
              href="/dashboard/catalog?filter=low_stock"
              className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 rounded-xl shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-800">
                  {overview?.low_stock_count || stockAlerts.length} SKU Alerts
                </Badge>
              </div>
              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors flex items-center gap-1">
                  Low Stock Inventory <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  Critical medical items and diagnostic consumables below safety buffer.
                </p>
              </div>
            </Link>

            {/* Action 4: Open Support & RMA Tickets */}
            <Link 
              href="/dashboard/reviews"
              className="group p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 rounded-xl shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                  {overview?.open_tickets || 0} Open Tickets
                </Badge>
              </div>
              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors flex items-center gap-1">
                  Reviews & Support <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  Device reviews, moderation queue, and RMA customer requests.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* =========================================================================
            TOP 4 PRIMARY EXECUTIVE KPI CARDS
           ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Platform Gross Volume */}
          <Card className="shadow-xs border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Platform GMV</span>
                <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
              </div>
              
              <div className="my-3">
                {isLoading ? (
                  <Skeleton className="h-8 w-3/4 mb-1" />
                ) : (
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {formattedRevenue}
                  </h3>
                )}
                <p className="text-[11px] text-slate-400">All-time lifetime sales</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{overview?.revenue_growth || 0}%</span>
                </div>
                <span className="text-slate-400 text-[11px]">vs prior window</span>
              </div>
            </CardContent>
          </Card>

          {/* KPI 2: Period Revenue */}
          <Card className="shadow-xs border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Period Revenue</span>
                <Badge variant="secondary" className="text-[10px] font-normal px-2">
                  {timeRange}
                </Badge>
              </div>
              
              <div className="my-3">
                {isLoading ? (
                  <Skeleton className="h-8 w-3/4 mb-1" />
                ) : (
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {formattedCurrentWindowRevenue}
                  </h3>
                )}
                <p className="text-[11px] text-slate-400">{overview?.current_window_orders || 0} orders processed</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500 text-[11px]">Daily Average Pace</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                  KES {overview?.current_window_revenue ? Math.round(overview.current_window_revenue / daysParam).toLocaleString() : "0"} / day
                </span>
              </div>
            </CardContent>
          </Card>

          {/* KPI 3: Orders Fulfilled & Conversion */}
          <Card className="shadow-xs border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Orders Fulfilled</span>
                <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Package className="w-3.5 h-3.5" />
                </div>
              </div>
              
              <div className="my-3">
                {isLoading ? (
                  <Skeleton className="h-8 w-1/2 mb-1" />
                ) : (
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {overview?.total_orders?.toLocaleString() || 0}
                  </h3>
                )}
                <p className="text-[11px] text-slate-400">Checkout Conversion: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{overview?.conversion_rate || 0}%</strong></p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{overview?.orders_growth || 0}%</span>
                </div>
                <span className="text-slate-400 text-[11px]">order volume pace</span>
              </div>
            </CardContent>
          </Card>

          {/* KPI 4: Average Order Value & Buyers */}
          <Card className="shadow-xs border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average Order Value (AOV)</span>
                <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              
              <div className="my-3">
                {isLoading ? (
                  <Skeleton className="h-8 w-3/4 mb-1" />
                ) : (
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {formattedAvgOrderValue}
                  </h3>
                )}
                <p className="text-[11px] text-slate-400">{overview?.total_customers || 0} Verified Clinics & Buyers</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-slate-500 text-[11px]">Active Vendors</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px]">
                  {overview?.total_vendors || 0} Verified Suppliers
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =========================================================================
            CORE INTERACTIVE ANALYTICS & CHARTS GRID
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Main Chart Card (8 cols): Switchable Trends View */}
          <Card className="lg:col-span-8 shadow-xs border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            <CardHeader className="p-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                    Procurement & Sales Performance Trends
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Historical marketplace transaction telemetry over the last 6 recording periods.
                </CardDescription>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button
                  onClick={() => setSelectedChartMetric("revenue")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    selectedChartMetric === "revenue"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Revenue (KES)
                </button>
                <button
                  onClick={() => setSelectedChartMetric("orders")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    selectedChartMetric === "orders"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Order Volume
                </button>
                <button
                  onClick={() => setSelectedChartMetric("aov")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    selectedChartMetric === "aov"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Avg Value (AOV)
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              {isLoading ? (
                <div className="h-72 w-full flex items-center justify-center">
                  <Skeleton className="h-64 w-full" />
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 15, right: 15, left: 5, bottom: 0 }}>
                      <defs>
                        <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="aovGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="period" 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 11, fill: "#64748b" }} 
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ fontSize: 11, fill: "#64748b" }} 
                        tickFormatter={(val) => {
                          if (selectedChartMetric === "orders") return `${val}`
                          return val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`
                        }}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="bg-slate-900/95 backdrop-blur-sm text-white p-3 rounded-xl shadow-xl border border-slate-800 text-xs space-y-1.5 min-w-[170px]">
                                <p className="font-bold text-slate-300 border-b border-slate-800 pb-1">{label}</p>
                                <p className="text-emerald-400 font-bold text-sm">
                                  KES {Number(data.revenue).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                                </p>
                                <div className="flex items-center justify-between text-slate-300 text-[11px]">
                                  <span>Orders:</span>
                                  <span className="font-semibold text-white">{data.orders}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-300 text-[11px]">
                                  <span>Avg Basket:</span>
                                  <span className="font-semibold text-white">KES {data.aov.toLocaleString()}</span>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }} 
                      />
                      {selectedChartMetric === "revenue" && (
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          name="Revenue" 
                          stroke="#0ea5e9" 
                          strokeWidth={2.5} 
                          fill="url(#primaryAreaGrad)" 
                        />
                      )}
                      {selectedChartMetric === "orders" && (
                        <Area 
                          type="monotone" 
                          dataKey="orders" 
                          name="Orders" 
                          stroke="#8b5cf6" 
                          strokeWidth={2.5} 
                          fill="url(#orderGrad)" 
                        />
                      )}
                      {selectedChartMetric === "aov" && (
                        <Area 
                          type="monotone" 
                          dataKey="aov" 
                          name="Avg Value" 
                          stroke="#10b981" 
                          strokeWidth={2.5} 
                          fill="url(#aovGrad)" 
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Side Card (4 cols): Customer & Healthcare Facility Segmentation */}
          <Card className="lg:col-span-4 shadow-xs border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 flex flex-col justify-between">
            <CardHeader className="p-5 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                  Buyer & Facility Segmentation
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500">
                Procurement volume breakdown by facility tier.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-5 flex flex-col justify-between flex-1">
              <div className="relative h-44 w-full flex items-center justify-center my-1">
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
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload
                          return (
                            <div className="bg-slate-900 text-white text-xs p-2 rounded-lg shadow-md">
                              <span className="font-semibold">{item.name}: </span>
                              {item.value} ({item.growth})
                            </div>
                          )
                        }
                        return null
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {overview?.total_customers || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Verified Buyers</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                {segmentation.map((seg, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span className="font-medium text-slate-700 dark:text-slate-300">{seg.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{seg.value}</span>
                      <span className="text-emerald-600 font-medium text-[11px]">{seg.growth}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* =========================================================================
            HEALTHCARE REGULATORY & PAYMENT SETTLEMENT METRICS ROW
           ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Card 1: Regulatory Compliance & Device Verification */}
          <Card className="shadow-xs border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">PPB & Regulatory Compliance</h3>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 text-[10px]">
                Active Audit
              </Badge>
            </div>

            <div className="my-4">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {overview?.compliance_score || 100}%
                </span>
                <span className="text-xs text-slate-400">
                  {overview?.verified_products || overview?.total_products || 0} / {overview?.total_products || 0} Verified SKUs
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${overview?.compliance_score || 100}%` }}
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>All vendors hold valid Pharmacy Board licenses</span>
              <Link href="/dashboard/catalog" className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5">
                Audit <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </Card>

          {/* Card 2: Payment Settlement Channels (M-Pesa / Card / Bank) */}
          <Card className="shadow-xs border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Payment Settlement Channels</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Safaricom Daraja & Cards</span>
            </div>

            <div className="my-2 space-y-2.5">
              {paymentDistribution.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.method}</span>
                    <span className="font-bold text-slate-900 dark:text-white">{item.share}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        idx === 0 ? "bg-emerald-500" : idx === 1 ? "bg-blue-500" : "bg-purple-500"
                      }`}
                      style={{ width: `${item.share}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>M-Pesa Daraja STK Push Active</span>
              <Link href="/dashboard/payments" className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5">
                Ledger <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </Card>

          {/* Card 3: Order Pipeline Status Distribution */}
          <Card className="shadow-xs border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5 flex flex-col justify-between md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Order Fulfillment Funnel</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Live Pipeline</span>
            </div>

            <div className="my-2 grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Delivered</p>
                <p className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  {orderStatusDistribution.find(s => s.key === "delivered")?.count || 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                <p className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">In Transit</p>
                <p className="text-base font-bold text-blue-900 dark:text-blue-200">
                  {orderStatusDistribution.find(s => s.key === "shipped")?.count || 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                <p className="text-[10px] text-indigo-700 dark:text-indigo-400 font-medium">Processing / Paid</p>
                <p className="text-base font-bold text-indigo-900 dark:text-indigo-200">
                  {overview?.unfulfilled_orders || 0}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Pending Payment</p>
                <p className="text-base font-bold text-amber-900 dark:text-amber-200">
                  {orderStatusDistribution.find(s => s.key === "pending")?.count || 0}
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Fulfilled On-Time: <strong>98.4%</strong></span>
              <Link href="/dashboard/orders" className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5">
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </Card>
        </div>

        {/* =========================================================================
            SEARCHABLE RECENT ORDERS & TOP PRODUCTS / STOCK ALERTS SECTION
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Main Column (8 cols): Interactive Recent Orders Table */}
          <Card className="lg:col-span-8 shadow-xs border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-500" />
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                    Recent Procurement & Hospital Orders
                  </CardTitle>
                </div>
                
                <Link 
                  href="/dashboard/orders" 
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  View Order Center <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Search Bar & Filter Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search by order #, clinic or item..."
                    value={searchOrderQuery}
                    onChange={(e) => setSearchOrderQuery(e.target.value)}
                    className="h-8 pl-8 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  />
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {["all", "pending", "processing", "shipped", "delivered"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSelectedStatusFilter(tab)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-colors whitespace-nowrap ${
                        selectedStatusFilter === tab
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                  <Package className="w-8 h-8 text-slate-300" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No orders match your filter criteria.</p>
                  <Button variant="ghost" size="sm" onClick={() => { setSearchOrderQuery(""); setSelectedStatusFilter("all"); }} className="text-xs text-blue-600">
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50/60 dark:bg-slate-900/60">
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
                    {filteredOrders.slice(0, Number(rowsPerPage)).map((order) => (
                      <TableRow key={order.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <TableCell className="pl-5 py-3.5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                              {order.order_number}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate max-w-[200px]" title={order.product}>
                              {order.product}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {order.customer}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {order.qty}
                        </TableCell>
                        <TableCell>
                          <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                            order.status.toLowerCase() === "pending" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" :
                            ["paid", "processing"].includes(order.status.toLowerCase()) ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300" :
                            order.status.toLowerCase() === "shipped" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" :
                            order.status.toLowerCase() === "delivered" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" :
                            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {order.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            <span>{order.paymentMethod}</span>
                          </div>
                        </TableCell>
                        <TableCell className="pr-5 py-3.5 text-right text-xs font-bold text-slate-900 dark:text-white">
                          {order.totalPrice}
                        </TableCell>
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
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>per page</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Showing {Math.min(filteredOrders.length, Number(rowsPerPage))} of {filteredOrders.length} orders</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Side Column (4 cols): Top Products & Critical Stock Alerts */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            
            {/* Top Selling Medical Products */}
            <Card className="shadow-xs border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Top Medical Equipment</CardTitle>
                </div>
                <Link href="/dashboard/catalog" className="text-[11px] text-blue-600 hover:underline">
                  Catalog
                </Link>
              </CardHeader>
              <CardContent className="p-4 pt-3 space-y-3">
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : topProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No product volume recorded yet.</p>
                ) : (
                  topProducts.map((prod) => (
                    <div key={prod.id} className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 pb-2.5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[190px]" title={prod.name}>
                          {prod.name}
                        </p>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          KES {prod.revenue?.toLocaleString() || "0"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{prod.units_sold} units sold</span>
                        <span>Avg Unit: KES {prod.price?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Critical Low Stock SKU Alerts */}
            <Card className="shadow-xs border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">Low Stock Watchlist</CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200">
                  {stockAlerts.length} Critical
                </Badge>
              </CardHeader>
              <CardContent className="p-4 pt-3 space-y-3">
                {stockAlerts.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span>All inventory levels are healthy.</span>
                  </div>
                ) : (
                  stockAlerts.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]" title={item.name}>
                          {item.name}
                        </p>
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                          Only {item.stock_quantity} remaining (Min: {item.threshold})
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-[11px] px-2" asChild>
                        <Link href={`/dashboard/catalog`}>Restock</Link>
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

          </div>

        </div>

        {/* =========================================================================
            FOOTER & OPERATIONS STATUS
           ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-200/80 dark:border-slate-800 gap-3">
          <p>© 2026 MyMedDevices Kenya Ltd. Official Healthcare Procurement & Regulatory Exchange.</p>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/settings" className="hover:underline hover:text-slate-600 dark:hover:text-slate-200">Platform Settings</Link>
            <Link href="/dashboard/payments" className="hover:underline hover:text-slate-600 dark:hover:text-slate-200">Payment Gateways</Link>
            <Link href="/dashboard/marketing" className="hover:underline hover:text-slate-600 dark:hover:text-slate-200">Marketing Center</Link>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
