'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useCustomerOrders } from '@/hooks/useDashboard';
import { formatCurrency } from '@/lib/utils/utils';
import { Search, Package, Eye } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';

export default function OrdersPage() {
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const { data: orders, isLoading } = useCustomerOrders(page, 10, status || undefined);

    const filteredOrders = orders?.filter((order) =>
        String(order.number || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
                <p className="text-muted-foreground mt-2">
                    View and track all your orders
                </p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by order number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value=" ">All Status</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="on-hold">On Hold</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Orders List */}
            <Card>
                <CardHeader>
                    <CardTitle>Order History</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-24 w-full" />
                            ))}
                        </div>
                    ) : filteredOrders && filteredOrders.length > 0 ? (
                        <div className="space-y-4">
                            {filteredOrders.map((order, index) => (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 rounded-full bg-primary/10 text-primary">
                                                <Package className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    Order #{order.number}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(order.date_created).toLocaleDateString(
                                                        'en-US',
                                                        {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                        }
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Status</p>
                                                <span
                                                    className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
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
                                            </div>

                                            <div>
                                                <p className="text-xs text-muted-foreground">Items</p>
                                                <p className="font-medium text-foreground">
                                                    {order.line_items.length} item(s)
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-muted-foreground">Total</p>
                                                <p className="font-semibold text-foreground">
                                                    Ksh {formatCurrency(parseFloat(order.total))}
                                                </p>
                                            </div>
                                        </div>

                                        <Button variant="outline" size="sm" className="gap-2" asChild>
                                            <Link href={`/dashboard/orders/${order.id}`}>
                                                <Eye className="h-4 w-4" />
                                                View Details
                                            </Link>
                                        </Button>
                                    </div>

                                    {/* Order Items Preview */}
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm font-medium text-muted-foreground mb-2">
                                            Items:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {order.line_items.slice(0, 3).map((item) => (
                                                <span
                                                    key={item.id}
                                                    className="text-xs bg-muted px-2 py-1 rounded"
                                                >
                                                    {item.name} (x{item.quantity})
                                                </span>
                                            ))}
                                            {order.line_items.length > 3 && (
                                                <span className="text-xs bg-muted px-2 py-1 rounded">
                                                    +{order.line_items.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title="No orders found"
                            description={
                                searchQuery
                                    ? 'Try adjusting your search or filter'
                                    : 'Start shopping to see your orders here'
                            }
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
