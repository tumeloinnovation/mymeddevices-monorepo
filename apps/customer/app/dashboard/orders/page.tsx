'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCustomerOrders } from '@/hooks/useDashboard';
import { formatCurrency } from '@/lib/utils/utils';
import {
    Search,
    Package,
    Truck,
    CheckCircle2,
    Clock,
    AlertCircle,
    Receipt,
    ArrowRight,
    ShoppingBag,
    Calendar,
    X,
    CreditCard,
    MapPin,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';

const STATUS_MAP: Record<
    string,
    { label: string; badgeClass: string; icon: any }
> = {
    pending: {
        label: 'Order Placed',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        icon: Clock,
    },
    'on-hold': {
        label: 'Awaiting Payment',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        icon: Clock,
    },
    paid: {
        label: 'Payment Confirmed',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        icon: CheckCircle2,
    },
    processing: {
        label: 'Processing & Packing',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300 dark:border-blue-800',
        icon: Package,
    },
    shipped: {
        label: 'In Transit',
        badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-300 dark:border-purple-800',
        icon: Truck,
    },
    delivered: {
        label: 'Delivered',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        icon: CheckCircle2,
    },
    completed: {
        label: 'Completed',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        icon: CheckCircle2,
    },
    cancelled: {
        label: 'Cancelled',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        icon: AlertCircle,
    },
    failed: {
        label: 'Failed',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        icon: AlertCircle,
    },
    refunded: {
        label: 'Refunded',
        badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
        icon: Receipt,
    },
};

export default function OrdersPage() {
    const [page, setPage] = useState(1);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: orders, isLoading } = useCustomerOrders(page, 50);

    // Filter logic based on tabs and search query
    const filteredOrders = useMemo(() => {
        if (!orders) return [];

        return orders.filter((order) => {
            const matchesSearch =
                String(order.number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.line_items.some((item) =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase())
                );

            if (!matchesSearch) return false;

            const st = String(order.status).toLowerCase();
            if (activeTab === 'all') return true;
            if (activeTab === 'active') {
                return ['pending', 'on-hold', 'paid', 'processing', 'shipped'].includes(st);
            }
            if (activeTab === 'delivered') {
                return ['delivered', 'completed'].includes(st);
            }
            if (activeTab === 'cancelled') {
                return ['cancelled', 'failed', 'refunded'].includes(st);
            }
            return true;
        });
    }, [orders, activeTab, searchQuery]);

    const activeCount = useMemo(() => {
        return (
            orders?.filter((o) =>
                ['pending', 'on-hold', 'paid', 'processing', 'shipped'].includes(String(o.status).toLowerCase())
            ).length || 0
        );
    }, [orders]);

    const deliveredCount = useMemo(() => {
        return (
            orders?.filter((o) =>
                ['delivered', 'completed'].includes(String(o.status).toLowerCase())
            ).length || 0
        );
    }, [orders]);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border/50">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                        My Orders
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                        Track delivery status, view detailed items, and access official VAT receipts.
                    </p>
                </div>
                <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-xl font-semibold shadow-xs shrink-0 self-start sm:self-auto border-border bg-card hover:bg-muted">
                    <Link href="/products">
                        <ShoppingBag className="h-4 w-4 text-primary" />
                        <span>Continue Shopping</span>
                    </Link>
                </Button>
            </div>

            {/* Minimalist Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between pt-1">
                {/* Status Segmented Control / Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                    {[
                        { key: 'all', label: 'All Orders', count: orders?.length || 0 },
                        { key: 'active', label: 'Active', count: activeCount },
                        { key: 'delivered', label: 'Delivered', count: deliveredCount },
                        { key: 'cancelled', label: 'Cancelled', count: orders?.filter(o => ['cancelled', 'failed', 'refunded'].includes(String(o.status).toLowerCase())).length || 0 },
                    ].map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/60'
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span
                                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                        isActive
                                            ? 'bg-primary-foreground/20 text-primary-foreground'
                                            : 'bg-background text-muted-foreground'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-72 shrink-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search order # or product..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-8 h-9 text-xs rounded-full bg-card border-border/80 focus-visible:ring-1 shadow-2xs"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="Clear search"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* 2-Column Responsive Orders Grid */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Card key={i} className="border border-border/70 p-5 rounded-2xl animate-pulse space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="h-5 w-36 bg-muted rounded-md" />
                                    <div className="h-6 w-24 bg-muted rounded-full" />
                                </div>
                                <div className="h-10 w-full bg-muted/30 rounded-xl" />
                                <div className="flex justify-between items-center pt-2">
                                    <div className="h-4 w-28 bg-muted rounded" />
                                    <div className="h-8 w-24 bg-muted rounded-xl" />
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : filteredOrders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence>
                            {filteredOrders.map((order, index) => {
                                const stKey = String(order.status).toLowerCase();
                                const statusInfo = STATUS_MAP[stKey] || STATUS_MAP.pending;
                                const StatusIcon = statusInfo.icon;
                                const totalAmount = parseFloat(order.total) || 0;
                                const totalItemsCount = order.line_items.reduce(
                                    (sum, item) => sum + (item.quantity || 1),
                                    0
                                );

                                return (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.2, delay: index * 0.02 }}
                                    >
                                        <Card className="border border-border/80 hover:border-primary/40 shadow-xs hover:shadow-md transition-all rounded-2xl overflow-hidden bg-card flex flex-col justify-between h-full group">
                                            <div>
                                                {/* Header Bar */}
                                                <div className="p-4 sm:p-5 bg-muted/15 border-b border-border/60 flex items-start justify-between gap-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
                                                                <Package className="h-4 w-4" />
                                                            </div>
                                                            <span className="font-extrabold text-foreground text-sm sm:text-base group-hover:text-primary transition-colors">
                                                                Order #{order.number || String(order.id).split('-')[0]}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>
                                                                {new Date(order.date_created).toLocaleDateString('en-KE', {
                                                                    weekday: 'short',
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                })}
                                                            </span>
                                                        </p>
                                                    </div>

                                                    <Badge
                                                        variant="outline"
                                                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 border shadow-2xs shrink-0 ${statusInfo.badgeClass}`}
                                                    >
                                                        <StatusIcon className="h-3 w-3" />
                                                        <span>{statusInfo.label}</span>
                                                    </Badge>
                                                </div>

                                                {/* Body Details (Concise 2-Column Specs) */}
                                                <CardContent className="p-4 sm:p-5 space-y-3">
                                                    <div className="grid grid-cols-2 gap-3 text-xs bg-muted/20 p-3 rounded-xl border border-border/40">
                                                        <div>
                                                            <span className="text-muted-foreground block text-[11px]">Items Ordered</span>
                                                            <p className="font-semibold text-foreground mt-0.5">
                                                                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} ({order.line_items.length} {order.line_items.length === 1 ? 'product' : 'products'})
                                                            </p>
                                                        </div>

                                                        <div>
                                                            <span className="text-muted-foreground block text-[11px]">Payment</span>
                                                            <p className="font-semibold text-foreground mt-0.5 flex items-center gap-1 truncate">
                                                                <CreditCard className="h-3 w-3 text-muted-foreground shrink-0" />
                                                                <span className="truncate">{order.payment_method_title || 'Lipa na M-Pesa'}</span>
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {order.shipping?.city && (
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
                                                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                                                            <span className="truncate">
                                                                Deliver to:{' '}
                                                                <strong className="text-foreground">
                                                                    {order.shipping?.first_name ? `${order.shipping.first_name} ${order.shipping.last_name || ''}`.trim() : 'Nairobi'}
                                                                </strong>{' '}
                                                                ({order.shipping.city})
                                                            </span>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </div>

                                            {/* Card Footer: Total & Actions */}
                                            <div className="px-4 sm:px-5 py-3.5 bg-muted/10 border-t border-border/60 flex items-center justify-between gap-2">
                                                <div>
                                                    <span className="text-[11px] text-muted-foreground block">Total Amount</span>
                                                    <span className="text-sm sm:text-base font-extrabold text-primary">
                                                        Ksh {formatCurrency(totalAmount)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 rounded-xl text-xs font-semibold gap-1 border-border bg-card hover:bg-muted"
                                                    >
                                                        <Link href={`/orders/${order.id}`}>
                                                            <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span>Receipt</span>
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        asChild
                                                        variant="default"
                                                        size="sm"
                                                        className="h-8 rounded-xl text-xs font-semibold gap-1 shadow-xs"
                                                    >
                                                        <Link href={`/dashboard/orders/${order.id}`}>
                                                            <span>View Details</span>
                                                            <ArrowRight className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    <EmptyState
                        title={searchQuery ? 'No matching orders found' : 'No orders in this category'}
                        description={
                            searchQuery
                                ? `We couldn't find any orders matching "${searchQuery}". Try searching with a different order number or item name.`
                                : 'You do not have any orders in this status tab yet.'
                        }
                    />
                )}
            </div>
        </div>
    );
}
