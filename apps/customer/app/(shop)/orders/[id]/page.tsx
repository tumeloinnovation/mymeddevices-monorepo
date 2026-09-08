'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils/utils';
import { orderService, type Order } from '@/lib/services/order-service';
import { PACKAGING_FEE, SERVICES_FEE } from '@/lib/config/fees';
import {
    Package,
    Truck,
    FileText,
    Home,
    Calendar,
    MapPin,
    Receipt,
    Info,
    CheckCircle2,
    Clock,
    Printer,
    PhoneCall,
    MessageCircle,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    CreditCard,
    AlertCircle,
    ListOrdered,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getValidImageUrl } from '@/lib/utils/image';
import { motion } from 'framer-motion';

const statusConfig: Record<
    string,
    { label: string; badgeClass: string; stepIndex: number; icon: any; description: string }
> = {
    pending: {
        label: 'Order Placed',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 dark:border-amber-800',
        stepIndex: 0,
        icon: Clock,
        description: 'Your order has been received and is awaiting payment confirmation.',
    },
    paid: {
        label: 'Payment Confirmed',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        stepIndex: 1,
        icon: CheckCircle2,
        description: 'Payment verified successfully. We are preparing your medical devices.',
    },
    processing: {
        label: 'Processing & Packing',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300 dark:border-blue-800',
        stepIndex: 2,
        icon: Package,
        description: 'Your items are being quality checked, sanitized, and packed securely.',
    },
    shipped: {
        label: 'Dispatched / In Transit',
        badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-300 dark:border-purple-800',
        stepIndex: 3,
        icon: Truck,
        description: 'Your package is on its way to your specified delivery address.',
    },
    delivered: {
        label: 'Delivered',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
        stepIndex: 4,
        icon: CheckCircle2,
        description: 'Package delivered. Thank you for choosing MyMedDevices Kenya.',
    },
    cancelled: {
        label: 'Cancelled',
        badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 dark:border-rose-800',
        stepIndex: -1,
        icon: AlertCircle,
        description: 'This order has been cancelled.',
    },
    refunded: {
        label: 'Refunded',
        badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
        stepIndex: -1,
        icon: Receipt,
        description: 'This order has been refunded to your original payment method.',
    },
};

const TRACKING_STEPS = [
    { key: 'placed', label: 'Order Placed', icon: Clock },
    { key: 'paid', label: 'Payment Confirmed', icon: CreditCard },
    { key: 'processing', label: 'Processing', icon: Package },
    { key: 'shipped', label: 'In Transit', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

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
                let localGuestToken = typeof window !== 'undefined'
                    ? (localStorage.getItem('guest_token') || localStorage.getItem('guest_cart_token'))
                    : null;

                if (!localGuestToken && typeof window !== 'undefined') {
                    try {
                        const cartStorage = localStorage.getItem('cart-storage');
                        if (cartStorage) {
                            const parsed = JSON.parse(cartStorage);
                            localGuestToken = parsed?.state?.cartToken || null;
                        }
                    } catch (_) {}
                }

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

    const handlePrint = () => {
        if (typeof window !== 'undefined') {
            window.print();
        }
    };

    if (loading) {
        return <OrderDetailSkeleton />;
    }

    if (error || !order) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="space-y-6">
                    <Button variant="ghost" onClick={() => router.push('/')} className="gap-2">
                        <Home className="h-4 w-4" />
                        Back to Home
                    </Button>
                    <Card className="border border-border/70 shadow-sm">
                        <CardContent className="p-12 text-center">
                            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h2 className="text-xl font-bold mb-2 text-foreground">Order Not Found</h2>
                            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                                {error || 'We could not find the order you are looking for. Please verify your order link or contact customer support.'}
                            </p>
                            <Button asChild className="rounded-xl">
                                <Link href="/products">Continue Shopping</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    const currentStatusConfig = statusConfig[order.status] || statusConfig.pending;
    const isCancelledOrRefunded = order.status === 'cancelled' || order.status === 'refunded';

    const subtotal = Number(
        order.subtotal ??
        (order as any).shipping_address?.subtotal ??
        order.items?.reduce((sum, item) => sum + Number(item.total_price), 0) ??
        0
    );

    const discountAmount = Number(
        order.discount_amount ??
        (order as any).shipping_address?.discount_amount ??
        0
    );

    const packagingFee = Number(
        order.packaging_fee ??
        (order as any).shipping_address?.packaging_fee ??
        PACKAGING_FEE
    );

    const servicesFee = Number(
        order.services_fee ??
        (order as any).shipping_address?.services_fee ??
        SERVICES_FEE
    );

    const taxAmount = Number(
        order.tax_amount ??
        (order as any).shipping_address?.tax_amount ??
        Math.round(Math.max(0, subtotal - discountAmount) * 0.16)
    );

    const shippingFee = Number(
        order.shipping_amount ??
        (order as any).shipping_address?.shipping_amount ??
        Math.max(0, order.total_amount - subtotal + discountAmount - taxAmount - packagingFee - servicesFee)
    );

    const paymentTitle =
        (order as any).payment_method_title ||
        (order.shipping_address as any)?.payment_method_title ||
        ((order as any).payment_method === 'mpesa' || (order.shipping_address as any)?.payment_method === 'mpesa'
            ? 'Lipa na M-Pesa'
            : 'Cash on Delivery');

    return (
        <div className="min-h-screen py-8 sm:py-12 bg-muted/15">
            <div className="container mx-auto px-4 max-w-6xl space-y-8">
                {/* --- HERO BANNER / ORDER HEADER --- */}
                <Card className="border border-border/80 shadow-xs overflow-hidden rounded-2xl bg-card">
                    <div className="p-6 sm:p-8 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border-b border-border/60">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-primary/15 text-primary">
                                        <Package className="h-5 w-5" />
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                                        Order #{order.order_number || order.id.split('-')[0]}
                                    </h1>
                                </div>
                                <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span>Placed on</span>
                                    <span className="font-medium text-foreground">
                                        {new Date(order.created_at).toLocaleDateString('en-KE', {
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                    <span>•</span>
                                    <span>Currency: <strong>{order.currency || 'KES'}</strong></span>
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5">
                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="gap-1.5 text-xs font-semibold rounded-xl border-border bg-card shadow-xs hover:bg-muted"
                                >
                                    <Link href="/dashboard/orders">
                                        <ListOrdered className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>My Orders</span>
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrint}
                                    className="gap-2 text-xs font-semibold rounded-xl border-border bg-card shadow-xs hover:bg-muted"
                                >
                                    <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>Print Receipt</span>
                                </Button>
                                <Button
                                    asChild
                                    variant="default"
                                    size="sm"
                                    className="gap-1.5 text-xs font-semibold rounded-xl shadow-xs"
                                >
                                    <Link href="/products">
                                        <span>Continue Shopping</span>
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                                <Badge
                                    variant="outline"
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border shadow-xs ${currentStatusConfig.badgeClass}`}
                                >
                                    <currentStatusConfig.icon className="h-3.5 w-3.5" />
                                    <span>{currentStatusConfig.label}</span>
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* --- HORIZONTAL STEP PROGRESS TRACKER --- */}
                    {!isCancelledOrRefunded && (
                        <div className="p-6 sm:p-8 border-b border-border/60 bg-muted/10">
                            <div className="relative">
                                {/* Desktop Progress Bar */}
                                <div className="hidden sm:block absolute top-1/2 left-6 right-6 -translate-y-1/2 h-1 bg-border rounded-full z-0">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                                        style={{
                                            width: `${Math.min(100, Math.max(0, (currentStatusConfig.stepIndex / (TRACKING_STEPS.length - 1)) * 100))}%`,
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative z-10">
                                    {TRACKING_STEPS.map((step, index) => {
                                        const StepIcon = step.icon;
                                        const isCompleted = index <= currentStatusConfig.stepIndex;
                                        const isCurrent = index === currentStatusConfig.stepIndex;

                                        return (
                                            <div key={step.key} className="flex flex-col items-center text-center">
                                                <div
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                                                        isCurrent
                                                            ? 'bg-primary text-primary-foreground border-primary shadow-md ring-4 ring-primary/20 scale-110'
                                                            : isCompleted
                                                            ? 'bg-primary text-primary-foreground border-primary'
                                                            : 'bg-card text-muted-foreground border-border'
                                                    }`}
                                                >
                                                    <StepIcon className="h-4 w-4" />
                                                </div>
                                                <span
                                                    className={`mt-2.5 text-xs font-semibold ${
                                                        isCurrent
                                                            ? 'text-primary'
                                                            : isCompleted
                                                            ? 'text-foreground'
                                                            : 'text-muted-foreground'
                                                    }`}
                                                >
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status Hint */}
                    <div className="px-6 py-3 bg-muted/20 text-xs text-muted-foreground flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary shrink-0" />
                        <span>{currentStatusConfig.description}</span>
                    </div>
                </Card>

                {/* --- MAIN 2-COLUMN GRID --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* LEFT COLUMN: Items, Timeline, Notes */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* 1. Ordered Products Card */}
                        <Card className="border border-border/80 shadow-xs rounded-2xl overflow-hidden bg-card">
                            <CardHeader className="border-b border-border/60 py-4 px-6 bg-muted/10">
                                <CardTitle className="text-base font-bold flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-foreground">
                                        <Package className="h-4 w-4 text-primary" />
                                        <span>Ordered Medical Devices ({order.items?.length || 0})</span>
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 divide-y divide-border/60">
                                {order.items?.map((item) => {
                                    const itemImage = getValidImageUrl(
                                        item.product?.image_url,
                                        '/logos/logo-portrait.png'
                                    );
                                    const unitPrice = Number(item.unit_price);
                                    const totalPrice = Number(item.total_price);

                                    return (
                                        <div
                                            key={item.id}
                                            className="p-4 sm:p-5 flex items-start gap-4 hover:bg-muted/10 transition-colors"
                                        >
                                            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden bg-muted/30 shrink-0 border border-border p-1.5 flex items-center justify-center">
                                                <Image
                                                    src={itemImage}
                                                    alt={item.product_name || 'Medical Device'}
                                                    fill
                                                    className="object-contain p-1"
                                                    sizes="(max-width: 640px) 80px, 96px"
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm sm:text-base font-semibold text-foreground leading-snug line-clamp-2">
                                                    {item.product_name || 'Medical Product'}
                                                </h4>

                                                {item.product?.sku && (
                                                    <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                                                        SKU: {item.product.sku}
                                                    </p>
                                                )}

                                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground">
                                                        Qty: {item.quantity}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        @ Ksh {formatCurrency(unitPrice)} each
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <p className="text-sm sm:text-base font-bold text-primary">
                                                    Ksh {formatCurrency(totalPrice)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>

                        {/* 2. Order Notes (if provided) */}
                        {order.notes && (
                            <Card className="border border-border/80 shadow-xs rounded-2xl bg-card">
                                <CardHeader className="py-4 px-6 border-b border-border/60 bg-muted/10">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                                        <FileText className="h-4 w-4 text-primary" />
                                        <span>Delivery Instructions</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-5">
                                    <p className="text-xs sm:text-sm text-foreground/90 bg-muted/40 rounded-xl p-3.5 border border-border/60 leading-relaxed">
                                        {order.notes}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* 3. Authentic Medical Device Assurance Banner */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-emerald-500/5 to-transparent border border-primary/20 flex items-start gap-4">
                            <div className="p-2.5 rounded-xl bg-primary/20 text-primary shrink-0">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-foreground">100% Certified Medical Devices</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    All equipment supplied by MyMedDevices Kenya is KMPDB & PPB certified, tested for clinical accuracy, and backed by manufacturer warranty with doorstep replacement support.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Receipt Summary, Delivery Details & Support */}
                    <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
                        {/* 1. Receipt Summary Card */}
                        <Card className="border border-border/80 shadow-sm rounded-2xl overflow-hidden bg-card">
                            <CardHeader className="py-4 px-6 border-b border-border/60 bg-muted/10">
                                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                                    <Receipt className="h-4 w-4 text-primary" />
                                    <span>Payment & Order Summary</span>
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="p-6 space-y-3.5">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Items Subtotal</span>
                                    <span className="font-semibold text-foreground">Ksh {formatCurrency(subtotal)}</span>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Delivery & Shipping</span>
                                    <span className="font-medium text-foreground">Ksh {formatCurrency(shippingFee)}</span>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <span>Packaging & Handling</span>
                                        <span title="Careful medical device protection packaging" className="cursor-help">
                                            <Info className="h-3.5 w-3.5 opacity-60" />
                                        </span>
                                    </div>
                                    <span className="font-medium text-foreground">Ksh {formatCurrency(packagingFee)}</span>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <span>Platform Services Fee</span>
                                        <span title="Order processing and verification fee" className="cursor-help">
                                            <Info className="h-3.5 w-3.5 opacity-60" />
                                        </span>
                                    </div>
                                    <span className="font-medium text-foreground">Ksh {formatCurrency(servicesFee)}</span>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">VAT (16% inclusive)</span>
                                    <span className="font-medium text-foreground">Ksh {formatCurrency(taxAmount)}</span>
                                </div>

                                {discountAmount > 0 && (
                                    <div className="flex justify-between items-center text-sm text-emerald-600 dark:text-emerald-400 font-semibold pt-1 border-t border-dashed border-border/60">
                                        <span>Promotional Discount</span>
                                        <span>-Ksh {formatCurrency(discountAmount)}</span>
                                    </div>
                                )}

                                <Separator className="my-2" />

                                <div className="flex justify-between items-baseline pt-1">
                                    <div>
                                        <span className="text-base font-bold text-foreground">Total Amount</span>
                                        <p className="text-[11px] text-muted-foreground">All taxes & fees included</p>
                                    </div>
                                    <span className="text-xl sm:text-2xl font-extrabold text-primary">
                                        Ksh {formatCurrency(order.total_amount)}
                                    </span>
                                </div>

                                {/* Payment Method Badge */}
                                <div className="pt-2">
                                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/60">
                                        <CreditCard className="h-4 w-4 text-primary shrink-0" />
                                        <div className="text-xs">
                                            <p className="text-muted-foreground">Payment Method</p>
                                            <p className="font-semibold text-foreground">{paymentTitle}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Delivery Address Card */}
                        <Card className="border border-border/80 shadow-xs rounded-2xl bg-card">
                            <CardHeader className="py-4 px-6 border-b border-border/60 bg-muted/10">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                                    <MapPin className="h-4 w-4 text-primary" />
                                    <span>Delivery Address</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5">
                                {order.shipping_address ? (
                                    <div className="text-xs sm:text-sm space-y-1.5">
                                        <p className="font-bold text-foreground text-sm">
                                            {(order.shipping_address as any).full_name ||
                                                `${order.shipping_address.first_name || ''} ${order.shipping_address.last_name || ''}`.trim()}
                                        </p>
                                        <div className="text-muted-foreground space-y-0.5 leading-relaxed">
                                            {order.shipping_address.address_line1 && (
                                                <p>{order.shipping_address.address_line1}</p>
                                            )}
                                            {order.shipping_address.address_line2 && (
                                                <p>{order.shipping_address.address_line2}</p>
                                            )}
                                            {(order.shipping_address.city || order.shipping_address.state) && (
                                                <p>
                                                    {[
                                                        order.shipping_address.city,
                                                        order.shipping_address.state,
                                                        order.shipping_address.postal_code,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(', ')}
                                                </p>
                                            )}
                                            {order.shipping_address.country && (
                                                <p className="font-medium text-foreground">{order.shipping_address.country}</p>
                                            )}
                                            {order.shipping_address.phone && (
                                                <p className="font-mono text-primary font-medium pt-1">
                                                    📞 {order.shipping_address.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground">Standard door-to-door delivery</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* 3. Customer Care & Inquiries */}
                        <Card className="border border-border/80 shadow-xs rounded-2xl bg-card">
                            <CardHeader className="py-4 px-6 border-b border-border/60 bg-muted/10">
                                <CardTitle className="text-sm font-bold text-foreground">
                                    Need Help With This Order?
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Have a question about dispatch time, delivery reschedule, or device usage? Our local customer care team is ready to assist you.
                                </p>
                                <div className="grid grid-cols-2 gap-2.5 pt-1">
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="h-10 rounded-xl text-xs font-semibold gap-1.5 border-border bg-card hover:bg-muted"
                                    >
                                        <a href="tel:+254707757088">
                                            <PhoneCall className="h-3.5 w-3.5 text-primary" />
                                            <span>Call Support</span>
                                        </a>
                                    </Button>
                                    <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                        className="h-10 rounded-xl text-xs font-semibold gap-1.5 border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100"
                                    >
                                        <a
                                            href={`https://wa.me/254735239696?text=${encodeURIComponent(
                                                `Hello MyMedDevices, I have an inquiry about Order #${order.order_number || order.id}`
                                            )}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                                            <span>WhatsApp</span>
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Skeleton Loader
// ============================================================================

function OrderDetailSkeleton() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl space-y-8">
            <div className="h-6 w-48 bg-muted rounded-md animate-pulse" />
            <div className="h-36 w-full bg-muted/40 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-6">
                    <div className="h-80 w-full bg-muted/30 rounded-2xl animate-pulse" />
                    <div className="h-32 w-full bg-muted/30 rounded-2xl animate-pulse" />
                </div>
                <div className="lg:col-span-5 space-y-6">
                    <div className="h-64 w-full bg-muted/30 rounded-2xl animate-pulse" />
                    <div className="h-44 w-full bg-muted/30 rounded-2xl animate-pulse" />
                </div>
            </div>
        </div>
    );
}
