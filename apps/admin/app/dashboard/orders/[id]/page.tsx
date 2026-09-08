"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Package,
  User,
  MapPin,
  CreditCard,
  FileText,
  Loader2,
  Calendar,
  Edit3,
  Save,
  RefreshCw,
  Store,
  Copy,
  Check,
  Printer,
  Phone,
  Mail,
  ShieldCheck,
  Navigation,
  Info,
  DollarSign,
  History,
  AlertCircle,
} from "lucide-react";
import { shoppingService, useAuthStore } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import AdminMap from "@/components/admin-map";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: {
    label: "Pending Payment / Confirmation",
    icon: <Clock className="h-4 w-4" />,
    color: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    badgeVariant: "outline",
  },
  paid: {
    label: "Payment Verified",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    badgeVariant: "outline",
  },
  processing: {
    label: "Processing & Packaging",
    icon: <Package className="h-4 w-4" />,
    color: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    badgeVariant: "outline",
  },
  shipped: {
    label: "Dispatched / In Transit",
    icon: <Truck className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    badgeVariant: "outline",
  },
  delivered: {
    label: "Delivered & Completed",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    badgeVariant: "outline",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    badgeVariant: "destructive",
  },
  refunded: {
    label: "Refunded",
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-900 dark:text-neutral-300 dark:border-neutral-700",
    badgeVariant: "outline",
  },
};

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await shoppingService.adminGetOrderDetails(id as string);
      const orderData = (response as any)?.data ?? response;
      setOrder(orderData);
      setInternalNotes(orderData?.internal_notes || "");
    } catch (error) {
      console.error("Failed to load order:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    setActionLoading(true);
    try {
      await shoppingService.adminUpdateOrderStatus(id as string, newStatus);
      toast.success(`Order status successfully updated to ${newStatus.toUpperCase()}`);
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await shoppingService.updateOrderInternalNotes(id as string, internalNotes);
      toast.success("Internal admin notes saved & logged");
      setIsEditingNotes(false);
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update internal notes");
    } finally {
      setSavingNotes(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 p-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <Skeleton className="h-72 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <div className="flex flex-col gap-6">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center flex flex-col items-center justify-center min-h-[50vh]">
          <Package className="h-14 w-14 text-muted-foreground mb-4 opacity-40" />
          <h2 className="text-xl font-bold text-foreground">Order Not Found</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            The requested order ID &quot;{id}&quot; does not exist or you may not have administrative permissions to view it.
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard/orders">Return to Orders Directory</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const items = order.items || order.order_items || [];
  const statusMeta = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const address = order.shipping_address || {};
  const timelineEvents = order.timeline_events || [];

  // Financial calculations with safe defaults
  const subtotal = order.subtotal ?? address.subtotal ?? (items.reduce((sum: number, it: any) => sum + Number(it.subtotal || (it.unit_price * it.quantity) || 0), 0));
  const shippingFee = order.shipping_amount ?? order.shipping_fee ?? address.shipping_amount ?? 0;
  const packagingFee = order.packaging_fee ?? address.packaging_fee ?? 100;
  const servicesFee = order.services_fee ?? address.services_fee ?? 50;
  const discountAmount = order.discount_amount ?? address.discount_amount ?? order.loyalty_discount ?? 0;
  const taxAmount = order.tax_amount ?? address.tax_amount ?? Math.round(Math.max(0, subtotal - discountAmount) * 0.16);
  const totalAmount = order.total_amount ?? (subtotal + shippingFee + packagingFee + servicesFee + taxAmount - discountAmount);

  // Map markers: if route coordinates exist, render warehouse origin and destination
  const mapMarkers = [];
  if (address?.route_coordinates && Array.isArray(address.route_coordinates) && address.route_coordinates.length > 1) {
    mapMarkers.push({
      lat: Number(address.route_coordinates[0][0]),
      lng: Number(address.route_coordinates[0][1]),
      label: "MyMedDevices Nairobi Central Fulfillment Hub",
    });
    mapMarkers.push({
      lat: Number(address.route_coordinates[address.route_coordinates.length - 1][0]),
      lng: Number(address.route_coordinates[address.route_coordinates.length - 1][1]),
      label: `Delivery to: ${address.full_name || "Customer Destination"}`,
    });
  } else if (address?.latitude && address?.longitude) {
    mapMarkers.push({
      lat: Number(address.latitude),
      lng: Number(address.longitude),
      label: address.full_name || "Customer Delivery Location",
    });
  }

  const customerName =
    order.user ? `${order.user.first_name || ""} ${order.user.last_name || ""}`.trim() || order.user.email : address.full_name || "Guest Customer";
  const customerEmail = order.user?.email || order.customer_email || "N/A";
  const customerPhone =
    order.user?.phone ||
    order.user?.phone_number ||
    address?.phone ||
    address?.phone_number ||
    order.customer_phone ||
    "N/A";

  const paymentMethodTitle =
    order.payment_method_title ||
    address?.payment_method_title ||
    (order.payment_method === "mpesa" ? "M-Pesa STK Express" : "Cash on Delivery (COD)");

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header Navigation & Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div className="flex flex-col gap-1.5">
            <Button variant="ghost" size="sm" asChild className="w-fit -ml-2 gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Link href="/dashboard/orders">
                <ArrowLeft className="h-4 w-4" /> Back to Orders
              </Link>
            </Button>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Order #{order.order_number || String(order.id).substring(0, 8).toUpperCase()}
              </h1>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusMeta.color}`}>
                {statusMeta.icon}
                <span>{statusMeta.label}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Placed:{" "}
                {order.created_at
                  ? new Date(order.created_at).toLocaleString("en-KE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "N/A"}
              </span>
              <span>•</span>
              <div className="flex items-center gap-1 font-mono text-[11px] bg-muted/60 px-2 py-0.5 rounded border">
                <span>UUID: {order.id}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(order.id)}
                  title="Copy Order UUID"
                  className="hover:text-primary transition-colors ml-1"
                >
                  {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="gap-1.5 text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Invoice
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrder}
              disabled={loading}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Column: Items, Pricing, Delivery Map */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Order Items Table Card */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    Medical Devices & Line Items ({items.length})
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">Certified Healthcare Catalog</span>
                </div>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {items.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">No item records attached to this order.</div>
                ) : (
                  items.map((item: any, idx: number) => {
                    const itemUnitPrice = Number(item.unit_price || item.price || 0);
                    const itemQty = Number(item.quantity || 1);
                    const itemSubtotal = Number(item.subtotal || item.total_price || itemUnitPrice * itemQty);
                    const itemSku = item.sku || item.product?.sku || "N/A";
                    const vendorName = item.vendor_name || item.vendor?.store_name || "Verified Medical Vendor";

                    return (
                      <div key={item.id || idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className="h-14 w-14 rounded-lg border bg-muted/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {item.product?.image_url || item.image_url ? (
                              <img
                                src={item.product?.image_url || item.image_url}
                                alt={item.product_name || "Medical Item"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-7 w-7 text-muted-foreground/50" />
                            )}
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="font-semibold text-sm text-foreground">
                              {item.product_name || item.product?.name || "Medical Product"}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                              <span className="font-mono text-[11px] bg-muted/70 px-1.5 py-0.5 rounded border">
                                SKU: {itemSku}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-primary font-medium">
                                <Store className="h-3 w-3" />
                                {vendorName}
                              </span>
                              <span>•</span>
                              <span>Qty: {itemQty}</span>
                              <span>•</span>
                              <span>Unit: KSh {itemUnitPrice.toLocaleString()}</span>
                            </div>
                            {item.tax_category_code && (
                              <div className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                {item.tax_category_code} ({Number(item.tax_rate_snapshot || 0.16) * 100}% VAT applied)
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex sm:flex-col items-baseline sm:items-end justify-between border-t sm:border-0 pt-2 sm:pt-0">
                          <span className="text-xs text-muted-foreground sm:hidden">Item Total:</span>
                          <div className="font-bold text-sm text-foreground">
                            KSh {itemSubtotal.toLocaleString()}
                          </div>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-semibold py-0.5 px-2 mt-1">
                            {item.fulfillment_status || "Pending"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Pricing & Financial Breakdown */}
                <div className="p-5 bg-muted/20 border-t flex flex-col gap-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Products Subtotal</span>
                    <span className="font-medium text-foreground">KSh {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Standard Tax / VAT (16%)</span>
                    <span className="font-medium text-foreground">KSh {taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Cold-Chain & Standard Delivery</span>
                    <span className="font-medium text-foreground">KSh {shippingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Medical Packaging & Protection</span>
                    <span className="font-medium text-foreground">KSh {packagingFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Healthcare Logistics & Handling</span>
                    <span className="font-medium text-foreground">KSh {servicesFee.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                      <span>Promotional / Loyalty Discount</span>
                      <span>- KSh {discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-baseline font-bold text-base text-foreground">
                    <span>Total Payable Amount</span>
                    <span className="text-primary text-lg">
                      KSh {Number(totalAmount).toLocaleString()}{" "}
                      <span className="text-xs font-normal text-muted-foreground">({order.currency || "KES"})</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Logistics & Interactive Routing Map */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Delivery Logistics & Geographical Routing
                  </CardTitle>
                  {address?.calculated_distance_km && (
                    <Badge variant="secondary" className="text-xs gap-1 font-medium">
                      <Navigation className="h-3 w-3" /> {address.calculated_distance_km} km dispatch radius
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-3.5 rounded-lg border bg-muted/30 text-xs flex flex-col gap-1.5">
                    <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                      Recipient Information
                    </div>
                    <div className="font-medium text-foreground">{customerName}</div>
                    <div className="text-muted-foreground">{address.street || address.street_address || address.address_line1 || "Street address not specified"}</div>
                    <div className="text-muted-foreground">
                      {address.city || "Nairobi"}, {address.state || address.county || "Nairobi County"} {address.postal_code || ""}
                    </div>
                    <div className="text-muted-foreground">{address.country || "Kenya"}</div>
                    {customerPhone !== "N/A" && (
                      <div className="pt-1 flex items-center gap-1.5 text-foreground font-medium">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <a href={`tel:${customerPhone}`} className="hover:underline text-primary">
                          {customerPhone}
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 rounded-lg border bg-muted/30 text-xs flex flex-col gap-1.5">
                    <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-primary" />
                      Dispatch & Logistics Protocol
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground pt-0.5">
                      <span>Carrier Model:</span>
                      <span className="font-medium text-foreground uppercase tracking-wide">
                        {address.logistics_type === "company_rider"
                          ? "Company Dispatch Fleet"
                          : address.logistics_type || "Standard Courier"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Distance from Hub:</span>
                      <span className="font-medium text-foreground">
                        {address.calculated_distance_km ? `${address.calculated_distance_km} km` : "Calculated at dispatch"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Assigned Driver ID:</span>
                      <span className="font-medium text-foreground">
                        {address.assigned_driver_id || "Unassigned (Awaiting dispatch)"}
                      </span>
                    </div>
                    {order.notes && (
                      <div className="pt-2 mt-1 border-t border-border/50">
                        <span className="font-semibold text-foreground">Customer Delivery Notes:</span>
                        <p className="text-muted-foreground italic mt-0.5 bg-background/50 p-1.5 rounded border">
                          &quot;{order.notes}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Leaflet OpenStreetMap Routing Display */}
                {mapMarkers.length > 0 ? (
                  <div className="rounded-lg overflow-hidden border">
                    <AdminMap
                      markers={mapMarkers}
                      routeCoordinates={address.route_coordinates || undefined}
                      height="240px"
                    />
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic p-4 bg-muted/20 rounded border text-center">
                    Geographical map coordinates not recorded for this delivery address.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audit Trail & Order Timeline Log */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    Audit Trail & Lifecycle Event Log ({timelineEvents.length})
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">Immutable System Logs</span>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                {timelineEvents.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic text-center py-4">
                    No timeline events recorded yet.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-primary/20 ml-3 flex flex-col gap-6 my-2">
                    {timelineEvents.map((evt: any, idx: number) => {
                      const evtStatus = evt.status || "update";
                      const evtColor =
                        STATUS_CONFIG[evtStatus]?.color ||
                        "bg-primary/10 text-primary border-primary/20";

                      return (
                        <div key={evt.id || idx} className="relative pl-6">
                          {/* Timeline bullet */}
                          <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          </div>

                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className={`text-[10px] uppercase font-bold py-0.5 px-2 ${evtColor}`}>
                                {evtStatus}
                              </Badge>
                              <span className="text-xs font-semibold text-foreground">
                                {evt.message}
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                              <span>
                                {evt.created_at
                                  ? new Date(evt.created_at).toLocaleString("en-KE", {
                                      dateStyle: "medium",
                                      timeStyle: "medium",
                                    })
                                  : "N/A"}
                              </span>
                              {evt.created_by && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-[10px]">Actor: {evt.created_by}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column: Status Actions, Payment, Customer, Internal Notes */}
          <div className="flex flex-col gap-6">
            {/* Order Status & State Machine Transitions */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Order Status Management
                  </CardTitle>
                  {actionLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <CardDescription className="text-xs">
                  Transition order stage with strict healthcare compliance validation
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 flex flex-col gap-4">
                {/* Active Status Badge banner */}
                <div className={`p-3 rounded-lg border flex items-center justify-between ${statusMeta.color}`}>
                  <div className="flex items-center gap-2">
                    {statusMeta.icon}
                    <span className="font-bold text-xs uppercase tracking-wider">{statusMeta.label}</span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase bg-background/50 px-2 py-0.5 rounded">
                    Current State
                  </span>
                </div>

                {/* State Machine Transition Buttons */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    Fulfillment Pipeline Stages
                  </div>
                  {(() => {
                    const steps = [
                      { key: "pending", label: "Pending Payment", icon: Clock },
                      { key: "paid", label: "Confirm Paid", icon: CheckCircle2 },
                      { key: "processing", label: "Start Processing", icon: Package },
                      { key: "shipped", label: "Dispatch / Ship", icon: Truck },
                      { key: "delivered", label: "Mark Delivered", icon: CheckCircle2 },
                    ];
                    const stepKeys = ["pending", "paid", "processing", "shipped", "delivered"];
                    const currentIdx = stepKeys.indexOf(order.status);
                    const isTerminal =
                      order.status === "delivered" ||
                      order.status === "cancelled" ||
                      order.status === "refunded";

                    return steps.map((step, idx) => {
                      const StepIcon = step.icon;
                      const isCurrent = order.status === step.key;
                      const isPassed = currentIdx !== -1 && idx < currentIdx;
                      const isNext = currentIdx !== -1 && idx === currentIdx + 1;
                      const isDisabled = actionLoading || isCurrent || isPassed || isTerminal;

                      return (
                        <button
                          key={step.key}
                          type="button"
                          onClick={() => handleStatusUpdate(step.key)}
                          disabled={isDisabled}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                            isCurrent
                              ? "bg-primary text-primary-foreground font-bold shadow-xs"
                              : isPassed
                              ? "bg-muted/40 text-muted-foreground/60 cursor-not-allowed border border-transparent"
                              : isNext
                              ? "bg-background hover:bg-muted/60 text-foreground border border-primary/40 shadow-xs ring-1 ring-primary/20"
                              : "bg-muted/30 text-muted-foreground/60 border border-transparent cursor-not-allowed"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <StepIcon className="h-4 w-4" />
                            {step.label}
                          </span>
                          {isCurrent ? (
                            <span className="text-[10px] bg-primary-foreground/20 px-2 py-0.5 rounded font-bold uppercase">
                              Active
                            </span>
                          ) : isPassed ? (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Done
                            </span>
                          ) : isNext ? (
                            <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                              Next Step
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50">Upcoming</span>
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>

                {/* Exception Handling Actions */}
                <div className="pt-3 border-t flex flex-col gap-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                    Administrative Exception Actions
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={order.status === "cancelled" ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => handleStatusUpdate("cancelled")}
                      disabled={
                        actionLoading ||
                        order.status === "cancelled" ||
                        order.status === "delivered" ||
                        order.status === "refunded"
                      }
                      className="text-xs justify-start h-9 gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {order.status === "cancelled" ? "Cancelled" : "Cancel Order"}
                    </Button>
                    <Button
                      variant={order.status === "refunded" ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleStatusUpdate("refunded")}
                      disabled={actionLoading || order.status === "refunded"}
                      className="text-xs justify-start h-9 gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-200 dark:border-amber-900"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {order.status === "refunded" ? "Refunded" : "Refund Order"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment & Settlement Details */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Payment & Transaction Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 text-xs flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-semibold text-foreground">{paymentMethodTitle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Settlement Status:</span>
                  <Badge variant="outline" className="font-semibold text-[11px]">
                    {order.status === "paid" || order.status === "delivered"
                      ? "Settled / Confirmed"
                      : "Pending Collection"}
                  </Badge>
                </div>
                {order.mobile_money_payment && (
                  <div className="p-3 rounded-lg border bg-muted/30 flex flex-col gap-1.5 mt-1">
                    <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                      M-Pesa STK Push Record
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Receipt Code:</span>
                      <span className="font-mono text-foreground font-semibold">
                        {order.mobile_money_payment.transaction_id || "Awaiting callback"}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Phone Number:</span>
                      <span className="font-mono text-foreground">
                        {order.mobile_money_payment.phone_number || customerPhone}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Transacted Amount:</span>
                      <span className="font-semibold text-foreground">
                        KSh {Number(order.mobile_money_payment.amount || totalAmount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Account Information */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Customer Profile & Account
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 text-xs flex flex-col gap-3">
                <div>
                  <div className="text-muted-foreground text-[11px]">Customer Name</div>
                  <div className="font-semibold text-sm text-foreground">{customerName}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px]">Email Address</div>
                  <div className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <a href={`mailto:${customerEmail}`} className="hover:underline text-primary">
                      {customerEmail}
                    </a>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[11px]">Phone Number</div>
                  <div className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {customerPhone !== "N/A" ? (
                      <a href={`tel:${customerPhone}`} className="hover:underline text-primary font-mono">
                        {customerPhone}
                      </a>
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t flex justify-between items-center text-[11px] text-muted-foreground">
                  <span>Account Type:</span>
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                    {order.user?.role ? `${order.user.role} user` : order.user_id ? "Registered Customer" : "Guest Checkout"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Internal Admin Notes Card */}
            <Card className="border shadow-xs">
              <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Internal Admin Notes
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Confidential remarks & audit notes
                  </CardDescription>
                </div>
                {!isEditingNotes && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={() => setIsEditingNotes(true)}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-5 flex flex-col gap-3">
                {isEditingNotes ? (
                  <div className="flex flex-col gap-2.5">
                    <Textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Add confidential medical compliance notes, verification logs, or customer support remarks..."
                      className="text-xs min-h-[110px]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingNotes(false)}
                        disabled={savingNotes}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                        className="gap-1.5 text-xs"
                      >
                        {savingNotes ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Save & Log Notes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground bg-muted/30 p-3.5 rounded-lg min-h-[70px] whitespace-pre-wrap border border-dashed">
                    {order.internal_notes || "No internal admin notes recorded yet. Click 'Edit' to add notes."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
