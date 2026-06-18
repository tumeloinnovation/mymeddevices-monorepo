'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface TrendData {
  period?: string;
  date?: string;
  sales: number;
  orders: number;
}

interface ProductPerformanceChartProps {
  data?: TrendData[];
  type?: 'line' | 'bar';
}

export function ProductPerformanceChart({ data = [], type = 'line' }: ProductPerformanceChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (periodStr: string) => {
    if (!periodStr) return '';
    const date = new Date(periodStr);
    return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
  };

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        <p>No trend data available for the selected period.</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    formattedPeriod: formatDate(item.period || item.date || ''),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 outline-none">
          <p className="text-sm font-medium mb-1 text-muted-foreground">{label}</p>
          <p className="text-sm font-bold text-emerald-600">
            {formatCurrency(payload[0].value)}
          </p>
          {payload[1] && (
            <p className="text-sm text-slate-600 mt-1">
              {payload[1].value} orders
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
          <XAxis
            dataKey="formattedPeriod"
            className="text-xs"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            tickLine={false}
            axisLine={false}
            dx={-10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
          <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/50" />
        <XAxis
          dataKey="formattedPeriod"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          dy={10}
        />
        <YAxis
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          tickLine={false}
          axisLine={false}
          dx={-10}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--muted))', strokeWidth: 1, strokeDasharray: '4 4' }} />
        <Line
          type="monotone"
          dataKey="sales"
          stroke="hsl(var(--primary))"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
