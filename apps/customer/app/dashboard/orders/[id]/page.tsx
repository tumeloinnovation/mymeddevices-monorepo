'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/utils';
import { useCustomerOrder, useOrderTracking } from '@/hooks/useDashboard';
import ShipmentTracking from '@/app/dashboard/_components/ShipmentTracking';
import {
    ArrowLeft,
    Package,
    MapPin,
    CreditCard,
    Calendar,
    Truck,
    FileText,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; className: string }> = {
    // Canonical order statuses (aligned with backend)
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
    paid: { label: 'Paid', className: 'bg-blue-100 text-blue-700' },
    processing: { label: 'Processing', className: 'bg-blue-100 text-blue-700' },
    shipped: { label: 'Shipped', className: 'bg-purple-100 text-purple-700' },
    delivered: { label: 'Delivered', className: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
    refunded: { label: 'Refunded', className: 'bg-purple-100 text-purple-700' },
    // Legacy status mappings (for backward compatibility)
    'on-hold': { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' }, // Maps to pending
    completed: { label: 'Delivered', className: 'bg-green-100 text-green-700' }, // Maps to delivered
    failed: { label: 'Cancelled', className: 'bg-red-100 text-red-700' }, // Maps to cancelled
};

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const { data: order, isLoading: orderLoading, error: orderError } = useCustomerOrder(orderId);
    const { data: trackingData, isLoading: trackingLoading } = useOrderTracking(orderId);

    if (orderLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-32" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-96 w-full" />
                    </div>
                    <div className="space-y-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (orderError || !order) {
        return (
            <div className="space-y-6">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Orders
                </Button>
                <Card>
                    <CardContent className="p-12 text-center">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
                        <p className="text-muted-foreground">
                            {orderError ? 'Failed to load order details.' : "The order you're looking for doesn't exist."}
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const status = statusConfig[order.status] || statusConfig.pending;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/orders">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                            Order #{order.order_number}
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
                                Order Items ({order.items.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y">
                                {order.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                                    >
                                        <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                                            {item.product?.image_url ? (
                                                <Image
                                                    src={item.product.image_url}
                                                    alt={item.product_name}
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
                                                {item.product_name}
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
                                                Ksh {formatCurrency(parseFloat(item.total_price))}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Order Notes */}
                    {order.notes && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-4 w-4" />
                                    Order Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-foreground bg-muted/50 rounded-md p-3">
                                    {order.notes}
                                </p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Addresses */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MapPin className="h-4 w-4" />
                                Delivery Address
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                            {order.shipping_address ? (
                                <>
                                    <p className="font-medium text-foreground">
                                        {(order.shipping_address as any).first_name || ''} {(order.shipping_address as any).last_name || ''}
                                    </p>
                                    {(order.shipping_address as any).company && (
                                        <p className="text-muted-foreground">{(order.shipping_address as any).company}</p>
                                    )}
                                    <p className="text-muted-foreground">
                                        {(order.shipping_address as any).address_line1 || (order.shipping_address as any).address_1 || (order.shipping_address as any).address}
                                    </p>
                                    {((order.shipping_address as any).address_line2 || (order.shipping_address as any).address_2) && (
                                        <p className="text-muted-foreground">
                                            {(order.shipping_address as any).address_line2 || (order.shipping_address as any).address_2}
                                        </p>
                                    )}
                                    <p className="text-muted-foreground">
                                        {(order.shipping_address as any).city || 'Nairobi'}, {(order.shipping_address as any).state || 'Nairobi'} {(order.shipping_address as any).postal_code || (order.shipping_address as any).postcode || ''}
                                    </p>
                                    <p className="text-muted-foreground">{(order.shipping_address as any).country || 'Kenya'}</p>
                                    {(order.shipping_address as any).phone && (
                                        <p className="text-muted-foreground mt-2">Phone: {(order.shipping_address as any).phone}</p>
                                    )}
                                </>
                            ) : (
                                <p className="text-muted-foreground">Standard Delivery</p>
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
                                        (order as any).subtotal ||
                                        order.items.reduce(
                                            (sum, item) => sum + parseFloat(item.total_price || String((item as any).subtotal || 0)),
                                            0
                                        )
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Shipping Fee</span>
                                <span>
                                    Ksh{' '}
                                    {formatCurrency(
                                        Number((order as any).shipping_amount ?? (order as any).shipping_address?.shipping_amount ?? 0)
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Packaging Fee</span>
                                <span>
                                    Ksh{' '}
                                    {formatCurrency(
                                        Number((order as any).packaging_fee ?? (order as any).shipping_address?.packaging_fee ?? 100)
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Services Fee</span>
                                <span>
                                    Ksh{' '}
                                    {formatCurrency(
                                        Number((order as any).services_fee ?? (order as any).shipping_address?.services_fee ?? 50)
                                    )}
                                </span>
                            </div>
                            {Number((order as any).discount_amount || (order as any).shipping_address?.discount_amount || 0) > 0 && (
                                <div className="flex justify-between text-sm text-green-600 font-medium">
                                    <span>Discount</span>
                                    <span>
                                        -Ksh {formatCurrency(Number((order as any).discount_amount || (order as any).shipping_address?.discount_amount))}
                                    </span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-semibold text-foreground text-base">
                                <span>Total</span>
                                <span>
                                    Ksh {formatCurrency(parseFloat(String(order.total_amount)))}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CreditCard className="h-4 w-4" />
                                Payment Method
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Method</span>
                                <span className="font-medium text-foreground">
                                    {(order as any).payment_method_title ||
                                     (order as any).shipping_address?.payment_method_title ||
                                     ((order as any).payment_method === 'mpesa' || (order as any).shipping_address?.payment_method === 'mpesa' ? 'M-Pesa Express' : 'Cash on Delivery')}
                                </span>
                            </div>
                            {(order as any).date_paid && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Paid on</span>
                                    <span className="text-foreground">
                                        {new Date((order as any).date_paid).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    {/* Shipment Tracking */}
                    {trackingData?.tracking_number ? (
                        <ShipmentTracking
                            trackingNumber={trackingData.tracking_number}
                            carrier="FedEx"
                            status={trackingData.status || 'in_transit'}
                            estimatedDelivery={trackingData.estimated_delivery}
                            events={trackingData.history || []}
                        />
                    ) : (order as any).tracking_number ? (
                        <ShipmentTracking
                            trackingNumber={(order as any).tracking_number}
                            carrier="FedEx"
                            status={(order.status as string) === 'completed' ? 'delivered' : 'in_transit'}
                            estimatedDelivery={(order as any).estimated_delivery}
                            events={[]}
                        />
                    ) : (
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Truck className="h-5 w-5" />
                                    <p className="text-sm">Tracking information will be available once the order is shipped.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

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
                                {order.status !== 'pending' && (
                                    <TimelineItem
                                        label="Payment Received"
                                        date={order.updated_at}
                                        completed
                                    />
                                )}
                                {order.status === 'processing' && (
                                    <TimelineItem
                                        label="Processing"
                                        date={order.updated_at}
                                        completed
                                    />
                                )}
                                {(order.status === 'delivered' || (order.status as string) === 'completed') && (
                                    <TimelineItem
                                        label="Completed"
                                        date={order.updated_at}
                                        completed
                                    />
                                )}
                            </div>
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
                className={`mt-1 h-2 w-2 rounded-full ${
                    completed ? 'bg-green-500' : 'bg-muted'
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
