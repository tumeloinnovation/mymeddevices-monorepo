'use client';

import { useState } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Package, RefreshCw } from 'lucide-react';
import { useActiveOrders, useOrder, useOrderTracking } from '@/lib/hooks/useOrders';
import { OrderTrackingTimeline, type TrackingEvent } from '@/components/common/order-tracking-timeline';
import { TrackingEmptyState } from './_components/tracking-empty-state';
import { motion, AnimatePresence } from 'framer-motion';

function TrackingPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data: activeOrders, isLoading: ordersLoading, refetch: refetchOrders } = useActiveOrders();
  const { data: selectedOrder, isLoading: orderLoading } = useOrder(
    selectedOrderId || '',
    selectedOrderId ? undefined : undefined
  );
  const { data: tracking, isLoading: trackingLoading, refetch: refetchTracking } = useOrderTracking(
    selectedOrderId || ''
  );

  // Auto-select first active order if none selected
  const activeOrdersList = activeOrders?.items || [];
  if (!selectedOrderId && activeOrdersList.length > 0) {
    setSelectedOrderId(activeOrdersList[0].id);
  }

  const handleRefresh = () => {
    refetchOrders();
    if (selectedOrderId) {
      refetchTracking();
    }
  };

  const isLoading = ordersLoading || orderLoading || trackingLoading;
  const hasActiveOrders = activeOrdersList.length > 0;
  const currentOrder = selectedOrder || activeOrdersList[0];

  // Build tracking events from order history or fallback to status-based events
  const trackingEvents: TrackingEvent[] = (tracking?.history || buildDefaultEvents(currentOrder)) as TrackingEvent[];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Order Tracking</h1>
          <p className="text-muted-foreground mt-1">
            Track your active orders and deliveries in real-time
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Content */}
      {isLoading && !hasActiveOrders ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : !hasActiveOrders ? (
        <TrackingEmptyState hasOrders={false} />
      ) : (
        <div className="space-y-6">
          {/* Order Selector */}
          {activeOrdersList.length > 1 && (
            <Card>
              <CardContent className="p-4">
                <label className="text-sm font-medium mb-2 block">Select Order to Track</label>
                <Select value={selectedOrderId || ''} onValueChange={setSelectedOrderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an order" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeOrdersList.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        Order #{order.order_number || order.id.slice(-6)} — {formatStatus(order.status)} — Ksh{' '}
                        {Number(order.total_amount).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Selected Order Details */}
          <AnimatePresence mode="wait">
            {currentOrder && (
              <motion.div
                key={currentOrder.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">Order #{currentOrder.order_number || currentOrder.id.slice(-6)}</h2>
                        <p className="text-sm text-muted-foreground">
                          Placed on {new Date(currentOrder.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(currentOrder.status)}>
                        {formatStatus(currentOrder.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {trackingLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <OrderTrackingTimeline
                        events={trackingEvents}
                        currentStatus={currentOrder.status}
                        estimatedDelivery={tracking?.estimated_delivery}
                        trackingNumber={tracking?.tracking_number}
                        carrier={tracking?.tracking_url ? 'G4S Kenya' : undefined}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Order Summary */}
                <Card className="mt-4">
                  <CardHeader>
                    <h3 className="font-semibold flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Order Items
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentOrder.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium">Ksh {Number(item.total_price).toLocaleString()}</p>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-3 font-semibold">
                        <span>Total</span>
                        <span>Ksh {Number(currentOrder.total_amount).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/**
 * Format order status for display
 */
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    paid: 'Paid',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return statusMap[status] || status;
}

/**
 * Get badge variant based on status
 */
function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'delivered') return 'default';
  if (status === 'cancelled' || status === 'refunded') return 'destructive';
  if (['processing', 'shipped'].includes(status)) return 'secondary';
  return 'outline';
}

/**
 * Build default tracking events from order status
 * Used when history is not available
 */
function buildDefaultEvents(order?: any) {
  if (!order) return [];

  const events = [];
  const now = new Date();
  const createdAt = new Date(order.created_at);

  // Always have order placed
  events.push({
    status: 'pending',
    timestamp: createdAt.toISOString(),
    description: 'Order placed successfully',
  });

  // Add events based on status
  if (['paid', 'processing', 'shipped', 'delivered'].includes(order.status)) {
    events.push({
      status: 'paid',
      timestamp: new Date(createdAt.getTime() + 5 * 60 * 1000).toISOString(), // 5 mins later
      description: 'Payment confirmed',
    });
  }

  if (['processing', 'shipped', 'delivered'].includes(order.status)) {
    events.push({
      status: 'processing',
      timestamp: new Date(createdAt.getTime() + 30 * 60 * 1000).toISOString(), // 30 mins later
      description: 'Order being prepared',
    });
  }

  if (['shipped', 'delivered'].includes(order.status)) {
    events.push({
      status: 'shipped',
      timestamp: new Date(createdAt.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour later
      description: 'Shipped via G4S Kenya',
    });
  }

  if (order.status === 'delivered') {
    events.push({
      status: 'delivered',
      timestamp: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 1 day later
      description: 'Delivered successfully',
    });
  }

  return events;
}


export default function TrackingPageWrapper() {
  return (
    <ErrorBoundary>
      <TrackingPage />
    </ErrorBoundary>
  );
}
