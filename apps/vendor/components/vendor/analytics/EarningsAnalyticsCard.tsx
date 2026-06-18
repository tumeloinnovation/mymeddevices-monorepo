'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, Variants } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Calendar,
  CheckCircle,
  Clock,
  Download,
} from 'lucide-react';

interface Payout {
  id: string;
  amount: number;
  status: string;
  payout_method?: string;
  method?: string;
  created_at?: string;
  processed_at?: string;
}

interface EarningsAnalytics {
  total_revenue?: number;
  vendor_earnings?: number;
  platform_commission?: number;
  pending_payouts?: number;
  completed_payouts?: number;
  available_balance?: number;
  payout_history?: Payout[];
}

interface EarningsAnalyticsCardProps {
  data?: EarningsAnalytics;
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

export function EarningsAnalyticsCard({ data }: EarningsAnalyticsCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Pending';
    return new Date(dateStr).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data?.total_revenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Gross sales</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Your Earnings
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(data?.vendor_earnings || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                After {formatCurrency(data?.platform_commission || 0)} platform fee
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Available Balance
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data?.available_balance || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ready for withdrawal</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Payouts
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {formatCurrency(data?.pending_payouts || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Processing</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Payout History */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>Your recent payout transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.payout_history && data.payout_history.length > 0 ? (
              <div className="space-y-4">
                {data.payout_history.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100">
                        <Wallet className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{formatCurrency(payout.amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          via {(payout.payout_method || payout.method || '').toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={payout.status === 'completed' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {payout.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {payout.status === 'completed'
                          ? `Paid: ${formatDate(payout.processed_at)}`
                          : `Requested: ${formatDate(payout.created_at)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No payout history yet</p>
                <p className="text-sm">Your payouts will appear here once processed</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Payout Information */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Payout Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>Processing Time</span>
                <span className="font-medium">2-3 business days</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>Minimum Payout</span>
                <span className="font-medium">KES 1,000</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span>Available Methods</span>
                <span className="font-medium">M-Pesa, Bank Transfer</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
