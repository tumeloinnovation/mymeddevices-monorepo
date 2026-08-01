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
  const [internalNotes, setInternalNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const response = await shoppingService.getOrderDetails(id as string);
      const orderData = (response as any)?.data ?? response;
      setOrder(orderData);
      setInternalNotes(orderData?.internal_notes || "");
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

  const handleSaveInternalNotes = async () => {
    setSavingNotes(true);
    try {
      await shoppingService.updateOrderInternalNotes(id as string, internalNotes);
      toast.success("Internal notes updated");
      setIsEditingNotes(false);
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update notes");
    } finally {
      setSavingNotes(false);
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

  if (!order) {
    return null;
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
                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {item.product?.image_url || item.product?.images?.[0]?.url ? (
                            <img
                              src={item.product?.image_url || item.product?.images?.[0]?.url}
                              alt={item.product_name || item.product?.name || "Product"}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).onerror = null;
                                (e.currentTarget as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'/%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.product_name || item.product?.name || "Product"}</p>
                          <p className="text-sm text-muted-foreground">
                            SKU: {item.product?.sku || "N/A"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Vendor: {item.vendor_name || <span className="text-xs">ID: {item.vendor_id?.split("-")[0]}...</span>}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × {order.currency} {(typeof item.unit_price === "number" ? item.unit_price : Number(item.unit_price)).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {order.currency} {(typeof item.subtotal === "number" ? item.subtotal : Number(item.subtotal)).toLocaleString()}
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
                  Customer Notes
                </CardTitle>
                <CardDescription>Notes provided by the customer at checkout</CardDescription>
              </CardHeader>
              <CardContent>
                <p className={order.notes ? "" : "text-muted-foreground italic"}>
                  {order.notes || "No notes provided for this order."}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Internal Notes
                </CardTitle>
                <CardDescription>Admin-only notes for internal communication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditingNotes ? (
                  <div className="space-y-3">
                    <Textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      className="w-full min-h-[100px]"
                      placeholder="Add internal notes (visible only to admins)..."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveInternalNotes}
                        disabled={savingNotes}
                      >
                        {savingNotes ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Notes
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingNotes(false);
                          setInternalNotes(order?.internal_notes || "");
                        }}
                        disabled={savingNotes}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className={internalNotes ? "" : "text-muted-foreground italic"}>
                      {internalNotes || "No internal notes. Click to add notes."}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingNotes(true)}
                    >
                      <Edit3 className="mr-2 h-4 w-4" />
                      {internalNotes ? "Edit Notes" : "Add Notes"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Order Timeline
                </CardTitle>
                <CardDescription>Status changes and order activity log</CardDescription>
              </CardHeader>
              <CardContent>
                {order.timeline_events && order.timeline_events.length > 0 ? (
                  <div className="space-y-4">
                    {order.timeline_events.map((event: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`mt-1 h-2 w-2 rounded-full ${
                          event.status === 'delivered' || event.status === 'completed' ? 'bg-green-500' :
                          event.status === 'cancelled' ? 'bg-red-500' :
                          event.status === 'shipped' ? 'bg-purple-500' :
                          event.status === 'paid' ? 'bg-blue-500' :
                          'bg-muted'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{event.message || event.status}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {event.created_by && ` • By: ${event.created_by}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-sm">No timeline events available for this order.</p>
                )}
              </CardContent>
            </Card>

            {order.shipping_address?.route_coordinates && order.shipping_address.route_coordinates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Delivery Route Map
                  </CardTitle>
                  <CardDescription>
                    Route path for Company Rider: Office &rarr; Vendor pickups &rarr; Customer destination
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Route Summary */}
                  <div className="flex items-center justify-between text-sm bg-muted/50 rounded-md px-3 py-2">
                    <span className="text-muted-foreground">Total Stops</span>
                    <span className="font-semibold">{order.shipping_address.route_coordinates.length} stops</span>
                  </div>

                  <AdminMap
                    markers={(() => {
                      const coords = order.shipping_address.route_coordinates;
                      const markers = [];

                      // Create a map of unique vendors in this order
                      const vendorMap = new Map();
                      order.items?.forEach((item: any) => {
                        if (item.vendor_id && item.vendor_name) {
                          vendorMap.set(String(item.vendor_id), item.vendor_name);
                        }
                      });

                      // Company Office (Start)
                      markers.push({
                        lat: coords[0][0],
                        lng: coords[0][1],
                        label: "Company Office (Start)"
                      });

                      // Vendor pickups with names
                      for (let i = 1; i < coords.length - 1; i++) {
                        const vendorId = order.shipping_address.vendor_pickups?.[i - 1]?.vendor_id;
                        const vendorName = vendorId && vendorMap.get(String(vendorId));

                        markers.push({
                          lat: coords[i][0],
                          lng: coords[i][1],
                          label: vendorName ? `${vendorName}` : `Vendor Pickup #${i}`
                        });
                      }

                      // Customer destination
                      if (coords.length > 1) {
                        markers.push({
                          lat: coords[coords.length - 1][0],
                          lng: coords[coords.length - 1][1],
                          label: `Customer: ${order.shipping_address.full_name || order.shipping_address.first_name || 'Delivery Destination'}`
                        });
                      }
                      return markers;
                    })()}
                    routeCoordinates={order.shipping_address.route_coordinates}
                    height="350px"
                  />

                  {/* Copy Coordinates Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const coords = order.shipping_address.route_coordinates;
                      const coordsText = coords.map((c: number[]) => `${c[0]},${c[1]}`).join('|');
                      navigator.clipboard.writeText(coordsText);
                      toast.success('Route coordinates copied to clipboard');
                    }}
                  >
                    <Store className="mr-2 h-4 w-4" />
                    Copy Route Coordinates
                  </Button>

                  {order.shipping_address.calculated_distance_km && (
                    <div className="flex justify-between items-center text-sm font-semibold border-t pt-3">
                      <span className="text-muted-foreground">Calculated Route Distance</span>
                      <span className="text-primary">{order.shipping_address.calculated_distance_km.toFixed(2)} km</span>
                    </div>
                  )}
                  {order.shipping_address.logistics_type && (
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-muted-foreground">Logistics Mode</span>
                      <span className="uppercase text-orange-600">{order.shipping_address.logistics_type.replace('_', ' ')}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
