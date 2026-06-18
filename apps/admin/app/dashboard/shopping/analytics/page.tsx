"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ShoppingCart,
  CreditCard,
  Tag,
  Package,
  Clock,
  DollarSign,
  Loader2,
} from "lucide-react";
import { shoppingService, ShoppingAnalytics } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ShoppingAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ShoppingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await shoppingService.getAnalytics();
        const parsed = (data as any).data ?? data;
        setAnalytics(parsed);
      } catch (error) {
        console.error("Failed to load analytics", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  const a = analytics;
  if (!a) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-muted-foreground">No analytics data available yet.</div>
      </DashboardLayout>
    );
  }

  const maxCount = Math.max(...a.monthly_trends.map((t: any) => t.count), 1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shopping Analytics</h1>
          <p className="text-muted-foreground">
            Performance metrics for carts, coupons, and conversions.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{a.total_orders}</div>
              <p className="text-xs text-muted-foreground">{a.recent_orders} in last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {a.total_revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">KES {a.recent_revenue.toLocaleString()} in last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{a.conversion_rate}%</div>
              <p className="text-xs text-muted-foreground">{a.total_orders} orders from {a.total_carts} carts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Cart Value</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {a.average_cart_value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Per completed order</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Carts</CardTitle>
              <ShoppingCart className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{a.total_carts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abandoned Carts</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{a.abandoned_carts}</div>
              <p className="text-xs text-muted-foreground">
                {a.total_carts > 0 ? ((a.abandoned_carts / a.total_carts) * 100).toFixed(1) : 0}% abandonment rate
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coupon Usages</CardTitle>
              <Tag className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{a.total_coupon_usages}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
              <CreditCard className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{a.status_breakdown?.pending || 0}</div>
              <p className="text-xs text-muted-foreground">Pending fulfillment</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Order Trends</CardTitle>
              <CardDescription>Order volume over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
              {a.monthly_trends.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-end gap-2 h-32">
                    {a.monthly_trends.map((trend: any) => (
                      <div key={`${trend.year}-${trend.month}`} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-medium">{trend.count}</span>
                        <div
                          className="w-full bg-primary/20 rounded-t"
                          style={{ height: `${(trend.count / maxCount) * 100}%`, minHeight: trend.count > 0 ? "4px" : "0" }}
                        >
                          <div
                            className="w-full bg-primary rounded-t transition-all"
                            style={{ height: `${(trend.count / maxCount) * 100}%`, minHeight: trend.count > 0 ? "4px" : "0" }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{MONTHS[trend.month - 1]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic py-8 text-center">No order data yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Status Breakdown</CardTitle>
              <CardDescription>Current distribution of order statuses.</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(a.status_breakdown).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(a.status_breakdown).map(([status, count]) => {
                    const total = Object.values(a.status_breakdown).reduce((s: number, c: any) => s + c, 0);
                    const pct = total > 0 ? ((count as number) / total) * 100 : 0;
                    const colors: Record<string, string> = {
                      pending: "bg-yellow-500",
                      paid: "bg-blue-500",
                      shipped: "bg-purple-500",
                      delivered: "bg-emerald-500",
                      cancelled: "bg-red-500",
                    };
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="capitalize">{status}</span>
                          <span className="font-medium">{count as number} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${colors[status] || "bg-gray-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic py-8 text-center">No orders yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
