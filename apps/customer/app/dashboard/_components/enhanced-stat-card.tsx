'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface EnhancedStatCardProps {
  icon: any;
  title: string;
  value: string;
  loading?: boolean;
  color?: 'primary' | 'success' | 'danger' | 'secondary' | 'warning';
  trend?: {
    value: number; // percentage change
    period: string; // e.g., "vs last month"
  };
  className?: string;
}

const colorConfig = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-green-100 text-green-600',
  danger: 'bg-red-100 text-red-600',
  secondary: 'bg-blue-100 text-blue-600',
  warning: 'bg-amber-100 text-amber-600',
};

/**
 * Enhanced stat card with trend indicator
 * Shows value, icon, and optional trend percentage
 */
export function EnhancedStatCard({
  icon: Icon,
  title,
  value,
  loading,
  color = 'primary',
  trend,
  className,
}: EnhancedStatCardProps) {
  const trendColor = trend && trend.value > 0 ? 'text-green-600' : trend && trend.value < 0 ? 'text-red-600' : 'text-muted-foreground';
  const TrendIcon = trend && trend.value > 0 ? TrendingUp : trend && trend.value < 0 ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">{title}</p>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{value}</p>
              )}

              {/* Trend Indicator */}
              {trend && !loading && (
                <div className={cn('flex items-center gap-1 text-xs', trendColor)}>
                  <TrendIcon className="h-3 w-3" />
                  <span className="font-medium">{Math.abs(trend.value)}%</span>
                  <span className="text-muted-foreground">{trend.period}</span>
                </div>
              )}
            </div>

            <div className={cn('p-3 rounded-full', colorConfig[color])}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
