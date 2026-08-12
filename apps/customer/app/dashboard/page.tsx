'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats, useCustomerOrders } from '@/hooks/useDashboard';
import { useAuthStore } from '@mymeddevices/shared-core';
import { formatCurrency } from '@/lib/utils/utils';
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
    Target,
    RefreshCw,
    User,
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

    const recentOrders = ordersData?.slice(0, 3);

    // Get the most recent active order for the banner (not completed/delivered)
    const activeOrder = ordersData?.find(
        (order) => (order.status as string) !== 'completed' && order.status !== 'delivered' && order.status !== 'cancelled'
    );

    const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'Guest';
    const loyaltyPoints = user?.loyaltyPoints ?? (user as any)?.loyalty_points ?? 0;
    const loyaltyTier = (user?.loyaltyTier as string) || 'bronze';

    const getInitial = (name: string | undefined) =>
        name ? name[0].toUpperCase() : '';

    const initials = user
        ? (getInitial(user.firstName) + getInitial(user.lastName)) || 'U'
        : 'U';

    return (
        <div className="space-y-6">
            {/* Hero Section with Personalized Greeting */}
            <Card className="border-muted/40 bg-muted/30">
                <CardContent className="p-6 md:p-8">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <TimeGreeting firstName={firstName} />
                            <p className="text-sm text-muted-foreground max-w-md">
                                {activeOrder ? (
                                    <span>You have an active order in transit</span>
                                ) : (
                                    <span>Browse our catalog and discover new products</span>
                                )}
                            </p>
                        </div>
                        <div className="hidden md:flex h-16 w-16 items-center justify-center rounded-full bg-muted text-xl font-semibold">
                            {initials}
                        </div>
                    </div>

                    {/* Quick stats in hero */}
                    <div className="mt-6 flex flex-wrap gap-4">
                        <QuickStatChip
                            icon={ShoppingBag}
                            label="Orders"
                            value={stats?.totalOrders.toString() || '0'}
                            loading={statsLoading}
                        />
                        <QuickStatChip
                            icon={Heart}
                            label="Wishlist"
                            value={stats?.wishlistCount.toString() || '0'}
                            loading={statsLoading}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Active Order Banner - Subtle */}
            {activeOrder && (
                <Link href={`/dashboard/orders/${activeOrder.id}`}>
                    <Card className="border-l-4 border-l-muted-foreground/20 bg-muted/20 hover:bg-muted/30 transition-all cursor-pointer">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 rounded-lg bg-muted">
                                    <Truck className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-sm">Order #{activeOrder.number} is on the way</h3>
                                        <Badge variant="secondary" className="text-xs">
                                            {activeOrder.status}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Arriving {activeOrder.estimated_delivery
                                            ? new Date(activeOrder.estimated_delivery).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })
                                            : 'soon'}
                                    </p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Stats & Quick Actions */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <SimpleStatCard
                            icon={ShoppingBag}
                            title="Total Orders"
                            value={stats?.totalOrders.toString() || '0'}
                            loading={statsLoading}
                        />
                        <SimpleStatCard
                            icon={TrendingUp}
                            title="Total Spent"
                            value={`Ksh ${formatCurrency(stats?.totalSpent || 0)}`}
                            loading={statsLoading}
                        />
                        <SimpleStatCard
                            icon={Heart}
                            title="Wishlist"
                            value={stats?.wishlistCount.toString() || '0'}
                            loading={statsLoading}
                        />
                        <SimpleStatCard
                            icon={MapPin}
                            title="Addresses"
                            value={stats?.savedAddresses.toString() || '0'}
                            loading={statsLoading}
                        />
                    </div>

                    {/* Recent Orders */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <CardTitle className="text-base">Recent Orders</CardTitle>
                            <Link href="/dashboard/orders">
                                <Button variant="ghost" size="sm" className="gap-2 h-8 text-xs">
                                    View All
                                    <ArrowRight className="h-3 w-3" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            {ordersLoading ? (
                                <div className="p-4 space-y-3">
                                    <Skeleton className="h-14 w-full" />
                                    <Skeleton className="h-14 w-full" />
                                    <Skeleton className="h-14 w-full" />
                                </div>
                            ) : ordersError ? (
                                <div className="p-4 text-center text-muted-foreground text-sm">
                                    Failed to load orders
                                </div>
                            ) : recentOrders && recentOrders.length > 0 ? (
                                <div className="divide-y divide-border/50">
                                    {recentOrders.map((order) => (
                                        <Link
                                            key={order.id}
                                            href={`/dashboard/orders/${order.id}`}
                                            className="block hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="p-4 flex items-center justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                        Order #{order.number}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(order.date_created).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                        })}
                                                    </p>
                                                </div>
                                                <OrderStatusBadge status={order.status as string} />
                                                <p className="font-medium text-sm whitespace-nowrap">
                                                    Ksh {formatCurrency(parseFloat(order.total))}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                                    <p className="text-muted-foreground text-sm">No orders yet</p>
                                    <Link href="/shop">
                                        <Button variant="link" size="sm" className="mt-2 h-8">
                                            Start Shopping
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Loyalty & Quick Links */}
                <div className="space-y-4">
                    {/* Loyalty Card */}
                    <Card className="bg-muted/30 border-muted/40">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Award className="h-4 w-4" />
                                    <CardTitle className="text-sm text-foreground">Loyalty Rewards</CardTitle>
                                </div>
                                <Badge variant="secondary" className="text-xs capitalize">
                                    {loyaltyTier}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center py-2">
                                <p className="text-3xl font-semibold">{loyaltyPoints}</p>
                                <p className="text-xs text-muted-foreground">Loyalty Points</p>
                            </div>
                            <LoyaltyProgress tier={loyaltyTier} points={loyaltyPoints} />
                            <Link href="/dashboard/loyalty" className="block">
                                <Button variant="outline" size="sm" className="w-full">
                                    View Rewards
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

// Quick Stat Chip Component
function QuickStatChip({
    icon: Icon,
    label,
    value,
    loading = false,
}: {
    icon: any;
    label: string;
    value: string | number;
    loading?: boolean;
}) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border/50">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{label}:</span>
            {loading ? (
                <Skeleton className="h-4 w-6" />
            ) : (
                <span className="text-xs font-medium">{value}</span>
            )}
        </div>
    );
}

// Simple Stat Card Component
function SimpleStatCard({
    icon: Icon,
    title,
    value,
    loading,
}: {
    icon: any;
    title: string;
    value: string;
    loading?: boolean;
}) {
    return (
        <Card className="border-muted/40">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{title}</p>
                        {loading ? (
                            <Skeleton className="h-6 w-16 mt-1" />
                        ) : (
                            <p className="text-lg font-semibold mt-1 truncate">{value}</p>
                        )}
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Order Status Badge
function OrderStatusBadge({ status }: { status: string }) {
    const config: Record<string, { class: string; label: string }> = {
        completed: { class: 'bg-muted text-muted-foreground', label: 'Completed' },
        delivered: { class: 'bg-muted text-muted-foreground', label: 'Delivered' },
        processing: { class: 'bg-muted text-muted-foreground', label: 'Processing' },
        shipped: { class: 'bg-muted text-muted-foreground', label: 'Shipped' },
        pending: { class: 'bg-muted text-muted-foreground', label: 'Pending' },
        'on-hold': { class: 'bg-muted text-muted-foreground', label: 'On Hold' },
        cancelled: { class: 'bg-muted text-muted-foreground', label: 'Cancelled' },
    };

    const { class: className, label } = config[status] || {
        class: 'bg-muted text-muted-foreground',
        label: status,
    };

    return (
        <Badge variant="secondary" className={cn('text-xs', className)}>
            {label}
        </Badge>
    );
}

// Loyalty Progress Component
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
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{tier}</span>
                {nextTier && <span className="capitalize">{nextTier}</span>}
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full bg-foreground/10 rounded-full"
                />
            </div>
        </div>
    );
}
