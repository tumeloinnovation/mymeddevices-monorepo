'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils/utils';
import { SEED_ORDERS } from '@/lib/data/seed/orders';
import type { Order } from '@/lib/data/types';
import ShipmentTracking from '@/app/(shop)/_components/ShipmentTracking';
import {
    Package,
    Truck,
    FileText,
    Home,
    CreditCard,
    Calendar
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo } from 'react';

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

export default function PublicOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const order = useMemo(() => {
        const found = SEED_ORDERS.find(o => o.id.toString() === orderId || o.number === orderId);
        if (found) return found;

        // Dynamic fallback mock order for demo checkout success
        return {
            id: Number(orderId) || 719001,
            number: orderId.startsWith('ORD-') ? orderId : `ORD-2026-${orderId}`,
            status: 'processing',
            currency: 'KES',
            date_created: new Date().toISOString(),
            date_modified: new Date().toISOString(),
            total: '12500',
            subtotal: '12000',
            discount_total: '0',
            shipping_total: '500',
            total_tax: '0',
            customer_id: 1,
            customer_note: '',
            billing: {
                first_name: 'John',
                last_name: 'Doe',
                company: 'Medi Devices',
                address_1: '123 Ngong Road',
                address_2: 'Suite 1A',
                city: 'Nairobi',
                state: 'Nairobi',
                postcode: '00100',
                country: 'Kenya',
                email: 'john.doe@example.com',
                phone: '+254712345678',
            },
            shipping: {
                first_name: 'John',
                last_name: 'Doe',
                company: 'Medi Devices',
                address_1: '123 Ngong Road',
                address_2: 'Suite 1A',
                city: 'Nairobi',
                state: 'Nairobi',
                postcode: '00100',
                country: 'Kenya',
                email: 'john.doe@example.com',
                phone: '+254712345678',
            },
            payment_method: 'cod',
            payment_method_title: 'Cash on Delivery',
            line_items: [
                {
                    id: 1,
                    name: 'Omron M2 Basic Blood Pressure Monitor',
                    product_id: 1,
                    variation_id: 0,
                    quantity: 1,
                    subtotal: '12000',
                    subtotal_tax: '0',
                    total: '12000',
                    total_tax: '0',
                    price: 12000,
                    sku: 'OMR-M2-001',
                    image: { id: 'img-1', src: '/logos/logo-portrait.png' }
                }
            ],
            shipping_lines: [
                {
                    id: 1,
                    method_title: 'Flat Rate',
                    method_id: 'flat_rate',
                    total: '500',
                    total_tax: '0',
                },
            ],
            fee_lines: [],
            meta_data: [],
            date_paid: null,
            date_completed: null,
        } as unknown as Order;
    }, [orderId]);

    if (!order) {
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
                                The order you're looking for doesn't exist
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
                        {(order.status === 'processing' || order.status === 'completed') && (
                            <ShipmentTracking
                                trackingNumber="1Z999AA10123456784"
                                carrier="FedEx"
                                status={order.status === 'completed' ? 'delivered' : 'in_transit'}
                                estimatedDelivery={
                                    new Date(
                                        new Date(order.date_created).getTime() + 5 * 24 * 60 * 60 * 1000
                                    ).toISOString()
                                }
                                events={[
                                    {
                                        status: 'picked_up',
                                        timestamp: new Date(
                                            new Date(order.date_created).getTime() + 24 * 60 * 60 * 1000
                                        ).toISOString(),
                                        location: 'Nairobi, KE',
                                    },
                                    {
                                        status: 'in_transit',
                                        timestamp: new Date(
                                            new Date(order.date_created).getTime() +
                                            2 * 24 * 60 * 60 * 1000
                                        ).toISOString(),
                                        location: 'Mombasa, KE',
                                    },
                                    ...(order.status === 'completed'
                                        ? [{
                                            status: 'delivered',
                                            timestamp: new Date(
                                                new Date(order.date_created).getTime() +
                                                4 * 24 * 60 * 60 * 1000
                                            ).toISOString(),
                                            location: 'Nairobi, KE',
                                        }]
                                        : []),
                                ]}
                            />
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
