"use client"

import { useState } from "react"
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
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  ChevronDown,
  Star,
  CheckCircle2,
  Clock,
  QrCode,
  Laptop
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// --- Custom Replicated Mock Datasets ---

const TOP_SPARKLINE_1 = [
  { val: 12 }, { val: 18 }, { val: 14 }, { val: 24 }, { val: 20 }, { val: 30 }, { val: 28 }, { val: 35 }
]

const TOP_SPARKLINE_2 = [
  { val: 10 }, { val: 15 }, { val: 22 }, { val: 19 }, { val: 28 }, { val: 24 }, { val: 32 }
]

const TOP_BAR_SPARKLINE = [
  { period: "M1", growth: 15 },
  { period: "M2", growth: 22 },
  { period: "M3", growth: 18 },
  { period: "M4", growth: 28 },
  { period: "M5", growth: 24 }
]

const SEGMENTATION_DATA = [
  { name: "Startup", value: 2310, growth: "+32.8%", color: "#000000" },
  { name: "Enterprise", value: 800, growth: "+32.8%", color: "#3b82f6" },
  { name: "Individuals", value: 310, growth: "-17%", color: "#10b981" }
]

const ORDER_OVERVIEW_DATA = [
  { date: "Mar 30", total: 8000, orders: 400 },
  { date: "Apr 9", total: 18000, orders: 1200 },
  { date: "Apr 14", total: 14000, orders: 900 },
  { date: "Apr 19", total: 22560, orders: 1540 },
  { date: "Apr 24", total: 19000, orders: 1100 },
  { date: "Apr 29", total: 28000, orders: 1800 },
]

const USER_ACTIVITY_DATA = [
  { day: "M", checkout: 45, active: 85 },
  { day: "T", checkout: 55, active: 90 },
  { day: "W", checkout: 75, active: 110 },
  { day: "T", checkout: 60, active: 95 },
  { day: "F", checkout: 85, active: 130 },
  { day: "S", checkout: 95, active: 140 },
  { day: "S", checkout: 70, active: 105 },
]

const RECENT_SALES_ORDERS = [
  {
    id: "1",
    product: "Livesoft Memory Foam Pillow Set",
    customer: "Emma Watson",
    qty: "3 Pcs",
    status: "Pending",
    paymentMethod: "Credit Card",
    totalPrice: "$180.00",
    image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=80&h=80&fit=crop"
  },
  {
    id: "2",
    product: "Solar Desk Lamp with Matte Finish",
    customer: "Michael Brown",
    qty: "2 Pcs",
    status: "Shipped",
    paymentMethod: "UPI",
    totalPrice: "$120.00",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=80&h=80&fit=crop"
  },
  {
    id: "3",
    product: "Artisan Coffee Maker with Wood Finish",
    customer: "Olivia Johnson",
    qty: "1 Pcs",
    status: "Delivered",
    paymentMethod: "Cash on Delivery",
    totalPrice: "$250.00",
    image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=80&h=80&fit=crop"
  },
  {
    id: "4",
    product: "Wireless Noise Canceling Earbuds",
    customer: "Daniel Lee",
    qty: "2 Pcs",
    status: "Shipped",
    paymentMethod: "UPI",
    totalPrice: "$200.00",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=80&h=80&fit=crop"
  },
  {
    id: "5",
    product: "Minimalist Glass Coffee Table",
    customer: "Sophia Garcia",
    qty: "1 Pcs",
    status: "Delivered",
    paymentMethod: "Cash on Delivery",
    totalPrice: "$450.00",
    image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=80&h=80&fit=crop"
  }
]

const LATEST_PRODUCTS = [
  { name: "Smart Home Camera", sub: "8.49k users", price: "$180.00", image: "https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?w=80&h=80&fit=crop" },
  { name: "Bluetooth Soundbar", sub: "8.49k users", price: "$200.00", image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=80&h=80&fit=crop" },
  { name: "Ergonomic Office Chair", sub: "8.49k users", price: "$350.00", image: "https://images.unsplash.com/photo-1580481072645-022f9a6d83d0?w=80&h=80&fit=crop" },
]

export default function ReplicatedAdminDashboard() {
  const [timeRange, setTimeRange] = useState("Last 30 Days")
  const [rowsPerPage, setRowsPerPage] = useState("5")

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 font-sans bg-slate-50/50 dark:bg-slate-950/50 p-2 md:p-6 rounded-2xl">
        
        {/* --- Top Row: 3 KPI Sparkline Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Total Sales */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Sales</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Shadon Space</p>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">$98,452.76</h3>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium pt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+32.8%</span>
                  <span className="text-slate-400 font-normal">vs last month</span>
                </div>
              </div>
              <div className="h-16 w-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={TOP_SPARKLINE_1}>
                    <defs>
                      <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#000000" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip cursor={false} content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow">
                            Sales {payload[0].value}
                          </div>
                        )
                      }
                      return null;
                    }} />
                    <Area type="monotone" dataKey="val" stroke="#000000" strokeWidth={2} fill="url(#grad1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Monthly Sales */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Monthly Sales</p>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white pt-2">$36,890</h3>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium pt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+32.8%</span>
                  <span className="text-slate-400 font-normal">vs last month</span>
                </div>
              </div>
              <div className="h-16 w-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={TOP_SPARKLINE_2}>
                    <defs>
                      <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={2} fill="url(#grad2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Revenue Growth */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Revenue Growth</p>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white pt-2">+24%</h3>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium pt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+32.8%</span>
                  <span className="text-slate-400 font-normal">vs last month</span>
                </div>
              </div>
              <div className="h-16 w-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={TOP_BAR_SPARKLINE}>
                    <Bar dataKey="growth" fill="#000000" radius={[3, 3, 0, 0]} barSize={8} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- Middle Grid 1: Analytics Row --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Card 1: Customer Segmentation */}
          <Card className="lg:col-span-3 shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 flex flex-col justify-between">
            <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Customer Segmentation</CardTitle>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              <div className="relative h-44 w-full flex items-center justify-center my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={SEGMENTATION_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {SEGMENTATION_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs p-2 rounded shadow">
                            <span className="font-semibold">{data.name}: </span>{data.value} ({data.growth})
                          </div>
                        )
                      }
                      return null;
                    }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold text-slate-900 dark:text-white">3,420</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Startup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">2,310</span>
                    <span className="text-emerald-600 font-medium">+32.8%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Enterprise</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">800</span>
                    <span className="text-emerald-600 font-medium">+32.8%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Individuals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">310</span>
                    <span className="text-rose-500 font-medium">-17%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Order Overview */}
          <Card className="lg:col-span-6 shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            <CardHeader className="p-5 pb-0 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Order Overview</CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> 170%
                </span>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="h-8 text-xs border-slate-200 rounded-lg w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                    <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                    <SelectItem value="Last Year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-center gap-6 mb-4 text-xs">
                <div>
                  <p className="text-slate-400">Total orders</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">$22,560</p>
                </div>
                <div>
                  <p className="text-slate-400">Orders</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">1,540</p>
                </div>
              </div>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ORDER_OVERVIEW_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `${val / 1000}K`} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white text-xs p-2 rounded shadow space-y-1">
                            <p className="font-semibold text-slate-400">{label}</p>
                            <p>Total Sales: ${payload[0].value}</p>
                            <p>Orders: {payload[0].payload.orders}</p>
                          </div>
                        )
                      }
                      return null;
                    }} />
                    <Area type="monotone" dataKey="total" stroke="#000000" strokeWidth={2.5} fill="url(#orderGrad)" />
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
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">User Activity</CardTitle>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="w-4 h-4 text-slate-400" />
              </Button>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-44 w-full my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={USER_ACTIVITY_DATA} barGap={4}>
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="active" fill="#000000" radius={[2, 2, 0, 0]} barSize={6} />
                    <Bar dataKey="checkout" fill="#cbd5e1" radius={[2, 2, 0, 0]} barSize={6} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <p className="text-slate-400">Is Tracking</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">678,900</p>
                </div>
                <div>
                  <p className="text-slate-400">Checkout</p>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">312,420</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- Middle Grid 2: 4 Small Metrics Row --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Stat 1 */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Total Orders</span>
              <Button variant="ghost" size="icon" className="h-5 w-5"><MoreHorizontal className="w-3 h-3 text-slate-400" /></Button>
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">1920</h4>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-emerald-600 font-medium flex items-center gap-0.5"><TrendingUp className="w-3 h-3"/> +32.8%</span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </Card>

          {/* Stat 2 */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Orders Shipped</span>
              <Button variant="ghost" size="icon" className="h-5 w-5"><MoreHorizontal className="w-3 h-3 text-slate-400" /></Button>
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">1785</h4>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-rose-500 font-medium flex items-center gap-0.5"><TrendingDown className="w-3 h-3"/> 2.5%</span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </Card>

          {/* Stat 3 */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Revenue Generated</span>
              <Button variant="ghost" size="icon" className="h-5 w-5"><MoreHorizontal className="w-3 h-3 text-slate-400" /></Button>
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">$88,900</h4>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-emerald-600 font-medium flex items-center gap-0.5"><TrendingUp className="w-3 h-3"/> +32.8%</span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </Card>

          {/* Stat 4 */}
          <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Customer Satisfaction</span>
              <Button variant="ghost" size="icon" className="h-5 w-5"><MoreHorizontal className="w-3 h-3 text-slate-400" /></Button>
            </div>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">4.9 / 5.0</h4>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-emerald-600 font-medium flex items-center gap-0.5"><TrendingUp className="w-3 h-3"/> +32.8%</span>
              <span className="text-slate-400">vs last month</span>
            </div>
          </Card>
        </div>

        {/* --- Bottom Row: Table & Side Widgets --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Main Table: Recent Sales Orders */}
          <Card className="lg:col-span-8 shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent Sales Orders</CardTitle>
              </div>
              <Button variant="ghost" className="text-xs text-slate-500 font-normal h-8">View all orders</Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
                  <TableRow className="border-slate-100 dark:border-slate-800">
                    <TableHead className="text-xs font-semibold text-slate-500 pl-5">Product</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500">Customer</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500">Qty</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500">Payment Method</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-500 pr-5 text-right">Total Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {RECENT_SALES_ORDERS.map((order) => (
                    <TableRow key={order.id} className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-900/60">
                      <TableCell className="pl-5 py-3">
                        <div className="flex items-center gap-3">
                          <img src={order.image} alt={order.product} className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[180px] truncate">{order.product}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-300 font-medium">{order.customer}</TableCell>
                      <TableCell className="text-xs text-slate-500">{order.qty}</TableCell>
                      <TableCell>
                        <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${
                          order.status === "Pending" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40" :
                          order.status === "Shipped" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40" :
                          "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
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
              
              {/* Pagination controls matching video */}
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
                  <span>1-4 of 4</span>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" disabled><ChevronLeft className="w-3.5 h-3.5"/></Button>
                    <Button variant="outline" size="icon" className="h-7 w-7 bg-slate-900 text-white border-slate-900">1</Button>
                    <Button variant="outline" size="icon" className="h-7 w-7"><ChevronRight className="w-3.5 h-3.5"/></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Side Column: Latest Products & Total Assets */}
          <div className="lg:col-span-4 space-y-5">
            {/* Latest Products Card */}
            <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-500" />
                  <CardTitle className="text-sm font-semibold text-slate-800 dark:text-slate-100">Latest Products</CardTitle>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="w-4 h-4 text-slate-400" /></Button>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-3">
                {LATEST_PRODUCTS.map((prod, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <img src={prod.image} alt={prod.name} className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{prod.name}</p>
                        <p className="text-[10px] text-slate-400">{prod.sub}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{prod.price}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Total Assets & Promo Card */}
            <Card className="shadow-sm border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <DollarSign className="w-4 h-4 text-slate-500" />
                <span>Total Assets</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">$478,230.90</h3>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">+15.7% +$65,000 <span className="text-slate-400 font-normal">vs last month</span></p>
              </div>
              
              {/* Asset progress bar */}
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-slate-400">Distribution</p>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-slate-900 dark:bg-white w-[65%]" />
                  <div className="h-full bg-slate-400 w-[25%]" />
                  <div className="h-full bg-slate-200 dark:bg-slate-700 w-[10%]" />
                </div>
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white" /> Product Sales
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">$312,500.45 (65%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" /> Service Revenue
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">$125,000.25 (25%)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700" /> Other Income
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">$40,730.20 (09%)</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Dark Mode Promo Banner Card */}
            <Card className="shadow-sm border-slate-900 bg-slate-900 text-white rounded-xl p-5 relative overflow-hidden">
              <div className="relative z-10 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Dark Mode Aesthetics</span>
                <div className="flex items-center gap-3">
                  <Laptop className="w-10 h-10 text-slate-300" />
                  <p className="text-xs text-slate-300">A laptop on desk with minimal desk setup</p>
                </div>
                <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100 font-semibold rounded-lg text-xs">Get Premium</Button>
              </div>
            </Card>
          </div>

        </div>

        {/* Footer info matching video */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-slate-200/60 dark:border-slate-800">
          <p>© 2026 by shadcnboard, creating a better web for you.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:underline">About Us</a>
            <a href="#" className="hover:underline">Blog</a>
            <a href="#" className="hover:underline">License</a>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
