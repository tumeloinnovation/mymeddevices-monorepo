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
} from "lucide-react";
import {
  shoppingService,
  useAuthStore,
} from "@mymeddevices/shared-core";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: {
    label: "Pending",
    icon: <Clock className="h-4 w-4" />,
    color: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400",
  },
  paid: {
    label: "Paid",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400",
  },
  processing: {
    label: "Processing",
    icon: <Clock className="h-4 w-4" />,
    color: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400",
  },
  shipped: {
    label: "Shipped",
    icon: <Truck className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400",
  },
  delivered: {
    label: "Delivered",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400",
  },
  refunded: {
    label: "Refunded",
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400",
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
      router.push("/dashboard/orders");
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
      toast.success(`Order status updated to ${newStatus}`);
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
      toast.success("Internal notes updated");
      setIsEditingNotes(false);
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update internal notes");
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-64 md:col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h2 className="text-xl font-semibold">Order Not Found</h2>
          <p className="text-sm text-muted-foreground mt-1">The requested order could not be loaded.</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/orders">Return to Orders</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const items = order.items || order.order_items || [];
  const statusMeta = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const address = order.shipping_address;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2 gap-1 text-xs -ml-2">
              <Link href="/dashboard/orders">
                <ArrowLeft className="h-4 w-4" /> Back to Orders
              </Link>
            </Button>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                Order #{order.order_number || order.id?.substring(0, 8)}
              </h1>
              <Badge variant="outline" className={`gap-1.5 px-3 py-1 text-xs ${statusMeta.color}`}>
                {statusMeta.icon}
                {statusMeta.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Placed on{" "}
              {order.created_at
                ? new Date(order.created_at).toLocaleString("en-KE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "N/A"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchOrder} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items Card */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Order Items ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y p-0">
                {items.map((item: any, idx: number) => (
                  <div key={item.id || idx} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded border bg-muted/30 flex items-center justify-center flex-shrink-0">
                        {item.product?.image_url || item.image_url ? (
                          <img
                            src={item.product?.image_url || item.image_url}
                            alt={item.product_name || "Product"}
                            className="h-full w-full object-cover rounded"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-muted-foreground opacity-50" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{item.product_name || item.name || "Medical Item"}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>Qty: {item.quantity}</span>
                          <span>•</span>
                          <span>Unit Price: KSh {(item.unit_price || item.price || 0).toLocaleString()}</span>
                          {item.vendor_name && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-primary">
                                <Store className="h-3 w-3" /> {item.vendor_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-semibold text-sm">
                      KSh {((item.unit_price || item.price || 0) * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}

                {/* Pricing Summary */}
                <div className="p-4 bg-muted/30 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>KSh {(order.subtotal || order.total_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping Fee</span>
                    <span>KSh {(order.shipping_fee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax / VAT</span>
                    <span>KSh {(order.tax_amount || 0).toLocaleString()}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-sm text-foreground">
                    <span>Total Amount</span>
                    <span className="text-primary">KSh {(order.total_amount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Map & Address */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Delivery & Logistics Destination
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {address ? (
                  <div className="text-xs space-y-1 bg-muted/40 p-3 rounded-lg border">
                    <div className="font-semibold text-sm text-foreground">
                      {address.full_name || `${address.first_name || ""} ${address.last_name || ""}`}
                    </div>
                    <div>{address.street_address || address.address_line1}</div>
                    <div>
                      {address.city}, {address.county || address.state} {address.postal_code}
                    </div>
                    {address.phone_number && (
                      <div className="text-muted-foreground pt-1">Phone: {address.phone_number}</div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No detailed address provided.</p>
                )}

                {address?.latitude && address?.longitude ? (
                  <AdminMap
                    markers={[
                      {
                        lat: Number(address.latitude),
                        lng: Number(address.longitude),
                        label: address.full_name || "Delivery Location",
                      },
                    ]}
                    height="200px"
                  />
                ) : null}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Order Status & Actions */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Order Status & Lifecycle
                  </span>
                  {actionLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </CardTitle>
                <CardDescription className="text-xs">
                  Update order stage intuitively with one-click transitions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Active Status Highlight */}
                <div className={`p-3 rounded-lg border flex items-center justify-between ${statusMeta.color}`}>
                  <div className="flex items-center gap-2">
                    {statusMeta.icon}
                    <span className="font-semibold text-xs tracking-wide uppercase">{statusMeta.label}</span>
                  </div>
                  <span className="text-[11px] font-medium opacity-80">Current State</span>
                </div>

                {/* Main Progress Steps */}
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">Standard Fulfillment Flow</div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {(() => {
                      const steps = [
                        { key: "pending", label: "Mark as Pending", icon: Clock },
                        { key: "paid", label: "Mark as Paid", icon: CheckCircle2 },
                        { key: "processing", label: "Start Processing", icon: Clock },
                        { key: "shipped", label: "Mark Shipped", icon: Truck },
                        { key: "delivered", label: "Mark Delivered", icon: CheckCircle2 },
                      ];
                      const stepOrder = ["pending", "paid", "processing", "shipped", "delivered"];
                      const currentIdx = stepOrder.indexOf(order.status);
                      const isTerminal = order.status === "delivered" || order.status === "cancelled" || order.status === "refunded";

                      return steps.map((step, idx) => {
                        const Icon = step.icon;
                        const isCurrent = order.status === step.key;
                        const isPassed = currentIdx !== -1 && idx < currentIdx;
                        const isDisabled = actionLoading || isCurrent || isPassed || isTerminal;

                        return (
                          <button
                            key={step.key}
                            type="button"
                            onClick={() => handleStatusUpdate(step.key)}
                            disabled={isDisabled}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                              isCurrent
                                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                                : isPassed
                                ? "bg-muted/60 text-muted-foreground/70 border border-transparent cursor-not-allowed opacity-65"
                                : isDisabled
                                ? "bg-muted/30 text-muted-foreground/50 border border-transparent cursor-not-allowed opacity-50"
                                : "bg-muted/40 hover:bg-muted text-foreground border border-border/50"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5" />
                              {step.label}
                            </span>
                            {isCurrent ? (
                              <span className="text-[10px] bg-primary-foreground/20 px-1.5 py-0.5 rounded text-primary-foreground font-bold">
                                Active
                              </span>
                            ) : isPassed ? (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Completed
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">Next</span>
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Exceptional Status Actions */}
                <div className="pt-2 border-t space-y-1.5">
                  <div className="text-xs font-medium text-muted-foreground">Exception Actions</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={order.status === "cancelled" ? "destructive" : "outline"}
                      size="sm"
                      onClick={() => handleStatusUpdate("cancelled")}
                      disabled={actionLoading || order.status === "cancelled" || order.status === "delivered" || order.status === "refunded"}
                      className="text-xs justify-start h-8 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {order.status === "cancelled" ? "Cancelled" : "Cancel Order"}
                    </Button>
                    <Button
                      variant={order.status === "refunded" ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleStatusUpdate("refunded")}
                      disabled={actionLoading || order.status === "refunded"}
                      className="text-xs justify-start h-8 gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {order.status === "refunded" ? "Refunded" : "Refund Order"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Details */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-3">
                <div>
                  <div className="text-muted-foreground">Customer Name</div>
                  <div className="font-semibold text-sm">
                    {order.user ? `${order.user.first_name || ""} ${order.user.last_name || ""}`.trim() || order.user.email : "Guest User"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Email Address</div>
                  <div className="font-medium">{order.user?.email || order.customer_email || "N/A"}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Phone</div>
                  <div className="font-medium">
                    {order.user?.phone ||
                      order.user?.phone_number ||
                      order.customer_phone ||
                      order.phone ||
                      address?.phone ||
                      address?.phone_number ||
                      address?.mobile ||
                      "N/A"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Internal Notes */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Internal Admin Notes
                </CardTitle>
                {!isEditingNotes && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsEditingNotes(true)}>
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditingNotes ? (
                  <div className="space-y-2">
                    <Textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Add confidential admin notes regarding this order..."
                      className="text-xs min-h-[100px]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditingNotes(false)} disabled={savingNotes}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes} className="gap-1 text-xs">
                        {savingNotes ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save Notes
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg min-h-[60px] whitespace-pre-wrap">
                    {order.internal_notes || "No internal notes recorded yet. Click edit to add notes."}
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
