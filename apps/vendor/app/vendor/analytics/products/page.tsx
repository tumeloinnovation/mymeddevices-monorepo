'use client';

import React, { useState } from 'react';
import {
  Package,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Download,
  AlertCircle,
  Search,
  RefreshCw,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion, Variants } from 'framer-motion';
import { useVendorAnalytics } from '@/lib/api/hooks/useVendorAnalytics';
import { AnalyticsPeriodSelector } from '@/components/vendor/analytics/PeriodSelector';
import { ProductPerformanceChart } from '@/components/vendor/analytics/ProductPerformanceChart';

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
    transition: { type: 'spring', bounce: 0, duration: 0.4 },
  },
};

export default function ProductPerformancePage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const { data, loading, error, refetch } = useVendorAnalytics(period);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const productsList = data?.sales?.top_products || [];
  const filteredProducts = productsList.filter(
    (p) =>
      (p.product_name || p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = productsList.reduce((acc, p) => acc + (p.revenue || 0), 0);
  const totalUnitsSold = productsList.reduce((acc, p) => acc + (p.total_sold || 0), 0);

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-600 mt-1" />
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-red-900">Product Performance Unavailable</h3>
                <p className="text-sm text-red-700">
                  Unable to load product analytics data. Please check your connection and try again.
                </p>
                <Button size="sm" variant="outline" className="mt-2" onClick={() => refetch()}>
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
          <h1 className="text-3xl font-bold tracking-tight">Product Performance</h1>
          <p className="text-slate-500">Sales velocity, revenue generation, and product performance analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          <AnalyticsPeriodSelector value={period} onChange={setPeriod} />
          <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <motion.div
        className="grid gap-4 md:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Tracked Products</CardTitle>
              <Package className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.performance?.total_products || productsList.length}</div>
              <p className="text-xs text-slate-500 mt-1">Active items in catalog</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Total Units Sold</CardTitle>
              <ShoppingCart className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUnitsSold}</div>
              <p className="text-xs text-slate-500 mt-1">Units fulfilled in selected period</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Catalog Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-slate-500 mt-1">Gross sales generated</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Sales Trend & Top Products Breakdown */}
      <motion.div
        className="grid gap-6 md:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Sales Velocity Trend
              </CardTitle>
              <CardDescription>Product revenue generation over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductPerformanceChart data={data?.sales?.sales_trend || []} type="line" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Volume Breakdown
              </CardTitle>
              <CardDescription>Sales distribution by period</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductPerformanceChart data={data?.sales?.sales_trend || []} type="bar" />
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Product Level Performance Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Product Performance Breakdown</CardTitle>
            <CardDescription>Detailed sales, units sold, and stock metrics for individual products.</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search products or SKU..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 animate-pulse">
                  <div className="size-10 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                  <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length ? (
            <div className="space-y-3">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.product_id || product.id || index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center size-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold shrink-0">
                      #{index + 1}
                    </div>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.product_name || product.name || ''}
                        className="size-10 rounded-lg object-cover shrink-0 border"
                      />
                    ) : (
                      <div className="size-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border">
                        <Package className="h-5 w-5 text-slate-400" />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm truncate max-w-[260px]">
                        {product.product_name || product.name}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        SKU: {product.sku || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-400">Units Sold</p>
                      <p className="text-sm font-semibold">{product.total_sold} units</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Revenue</p>
                      <p className="text-sm font-bold text-emerald-600">{formatCurrency(product.revenue)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Package className="h-8 w-8 text-slate-300" />
              <p className="text-sm font-medium">No product performance data found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
