"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Tag,
  BarChart3,
  Clock,
  ArrowRight,
  Plus,
} from "lucide-react";
import { shoppingService } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  href: string;
  description: string;
}

const statCardsConfig: Omit<StatCard, "value">[] = [
  {
    title: "Active Coupons",
    icon: <Tag className="h-5 w-5 text-blue-500" />,
    href: "/dashboard/shopping/coupons",
    description: "Currently valid discount codes",
  },
  {
    title: "Abandoned Carts",
    icon: <ShoppingCart className="h-5 w-5 text-yellow-500" />,
    href: "/dashboard/shopping/abandoned-carts",
    description: "Carts waiting for recovery",
  },
  {
    title: "Total Coupons",
    icon: <Tag className="h-5 w-5 text-green-500" />,
    href: "/dashboard/shopping/coupons",
    description: "All time coupons created",
  },
  {
    title: "Conversion Rate",
    icon: <BarChart3 className="h-5 w-5 text-emerald-500" />,
    href: "/dashboard/shopping/analytics",
    description: "Cart recovery success rate",
  },
];

export default function ShoppingOverviewPage() {
  const [stats, setStats] = useState({
    activeCoupons: 0,
    abandonedCarts: 0,
    totalCoupons: 0,
    conversionRate: "N/A",
    recentOrders: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const [activeCoupons, allCoupons, abandonedCarts, analytics] = await Promise.all([
          shoppingService.getCoupons(true),
          shoppingService.getCoupons(false),
          shoppingService.getAbandonedCarts(),
          shoppingService.getAnalytics(),
        ]);

        const a = (analytics as any).data ?? analytics;

        setStats({
          activeCoupons: activeCoupons.length,
          totalCoupons: allCoupons.length,
          abandonedCarts: abandonedCarts.length,
          conversionRate: `${a.conversion_rate || 0}%`,
          recentOrders: a.recent_orders || 0,
          totalOrders: a.total_orders || 0,
          totalRevenue: a.total_revenue || 0,
        });
      } catch (error) {
        console.error("Failed to load shopping stats", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Shopping & Promotions</h1>
            <p className="text-muted-foreground">
              Manage discount coupons, abandoned carts, and shopping analytics.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard/shopping/coupons/new">
                <Plus className="mr-2 h-4 w-4" /> Create Coupon
              </Link>
            </Button>
          </div>
        </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { ...statCardsConfig[0], value: stats.activeCoupons },
          { ...statCardsConfig[1], value: stats.abandonedCarts },
          { ...statCardsConfig[2], value: stats.totalCoupons },
          { ...statCardsConfig[3], value: stats.conversionRate },
        ].map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              {card.icon}
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{card.value}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              <Button variant="ghost" size="sm" className="mt-4 w-full justify-between" asChild>
                <Link href={card.href}>
                  View Details
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest events in the shopping domain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.totalOrders > 0 ? (
                <>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{stats.recentOrders} new orders in the last 30 days</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <span>{stats.activeCoupons} active coupons available</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span>{stats.abandonedCarts} carts abandoned (24h+ threshold)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <span>Total revenue: KES {stats.totalRevenue.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">No recent activity found.</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Insights</CardTitle>
            <CardDescription>Automated shopping recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.abandonedCarts > 0 ? (
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Abandoned Carts Need Attention</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.abandonedCarts} cart{stats.abandonedCarts === 1 ? "" : "s"} waiting for recovery. Consider sending recovery emails.
                  </p>
                </div>
              ) : null}
              {stats.activeCoupons === 0 ? (
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">No Active Coupons</p>
                  <p className="text-xs text-muted-foreground">
                    Create promotional coupons to drive more sales.
                  </p>
                </div>
              ) : null}
              {stats.totalOrders === 0 ? (
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">First Order Awaited</p>
                  <p className="text-xs text-muted-foreground">
                    No orders yet. Ensure products are published and visible to customers.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Conversion Rate: {stats.conversionRate}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalOrders} total orders placed to date.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </DashboardLayout>
  );
}
