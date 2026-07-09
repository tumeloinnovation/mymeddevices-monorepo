'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils/utils';
import { orderService, type Order } from '@/lib/services/order-service';
import ShipmentTracking from '@/app/(shop)/_components/ShipmentTracking';
import {
    Package,
    Truck,
    FileText,
    Home,
    CreditCard,
    Calendar,
    Loader2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
    paid: { label: 'Paid', className: 'bg-blue-100 text-blue-700' },
    processing: { label: 'Processing', className: 'bg-blue-100 text-blue-700' },
    shipped: { label: 'Shipped', className: 'bg-purple-100 text-purple-700' },
    delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700' },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
    refunded: { label: 'Refunded', className: 'bg-purple-100 text-purple-700' },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
    'on-hold': { label: 'On Hold', className: 'bg-orange-100 text-orange-700' },
};

export default function PublicOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) return;

            setLoading(true);
            setError(null);

            try {
                const fetchedOrder = await orderService.getOrder(orderId);
                setOrder(fetchedOrder);
            } catch (err: any) {
                console.error('Failed to fetch order:', err);
                const errorMessage = err?.message || 'Failed to load order details';
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="space-y-6">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/')}
                        className="gap-2"
                    >
                        <Home className="h-4 w-4" />
                        Back to Home
                    </Button>
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
                            <p className="text-muted-foreground">
                                {error || 'The order you are looking for does not exist or could not be loaded.'}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const status = statusConfig[order.status] || statusConfig.pending;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <Home className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                Order #{order.order_number || order.id.split('-')[0]}
                            </h1>
                            <p className="text-muted-foreground">
                                Placed on{' '}
                                {new Date(order.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>
                    <Badge className={`${status.className} text-sm px-4 py-1`}>
                        {status.label}
                    </Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Items */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Order Items ({order.items?.length || 0})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="divide-y">
                                    {order.items?.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                                        >
                                            <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                                                {item.product?.image_url ? (
                                                    <Image
                                                        src={item.product.image_url}
                                                        alt={item.product_name || 'Product'}
                                                        fill
                                                        className="object-cover"
                                                        sizes="80px"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <Package className="h-8 w-8 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-foreground line-clamp-2">
                                                    {item.product_name || 'Product'}
                                                </h4>
                                                {item.product?.sku && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        SKU: {item.product.sku}
                                                    </p>
                                                )}
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Qty: {item.quantity} × Ksh {formatCurrency(Number(item.unit_price))}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-foreground">
                                                    Ksh {formatCurrency(Number(item.total_price))}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Shipping Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Truck className="h-4 w-4" />
                                    Shipping Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {order.shipping_address ? (
                                    <div className="text-sm space-y-1">
                                        <p className="font-medium">
                                            {order.shipping_address.first_name} {order.shipping_address.last_name}
                                        </p>
                                        {order.shipping_address.address_line1 && (
                                            <p className="text-muted-foreground">{order.shipping_address.address_line1}</p>
                                        )}
                                        {order.shipping_address.address_line2 && (
                                            <p className="text-muted-foreground">{order.shipping_address.address_line2}</p>
                                        )}
                                        <p className="text-muted-foreground">
                                            {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                                        </p>
                                        <p className="text-muted-foreground">{order.shipping_address.country}</p>
                                        {order.shipping_address.phone && (
                                            <p className="text-muted-foreground">{order.shipping_address.phone}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No shipping address provided</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>
                                        Ksh{' '}
                                        {formatCurrency(
                                            order.items?.reduce(
                                                (sum, item) => sum + Number(item.total_price),
                                                0
                                            ) || 0
                                        )}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-semibold">
                                    <span>Total</span>
                                    <span className="text-primary">
                                        Ksh {formatCurrency(order.total_amount)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Calendar className="h-4 w-4" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <TimelineItem
                                        label="Order Placed"
                                        date={order.created_at}
                                        completed
                                    />
                                    {order.status === 'paid' && (
                                        <TimelineItem
                                            label="Payment Received"
                                            date={order.updated_at || order.created_at}
                                            completed
                                        />
                                    )}
                                    {order.status === 'processing' && (
                                        <TimelineItem
                                            label="Processing"
                                            date={order.updated_at || order.created_at}
                                            completed
                                        />
                                    )}
                                    {(order.status === 'shipped' || order.status === 'delivered') && (
                                        <TimelineItem
                                            label="Shipped"
                                            date={order.updated_at || order.created_at}
                                            completed
                                        />
                                    )}
                                    {order.status === 'delivered' && (
                                        <TimelineItem
                                            label="Delivered"
                                            date={order.updated_at || order.created_at}
                                            completed
                                        />
                                    )}
                                    {order.status === 'cancelled' && (
                                        <TimelineItem
                                            label="Cancelled"
                                            date={order.updated_at || order.created_at}
                                            completed
                                        />
                                    )}
                                    {order.status === 'refunded' && (
                                        <TimelineItem
                                            label="Refunded"
                                            date={order.updated_at || order.created_at}
                                            completed
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TimelineItem({
    label,
    date,
    completed,
}: {
    label: string;
    date: string;
    completed: boolean;
}) {
    return (
        <div className="flex items-start gap-3">
            <div
                className={`mt-1 h-2 w-2 rounded-full ${completed ? 'bg-green-500' : 'bg-muted'
                    }`}
            />
            <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                    {new Date(date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </p>
            </div>
        </div>
    );
}
