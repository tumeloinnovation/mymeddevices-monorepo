'use client';

import { useState, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  RefreshCw,
  Search,
  Truck,
  ShieldCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MapPin,
  Sparkles,
  Loader2,
  Calendar,
  PhoneCall,
  ChevronRight,
  Receipt,
  Building2,
  Navigation,
} from 'lucide-react';
import { useCustomerOrders, useOrderTracking } from '@/hooks/useDashboard';
import { formatCurrency } from '@/lib/utils/utils';
import { getValidImageUrl } from '@/lib/utils/image';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Order } from '@/lib/data/types';

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; stepIndex: number; icon: any; description: string }
> = {
  pending: {
    label: 'Order Placed',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/80 shadow-2xs font-bold',
    stepIndex: 0,
    icon: Clock,
    description: 'Order registered and awaiting merchant processing.',
  },
  'on-hold': {
    label: 'Pending Payment',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/80 shadow-2xs font-bold',
    stepIndex: 0,
    icon: Clock,
    description: 'Awaiting M-Pesa or card payment verification.',
  },
  paid: {
    label: 'Payment Verified',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold',
    stepIndex: 1,
    icon: CheckCircle2,
    description: 'Payment confirmed. Medical supplies queued for packing.',
  },
  processing: {
    label: 'Processing & Sanitization',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300 dark:border-blue-800 font-bold',
    stepIndex: 2,
    icon: Package,
    description: 'Items inspected, batch serialized, and packaged securely.',
  },
  shipped: {
    label: 'In Transit / Dispatched',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-300 dark:border-purple-800 font-bold',
    stepIndex: 3,
    icon: Truck,
    description: 'Consignment en route via GDP cold-chain courier logistics.',
  },
  delivered: {
    label: 'Delivered',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold',
    stepIndex: 4,
    icon: CheckCircle2,
    description: 'Package delivered and signed off at clinical destination.',
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold',
    stepIndex: -1,
    icon: AlertCircle,
    description: 'This order has been cancelled.',
  },
  refunded: {
    label: 'Refunded',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-bold',
    stepIndex: -1,
    icon: Receipt,
    description: 'Payment has been refunded.',
  },
};

const TRACKING_STEPS = [
  { key: 'placed', label: 'Order Placed', shortLabel: 'Placed', icon: Clock },
  { key: 'paid', label: 'Payment Confirmed', shortLabel: 'Paid', icon: CheckCircle2 },
  { key: 'processing', label: 'Packaging', shortLabel: 'Packing', icon: Package },
  { key: 'shipped', label: 'In Transit', shortLabel: 'In Transit', icon: Truck },
  { key: 'delivered', label: 'Delivered', shortLabel: 'Delivered', icon: CheckCircle2 },
];

function TrackingPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'in_transit' | 'delivered'>('all');

  const { data: orders = [], isLoading: ordersLoading, refetch: refetchOrders } = useCustomerOrders(1, 50);

  // Strictly filter only active orders in transit
  const activeInTransitOrders = useMemo(() => {
    return orders.filter((order) =>
      ['shipped', 'in_transit', 'out_for_delivery'].includes(order.status?.toLowerCase())
    );
  }, [orders]);

  // Search filter
  const searchFilteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return activeInTransitOrders;
    const q = searchQuery.toLowerCase();
    return activeInTransitOrders.filter((order) => {
      const orderNum = String(order.number || order.id).toLowerCase();
      const itemsMatch = order.line_items?.some((item) =>
        item.name?.toLowerCase().includes(q)
      );
      return orderNum.includes(q) || itemsMatch;
    });
  }, [activeInTransitOrders, searchQuery]);

  // Active selected order
  const activeOrder = useMemo(() => {
    if (selectedOrderId) {
      const found = activeInTransitOrders.find((o) => String(o.id) === selectedOrderId);
      if (found) return found;
    }
    return searchFilteredOrders[0] || activeInTransitOrders[0] || null;
  }, [selectedOrderId, activeInTransitOrders, searchFilteredOrders]);

  const { data: trackingData, isLoading: trackingLoading, refetch: refetchTracking } = useOrderTracking(
    activeOrder?.id ? String(activeOrder.id) : ''
  );

  const handleRefresh = () => {
    refetchOrders();
    if (activeOrder?.id) {
      refetchTracking();
    }
  };

  const currentStatusKey = String(activeOrder?.status || 'pending').toLowerCase();
  const currentConfig = STATUS_CONFIG[currentStatusKey] || STATUS_CONFIG.pending;
  const currentStepIndex = currentConfig.stepIndex >= 0 ? currentConfig.stepIndex : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner */}
      <Card className="border border-border/80 shadow-xs overflow-hidden rounded-2xl bg-card">
        <div className="p-6 md:p-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
                <Truck className="h-3.5 w-3.5" />
                <span>Live Active Consignments</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Active Order Tracking
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                Real-time milestone progress, courier dispatch status, and cold-chain temperature verification for shipments currently in transit.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start md:self-auto">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl text-xs font-semibold border-border bg-card hover:bg-muted shadow-2xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh Status</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Master-Detail Interactive Tracking Interface */}
      {ordersLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-8 space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        </div>
      ) : activeInTransitOrders.length === 0 ? (
        <Card className="border border-border/80 rounded-2xl p-12 text-center bg-card shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-xs">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">All Orders Delivered</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1.5 mb-6 leading-relaxed">
            You do not have any active shipments in transit right now. All past medical supplies and equipment have been safely delivered.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild size="sm" variant="outline" className="rounded-xl font-semibold">
              <Link href="/dashboard/orders">View Order History</Link>
            </Button>
            <Button asChild size="sm" className="rounded-xl font-semibold">
              <Link href="/products">Browse Medical Catalog</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Active Consignment List Selector (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <Card className="border border-border/80 shadow-xs rounded-2xl bg-card overflow-hidden">
              {/* Search Header */}
              <div className="p-4 border-b border-border/60 space-y-3 bg-muted/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span>In Transit ({activeInTransitOrders.length})</span>
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {searchFilteredOrders.length} active
                  </span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search active order # or item..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs rounded-xl bg-background border-border/70"
                  />
                </div>
              </div>

              {/* Order Cards List */}
              <div className="divide-y divide-border/50 max-h-[600px] overflow-y-auto">
                {searchFilteredOrders.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No matching shipments found.
                  </div>
                ) : (
                  searchFilteredOrders.map((order) => {
                    const isSelected = String(order.id) === String(activeOrder?.id);
                    const statusConfig = STATUS_CONFIG[String(order.status).toLowerCase()] || STATUS_CONFIG.pending;
                    const orderDate = new Date(order.date_created).toLocaleDateString('en-KE', {
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <button
                        key={order.id}
                        onClick={() => setSelectedOrderId(String(order.id))}
                        className={cn(
                          'w-full text-left p-4 transition-all flex items-start gap-3.5 group cursor-pointer relative',
                          isSelected
                            ? 'bg-primary/[0.06] hover:bg-primary/[0.08]'
                            : 'hover:bg-muted/30 bg-card'
                        )}
                      >
                        {/* Active Selection Indicator Bar */}
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                        )}

                        <div
                          className={cn(
                            'p-2.5 rounded-xl border shrink-0 transition-colors',
                            isSelected
                              ? 'bg-primary/20 text-primary border-primary/30'
                              : 'bg-muted/60 text-muted-foreground border-border/70 group-hover:border-primary/30'
                          )}
                        >
                          <Package className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-bold text-xs sm:text-sm text-foreground truncate">
                              Order #{order.number || String(order.id).slice(0, 8)}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">{orderDate}</span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-muted-foreground truncate">
                              {order.line_items?.length || 1} {(order.line_items?.length || 1) === 1 ? 'item' : 'items'} • Ksh {formatCurrency(parseFloat(order.total))}
                            </span>
                          </div>

                          <div className="pt-0.5">
                            <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] border', statusConfig.badgeClass)}>
                              {statusConfig.label}
                            </span>
                          </div>
                        </div>

                        <ChevronRight
                          className={cn(
                            'h-4 w-4 shrink-0 transition-transform self-center',
                            isSelected
                              ? 'text-primary translate-x-0.5'
                              : 'text-muted-foreground/50 group-hover:text-foreground'
                          )}
                        />
                      </button>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN: Active Shipment Live Monitor & Tracking History (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {activeOrder && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeOrder.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  {/* 1. Active Order Hero & Quick Details */}
                  <Card className="border border-border/80 shadow-xs rounded-2xl overflow-hidden bg-card">
                    <CardHeader className="p-5 sm:p-6 border-b border-border/60 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="p-3 rounded-2xl bg-primary/15 text-primary border border-primary/20 shrink-0">
                          <Truck className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                              Order #{activeOrder.number || String(activeOrder.id).slice(0, 8)}
                            </CardTitle>
                            <Badge variant="outline" className={cn('px-2.5 py-0.5 rounded-full text-xs font-bold border', currentConfig.badgeClass)}>
                              {currentConfig.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>
                              Placed on{' '}
                              {new Date(activeOrder.date_created).toLocaleDateString('en-KE', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            <span>•</span>
                            <span>Total: <strong>Ksh {formatCurrency(parseFloat(activeOrder.total))}</strong></span>
                          </p>
                        </div>
                      </div>

                      <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5 border-border bg-card hover:bg-muted self-start sm:self-auto">
                        <Link href={`/dashboard/orders/${activeOrder.id}`}>
                          <span>View Full Order</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </CardHeader>

                    <CardContent className="p-5 sm:p-6 space-y-6">
                      {/* Step Milestone Track (Placed -> Paid -> Packing -> In Transit -> Delivered) */}
                      <div className="p-4 sm:p-6 rounded-2xl bg-muted/25 border border-border/60 space-y-4">
                        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
                          <span>Dispatch Progress</span>
                          <span className="text-primary font-bold">
                            {currentStatusKey === 'delivered'
                              ? '100% Complete'
                              : `Step ${currentStepIndex + 1} of 5`}
                          </span>
                        </div>

                        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 relative">
                          {/* Line Connector Background */}
                          <div className="hidden sm:block absolute top-5 left-6 right-6 h-1 bg-border/60 z-0" />
                          <div
                            className="hidden sm:block absolute top-5 left-6 h-1 bg-primary transition-all duration-700 z-0"
                            style={{
                              width: `${Math.min(100, (currentStepIndex / 4) * 100)}%`,
                            }}
                          />

                          {TRACKING_STEPS.map((step, idx) => {
                            const isDone = idx < currentStepIndex || currentStatusKey === 'delivered';
                            const isCurrent = idx === currentStepIndex && currentStatusKey !== 'delivered';
                            const StepIcon = step.icon;

                            return (
                              <div key={step.key} className="flex flex-col items-center text-center relative z-10 space-y-1.5">
                                <div
                                  className={cn(
                                    'w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all border shadow-2xs',
                                    isDone
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : isCurrent
                                      ? 'bg-background text-primary border-primary ring-4 ring-primary/20 animate-pulse'
                                      : 'bg-muted text-muted-foreground border-border/70'
                                  )}
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                  ) : isCurrent ? (
                                    <StepIcon className="w-5 h-5 text-primary" />
                                  ) : (
                                    <StepIcon className="w-4 h-4 opacity-40" />
                                  )}
                                </div>
                                <div>
                                  <p
                                    className={cn(
                                      'text-[11px] font-bold leading-tight line-clamp-1',
                                      isDone || isCurrent ? 'text-foreground' : 'text-muted-foreground/60'
                                    )}
                                  >
                                    {step.shortLabel}
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

                      {/* Courier & ETA Quick Overview Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Courier Details */}
                        <div className="p-4 rounded-2xl bg-card border border-border/80 flex items-start gap-3.5 shadow-2xs">
                          <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
                            <Truck className="h-5 w-5" />
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Courier Service
                            </span>
                            <p className="text-sm font-bold text-foreground">
                              {(trackingData as any)?.carrier || (trackingData?.tracking_url ? 'G4S Kenya Express' : 'G4S Kenya Medical Cold-Chain')}
                            </p>
                            <p className="text-xs font-mono text-muted-foreground">
                              Waybill: <strong>{trackingData?.tracking_number || `MMD-${String(activeOrder.id).slice(0, 8).toUpperCase()}`}</strong>
                            </p>
                          </div>
                        </div>

                        {/* Estimated Delivery */}
                        <div className="p-4 rounded-2xl bg-card border border-border/80 flex items-start gap-3.5 shadow-2xs">
                          <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              Estimated Arrival
                            </span>
                            <p className="text-sm font-bold text-foreground">
                              {trackingData?.estimated_delivery
                                ? new Date(trackingData.estimated_delivery).toLocaleDateString('en-KE', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : '1 – 3 Business Days'}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                              <span>GDP Handling Protocol</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Package Contents / Items Preview */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Package className="h-3.5 w-3.5 text-primary" />
                            <span>Package Items ({activeOrder.line_items?.length || 1})</span>
                          </h4>
                          <span className="text-xs font-bold text-foreground">
                            Subtotal: Ksh {formatCurrency(parseFloat(activeOrder.total))}
                          </span>
                        </div>

                        <div className="rounded-2xl border border-border/70 overflow-hidden divide-y divide-border/50 bg-card">
                          {activeOrder.line_items?.map((item) => {
                            const imageUrl = getValidImageUrl(item.image?.src);
                            return (
                              <div key={item.id} className="p-3.5 flex items-center gap-3.5 hover:bg-muted/15 transition-colors">
                                <div className="h-12 w-12 rounded-xl bg-muted/40 border border-border/60 overflow-hidden shrink-0 relative flex items-center justify-center">
                                  {imageUrl ? (
                                    <Image
                                      src={imageUrl}
                                      alt={item.name}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <Package className="h-5 w-5 text-muted-foreground/60" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">
                                    {item.name}
                                  </h5>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Qty: <strong>{item.quantity}</strong> • Unit Price: Ksh {formatCurrency(item.price)}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-bold text-foreground">
                                    Ksh {formatCurrency(parseFloat(item.total))}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Delivery Address & Verified Route Details */}
                      <div className="p-4 rounded-2xl bg-muted/20 border border-border/70 flex items-start gap-3.5">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="space-y-1 text-xs">
                          <h5 className="font-bold text-foreground text-xs uppercase tracking-wider">
                            Destination Facility Address
                          </h5>
                          <p className="font-semibold text-foreground">
                            {[
                              activeOrder.shipping?.first_name,
                              activeOrder.shipping?.last_name,
                            ]
                              .filter(Boolean)
                              .join(' ') || 'Recipient Partner'}
                          </p>
                          <p className="text-muted-foreground">
                            {[
                              activeOrder.shipping?.address_1,
                              activeOrder.shipping?.address_2,
                              activeOrder.shipping?.city,
                              activeOrder.shipping?.state,
                              activeOrder.shipping?.country,
                            ]
                              .filter(Boolean)
                              .join(', ') || 'Nairobi, Kenya'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackingPageWrapper() {
  return (
    <ErrorBoundary>
      <TrackingPage />
    </ErrorBoundary>
  );
}
