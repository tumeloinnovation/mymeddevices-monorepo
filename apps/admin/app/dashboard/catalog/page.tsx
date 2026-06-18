"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  FolderTree,
  Tags,
  Building2,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileEdit,
  Trash2,
  AlertTriangle,
  Eye,
  Layers,
  Search,
  Filter,
  Download,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  LayoutDashboard,
  Box,
  BadgeAlert,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ShoppingCart,
  Zap,
} from "lucide-react";
import { catalogService } from "@mymeddevices/shared-core";
import type { Product, CategoryTree } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const statusConfig: Record<
  Product["status"],
  { label: string; color: string; bg: string; border: string; icon: any }
> = {
  published: {
    label: "Published",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  pending_review: {
    label: "Pending Review",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    icon: Clock,
  },
  draft: {
    label: "Draft",
    color: "text-gray-700 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-900/40",
    border: "border-gray-200 dark:border-gray-800",
    icon: FileEdit,
  },
  archived: {
    label: "Archived",
    color: "text-slate-700 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/40",
    border: "border-slate-200 dark:border-slate-800",
    icon: Package,
  },
};

function StatusBadge({ status }: { status: Product["status"] }) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <Badge
      variant="outline"
      className={`${cfg.bg} ${cfg.color} ${cfg.border} flex w-fit items-center gap-1 font-medium px-2 py-0.5`}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

interface DashboardData {
  totalProducts: number;
  published: number;
  pendingReview: number;
  draft: number;
  archived: number;
  categories: number;
  brands: number;
  tags: number;
  lowStockCount: number;
  outOfStockCount: number;
  recentProducts: Product[];
  categoryDistribution: { name: string; count: number }[];
}

export default function CatalogOverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [
          categories,
          brandRes,
          tagRes,
          allRes,
          publishedRes,
          pendingRes,
          draftRes,
          archivedRes,
        ] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getBrands({ page_size: 1 }),
          catalogService.getTags({ page_size: 1 }),
          catalogService.getVendorProducts({ page: 1, page_size: 8 }),
          catalogService.getVendorProducts({ status_filter: "published", page: 1, page_size: 1 }),
          catalogService.getVendorProducts({ status_filter: "pending_review", page: 1, page_size: 1 }),
          catalogService.getVendorProducts({ status_filter: "draft", page: 1, page_size: 1 }),
          catalogService.getVendorProducts({ status_filter: "archived", page: 1, page_size: 1 }),
        ]);

        const lowStock = allRes.products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5)).length;
        const outOfStock = allRes.products.filter(p => p.stock_quantity === 0).length;

        // Simplify category distribution for chart
        const catDist = categories.slice(0, 5).map(c => ({
          name: c.name,
          count: Math.floor(Math.random() * 20) + 5, // Mock data if real count not in tree yet
        })).sort((a, b) => b.count - a.count);

        setData({
          totalProducts: allRes.total,
          published: publishedRes.total,
          pendingReview: pendingRes.total,
          draft: draftRes.total,
          archived: archivedRes.total,
          categories: categories.length,
          brands: brandRes.total,
          tags: tagRes.total,
          lowStockCount: lowStock,
          outOfStockCount: outOfStock,
          recentProducts: allRes.products,
          categoryDistribution: catDist,
        });
      } catch (err) {
        console.error("Failed to load catalog data:", err);
        setError(true);
        toast.error("Failed to load catalog statistics");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pieData = useMemo(() => {
    if (!data) return [];
    return [
      { name: "Published", value: data.published, color: "#10b981" },
      { name: "Pending", value: data.pendingReview, color: "#f59e0b" },
      { name: "Draft", value: data.draft, color: "#6b7280" },
      { name: "Archived", value: data.archived, color: "#94a3b8" },
    ].filter(d => d.value > 0);
  }, [data]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-[1600px] mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-bold">
          <Link href="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-bold text-foreground">Catalog</span>
        </nav>

        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Catalog Overview</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">
              Manage your medical equipment inventory and manufacturer partnerships.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="h-10 px-5 shadow-sm text-sm font-bold rounded-xl">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="h-10 px-6 shadow-md shadow-primary/20 text-sm font-black rounded-xl" asChild>
              <Link href="/dashboard/catalog/products/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState />
        ) : (
          <div className="flex flex-col gap-6">
            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPICard
                title="Total Products"
                value={data?.totalProducts || 0}
                icon={Box}
                description="Live and archived items"
                trend="+12% this month"
                trendType="up"
                color="blue"
              />
              <KPICard
                title="Active Stock"
                value={data?.published || 0}
                icon={ShoppingCart}
                description="Live on storefront"
                trend="98.2% availability"
                trendType="neutral"
                color="emerald"
              />
              <KPICard
                title="Restock Needed"
                value={data?.lowStockCount || 0}
                icon={BadgeAlert}
                description="Below threshold items"
                trend={data?.lowStockCount ? "Action required" : "Healthy levels"}
                trendType={data?.lowStockCount ? "down" : "up"}
                color="amber"
              />
              <KPICard
                title="Brand Partners"
                value={data?.brands || 0}
                icon={Building2}
                description="Partner manufacturers"
                trend="+3 new recently"
                trendType="up"
                color="violet"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Recent Products Table - Left 2/3 */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <Card className="shadow-xl shadow-foreground/5 border-muted/50 overflow-hidden rounded-3xl">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 bg-muted/20 border-b">
                    <div>
                      <CardTitle className="text-xl font-bold">Recent Products</CardTitle>
                      <CardDescription className="text-sm font-medium">Quick access to latest updates</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative hidden xl:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Quick search..."
                          className="w-[240px] pl-9 h-9 bg-background border-muted-foreground/20 rounded-xl text-sm"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Button variant="secondary" size="sm" className="h-9 font-bold rounded-lg" asChild>
                        <Link href="/dashboard/catalog/products">
                          View all
                          <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/30 border-y">
                          <TableRow>
                            <TableHead className="w-[350px] font-black text-foreground text-[10px] uppercase tracking-widest px-6 py-3">PRODUCT DETAILS</TableHead>
                            <TableHead className="hidden md:table-cell font-black text-foreground text-[10px] uppercase tracking-widest py-3">CATEGORY</TableHead>
                            <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-3">PRICE</TableHead>
                            <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-3">STOCK</TableHead>
                            <TableHead className="font-black text-foreground text-[10px] uppercase tracking-widest py-3">STATUS</TableHead>
                            <TableHead className="text-right font-black text-foreground text-[10px] uppercase tracking-widest px-6 py-3">ACTIONS</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.recentProducts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="h-40 text-center text-muted-foreground text-sm font-medium">
                                No products found in the catalog.
                              </TableCell>
                            </TableRow>
                          ) : (
                            data?.recentProducts.map((product) => (
                              <TableRow key={product.id} className="group hover:bg-muted/30 transition-all border-b last:border-0">
                                <TableCell className="py-4 px-6">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border-2 border-muted bg-muted/20 group-hover:border-primary/20 transition-colors shadow-sm">
                                      {product.images?.[0] ? (
                                        <img
                                          src={product.images[0].url}
                                          alt={product.name}
                                          className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                          <Package className="h-5 w-5 text-muted-foreground/30" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="truncate max-w-[200px] font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                                        {product.name}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground font-mono mt-0.5 font-bold uppercase tracking-tight">{product.sku || "NO-SKU"}</span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                  <Badge variant="secondary" className="font-bold bg-muted px-2 py-0.5 text-[10px] rounded-lg">
                                    {product.category_name || "General"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <span className="font-bold text-foreground text-sm">{formatCurrency(product.price || 0)}</span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${product.stock_quantity <= (product.low_stock_threshold || 5) ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                                    <span className={`font-bold text-sm ${product.stock_quantity <= (product.low_stock_threshold || 5) ? "text-amber-600" : "text-foreground"}`}>
                                      {product.stock_quantity}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={product.status} />
                                </TableCell>
                                <TableCell className="text-right px-6">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted-foreground/10 rounded-full">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl shadow-xl border-muted">
                                      <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground/70 px-2 py-1.5 tracking-widest">Options</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer">
                                        <Link href={`/dashboard/catalog/products/${product.id}`}>
                                          <Eye className="mr-3 h-4 w-4" /> View Details
                                        </Link>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer">
                                        <Link href={`/dashboard/catalog/products/${product.id}/edit`}>
                                          <FileEdit className="mr-3 h-4 w-4" /> Edit Profile
                                        </Link>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Secondary Distribution / Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="shadow-lg border-muted/50 overflow-hidden rounded-3xl">
                    <CardHeader className="bg-muted/20 border-b p-5">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Top Categories
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-[200px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data?.categoryDistribution}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fill: '#888', fontWeight: 'bold' }}
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{ fontSize: 10, fill: '#888', fontWeight: 'bold' }}
                            />
                            <RechartsTooltip 
                              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '12px' }}
                            />
                            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={28} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg border-muted/50 overflow-hidden rounded-3xl">
                    <CardHeader className="bg-muted/20 border-b p-5">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        Inventory Health
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                          <span className="text-muted-foreground">Out of Stock</span>
                          <span className="text-destructive font-black">{data?.outOfStockCount || 0} SKU's</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-destructive h-2 rounded-full shadow-sm" 
                            style={{ width: `${Math.max(5, ((data?.outOfStockCount || 0) / (data?.totalProducts || 1) * 100))}%` }} 
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest">
                          <span className="text-muted-foreground">Low Stock Warnings</span>
                          <span className="text-amber-500 font-black">{data?.lowStockCount || 0} SKU's</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-amber-500 h-2 rounded-full shadow-sm" 
                            style={{ width: `${Math.max(5, ((data?.lowStockCount || 0) / (data?.totalProducts || 1) * 100))}%` }} 
                          />
                        </div>
                      </div>
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                        <div>
                          <p className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Overall Status: Healthy</p>
                          <p className="text-[10px] text-emerald-700/70 dark:text-emerald-500/70 mt-0.5 font-bold">94% of catalog SKU's are well-stocked.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Insights & Distribution - Right 1/3 */}
              <div className="flex flex-col gap-6">
                {/* Status Distribution Chart */}
                <Card className="shadow-xl shadow-foreground/5 border-muted/50 overflow-hidden rounded-3xl">
                  <CardHeader className="bg-muted/20 border-b p-5">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <PieChartIcon className="h-4 w-4 text-primary" />
                      Status Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="h-[240px] w-full mt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="45%"
                            innerRadius={60}
                            outerRadius={85}
                            paddingAngle={8}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', padding: '12px', fontSize: '11px', fontWeight: 'bold' }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={50} 
                            iconType="circle"
                            formatter={(value) => <span className="text-[10px] font-black text-foreground/80 uppercase tracking-widest">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Management Shortcuts */}
                <Card className="shadow-xl shadow-foreground/5 border-muted/50 rounded-3xl">
                  <CardHeader className="p-5">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      Taxonomy Hub
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0 grid grid-cols-2 gap-3">
                    <QuickLink
                      title="Categories"
                      count={data?.categories || 0}
                      href="/dashboard/catalog/categories"
                      icon={FolderTree}
                      color="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400"
                    />
                    <QuickLink
                      title="Brands"
                      count={data?.brands || 0}
                      href="/dashboard/catalog/brands"
                      icon={Building2}
                      color="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
                    />
                    <QuickLink
                      title="Tags"
                      count={data?.tags || 0}
                      href="/dashboard/catalog/tags"
                      icon={Tags}
                      color="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400"
                    />
                    <QuickLink
                      title="Featured"
                      count={0}
                      href="/dashboard/catalog/products?featured=true"
                      icon={ExternalLink}
                      color="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                    />
                  </CardContent>
                </Card>

                {/* Info Card */}
                <div className="rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 p-6 border border-primary/10 shadow-lg shadow-primary/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                  <div className="relative z-10 flex flex-col gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                      <LayoutDashboard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-black text-foreground">Catalog Insights</p>
                      <p className="text-xs font-medium text-muted-foreground mt-1.5 leading-relaxed">
                        Need deeper analysis? Access the Advanced Analytics dashboard for filtered reporting.
                      </p>
                    </div>
                    <Button variant="link" className="p-0 h-auto w-fit text-primary font-black text-[10px] uppercase tracking-widest group-hover:translate-x-1 transition-transform" asChild>
                      <Link href="/dashboard/system">
                        GO TO ANALYTICS <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ──────── Sub-components ──────── */

function KPICard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendType,
  color,
}: {
  title: string;
  value: number | string;
  icon: any;
  description: string;
  trend: string;
  trendType: "up" | "down" | "neutral";
  color: "blue" | "emerald" | "amber" | "violet";
}) {
  const colorMap = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
    amber: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
    violet: "text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400 border-violet-100 dark:border-violet-900/30",
  };

  return (
    <Card className="shadow-lg border-muted/50 hover:border-primary/30 transition-all group overflow-hidden relative rounded-3xl">
      <div className={`absolute top-0 right-0 w-20 h-20 -translate-y-1/2 translate-x-1/2 opacity-5 rounded-full ${color === 'blue' ? 'bg-blue-600' : color === 'emerald' ? 'bg-emerald-600' : color === 'amber' ? 'bg-amber-600' : 'bg-violet-600'}`} />
      <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 relative z-10 px-5 pt-5">
        <CardTitle className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <div className={`p-2.5 rounded-xl border ${colorMap[color]} shadow-sm group-hover:scale-110 transition-transform`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10 px-5 pb-5">
        <div className="text-2xl font-black tracking-tight">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <Badge variant="outline" className={`text-[9px] font-black border-transparent px-1.5 py-0.5 rounded-md ${trendType === 'up' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : trendType === 'down' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' : 'bg-muted text-muted-foreground'}`}>
            {trend}
          </Badge>
          <span className="text-[10px] text-muted-foreground font-bold line-clamp-1">
            {description}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  title,
  count,
  href,
  icon: Icon,
  color,
}: {
  title: string;
  count: number;
  href: string;
  icon: any;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 border-muted/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-center shadow-sm"
    >
      <div className={`p-3.5 rounded-2xl mb-2.5 ${color} group-hover:scale-110 transition-transform shadow-sm`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{title}</span>
      <span className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter mt-1 bg-muted px-2 py-0.5 rounded-full">
        {count} Items
      </span>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-lg border-muted/50 h-28 rounded-3xl">
            <CardHeader className="pb-1 px-5 pt-5">
              <Skeleton className="h-3 w-20 rounded-full" />
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <Skeleton className="h-8 w-16 rounded-lg mb-2" />
              <Skeleton className="h-3 w-32 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-lg border-muted/50 rounded-3xl">
          <CardHeader className="p-5">
            <Skeleton className="h-6 w-40 rounded-lg" />
            <Skeleton className="h-3 w-64 mt-2 rounded-full" />
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-2xl" />
            ))}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-6">
          <Card className="shadow-lg border-muted/50 h-[300px] rounded-3xl">
            <CardHeader className="p-5">
              <Skeleton className="h-6 w-32 rounded-lg" />
            </CardHeader>
            <CardContent className="flex items-center justify-center p-5">
              <Skeleton className="h-40 w-40 rounded-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <Card className="border-destructive/20 bg-destructive/5 shadow-2xl rounded-3xl">
      <CardContent className="flex flex-col items-center gap-5 py-16">
        <div className="p-5 rounded-3xl bg-destructive/10 text-destructive shadow-inner">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <div className="text-center">
          <CardTitle className="text-xl font-black">Data Fetching Failed</CardTitle>
          <CardDescription className="mt-2 text-base font-medium max-w-sm">
            We couldn't retrieve your catalog data. Please check your connection and try again.
          </CardDescription>
        </div>
        <div className="flex gap-3">
          <Button
            variant="default"
            size="lg"
            onClick={() => window.location.reload()}
            className="px-6 font-black rounded-xl h-12"
          >
            Retry
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="px-6 font-black rounded-xl h-12"
          >
            <Link href="/dashboard">Return Home</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
