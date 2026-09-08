'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  BarChart3,
  Download,
  Calendar,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, Variants } from 'framer-motion';
import { useVendorAnalytics } from '@/lib/api/hooks/useVendorAnalytics';
import { AnalyticsPeriodSelector } from '@/components/vendor/analytics/PeriodSelector';
import { SalesAnalyticsCard } from '@/components/vendor/analytics/SalesAnalyticsCard';
import { PerformanceMetricsCard } from '@/components/vendor/analytics/PerformanceMetricsCard';
import { ProductPerformanceChart } from '@/components/vendor/analytics/ProductPerformanceChart';
import { EarningsAnalyticsCard } from '@/components/vendor/analytics/EarningsAnalyticsCard';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', bounce: 0, duration: 0.4 } 
  },
};

function VendorAnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px] mb-2" />
              <Skeleton className="h-3 w-[150px]" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-[150px] mb-2" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="col-span-1">
          <CardHeader>
            <Skeleton className="h-6 w-[150px] mb-2" />
            <Skeleton className="h-4 w-[250px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-[120px] mb-1" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-[80px] mb-1 ml-auto" />
                  <Skeleton className="h-3 w-[50px] ml-auto" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VendorAnalytics() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState(initialTab);
  const { data, loading, error, refetch } = useVendorAnalytics(period);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const handleExport = async (reportType: string) => {
    try {
      // Implement export functionality
      console.log(`Exporting ${reportType} report`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 mt-1" />
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-red-900">Analytics Unavailable</h3>
                <p className="text-sm text-red-700">
                  Unable to load analytics data. Please check your connection and try again.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 active:scale-95 transition-transform"
                  onClick={() => refetch()}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-slate-500">Track your store performance and insights.</p>
        </div>
        <div className="flex items-center gap-3">
          <AnalyticsPeriodSelector value={period} onChange={setPeriod} />
          <Button
            variant="outline"
            size="default"
            className="gap-2 active:scale-95 transition-transform"
            onClick={() => handleExport(activeTab)}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg h-auto">
          <TabsTrigger value="overview" className="px-3 py-1.5 text-xs data-active:bg-white dark:data-active:bg-slate-800 data-active:text-slate-900 dark:data-active:text-slate-50 data-active:shadow-sm">Overview</TabsTrigger>
          <TabsTrigger value="sales" className="px-3 py-1.5 text-xs data-active:bg-white dark:data-active:bg-slate-800 data-active:text-slate-900 dark:data-active:text-slate-50 data-active:shadow-sm">Sales</TabsTrigger>
          <TabsTrigger value="products" className="px-3 py-1.5 text-xs data-active:bg-white dark:data-active:bg-slate-800 data-active:text-slate-900 dark:data-active:text-slate-50 data-active:shadow-sm">Products</TabsTrigger>
          <TabsTrigger value="earnings" className="px-3 py-1.5 text-xs data-active:bg-white dark:data-active:bg-slate-800 data-active:text-slate-900 dark:data-active:text-slate-50 data-active:shadow-sm">Earnings</TabsTrigger>
          <TabsTrigger value="performance" className="px-3 py-1.5 text-xs data-active:bg-white dark:data-active:bg-slate-800 data-active:text-slate-900 dark:data-active:text-slate-50 data-active:shadow-sm">Performance</TabsTrigger>
        </TabsList>

        {loading ? (
          <VendorAnalyticsSkeleton />
        ) : (
          <>
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <motion.div 
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {/* Key Metrics Cards */}
                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Sales
                      </CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(data?.sales?.gross_sales?.current || 0)}
                      </div>
                      {data?.sales?.gross_sales?.change_percent !== undefined && (
                        <div className="flex items-center gap-1 mt-1">
                          {data.sales.gross_sales.change_percent >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span
                            className={`text-xs font-medium ${
                              data.sales.gross_sales.change_percent >= 0
                                ? 'text-emerald-600'
                                : 'text-red-600'
                            }`}
                          >
                            {formatPercent(data.sales.gross_sales.change_percent)}
                          </span>
                          <span className="text-xs text-muted-foreground">vs previous period</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Orders
                      </CardTitle>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {data?.sales?.total_orders?.current || 0}
                      </div>
                      {data?.sales?.total_orders?.change_percent !== undefined && (
                        <div className="flex items-center gap-1 mt-1">
                          {data.sales.total_orders.change_percent >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span
                            className={`text-xs font-medium ${
                              data.sales.total_orders.change_percent >= 0
                                ? 'text-emerald-600'
                                : 'text-red-600'
                            }`}
                          >
                            {formatPercent(data.sales.total_orders.change_percent)}
                          </span>
                          <span className="text-xs text-muted-foreground">vs previous period</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Products
                      </CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {data?.performance?.total_products || 0}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {data?.performance?.low_stock_products || 0} low stock items
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Pending Payouts
                      </CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {formatCurrency(data?.earnings?.pending_payouts || 0)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Available: {formatCurrency(data?.earnings?.available_balance || 0)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>

              {/* Charts and Detailed Analytics */}
              <motion.div 
                className="grid gap-4 md:grid-cols-2"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                <motion.div variants={itemVariants} className="col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sales Trend</CardTitle>
                      <CardDescription>Your sales performance over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ProductPerformanceChart data={data?.sales?.sales_trend || []} />
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Products</CardTitle>
                      <CardDescription>Best performing products this period</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(data?.sales?.top_products || []).slice(0, 5).map((product, index) => (
                          <div
                            key={product.product_id || product.id}
                            className="flex items-center justify-between py-2 border-b last:border-0"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{product.product_name || product.name}</p>
                                <p className="text-xs text-muted-foreground">{product.sku}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">{formatCurrency(product.revenue)}</p>
                              <p className="text-xs text-muted-foreground">{product.total_sold} sold</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* Sales Tab */}
            <TabsContent value="sales" className="space-y-6">
              <SalesAnalyticsCard data={data?.sales} />
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Product Performance</CardTitle>
                  <CardDescription>Sales and performance metrics by product</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(data?.sales?.top_products || []).map((product, index) => (
                      <div
                        key={product.product_id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
                            {index + 1}
                          </div>
                          {product.image_url && (
                            <img
                              src={product.image_url}
                              alt={product.product_name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-semibold">{product.product_name}</p>
                            <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">{formatCurrency(product.revenue)}</p>
                          <p className="text-sm text-muted-foreground">{product.total_sold} units sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Earnings Tab */}
            <TabsContent value="earnings" className="space-y-6">
              <EarningsAnalyticsCard data={data?.earnings} />
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <PerformanceMetricsCard data={data?.performance} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
