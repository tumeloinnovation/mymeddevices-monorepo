'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, ArrowRight, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface ActiveOrderBannerProps {
  orderId?: string;
  orderNumber?: string;
  estimatedDelivery?: string;
  status?: string;
}

/**
 * Prominent banner for active orders in transit
 * Shows when user has an order that's currently being delivered
 */
export function ActiveOrderBanner({
  orderId,
  orderNumber,
  estimatedDelivery,
  status = 'shipped',
}: ActiveOrderBannerProps) {
  // Don't show if no order or order is not active
  if (!orderId || !orderNumber) return null;

  const isActiveOrder = ['processing', 'shipped', 'out_for_delivery'].includes(status);
  if (!isActiveOrder) return null;

  const getStatusLabel = () => {
    switch (status) {
      case 'processing':
        return 'Being prepared';
      case 'shipped':
        return 'Shipped';
      case 'out_for_delivery':
        return 'Out for delivery';
      default:
        return 'In transit';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'out_for_delivery':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDeliveryTime = () => {
    if (!estimatedDelivery) return 'Expected soon';
    const date = new Date(estimatedDelivery);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(now.setDate(now.getDate() + 1)).toDateString();

    if (isToday) {
      return `Expected today by ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Expected tomorrow by ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return `Expected ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">Order #{orderNumber}</h3>
                  <Badge className={getStatusColor()} variant="outline">
                    {getStatusLabel()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {formatDeliveryTime()}
                </p>
              </div>
            </div>
            <Link href={`/dashboard/tracking?orderId=${orderId}`}>
              <Button size="sm" className="gap-2">
                Track
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
