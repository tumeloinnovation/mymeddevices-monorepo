'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats, useCustomerOrders } from '@/hooks/useDashboard';
import { useAuthStore } from '@mymeddevices/shared-core';
import { formatCurrency } from '@/lib/utils/utils';
import { useLoyaltyPoints } from '@/lib/hooks/useLoyalty';
import {
    Package,
    Heart,
    MapPin,
    ShoppingBag,
    TrendingUp,
    ArrowRight,
    Truck,
    Clock,
    Gift,
    ChevronRight,
    Award,
    ShieldCheck,
    Headphones,
    Sparkles,
    CheckCircle2,
    Calendar,
    MessageSquare,
    Eye,
    Receipt,
    RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TimeGreeting } from './_components/time-greeting';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const user = useAuthStore((state) => state.user);
    const { data: stats, isLoading: statsLoading } = useDashboardStats();
    const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useCustomerOrders(
        1,
        10
    );
    const { points: loyaltyPoints, tier: loyaltyTier, isLoading: loyaltyLoading } = useLoyaltyPoints();

    const recentOrders = ordersData?.slice(0, 4);

    // Get the most recent active order for the banner (not completed/delivered/cancelled)
    const activeOrder = ordersData?.find(
        (order) =>
            (order.status as string) !== 'completed' &&
            order.status !== 'delivered' &&
            order.status !== 'cancelled' &&
            order.status !== 'refunded'
    );

    const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'Healthcare Partner';

    const getInitial = (name: string | undefined) => (name ? name[0].toUpperCase() : '');

    const initials = user
        ? (getInitial(user.firstName) + getInitial(user.lastName)) || user.email?.[0]?.toUpperCase() || 'U'
        : 'U';

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* 1. Hero Banner with Welcome & Highlights */}
            <Card className="border border-border/80 shadow-xs overflow-hidden rounded-2xl bg-card relative">
                <div className="p-6 md:p-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/20">
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>Verified Healthcare Account</span>
                            </div>
                            <TimeGreeting firstName={firstName} />
                            <p className="text-sm text-muted-foreground max-w-xl">
                                Welcome to your MyMedDevices portal. Monitor your clinical equipment orders, track deliveries, manage warranties, and redeem healthcare loyalty rewards.
                            </p>
                        </div>

                        {/* Right Quick Actions / User Avatar */}
                        <div className="flex items-center gap-3">
                            <Button asChild size="sm" variant="default" className="gap-2 rounded-xl shadow-xs font-semibold">
                                <Link href="/products">
                                    <ShoppingBag className="h-4 w-4" />
                                    <span>Browse Equipment</span>
                                </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline" className="gap-2 rounded-xl font-semibold border-border bg-card hover:bg-muted">
                                <Link href="/dashboard/tracking">
                                    <Truck className="h-4 w-4 text-primary" />
                                    <span>Track Shipments</span>
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Quick Stat Chips */}
                    <div className="mt-6 pt-5 border-t border-border/50 flex flex-wrap items-center gap-3">
                        <QuickStatChip
                            icon={ShoppingBag}
                            label="Total Orders"
                            value={stats?.totalOrders.toString() || '0'}
                            loading={statsLoading}
                        />
                        <QuickStatChip
                            icon={TrendingUp}
                            label="Total Procurement"
                            value={`Ksh ${formatCurrency(stats?.totalSpent || 0)}`}
                            loading={statsLoading}
                        />
                        <QuickStatChip
                            icon={Heart}
                            label="Saved Devices"
                            value={stats?.wishlistCount.toString() || '0'}
                            loading={statsLoading}
                        />
                        <QuickStatChip
                            icon={Award}
                            label="Reward Points"
                            value={loyaltyLoading ? '...' : `${loyaltyPoints.toLocaleString()} pts`}
                            loading={loyaltyLoading}
                            highlight
                        />
                    </div>
                </div>
            </Card>

            {/* 2. Active Order Tracker Banner (if active order exists) */}
            {activeOrder && (
                <Link href={`/dashboard/orders/${activeOrder.id}`} className="block group">
                    <Card className="border-2 border-primary/30 hover:border-primary bg-gradient-to-r from-primary/10 via-card to-card shadow-xs hover:shadow-md transition-all rounded-2xl overflow-hidden cursor-pointer">
                        <CardContent className="p-5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary/20 text-primary shrink-0 relative">
                                        <Truck className="h-6 w-6" />
                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-foreground text-sm sm:text-base">
                                                Order #{activeOrder.number} is in transit
                                            </h3>
                                            <OrderStatusBadge status={activeOrder.status as string} />
                                        </div>
                                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                                            <span>
                                                Placed on{' '}
                                                {new Date(activeOrder.date_created).toLocaleDateString('en-KE', {
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
                                <div className="flex items-center gap-2 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform self-end sm:self-center">
                                    <span>View Real-time Tracker</span>
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            )}

            {/* 3. 4-Key Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricStatCard
                    icon={ShoppingBag}
                    title="Total Orders"
                    value={stats?.totalOrders.toString() || '0'}
                    helper="Lifetime placed orders"
                    loading={statsLoading}
                    iconClass="bg-blue-500/15 text-blue-600 dark:text-blue-400"
                />
                <MetricStatCard
                    icon={TrendingUp}
                    title="Total Spend"
                    value={`Ksh ${formatCurrency(stats?.totalSpent || 0)}`}
                    helper="Completed equipment purchases"
                    loading={statsLoading}
                    iconClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                />
                <MetricStatCard
                    icon={Heart}
                    title="Wishlist Items"
                    value={stats?.wishlistCount.toString() || '0'}
                    helper="Saved for future procurement"
                    loading={statsLoading}
                    iconClass="bg-rose-500/15 text-rose-600 dark:text-rose-400"
                />
                <MetricStatCard
                    icon={MapPin}
                    title="Delivery Addresses"
                    value={stats?.savedAddresses.toString() || '0'}
                    helper="Verified shipping locations"
                    loading={statsLoading}
                    iconClass="bg-purple-500/15 text-purple-600 dark:text-purple-400"
                />
            </div>

            {/* 4. Main 2-Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Recent Orders (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="border border-border/80 shadow-xs rounded-2xl overflow-hidden bg-card">
                        <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b border-border/60 bg-muted/10">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" />
                                <CardTitle className="text-base font-bold text-foreground">Recent Orders</CardTitle>
                            </div>
                            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs font-semibold h-8 rounded-lg hover:bg-muted">
                                <Link href="/dashboard/orders">
                                    <span>All Orders</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {ordersLoading ? (
                                <div className="p-6 space-y-4">
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                </div>
                            ) : ordersError ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    Failed to load orders. Please refresh or try again later.
                                </div>
                            ) : recentOrders && recentOrders.length > 0 ? (
                                <div className="divide-y divide-border/60">
                                    {recentOrders.map((order) => (
                                        <Link
                                            key={order.id}
                                            href={`/dashboard/orders/${order.id}`}
                                            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/15 transition-colors block group"
                                        >
                                            <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                                                <div className="p-2.5 rounded-xl bg-muted/50 border border-border/60 text-foreground shrink-0 group-hover:border-primary/40 transition-colors">
                                                    <Package className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">
                                                            Order #{order.number || String(order.id).split('-')[0]}
                                                        </h4>
                                                        <OrderStatusBadge status={order.status as string} />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                                                        <span>
                                                            {new Date(order.date_created).toLocaleDateString('en-KE', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            })}
                                                        </span>
                                                        <span>•</span>
                                                        <span>{order.line_items?.length || 1} {(order.line_items?.length || 1) === 1 ? 'item' : 'items'}</span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                                                <div className="text-left sm:text-right">
                                                    <span className="text-[11px] text-muted-foreground block sm:hidden">Total</span>
                                                    <span className="text-sm font-bold text-foreground">
                                                        Ksh {formatCurrency(parseFloat(order.total))}
                                                    </span>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center space-y-3">
                                    <Package className="h-12 w-12 mx-auto text-muted-foreground/40" />
                                    <h4 className="font-bold text-foreground text-sm">No orders yet</h4>
                                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                        You haven't placed any medical equipment orders yet.
                                    </p>
                                    <Button asChild size="sm" className="rounded-xl mt-2 font-semibold">
                                        <Link href="/products">Browse Medical Catalog</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quality & Assurance Banner */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/20 flex items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div className="space-y-1 text-xs">
                            <h4 className="font-bold text-foreground text-sm">PPB & KMPDB Regulatory Compliance</h4>
                            <p className="text-muted-foreground leading-relaxed">
                                Every medical instrument and device procured through MyMedDevices Kenya complies with national health standards, arrives with official manufacturer warranties, and includes verified batch documentation.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Column: Loyalty, Quick Navigation & Support (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    {/* 1. Loyalty Rewards Card */}
                    <Card className="border border-border/80 shadow-xs rounded-2xl overflow-hidden bg-card">
                        <CardHeader className="py-4 px-5 border-b border-border/60 bg-muted/10 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-amber-500" />
                                <CardTitle className="text-sm font-bold text-foreground">Healthcare Loyalty</CardTitle>
                            </div>
                            <Badge variant="outline" className="text-xs capitalize font-bold border-amber-300 bg-amber-500/10 text-amber-800 dark:text-amber-300">
                                {loyaltyTier} Tier
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <div className="text-center py-2 bg-muted/20 rounded-xl border border-border/50">
                                {loyaltyLoading ? (
                                    <Skeleton className="h-8 w-24 mx-auto rounded-md" />
                                ) : (
                                    <p className="text-3xl font-extrabold text-foreground tracking-tight">
                                        {loyaltyPoints.toLocaleString()}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-0.5">Available Redeemable Points</p>
                            </div>

                            <LoyaltyProgress tier={loyaltyTier} points={loyaltyPoints} />

                            <Button asChild variant="outline" size="sm" className="w-full rounded-xl text-xs font-semibold border-border bg-card hover:bg-muted">
                                <Link href="/dashboard/loyalty" className="flex items-center justify-center gap-1.5">
                                    <span>Redeem Rewards & Discounts</span>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* 2. Quick Shortcuts Grid */}
                    <Card className="border border-border/80 shadow-xs rounded-2xl overflow-hidden bg-card">
                        <CardHeader className="py-3.5 px-5 border-b border-border/60 bg-muted/10">
                            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Quick Shortcuts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 divide-y divide-border/40">
                            <QuickLinkItem
                                icon={Heart}
                                title="My Wishlist"
                                subtitle={`${stats?.wishlistCount || 0} saved products`}
                                href="/dashboard/wishlist"
                            />
                            <QuickLinkItem
                                icon={MapPin}
                                title="Shipping Addresses"
                                subtitle="Manage clinic & home addresses"
                                href="/dashboard/addresses"
                            />
                            <QuickLinkItem
                                icon={RefreshCw}
                                title="Returns & Refunds"
                                subtitle="Warranty claims & replacements"
                                href="/dashboard/returns"
                            />
                        </CardContent>
                    </Card>

                    {/* 3. Customer Care & Assistance */}
                    <Card className="border border-border/80 shadow-xs rounded-2xl bg-card p-5 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/15 text-primary shrink-0">
                                <Headphones className="h-4 w-4" />
                            </div>
                            <div>
                                <h4 className="font-bold text-foreground text-xs">Need Procurement Assistance?</h4>
                                <p className="text-[11px] text-muted-foreground">Dedicated 24/7 medical desk support</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                            <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-xs font-semibold">
                                <a href="tel:+254707757088">Call Desk</a>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="h-8 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-500/20">
                                <a
                                    href="https://wa.me/254735239696"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    WhatsApp
                                </a>
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Subcomponents
// ============================================================================

function QuickStatChip({
    icon: Icon,
    label,
    value,
    loading = false,
    highlight = false,
}: {
    icon: any;
    label: string;
    value: string | number;
    loading?: boolean;
    highlight?: boolean;
}) {
    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-2xs",
            highlight
                ? "bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200"
                : "bg-background border-border/60 text-foreground"
        )}>
            <Icon className={cn("h-3.5 w-3.5", highlight ? "text-amber-500" : "text-muted-foreground")} />
            <span className="text-muted-foreground">{label}:</span>
            {loading ? (
                <Skeleton className="h-4 w-10 rounded" />
            ) : (
                <span className="font-bold">{value}</span>
            )}
        </div>
    );
}

function MetricStatCard({
    icon: Icon,
    title,
    value,
    helper,
    loading,
    iconClass,
}: {
    icon: any;
    title: string;
    value: string;
    helper?: string;
    loading?: boolean;
    iconClass?: string;
}) {
    return (
        <Card className="border border-border/80 shadow-xs rounded-2xl bg-card hover:border-primary/40 transition-all">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground">{title}</p>
                        {loading ? (
                            <Skeleton className="h-7 w-20 rounded my-1" />
                        ) : (
                            <p className="text-xl font-extrabold text-foreground tracking-tight truncate">
                                {value}
                            </p>
                        )}
                        {helper && (
                            <p className="text-[11px] text-muted-foreground truncate">{helper}</p>
                        )}
                    </div>
                    <div className={cn("p-2.5 rounded-xl shrink-0", iconClass || "bg-primary/10 text-primary")}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function QuickLinkItem({
    icon: Icon,
    title,
    subtitle,
    href,
}: {
    icon: any;
    title: string;
    subtitle: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/40 transition-colors group"
        >
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/60 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <h5 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                        {title}
                    </h5>
                    <p className="text-[11px] text-muted-foreground">{subtitle}</p>
                </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </Link>
    );
}

function OrderStatusBadge({ status }: { status: string }) {
    const config: Record<string, { badgeClass: string; label: string }> = {
        completed: { badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800', label: 'Completed' },
        delivered: { badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800', label: 'Delivered' },
        paid: { badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800', label: 'Paid' },
        processing: { badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300 dark:border-blue-800', label: 'Processing' },
        shipped: { badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-300 dark:border-purple-800', label: 'In Transit' },
        pending: { badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/80', label: 'Order Placed' },
        'on-hold': { badgeClass: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/80', label: 'Pending Payment' },
        cancelled: { badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800', label: 'Cancelled' },
        refunded: { badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700', label: 'Refunded' },
    };

    const statusKey = String(status).toLowerCase();
    const { badgeClass, label } = config[statusKey] || {
        badgeClass: 'bg-muted text-muted-foreground border-border',
        label: status,
    };

    return (
        <Badge variant="outline" className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border shadow-2xs', badgeClass)}>
            {label}
        </Badge>
    );
}

function LoyaltyProgress({ tier, points }: { tier: string; points: number }) {
    const tiers = ['bronze', 'silver', 'gold', 'platinum'];
    const currentIndex = tiers.indexOf(tier.toLowerCase());
    const nextTier = tiers[currentIndex + 1];
    const tierPoints = { bronze: 0, silver: 1000, gold: 5000, platinum: 10000 };

    const currentThreshold = tierPoints[tier as keyof typeof tierPoints] || 0;
    const nextThreshold = nextTier ? tierPoints[nextTier as keyof typeof tierPoints] : tierPoints.platinum;
    const progress = nextTier
        ? Math.min(100, Math.round(((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100))
        : 100;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                <span className="capitalize">{tier} Tier</span>
                {nextTier && <span>Next: <strong className="capitalize text-foreground">{nextTier}</strong> ({nextThreshold - points} pts)</span>}
            </div>
            <div className="h-2 bg-muted/60 rounded-full overflow-hidden border border-border/40">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-amber-500 to-primary rounded-full"
                />
            </div>
        </div>
    );
}
