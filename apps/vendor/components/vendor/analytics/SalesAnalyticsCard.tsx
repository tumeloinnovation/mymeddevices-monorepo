'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, Variants } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
} from 'lucide-react';

interface SalesAnalytics {
  gross_sales?: {
    current: number;
    previous: number;
    change_percent: number;
  };
  net_sales?: {
    current: number;
    previous: number;
    change_percent: number;
  };
  total_orders?: {
    current: number;
    previous: number;
    change_percent: number;
  };
  average_order_value?: {
    current: number;
    previous: number;
    change_percent: number;
  };
  sales_trend?: Array<{
    period?: string;
    date?: string;
    sales: number;
    orders: number;
  }>;
  top_products?: Array<{
    product_id?: string;
    product_name?: string;
    id?: string;
    name?: string;
    sku: string;
    image_url?: string;
    total_sold: number;
    revenue: number;
  }>;
  sales_by_category?: Array<{
    category: string;
    total_sales: number;
    order_count: number;
  }>;
}

interface SalesAnalyticsCardProps {
  data?: SalesAnalytics;
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

export function SalesAnalyticsCard({ data }: SalesAnalyticsCardProps) {
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

  const MetricCard = ({
    title,
    value,
    previous,
    changePercent,
    icon: Icon,
  }: {
    title: string;
    value: number;
    previous?: number;
    changePercent?: number;
    icon?: any;
  }) => (
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {typeof value === 'number' ? formatCurrency(value) : value}
          </div>
          {changePercent !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {changePercent >= 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span
                className={`text-xs font-medium ${
                  changePercent >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {formatPercent(changePercent)}
              </span>
              <span className="text-xs text-muted-foreground">vs previous period</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Gross Sales"
          value={data?.gross_sales?.current || 0}
          changePercent={data?.gross_sales?.change_percent}
          icon={DollarSign}
        />
        <MetricCard
          title="Net Sales"
          value={data?.net_sales?.current || 0}
          changePercent={data?.net_sales?.change_percent}
          icon={DollarSign}
        />
        <MetricCard
          title="Total Orders"
          value={data?.total_orders?.current || 0}
          changePercent={data?.total_orders?.change_percent}
          icon={BarChart3}
        />
        <MetricCard
          title="Avg. Order Value"
          value={data?.average_order_value?.current || 0}
          changePercent={data?.average_order_value?.change_percent}
        />
      </div>

      {/* Sales by Category */}
      {data?.sales_by_category && data.sales_by_category.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
              <CardDescription>Revenue breakdown by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.sales_by_category.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{category.category}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(category.total_sales)}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{
                          width: `${(category.total_sales /
                            (data?.gross_sales?.current || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
