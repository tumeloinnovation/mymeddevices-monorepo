'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TimeGreeting } from './_components/time-greeting';
import { ActiveOrderBanner } from './_components/active-order-banner';
import { LoyaltyProgressBar } from './_components/loyalty-progress-bar';
import { EnhancedStatCard } from './_components/enhanced-stat-card';

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
        (order) => order.status !== 'completed' && order.status !== 'delivered' && order.status !== 'cancelled'
    );

    const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'Guest';

    return (
        <div className="space-y-6">
            {/* Time-based Greeting */}
            <TimeGreeting firstName={firstName} />

            {/* Active Order Banner */}
            {activeOrder && (
                <ActiveOrderBanner
                    orderId={String(activeOrder.id)}
                    orderNumber={activeOrder.number}
                    estimatedDelivery={activeOrder.estimated_delivery}
                    status={activeOrder.status}
                />
            )}

            {/* Loyalty Progress Bar */}
            <LoyaltyProgressBar
                currentTier={(user?.loyaltyTier as 'bronze' | 'silver' | 'gold' | 'platinum') || 'bronze'}
                currentPoints={stats?.loyaltyPoints || 0}
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <EnhancedStatCard
                    icon={ShoppingBag}
                    title="Total Orders"
                    value={stats?.totalOrders.toString() || '0'}
                    loading={statsLoading}
                    color="primary"
                    trend={{ value: stats?.ordersTrend || 0, period: 'vs last month' }}
                />
                <EnhancedStatCard
                    icon={TrendingUp}
                    title="Total Spent"
                    value={`Ksh ${formatCurrency(stats?.totalSpent || 0)}`}
                    loading={statsLoading}
                    color="success"
                    trend={{ value: stats?.spentTrend || 0, period: 'vs last month' }}
                />
                <EnhancedStatCard
                    icon={Heart}
                    title="Wishlist Items"
                    value={stats?.wishlistCount.toString() || '0'}
                    loading={statsLoading}
                    color="danger"
                />
                <EnhancedStatCard
                    icon={MapPin}
                    title="Saved Addresses"
                    value={stats?.savedAddresses.toString() || '0'}
                    loading={statsLoading}
                    color="secondary"
                />
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <QuickActionButton
                            href="/dashboard/orders"
                            icon={Package}
                            title="View Orders"
                            description="Track your orders"
                        />
                        <QuickActionButton
                            href="/dashboard/wishlist"
                            icon={Heart}
                            title="Wishlist"
                            description="Manage saved items"
                        />
                        <QuickActionButton
                            href="/dashboard/addresses"
                            icon={MapPin}
                            title="Addresses"
                            description="Update addresses"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Orders</CardTitle>
                    <Link href="/dashboard/orders">
                        <Button variant="ghost" size="sm" className="gap-2">
                            View All
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {ordersLoading ? (
                        <div className="space-y-3">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : ordersError ? (
                        <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg">
                            <p>Failed to load recent orders.</p>
                            <p className="text-sm mt-1 text-red-400">{ordersError ? String(ordersError) : 'Unknown error'}</p>
                        </div>
                    ) : recentOrders && recentOrders.length > 0 ? (
                        <div className="space-y-3">
                            {recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium text-foreground">
                                            Order #{order.number}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(order.date_created).toLocaleDateString(
                                                'en-US',
                                                {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                }
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                order.status === 'completed' || order.status === 'delivered'
                                                    ? 'bg-green-100 text-green-700'
                                                    : order.status === 'processing'
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : order.status === 'shipped'
                                                            ? 'bg-purple-100 text-purple-700'
                                                            : order.status === 'on-hold' || order.status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {order.status}
                                        </span>
                                        <p className="font-semibold text-foreground">
                                            Ksh {formatCurrency(parseFloat(order.total))}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">
                            No orders yet. Start shopping!
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Quick Action Button Component
function QuickActionButton({
    href,
    icon: Icon,
    title,
    description,
}: {
    href: string;
    icon: any;
    title: string;
    description: string;
}) {
    return (
        <Link href={href}>
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 border rounded-lg hover:bg-muted/50 transition-all cursor-pointer group"
            >
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
