'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils/utils';
import { orderService, type Order } from '@/lib/services/order-service';
import ShipmentTracking from '@/app/(shop)/_components/ShipmentTracking';
import { PACKAGING_FEE, SERVICES_FEE } from '@/lib/config/fees';
import {
    Package,
    Truck,
    FileText,
    Home,
    CreditCard,
    Calendar,
    Loader2,
    MapPin,
    Receipt,
    Info
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
                const urlParams = new URLSearchParams(window.location.search);
                const urlGuestToken = urlParams.get('guest_token');
                const localGuestToken = typeof window !== 'undefined' ? localStorage.getItem('guest_token') : null;
                const guestToken = urlGuestToken || localGuestToken || undefined;

                const fetchedOrder = await orderService.getOrder(orderId, guestToken);
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
        return <OrderDetailSkeleton />;
    }

    if (error || !order) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-5xl">
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

    const subtotal = order.items?.reduce(
        (sum, item) => sum + Number(item.total_price),
        0
    ) || 0;

    // Calculate shipping as the remainder after subtracting subtotal and known fees
    // This is an approximation since backend doesn't provide fee breakdown
    const calculatedShipping = Math.max(0, order.total_amount - subtotal - PACKAGING_FEE - SERVICES_FEE);

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <Button variant="ghost" size="icon" className="shrink-0">
                                <Home className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="min-w-0">
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                                Order #{order.order_number || order.id.split('-')[0]}
                            </h1>
                            <p className="text-muted-foreground text-sm mt-1">
                                Placed on{' '}
                                <time dateTime={order.created_at}>
                                    {new Date(order.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </time>
                            </p>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className={`${status.className} text-sm px-3 py-1 border-current shrink-0`}
                    >
                        {status.label}
                    </Badge>
                </div>

                {/* Order Items with Timeline */}
                <div className="space-y-6">
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
                                        <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted/50 shrink-0 border">
                                            {item.product?.image_url ? (
                                                <Image
                                                    src={item.product.image_url}
                                                    alt={item.product_name || 'Product'}
                                                    fill
                                                    className="object-cover"
                                                    sizes="80px"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center bg-muted">
                                                    <Package className="h-8 w-8 text-muted-foreground/60" />
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
                                            <p className="text-sm text-muted-foreground mt-1.5">
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

                {/* Order Summary with Address below */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Receipt className="h-4 w-4" />
                                Order Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <SummaryRow
                                label="Subtotal"
                                value={subtotal}
                            />
                            <SummaryRow
                                label="Shipping"
                                value={calculatedShipping}
                            />
                            <SummaryRow
                                label="Packaging Fee"
                                value={PACKAGING_FEE}
                            />
                            <SummaryRow
                                label="Services Fee"
                                value={SERVICES_FEE}
                            />
                            <Separator />
                            <SummaryRow
                                label="Total"
                                value={order.total_amount}
                                highlight
                            />
                            {order.status === 'paid' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' ? (
                                <div className="pt-2">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
                                        <Info className="h-3 w-3 shrink-0" />
                                        <span>Paid via M-Pesa</span>
                                    </div>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MapPin className="h-4 w-4" />
                                Delivery Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {order.shipping_address ? (
                                <div className="text-sm space-y-2">
                                    <p className="font-medium text-foreground">
                                        {(order.shipping_address as any).full_name ||
                                            `${order.shipping_address.first_name || ''} ${order.shipping_address.last_name || ''}`.trim()}
                                    </p>
                                    <div className="text-muted-foreground space-y-0.5">
                                        {order.shipping_address.address_line1 && (
                                            <p>{order.shipping_address.address_line1}</p>
                                        )}
                                        {order.shipping_address.address_line2 && (
                                            <p>{order.shipping_address.address_line2}</p>
                                        )}
                                        {(order.shipping_address.city || order.shipping_address.state) && (
                                            <p>
                                                {[order.shipping_address.city, order.shipping_address.state, order.shipping_address.postal_code]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                            </p>
                                        )}
                                        {order.shipping_address.country && (
                                            <p>{order.shipping_address.country}</p>
                                        )}
                                        {order.shipping_address.phone && (
                                            <p className="text-xs mt-2">{order.shipping_address.phone}</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>No delivery address provided</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
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

// ============================================================================
// Helper Components
// ============================================================================

function SummaryRow({
    label,
    value,
    highlight = false,
    showInfo = false,
}: {
    label: string;
    value: number;
    highlight?: boolean;
    showInfo?: boolean;
}) {
    return (
        <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-1.5">
                <span className={highlight ? 'font-semibold' : 'text-muted-foreground'}>
                    {label}
                </span>
                {showInfo && (
                    <span
                        className="text-muted-foreground/50 hover:text-muted-foreground cursor-help"
                        title="Includes shipping costs and any applicable fees"
                    >
                        <Info className="h-3 w-3" />
                    </span>
                )}
            </div>
            <span className={highlight ? 'font-semibold text-base' : ''}>
                Ksh {formatCurrency(value)}
            </span>
        </div>
    );
}

// calculateShippingFees is now calculated inline in the main component

// ============================================================================
// Skeleton Loader
// ============================================================================

function OrderDetailSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="space-y-6">
                {/* Header Skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted animate-pulse" />
                        <div className="space-y-2">
                            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                        </div>
                    </div>
                    <div className="h-7 w-24 bg-muted rounded-full animate-pulse" />
                </div>

                {/* Order Items Skeleton */}
                <Card>
                    <CardHeader>
                        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="h-20 w-20 rounded-lg bg-muted animate-pulse shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
                                    <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                                    <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                                </div>
                                <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Timeline Skeleton */}
                <Card>
                    <CardHeader>
                        <div className="h-5 w-28 bg-muted rounded animate-pulse" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-start gap-3">
                                <div className="h-2 w-2 rounded-full bg-muted animate-pulse mt-1" />
                                <div className="flex-1 space-y-1">
                                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                    <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Order Summary and Address Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order Summary Skeleton */}
                    <Card>
                        <CardHeader>
                            <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                            </div>
                            <div className="flex justify-between">
                                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                            </div>
                            <div className="flex justify-between">
                                <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                            </div>
                            <div className="flex justify-between">
                                <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                                <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                                <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping Address Skeleton */}
                    <Card>
                        <CardHeader>
                            <div className="h-5 w-36 bg-muted rounded animate-pulse" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
