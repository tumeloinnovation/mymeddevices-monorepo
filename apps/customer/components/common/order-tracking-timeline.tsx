'use client';

import {
  CheckCircle2,
  Circle,
  Loader2,
  Package,
  Truck,
  Clock,
  Ban,
  MapPin,
  ShieldCheck,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type OrderStatus =
  | 'pending'
  | 'on-hold'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

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
  trackingUrl?: string;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  pending: { label: 'Order Placed', icon: Clock, color: 'text-amber-500' },
  'on-hold': { label: 'Pending Payment', icon: Clock, color: 'text-amber-500' },
  paid: { label: 'Payment Confirmed', icon: CheckCircle2, color: 'text-emerald-500' },
  processing: { label: 'Preparing Medical Equipment', icon: Package, color: 'text-blue-500' },
  shipped: { label: 'In Transit / Dispatched', icon: Truck, color: 'text-purple-500' },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'text-emerald-500' },
  cancelled: { label: 'Cancelled', icon: Ban, color: 'text-rose-500' },
  refunded: { label: 'Refunded', icon: Ban, color: 'text-slate-500' },
};

const STATUS_STEPS: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

function getStepIndex(status: string): number {
  if (status === 'on-hold') return 0;
  const idx = STATUS_STEPS.indexOf(status as OrderStatus);
  return idx === -1 ? 0 : idx;
}

export function OrderTrackingTimeline({
  events,
  currentStatus,
  estimatedDelivery,
  trackingNumber,
  carrier,
  trackingUrl,
}: OrderTrackingTimelineProps) {
  const currentStepIndex = getStepIndex(currentStatus);
  const isCancelled = currentStatus === 'cancelled' || currentStatus === 'refunded';
  const currentConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;
  const CurrentIcon = currentConfig.icon;

  const groupedEvents = events.reduce((groups, event) => {
    const date = new Date(event.timestamp).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(event);
    return groups;
  }, {} as Record<string, TrackingEvent[]>);

  return (
    <div className="space-y-6">
      {/* 1. Milestone Step Bar (Horizontal on tablet/desktop) */}
      {!isCancelled && (
        <div className="p-4 sm:p-6 rounded-2xl bg-muted/20 border border-border/60">
          <div className="grid grid-cols-5 gap-2 relative">
            {/* Step Connection Track Background */}
            <div className="hidden sm:block absolute top-5 left-8 right-8 h-1 bg-border/60 z-0" />
            <div
              className="hidden sm:block absolute top-5 left-8 h-1 bg-primary transition-all duration-700 z-0"
              style={{
                width: `${Math.min(100, (currentStepIndex / (STATUS_STEPS.length - 1)) * 100)}%`,
              }}
            />

            {STATUS_STEPS.map((step, idx) => {
              const stepConfig = STATUS_CONFIG[step];
              const StepIcon = stepConfig.icon;
              const isDone = idx < currentStepIndex || currentStatus === 'delivered';
              const isCurrent = idx === currentStepIndex && currentStatus !== 'delivered';

              return (
                <div key={step} className="flex flex-col items-center text-center relative z-10 space-y-2">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-2xs relative border',
                      isDone
                        ? 'bg-primary text-primary-foreground border-primary'
                        : isCurrent
                        ? 'bg-background text-primary border-primary ring-4 ring-primary/20 animate-pulse'
                        : 'bg-muted/60 text-muted-foreground border-border/70'
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isCurrent ? (
                      <StepIcon className="w-5 h-5 text-primary" />
                    ) : (
                      <StepIcon className="w-4 h-4 opacity-50" />
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <p
                      className={cn(
                        'text-xs font-bold leading-tight line-clamp-1',
                        isDone || isCurrent ? 'text-foreground' : 'text-muted-foreground/70'
                      )}
                    >
                      {stepConfig.label.split(' ')[0]}
                    </p>
                    <span className="text-[10px] text-muted-foreground hidden sm:block">
                      {isDone ? 'Completed' : isCurrent ? 'Active' : 'Pending'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Dispatch / Live Status Details Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Left: Carrier & Tracking Info */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 flex items-start gap-3.5 shadow-xs">
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
            <Truck className="h-5 w-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Courier Dispatch
            </span>
            <p className="text-sm font-bold text-foreground truncate">
              {carrier || 'G4S Kenya Medical Logistics'}
            </p>
            {trackingNumber ? (
              <p className="text-xs font-mono text-muted-foreground flex items-center gap-1.5 pt-0.5">
                <span>Waybill:</span>
                <strong className="text-foreground">{trackingNumber}</strong>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">Standard Medical Cold-Chain Route</p>
            )}
            {trackingUrl && (
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-1"
              >
                <span>External Waybill Tracking</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Right: Estimated Delivery */}
        <div className="p-4 rounded-2xl bg-card border border-border/80 flex items-start gap-3.5 shadow-xs">
          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Estimated Delivery
            </span>
            <p className="text-sm font-bold text-foreground">
              {estimatedDelivery
                ? new Date(estimatedDelivery).toLocaleDateString('en-KE', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '1 – 3 Business Days (Kenya)'}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Insured GDP Medical Handling</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. Detailed Activity Log Timeline */}
      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Activity Log & Status History
        </h4>

        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <div key={date} className="space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-muted/50 border border-border/60 text-[11px] font-bold text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{date}</span>
              </div>

              <div className="relative pl-6 space-y-4 border-l-2 border-border/70 ml-3">
                {dayEvents.map((event, index) => {
                  const eventConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.pending;
                  const isCurrent = event.status === currentStatus;

                  return (
                    <motion.div
                      key={`${event.status}-${event.timestamp}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative space-y-1"
                    >
                      {/* Timeline Dot */}
                      <span
                        className={cn(
                          'absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 bg-background',
                          isCurrent
                            ? 'border-primary bg-primary ring-4 ring-primary/20'
                            : 'border-muted-foreground/60'
                        )}
                      />

                      <div className="p-3.5 rounded-xl bg-card border border-border/70 shadow-2xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-bold text-xs sm:text-sm text-foreground">
                            {eventConfig.label}
                          </h5>
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString('en-KE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {event.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {event.description}
                          </p>
                        )}

                        {event.location && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 pt-0.5">
                            <MapPin className="h-3 w-3 text-primary shrink-0" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
