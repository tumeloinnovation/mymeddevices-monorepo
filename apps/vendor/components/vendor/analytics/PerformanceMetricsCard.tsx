'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, Variants } from 'framer-motion';
import {
  Truck,
  Clock,
  Package,
  TrendingUp,
  AlertTriangle,
  Star,
} from 'lucide-react';

interface PerformanceMetrics {
  fulfillment_rate?: number;
  on_time_delivery_rate?: number;
  average_fulfillment_time_hours?: number;
  total_products?: number;
  low_stock_products?: number;
  vendor_rating?: number;
}

interface PerformanceMetricsCardProps {
  data?: PerformanceMetrics;
}

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

export function PerformanceMetricsCard({ data }: PerformanceMetricsCardProps) {
  const MetricCard = ({
    title,
    value,
    description,
    icon: Icon,
    variant = 'default',
  }: {
    title: string;
    value: string | number;
    description?: string;
    icon?: any;
    variant?: 'default' | 'warning' | 'success';
  }) => {
    const variantColors = {
      default: 'bg-blue-100 text-blue-700',
      warning: 'bg-amber-100 text-amber-700',
      success: 'bg-emerald-100 text-emerald-700',
    };

    return (
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            {Icon && (
              <div className={`p-2 rounded-lg ${variantColors[variant]}`}>
                <Icon className="h-4 w-4" />
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Fulfillment Rate"
          value={`${data?.fulfillment_rate?.toFixed(1) || 0}%`}
          description="Orders successfully fulfilled"
          icon={Package}
          variant={data?.fulfillment_rate && data.fulfillment_rate >= 95 ? 'success' : 'default'}
        />
        <MetricCard
          title="On-Time Delivery"
          value={`${data?.on_time_delivery_rate?.toFixed(1) || 0}%`}
          description="Delivered on schedule"
          icon={Truck}
          variant={data?.on_time_delivery_rate && data.on_time_delivery_rate >= 90 ? 'success' : 'default'}
        />
        <MetricCard
          title="Avg. Fulfillment Time"
          value={`${data?.average_fulfillment_time_hours?.toFixed(1) || 0}h`}
          description="Average processing time"
          icon={Clock}
        />
        <MetricCard
          title="Vendor Rating"
          value={data?.vendor_rating?.toFixed(1) || 'N/A'}
          description="Customer satisfaction score"
          icon={Star}
          variant={data?.vendor_rating && data.vendor_rating >= 4.5 ? 'success' : 'default'}
        />
      </div>

      {/* Inventory Alerts */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Inventory Alerts
            </CardTitle>
            <CardDescription>
              Products requiring attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Products</span>
                <span className="text-2xl font-bold">{data?.total_products || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Low Stock Items</span>
                <Badge
                  variant={data?.low_stock_products && data.low_stock_products > 0 ? 'destructive' : 'default'}
                  className="text-lg px-3 py-1"
                >
                  {data?.low_stock_products || 0}
                </Badge>
              </div>
              {data && data.low_stock_products !== undefined && data.low_stock_products > 0 && (
                <p className="text-xs text-muted-foreground">
                  Consider restocking soon to avoid stockouts.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Performance Tips */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {data?.fulfillment_rate && data.fulfillment_rate < 95 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-amber-800">
                    Your fulfillment rate is below 95%. Consider reviewing your order processing workflow.
                  </p>
                </div>
              )}
              {data?.on_time_delivery_rate && data.on_time_delivery_rate < 90 && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-800">
                    Improve delivery times by optimizing your shipping schedule.
                  </p>
                </div>
              )}
              {data?.low_stock_products === 0 && (
                <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <Package className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <p className="text-emerald-800">
                    Great job! No products are currently below stock threshold.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
