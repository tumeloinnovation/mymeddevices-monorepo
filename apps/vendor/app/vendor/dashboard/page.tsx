'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { VendorStatCard } from '@/components/vendor/dashboard/VendorStatCard';
import { SalesTrendChart } from '@/components/vendor/dashboard/SalesTrendChart';
import { RecentOrdersTable } from '@/components/vendor/dashboard/RecentOrdersTable';
import { useDashboardStats } from '@/lib/api/hooks/useAnalytics';
import { useOrders } from '@/lib/api/hooks/useOrders';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export default function VendorDashboard() {
  const { data: statsData, loading: statsLoading, error: statsError } = useDashboardStats('30d');
  const { data: ordersData, loading: ordersLoading } = useOrders({ limit: 5 });
  const isLoading = statsLoading || ordersLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back to your store overview.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 animate-pulse rounded bg-muted" />
                <div className="mt-1 h-3 w-32 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <div className="h-5 w-28 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full animate-pulse rounded bg-muted/50" />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <div className="h-5 w-28 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="space-y-1.5">
                    <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-16 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-3 w-14 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-full bg-destructive/10 p-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">Failed to load dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Could not fetch your store metrics. Please try again.
        </p>
        <Button variant="outline" className="mt-4 gap-2" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Revenue',
      value: formatCurrency(statsData?.total_sales || 0),
      description: 'Last 30 days revenue',
      icon: TrendingUp,
      color: 'text-emerald-600',
    },
    {
      title: 'Total Orders',
      value: (statsData?.total_orders || 0).toString(),
      description: `${statsData?.pending_fulfillments || 0} pending fulfillment`,
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: 'Products',
      value: (statsData?.total_products || 0).toString(),
      description: 'Active catalog items',
      icon: Package,
      color: 'text-purple-600',
    },
    {
      title: 'Low Stock Alerts',
      value: (statsData?.low_stock_count || 0).toString(),
      description: 'Items below threshold',
      icon: AlertTriangle,
      color: 'text-amber-600',
    },
  ];

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back to your store overview.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <VendorStatCard key={stat.title} {...stat} index={i} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <SalesTrendChart data={statsData?.sales_trend || []} />
        <RecentOrdersTable orders={ordersData?.items || []} />
      </div>
    </motion.div>
  );
}
