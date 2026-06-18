'use client';

import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Dot,
} from 'recharts';
import { motion, type Easing } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const easeOut: Easing = [0.23, 1, 0.32, 1];

interface SalesTrendPoint {
  date: string;
  sales: number;
  orders?: number;
}

export function SalesTrendChart({ data = [] }: { data?: SalesTrendPoint[] }) {
  const formatDate = (dateStr: any) => {
    try {
      const date = new Date(String(dateStr));
      if (isNaN(date.getTime())) return String(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (data.length === 0) {
    return (
      <motion.div
        className="col-span-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut, delay: 0.4 } }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              No sales data available yet.
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="col-span-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOut, delay: 0.4 } }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                  tickFormatter={formatDate}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
                  tickFormatter={(value) => `KES ${value}`}
                  width={80}
                />
                <Tooltip
                  labelFormatter={formatDate}
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Sales']}
                  contentStyle={{
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-card)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    padding: '8px 12px',
                    fontSize: '13px',
                  }}
                  cursor={{ stroke: 'var(--color-muted-foreground)', strokeDasharray: '3 3', strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                  animationDuration={800}
                  animationEasing="ease-out"
                  dot={false}
                  activeDot={(props: any) => (
                    <Dot
                      {...props}
                      r={5}
                      fill="#10b981"
                      stroke="white"
                      strokeWidth={2.5}
                    />
                  )}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
