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

export default function DashboardPage() {
    const user = useAuthStore((state) => state.user);
    const { data: stats, isLoading: statsLoading } = useDashboardStats();
    const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useCustomerOrders(
        1,
        10
    );
    
    const recentOrders = ordersData?.slice(0, 3);

    const firstName = user?.firstName || user?.displayName?.split(' ')[0] || 'Guest';

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Welcome back, {firstName}! 👋
                </h1>
                <p className="text-muted-foreground mt-2">
                    Here's what's happening with your account
                </p>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={ShoppingBag}
                    title="Total Orders"
                    value={stats?.totalOrders.toString() || '0'}
                    loading={statsLoading}
                    color="primary"
                />
                <StatCard
                    icon={TrendingUp}
                    title="Total Spent"
                    value={`Ksh ${formatCurrency(stats?.totalSpent || 0)}`}
                    loading={statsLoading}
                    color="success"
                />
                <StatCard
                    icon={Heart}
                    title="Wishlist Items"
                    value={stats?.wishlistCount.toString() || '0'}
                    loading={statsLoading}
                    color="danger"
                />
                <StatCard
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
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${order.status === 'completed'
                                                    ? 'bg-green-100 text-green-700'
                                                    : order.status === 'processing'
                                                        ? 'bg-blue-100 text-blue-700'
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

// Stat Card Component
function StatCard({
    icon: Icon,
    title,
    value,
    loading,
    color,
}: {
    icon: any;
    title: string;
    value: string;
    loading: boolean;
    color: string;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
        >
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-muted-foreground mb-1">{title}</p>
                            {loading ? (
                                <Skeleton className="h-8 w-20" />
                            ) : (
                                <p className="text-2xl font-bold text-foreground">{value}</p>
                            )}
                        </div>
                        <div
                            className={`p-3 rounded-full ${color === 'primary'
                                    ? 'bg-primary/10 text-primary'
                                    : color === 'success'
                                        ? 'bg-green-100 text-green-600'
                                        : color === 'danger'
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-blue-100 text-blue-600'
                                }`}
                        >
                            <Icon className="h-5 w-5" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
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
