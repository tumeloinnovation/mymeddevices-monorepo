'use client';

import React from 'react';
import { motion, type Easing } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const easeOut: Easing = [0.23, 1, 0.32, 1];

interface VendorStatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  index?: number;
}

const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: i * 0.08,
      ease: easeOut,
    },
  }),
};

export function VendorStatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = 'text-emerald-600',
  index = 0,
}: VendorStatCardProps) {
  return (
    <motion.div
      custom={index}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2, transition: { duration: 0.2, ease: easeOut } }}
      whileTap={{ scale: 0.98 }}
      className="group/card"
    >
      <Card className="transition-shadow duration-200 ease-[var(--ease-out)] group-hover/card:shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={`rounded-lg bg-${color?.replace('text-', '')}/10 p-1.5 ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tabular-nums tracking-tight">{value}</div>
          {(description || trend) && (
            <div className="mt-1 flex items-center">
              {trend && (
                <span
                  className={`mr-1 text-xs font-medium ${
                    trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                </span>
              )}
              <span className="text-xs text-muted-foreground">{description}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
