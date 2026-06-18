"use client"

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
  Apple, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  LucideIcon
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

// --- Mock Data ---

const KPI_DATA = [
  { title: "Total Revenue", value: "$45,231.89", trend: "+20.1%", trendType: "up" as const, icon: DollarSign },
  { title: "Active Customers", value: "+2,350", trend: "+180.1%", trendType: "up" as const, icon: Users },
  { title: "Products Sold", value: "+12,234", trend: "+19%", trendType: "up" as const, icon: Package },
  { title: "Conversion Rate", value: "3.2%", trend: "-4%", trendType: "down" as const, icon: Activity },
  { title: "Revenue Growth", value: "+$12,403", trend: "+12%", trendType: "up" as const, icon: TrendingUp },
]

const SALES_DATA = [
  { name: "Jan", total: 1200 },
  { name: "Feb", total: 2100 },
  { name: "Mar", total: 1800 },
  { name: "Apr", total: 2400 },
  { name: "May", total: 1900 },
  { name: "Jun", total: 2800 },
]

const RECENT_TRANSACTIONS = [
  { id: "1", type: "Credit Card", status: "Completed", date: "2024-03-12 10:45", amount: "$120.50", methodIcon: CreditCard },
  { id: "2", type: "Apple Pay", status: "Pending", date: "2024-03-12 09:30", amount: "$45.00", methodIcon: Apple },
  { id: "3", type: "Credit Card", status: "Completed", date: "2024-03-11 16:20", amount: "$210.00", methodIcon: CreditCard },
  { id: "4", type: "Apple Pay", status: "Failed", date: "2024-03-11 14:15", amount: "$89.99", methodIcon: Apple },
]

const POPULAR_PRODUCTS = [
  { name: "Wireless Headphones", price: "$199.00", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop", sales: 120 },
  { name: "Smart Watch", price: "$299.00", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop", sales: 85 },
  { name: "Leather Backpack", price: "$149.00", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop", sales: 64 },
]

const RECENT_ORDERS = [
  { id: "ORD-7392", customer: "John Doe", email: "john@example.com", product: "Wireless Headphones", amount: "$199.00", status: "Shipped", date: "2024-03-12", method: "Express" },
  { id: "ORD-7391", customer: "Jane Smith", email: "jane@example.com", product: "Smart Watch", amount: "$299.00", status: "Processing", date: "2024-03-12", method: "Standard" },
  { id: "ORD-7390", customer: "Robert Brown", email: "robert@example.com", product: "Leather Backpack", amount: "$149.00", status: "Delivered", date: "2024-03-11", method: "Next Day" },
  { id: "ORD-7389", customer: "Alice Johnson", email: "alice@example.com", product: "Smart Watch", amount: "$299.00", status: "Cancelled", date: "2024-03-11", method: "Standard" },
  { id: "ORD-7388", customer: "Michael Wilson", email: "michael@example.com", product: "Wireless Headphones", amount: "$199.00", status: "Shipped", date: "2024-03-10", method: "Express" },
]

const SPARKLINE_DATA = [
  { value: 10 }, { value: 15 }, { value: 8 }, { value: 22 }, { value: 18 }, { value: 25 }, { value: 20 },
]

// --- Helper Components ---

interface KPICardProps {
  title: string
  value: string
  trend: string
  trendType: "up" | "down"
  icon: LucideIcon
}

const KPICard = ({ title, value, trend, trendType, icon: Icon }: KPICardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
        {trendType === "up" ? (
          <TrendingUp className="h-3 w-3 text-emerald-500" />
        ) : (
          <TrendingDown className="h-3 w-3 text-rose-500" />
        )}
        <span className={trendType === "up" ? "text-emerald-500" : "text-rose-500"}>
          {trend}
        </span>
        from last month
      </div>
    </CardContent>
  </Card>
)

const CircularProgress = ({ value, label }: { value: number, label: string }) => {
  const data = [
    { name: "Progress", value: value },
    { name: "Remaining", value: 100 - value },
  ]
  const COLORS = ["#3b82f6", "#f1f5f9"]

  return (
    <div className="relative flex flex-col items-center justify-center h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
            startAngle={90}
            endAngle={450}
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold">{value}%</span>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
    </div>
  )
}

const Sparkline = ({ data }: { data: { value: number }[] }) => (
  <div className="h-[40px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#gradient)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
)

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, string> = {
    "Shipped": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "Processing": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "Delivered": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "Cancelled": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    "Completed": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "Pending": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "Failed": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  }
  
  return (
    <Badge className={`${variants[status] || "bg-gray-100 text-gray-700"} border-none font-medium`}>
      {status}
    </Badge>
  )
}

// --- Main Page ---

export default function ShopNowDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">ShopNow Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening with your store today.</p>
        </div>


        {/* Top-Level KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {KPI_DATA.map((kpi, i) => (
            <KPICard key={i} {...kpi} />
          ))}
        </div>

        {/* Middle Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Sales Metrics */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Sales Metrics</CardTitle>
              <CardDescription>Monthly performance and key sales indicators.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Orders Today</p>
                  <p className="text-2xl font-bold">142</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className="text-2xl font-bold">$12,403</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Active Discounts</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                  <p className="text-2xl font-bold">$87.50</p>
                </div>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={SALES_DATA}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <YAxis 
                      hide 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar 
                      dataKey="total" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]} 
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Target */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Revenue Target</CardTitle>
              <CardDescription>Current month progress.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-between">
              <CircularProgress value={78} label="Total Profit" />
              <div className="w-full space-y-4 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Target</span>
                  <span className="font-medium">$50,000.00</span>
                </div>
                <Progress value={78} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  You are <span className="text-foreground font-medium">$12,342</span> away from your monthly goal.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Transactions */}
          <Card className="col-span-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest financial activity on your platform.</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {RECENT_TRANSACTIONS.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <tx.methodIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.type}</p>
                        <p className="text-xs text-muted-foreground">{tx.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <StatusBadge status={tx.status} />
                      <p className="text-sm font-bold w-20 text-right">{tx.amount}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Popular Products & Sales Plan */}
          <div className="col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Popular Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {POPULAR_PRODUCTS.map((product, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-md">
                        <AvatarImage src={product.image} />
                        <AvatarFallback>{product.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sales} sales</p>
                      </div>
                      <p className="text-sm font-bold">{product.price}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Sales Plan</CardTitle>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">+12.5%</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold">84%</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Cohort Performance</p>
                  </div>
                  <div className="flex-1">
                    <Sparkline data={SPARKLINE_DATA} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lower Section: Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Monitor and manage latest customer orders.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Export CSV</Button>
              <Button size="sm">Add Order</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Shipping</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RECENT_ORDERS.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.customer}</span>
                        <span className="text-xs text-muted-foreground">{order.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{order.product}</TableCell>
                    <TableCell>{order.amount}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>{order.date}</TableCell>
                    <TableCell>{order.method}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Showing 5 of 124 orders</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon-sm" disabled>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="icon-sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Sidebar/Widget Area */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Orders Widget */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Order Logistics</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="new">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                  <TabsTrigger value="new">New</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="shipping">Shipping</TabsTrigger>
                  <TabsTrigger value="reviews" className="bg-primary/5 text-primary">Reviews</TabsTrigger>
                </TabsList>
                <TabsContent value="reviews" className="space-y-4">
                  <div className="p-3 border rounded-xl bg-indigo-500/5 border-indigo-500/10">
                    <div className="flex justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Audit Queue</span>
                      <Badge className="bg-amber-100 text-amber-700 text-[9px] h-4">Pending</Badge>
                    </div>
                    <div className="space-y-1">
                       <p className="text-xs font-bold truncate">MRI Scanner Voluson E10</p>
                       <p className="text-[10px] text-muted-foreground">Submitted by GE Healthcare</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-indigo-500/10 flex justify-between items-center">
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Medical Class C</span>
                      <Button size="xs" className="rounded-lg h-7 px-3 bg-indigo-600" asChild>
                        <Link href="/dashboard/catalog/products?status=pending_review">Audit</Link>
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="new" className="space-y-4">
                  <div className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-bold uppercase text-blue-600">ORD-7394</span>
                      <span className="text-[10px] text-muted-foreground">2 mins ago</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-emerald-500" />
                        <p className="text-xs text-muted-foreground"><span className="text-foreground font-medium">Sender:</span> Global Logistics Hub</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-blue-500" />
                        <p className="text-xs text-muted-foreground"><span className="text-foreground font-medium">Receiver:</span> Sarah Jenkins, NY</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      <span className="text-xs font-medium">$420.00</span>
                      <Button size="xs">Process</Button>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="pending">
                   <p className="text-xs text-center py-8 text-muted-foreground">No pending orders to show.</p>
                </TabsContent>
                <TabsContent value="shipping">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span>ORD-7385</span>
                      <span className="text-blue-500">In Transit</span>
                    </div>
                    <Progress value={65} className="h-1.5" />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Chicago, IL</span>
                      <span>Denver, CO</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Top Products by Sales */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Top Products (Sales)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-8 text-[10px] uppercase">Product</TableHead>
                    <TableHead className="h-8 text-[10px] uppercase">Category</TableHead>
                    <TableHead className="h-8 text-[10px] uppercase text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="py-2 text-xs font-medium">MacBook Pro</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">Electronics</TableCell>
                    <TableCell className="py-2 text-xs font-bold text-right">$45,200</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-2 text-xs font-medium">iPhone 15</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">Mobile</TableCell>
                    <TableCell className="py-2 text-xs font-bold text-right">$38,150</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-2 text-xs font-medium">iPad Air</TableCell>
                    <TableCell className="py-2 text-xs text-muted-foreground">Tablets</TableCell>
                    <TableCell className="py-2 text-xs font-bold text-right">$12,400</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Top Products by Volume */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Top Products (Volume)</CardTitle>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-8 text-[10px] uppercase">Product</TableHead>
                    <TableHead className="h-8 text-[10px] uppercase">Units</TableHead>
                    <TableHead className="h-8 text-[10px] uppercase text-right">Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="py-2 text-xs font-medium">AirPods Pro</TableCell>
                    <TableCell className="py-2 text-xs">1,240</TableCell>
                    <TableCell className="py-2 text-xs text-emerald-500 font-bold text-right flex items-center justify-end gap-1">
                      <ArrowUpRight className="size-3" /> 24%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-2 text-xs font-medium">MagSafe Charger</TableCell>
                    <TableCell className="py-2 text-xs">850</TableCell>
                    <TableCell className="py-2 text-xs text-rose-500 font-bold text-right flex items-center justify-end gap-1">
                      <ArrowDownRight className="size-3" /> 5%
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="py-2 text-xs font-medium">USB-C Cable</TableCell>
                    <TableCell className="py-2 text-xs">640</TableCell>
                    <TableCell className="py-2 text-xs text-emerald-500 font-bold text-right flex items-center justify-end gap-1">
                      <ArrowUpRight className="size-3" /> 12%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
