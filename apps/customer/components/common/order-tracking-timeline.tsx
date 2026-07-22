'use client';

import { CheckCircle2, Circle, Loader2, Package, Truck, Clock, Ban } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface TrackingEvent {
  status: OrderStatus;
  timestamp: string;
  description?: string;
  location?: string;
}

interface OrderTrackingTimelineProps {
  events: TrackingEvent[];
  currentStatus: OrderStatus;
  estimatedDelivery?: string;
  trackingNumber?: string;
  carrier?: string;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  pending: { label: 'Order Placed', icon: Clock, color: 'text-amber-500' },
  paid: { label: 'Payment Confirmed', icon: CheckCircle2, color: 'text-green-500' },
  processing: { label: 'Processing', icon: Package, color: 'text-blue-500' },
  shipped: { label: 'Shipped', icon: Truck, color: 'text-purple-500' },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'text-green-500' },
  cancelled: { label: 'Cancelled', icon: Ban, color: 'text-red-500' },
  refunded: { label: 'Refunded', icon: Ban, color: 'text-red-500' },
};

const STATUS_ORDER: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

/**
 * Calculate progress percentage based on status
 */
function getProgressPercentage(status: OrderStatus): number {
  if (status === 'cancelled' || status === 'refunded') return 0;
  const index = STATUS_ORDER.indexOf(status);
  if (index === -1) return 0;
  return ((index + 1) / STATUS_ORDER.length) * 100;
}

/**
 * Enhanced order tracking timeline with progress bar
 */
export function OrderTrackingTimeline({
  events,
  currentStatus,
  estimatedDelivery,
  trackingNumber,
  carrier,
}: OrderTrackingTimelineProps) {
  const progress = getProgressPercentage(currentStatus);
  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'refunded';
  const currentConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = new Date(event.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(event);
    return groups;
  }, {} as Record<string, TrackingEvent[]>);

  const timelineVariants = {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.15,
        },
      },
    },
    item: {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header with current status */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full bg-${currentConfig.color.split('-')[1]}-100 dark:bg-${currentConfig.color.split('-')[1]}-900/20`}>
            <currentConfig.icon className={`h-5 w-5 ${currentConfig.color}`} />
          </div>
          <div>
            <p className="font-semibold">{currentConfig.label}</p>
            {trackingNumber && (
              <p className="text-sm text-muted-foreground">Tracking: {trackingNumber}</p>
            )}
          </div>
        </div>
        {!isCancelled && (
          <Badge variant={currentStatus === 'delivered' ? 'default' : 'secondary'}>
            {currentStatus === 'delivered' ? 'Complete' : 'In Progress'}
          </Badge>
        )}
      </motion.div>

      {/* Progress Bar */}
      {!isCancelled && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Order Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          {estimatedDelivery && (
            <p className="text-xs text-muted-foreground">
              Estimated delivery: {new Date(estimatedDelivery).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      )}

      {/* Timeline */}
      <motion.div
        variants={timelineVariants.container}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {Object.entries(groupedEvents).map(([date, dayEvents]) => (
          <div key={date} className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">{date}</h4>
            <div className="space-y-4">
              {dayEvents.map((event, index) => {
                const config = STATUS_CONFIG[event.status] || STATUS_CONFIG.pending;
                const isActive = event.status === currentStatus;
                const isCompleted = STATUS_ORDER.indexOf(event.status) < STATUS_ORDER.indexOf(currentStatus);

                return (
                  <motion.div
                    key={`${event.status}-${event.timestamp}`}
                    variants={timelineVariants.item}
                    className="flex gap-4"
                  >
                    {/* Icon and Line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all',
                          isCompleted && 'bg-green-500',
                          isActive && !isCompleted && 'bg-primary',
                          !isActive && !isCompleted && 'bg-muted'
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        ) : isActive ? (
                          <Loader2 className="w-4 h-4 text-white animate-spin" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      {index < dayEvents.length - 1 && (
                        <div className="w-0.5 flex-1 bg-muted mt-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <p className="font-medium">{config.label}</p>
                      {event.description && (
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      )}
                      {event.location && (
                        <p className="text-xs text-muted-foreground mt-1">{event.location}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.timestamp).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Carrier Info */}
      {carrier && !isCancelled && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg"
        >
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Carrier: {carrier}</span>
        </motion.div>
      )}
    </div>
  );
}
