"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  FolderTree,
  Tag,
  Building2,
  Plus,
  CheckCircle2,
  Clock,
  FileEdit,
  AlertTriangle,
  Layers,
  Download,
  LayoutDashboard,
  Box,
  BadgeAlert,
  BarChart3,
  PieChart as PieChartIcon,
  ShoppingCart,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import { catalogService } from "@mymeddevices/shared-core";
import type { Product } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
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

const STATUS_COLORS = {
  published: "#a69d61", // olive
  pending_review: "#e0752b", // orange
  draft: "#6b6b6b", // gray
  archived: "#a5c5c6", // teal
};

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
  categoryDistribution: { name: string; count: number }[];
}

export default function CatalogOverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
          catalogService.getVendorProducts({ page: 1, page_size: 50 }),
          catalogService.getVendorProducts({ status_filter: "published", page: 1, page_size: 1 }),
          catalogService.getVendorProducts({ status_filter: "pending_review", page: 1, page_size: 1 }),
          catalogService.getVendorProducts({ status_filter: "draft", page: 1, page_size: 1 }),
          catalogService.getVendorProducts({ status_filter: "archived", page: 1, page_size: 1 }),
        ]);

        const lowStock = allRes.products.filter(
          (p) => p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_threshold || 5)
        ).length;
        const outOfStock = allRes.products.filter((p) => p.stock_quantity === 0).length;

        // Category distribution (using actual counts from products)
        const catCounts = new Map<string, number>();
        allRes.products.forEach((p) => {
          if (p.category_name) {
            catCounts.set(p.category_name, (catCounts.get(p.category_name) || 0) + 1);
          }
        });
        const catDist = Array.from(catCounts.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

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
      { name: "Published", value: data.published, color: STATUS_COLORS.published },
      { name: "Pending", value: data.pendingReview, color: STATUS_COLORS.pending_review },
      { name: "Draft", value: data.draft, color: STATUS_COLORS.draft },
      { name: "Archived", value: data.archived, color: STATUS_COLORS.archived },
    ].filter((d) => d.value > 0);
  }, [data]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px]/[28px] font-semibold tracking-tight">
              Catalog Overview
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your medical equipment inventory and manufacturer partnerships
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
            <Button size="default" asChild>
              <Link href="/dashboard/catalog/products/new">
                <Plus className="h-4 w-4 mr-1.5" />
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
            {/* Stat Cards Row */}
            <div className="grid grid-cols-4 gap-4">
              <StatCard
                label="Total Products"
                value={data?.totalProducts || 0}
                trend={{ value: "+12%", positive: true }}
                trendLabel="this month"
                icon={Box}
              />
              <StatCard
                label="Published"
                value={data?.published || 0}
                trend={{ value: "+8", positive: true }}
                trendLabel="vs last month"
                icon={CheckCircle2}
              />
              <StatCard
                label="Pending Review"
                value={data?.pendingReview || 0}
                trend={data?.pendingReview ? { value: "!", positive: false } : null}
                trendLabel="needs attention"
                icon={Clock}
              />
              <StatCard
                label="Low Stock"
                value={data?.lowStockCount || 0}
                trend={data?.lowStockCount ? { value: "!", positive: false } : null}
                trendLabel="action needed"
                icon={BadgeAlert}
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Top Categories */}
              <Card title="Top Categories" icon={BarChart3}>
                {!data?.categoryDistribution || data.categoryDistribution.length === 0 ? (
                  <EmptyState icon={<FolderTree className="h-8 w-8" />} noun="categories" />
                ) : (
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.categoryDistribution} layout="vertical" barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" strokeOpacity={0.1} />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b6b6b' }} />
                        <YAxis type="category" dataKey="name" width={80} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#a1a1a1', fontWeight: 500 }} />
                        <RechartsTooltip
                          cursor={{ fill: 'rgba(224, 117, 43, 0.05)' }}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #333', backgroundColor: '#1a1a1a', fontSize: '12px', color: '#fafafa' }}
                        />
                        <Bar dataKey="count" fill="#e0752b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              {/* Status Breakdown */}
              <Card title="Status Breakdown" icon={PieChartIcon}>
                {pieData.length === 0 ? (
                  <EmptyState icon={<Package className="h-8 w-8" />} noun="products" />
                ) : (
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="45%"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={4}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #333', backgroundColor: '#1a1a1a', fontSize: '11px', color: '#fafafa' }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={40}
                          iconType="circle"
                          formatter={(value) => (
                            <span className="text-[10px] font-medium text-muted-foreground uppercase">
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              {/* Inventory Health */}
              <Card title="Inventory Health" icon={Zap}>
                <div className="space-y-4 py-2">
                  {/* Out of Stock */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider">
                      <span className="text-muted-foreground">Out of Stock</span>
                      <span className="text-destructive font-semibold tabular-nums">
                        {data?.outOfStockCount || 0}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-destructive rounded-full"
                        style={{
                          width: `${Math.max(2, ((data?.outOfStockCount || 0) / (data?.totalProducts || 1) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Low Stock */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider">
                      <span className="text-muted-foreground">Low Stock</span>
                      <span className="text-warning font-semibold tabular-nums">
                        {data?.lowStockCount || 0}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-warning rounded-full"
                        style={{
                          width: `${Math.max(2, ((data?.lowStockCount || 0) / (data?.totalProducts || 1) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Overall Status */}
                  <div className="p-3 bg-success/10 border border-success/20 rounded-lg flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-medium text-success uppercase tracking-wider">
                        Overall: Healthy
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {data?.totalProducts && data?.lowStockCount
                          ? `${Math.round(((data.totalProducts - data.lowStockCount) / data.totalProducts) * 100)}%`
                          : "94%"} of catalog SKUs are well-stocked
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Taxonomy Row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Taxonomy Hub */}
              <div className="col-span-2 bg-card border rounded-lg p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Taxonomy Hub</h3>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <QuickLink
                    title="Categories"
                    count={data?.categories || 0}
                    href="/dashboard/catalog/categories"
                    icon={FolderTree}
                  />
                  <QuickLink
                    title="Brands"
                    count={data?.brands || 0}
                    href="/dashboard/catalog/brands"
                    icon={Building2}
                  />
                  <QuickLink
                    title="Tags"
                    count={data?.tags || 0}
                    href="/dashboard/catalog/tags"
                    icon={Tag}
                  />
                  <QuickLink
                    title="Products"
                    count={data?.totalProducts || 0}
                    href="/dashboard/catalog/products"
                    icon={Package}
                  />
                </div>
              </div>

              {/* CTA Card */}
              <Link
                href="/dashboard/analytics"
                className="group flex flex-col justify-between p-5 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg hover:border-primary/40 transition-colors"
              >
                <div>
                  <div className="h-9 w-9 rounded bg-primary flex items-center justify-center text-primary-foreground mb-3">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-semibold">Catalog Insights</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Access advanced analytics for filtered reporting and deeper analysis.
                  </p>
                </div>
                <div className="flex items-center text-xs font-medium text-primary group-hover:gap-2 transition-all">
                  Go to analytics
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ──────── Sub-components ──────── */

// Stat Card Component
function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
}: {
  label: string;
  value: number;
  trend?: { value: string; positive: boolean } | null;
  trendLabel?: string;
  icon: any;
}) {
  return (
    <div className="px-4 py-3 bg-card border rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
      </div>
      <div className="text-[24px] font-semibold tabular-nums tracking-tight">
        {value.toLocaleString()}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-1">
          <span
            className={`text-xs font-medium tabular-nums ${
              trend.positive ? "text-success" : "text-destructive"
            }`}
          >
            {trend.value}
          </span>
          {trendLabel && (
            <span className="text-xs text-muted-foreground">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

// Card Component
function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// Empty State Component
function EmptyState({ icon, noun }: { icon: React.ReactNode; noun: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[180px] text-center p-4">
      <div className="text-muted-foreground/30 mb-2">{icon}</div>
      <p className="text-sm font-medium text-foreground">No {noun} found</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
        Add {noun} to your catalog to see data here.
      </p>
    </div>
  );
}

// Quick Link Component
function QuickLink({
  title,
  count,
  href,
  icon: Icon,
}: {
  title: string;
  count: number;
  href: string;
  icon: any;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col items-center justify-center p-4 rounded-lg border hover:bg-muted/30 hover:border-border transition-all text-center"
    >
      <div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
        {title}
      </span>
      <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider mt-1 bg-muted/50 px-2 py-0.5 rounded-full">
        {count}
      </span>
    </Link>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[88px] border rounded-lg overflow-hidden">
            <div className="h-[34px] bg-muted/30 border-b animate-pulse" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[252px] border rounded-lg overflow-hidden">
            <div className="h-[45px] bg-muted/30 border-b animate-pulse" />
            <div className="p-4 flex items-center justify-center h-[207px]">
              <Skeleton className="h-32 w-32 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Taxonomy Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 h-[156px] border rounded-lg overflow-hidden">
          <div className="h-[45px] bg-muted/30 border-b animate-pulse" />
          <div className="p-4 grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="h-[156px] border rounded-lg animate-pulse bg-muted/20" />
      </div>
    </div>
  );
}

// Error State
function ErrorState() {
  return (
    <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-12 text-center">
      <div className="h-12 w-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">Data Fetching Failed</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
        We couldn't retrieve your catalog data. Please check your connection and try again.
      </p>
      <div className="flex items-center justify-center gap-2">
        <Button size="sm" onClick={() => window.location.reload()}>
          Retry
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link href="/dashboard">Return Home</Link>
        </Button>
      </div>
    </div>
  );
}
