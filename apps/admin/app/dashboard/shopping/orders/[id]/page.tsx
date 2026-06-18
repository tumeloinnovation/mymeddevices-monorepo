"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import {
  shoppingService,
  useAuthStore,
} from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
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
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  paid: {
    label: "Paid",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  shipped: {
    label: "Shipped",
    icon: <Truck className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  delivered: {
    label: "Delivered",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  cancelled: {
    label: "Cancelled",
    icon: <XCircle className="h-4 w-4" />,
    color: "bg-red-100 text-red-700 border-red-200",
  },
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await shoppingService.getOrderDetails(id as string);
      setOrder(response);
    } catch (error) {
      console.error("Failed to load order:", error);
      toast.error("Failed to load order details");
      router.push("/dashboard/shopping/orders");
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

  const handleMockPayment = async () => {
    setActionLoading(true);
    try {
      await shoppingService.adminUpdateOrderStatus(id as string, "paid");
      toast.success("Payment confirmed. Order status updated to Paid.");
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to process payment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMockShipping = async () => {
    setActionLoading(true);
    try {
      await shoppingService.adminUpdateOrderStatus(id as string, "shipped");
      toast.success("Order marked as shipped.");
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to ship order");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 col-span-2" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
                <Badge variant="outline" className={status.color}>
                  {status.icon}
                  <span className="ml-1">{status.label}</span>
                </Badge>
              </div>
              <p className="text-muted-foreground">ID: {order.id}</p>
            </div>
          </div>

          {user?.role === "admin" && (
            <div className="flex items-center gap-2">
              <Select
                value={order.status}
                onValueChange={handleStatusUpdate}
                disabled={actionLoading}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content: Order Items */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Items</CardTitle>
                <CardDescription>
                  List of products included in this transaction.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">Product ID: {item.product_id.split("-")[0]}...</p>
                          <p className="text-sm text-muted-foreground">
                            Vendor ID: {item.vendor_id.split("-")[0]}...
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × {order.currency} {item.unit_price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {order.currency} {item.subtotal.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                    <p className="text-lg font-bold">Total Amount</p>
                    <p className="text-2xl font-bold text-primary">
                      {order.currency} {order.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Order Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={order.notes ? "" : "text-muted-foreground italic"}>
                  {order.notes || "No notes provided for this order."}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Customer & Shipping */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User ID</p>
                  <p className="font-mono text-sm">{order.user_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Date</p>
                  <p>{new Date(order.created_at).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.shipping_address ? (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{order.shipping_address.full_name || "N/A"}</p>
                    <p>{order.shipping_address.street || "N/A"}</p>
                    <p>{order.shipping_address.city || "N/A"}, {order.shipping_address.state || ""}</p>
                    <p>{order.shipping_address.country || "Kenya"}</p>
                    <p>Phone: {order.shipping_address.phone || "N/A"}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground italic">No shipping address provided.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.status === "pending" ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Awaiting Payment</Badge>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleMockPayment}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                      Simulate Payment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Paid
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      Transaction verified via mock system.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {(order.status === "paid" || order.status === "shipped") && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.status === "paid" ? (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={handleMockShipping}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Truck className="mr-2 h-4 w-4" />}
                      Ship Order (Mock)
                    </Button>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-purple-700">Shipped</p>
                      <p className="text-xs text-muted-foreground">Tracking ID: MOCK-TRK-{id?.toString().split("-")[0].toUpperCase()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
