'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils/utils';
import { useCustomerOrder, useOrderTracking } from '@/hooks/useDashboard';
import ShipmentTracking from '@/app/(shop)/_components/ShipmentTracking';
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
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
    processing: { label: 'Processing', className: 'bg-blue-100 text-blue-700' },
    'on-hold': { label: 'On Hold', className: 'bg-orange-100 text-orange-700' },
    completed: { label: 'Completed', className: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
    refunded: { label: 'Refunded', className: 'bg-purple-100 text-purple-700' },
    failed: { label: 'Failed', className: 'bg-red-100 text-red-700' },
    trash: { label: 'Trash', className: 'bg-gray-100 text-gray-700' },
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
                            Order #{order.number}
                        </h1>
                        <p className="text-muted-foreground">
                            Placed on{' '}
                            {new Date(order.date_created).toLocaleDateString('en-US', {
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
                                Order Items ({order.line_items.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y">
                                {order.line_items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-4 py-4 first:pt-0 last:pb-0"
                                    >
                                        <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted shrink-0">
                                            {item.image?.src ? (
                                                <Image
                                                    src={item.image.src}
                                                    alt={item.name}
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
                                                {item.name}
                                            </h4>
                                            {item.sku && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    SKU: {item.sku}
                                                </p>
                                            )}
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Qty: {item.quantity} × Ksh {formatCurrency(Number(item.price))}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-foreground">
                                                Ksh {formatCurrency(parseFloat(item.total))}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Addresses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Billing Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FileText className="h-4 w-4" />
                                    Billing Address
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm space-y-1">
                                    <p className="font-medium">
                                        {order.billing.first_name} {order.billing.last_name}
                                    </p>
                                    {order.billing.company && (
                                        <p className="text-muted-foreground">{order.billing.company}</p>
                                    )}
                                    <p className="text-muted-foreground">{order.billing.address_1}</p>
                                    {order.billing.address_2 && (
                                        <p className="text-muted-foreground">{order.billing.address_2}</p>
                                    )}
                                    <p className="text-muted-foreground">
                                        {order.billing.city}, {order.billing.state} {order.billing.postcode}
                                    </p>
                                    <p className="text-muted-foreground">{order.billing.country}</p>
                                    <Separator className="my-2" />
                                    <p className="text-muted-foreground">{order.billing.email}</p>
                                    <p className="text-muted-foreground">{order.billing.phone}</p>
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
                                <div className="text-sm space-y-1">
                                    <p className="font-medium">
                                        {order.shipping.first_name} {order.shipping.last_name}
                                    </p>
                                    {order.shipping.company && (
                                        <p className="text-muted-foreground">{order.shipping.company}</p>
                                    )}
                                    <p className="text-muted-foreground">{order.shipping.address_1}</p>
                                    {order.shipping.address_2 && (
                                        <p className="text-muted-foreground">{order.shipping.address_2}</p>
                                    )}
                                    <p className="text-muted-foreground">
                                        {order.shipping.city}, {order.shipping.state} {order.shipping.postcode}
                                    </p>
                                    <p className="text-muted-foreground">{order.shipping.country}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
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
                                        order.line_items.reduce(
                                            (sum, item) => sum + parseFloat(item.subtotal),
                                            0
                                        )
                                    )}
                                </span>
                            </div>
                            {parseFloat(order.discount_total) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Discount</span>
                                    <span className="text-green-600">
                                        -Ksh {formatCurrency(parseFloat(order.discount_total))}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Shipping</span>
                                <span>
                                    {parseFloat(order.shipping_total) > 0
                                        ? `Ksh ${formatCurrency(parseFloat(order.shipping_total))}`
                                        : 'Free'}
                                </span>
                            </div>
                            {order.fee_lines?.map((fee: { id: number; name: string; total: string }) => (
                                <div key={fee.id} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{fee.name}</span>
                                    <span>Ksh {formatCurrency(parseFloat(fee.total))}</span>
                                </div>
                            ))}
                            {parseFloat(order.total_tax) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span>Ksh {formatCurrency(parseFloat(order.total_tax))}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between font-semibold">
                                <span>Total</span>
                                <span className="text-primary">
                                    Ksh {formatCurrency(parseFloat(order.total))}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <CreditCard className="h-4 w-4" />
                                Payment
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Method</span>
                                <span>{order.payment_method_title || 'N/A'}</span>
                            </div>
                            {order.date_paid && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Paid on</span>
                                    <span>
                                        {new Date(order.date_paid).toLocaleDateString('en-US', {
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
                    ) : order.tracking_number ? (
                        <ShipmentTracking
                            trackingNumber={order.tracking_number}
                            carrier="FedEx"
                            status={order.status === 'completed' ? 'delivered' : 'in_transit'}
                            estimatedDelivery={order.estimated_delivery}
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
                                    date={order.date_created}
                                    completed
                                />
                                {order.date_paid && (
                                    <TimelineItem
                                        label="Payment Received"
                                        date={order.date_paid}
                                        completed
                                    />
                                )}
                                {order.status === 'processing' && (
                                    <TimelineItem
                                        label="Processing"
                                        date={order.date_modified}
                                        completed
                                    />
                                )}
                                {order.date_completed && (
                                    <TimelineItem
                                        label="Completed"
                                        date={order.date_completed}
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
