"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  User,
  Phone,
  Calendar,
  Clock,
  ShoppingCart,
  Package,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  ExternalLink,
  ShieldAlert,
  Send,
  Building,
} from "lucide-react";
import { shoppingService } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AbandonedCartDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);

  const fetchCartDetail = async () => {
    setLoading(true);
    try {
      const res = await shoppingService.getAbandonedCartDetail(id);
      const data = (res as any)?.data ?? res;
      setCart(data);
    } catch (error) {
      console.error("Failed to load abandoned cart details:", error);
      toast.error("Could not fetch abandoned cart details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCartDetail();
    }
  }, [id]);

  const handleRecover = async () => {
    if (!cart?.id) return;
    setRecovering(true);
    try {
      await shoppingService.recoverAbandonedCart(cart.id);
      toast.success("Recovery notification email queued successfully");
      fetchCartDetail();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to dispatch recovery notification");
    } finally {
      setRecovering(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const calculateCartTotal = (cartObj: any) => {
    if (!cartObj?.items || cartObj.items.length === 0) return 0;
    return cartObj.items.reduce((sum: number, item: any) => {
      const price = parseFloat(item.unit_price || item.product?.price || 0);
      return sum + item.quantity * price;
    }, 0);
  };

  const customerUser = cart?.user;
  const customerName = customerUser
    ? `${customerUser.firstName || customerUser.first_name || ""} ${customerUser.lastName || customerUser.last_name || ""}`.trim() || customerUser.email
    : "Guest Customer (Unregistered)";

  const customerPhone = customerUser?.phone || customerUser?.telephone || null;
  const customerEmail = customerUser?.email || null;

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6 max-w-6xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-2 text-xs">
            <Link href="/dashboard/shopping/abandoned-carts">
              <ArrowLeft className="h-4 w-4" /> Back to Abandoned Carts
            </Link>
          </Button>

          <Button onClick={fetchCartDetail} variant="outline" size="sm" disabled={loading} className="gap-2 text-xs">
            <Clock className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Cart Detail
          </Button>
        </div>

        {/* Header Title Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] uppercase font-bold">
                Abandoned Cart Follow-Up
              </Badge>
              <span className="font-mono text-xs text-muted-foreground">ID: #{id?.substring(0, 8)}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              Abandoned Cart Inspection & Customer Profile
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Detailed breakdown of items, estimated cart value, and customer contact information for sales follow-up.
            </p>
          </div>

          <Button onClick={handleRecover} disabled={recovering || loading} className="gap-2 font-medium shrink-0">
            {recovering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send Recovery Notification
          </Button>
        </div>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-28 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-64 md:col-span-2 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        ) : cart ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Cart Items & Value Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              {/* Value Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border shadow-xs bg-primary/5 border-primary/20">
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">Estimated Cart Valuation</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <div className="text-2xl font-bold text-primary">
                      KSh {calculateCartTotal(cart).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Based on saved line item unit prices</p>
                  </CardContent>
                </Card>

                <Card className="border shadow-xs">
                  <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Line Items</CardTitle>
                    <Package className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent className="py-2 px-4">
                    <div className="text-2xl font-bold">{cart.items?.length || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Distinct product SKUs in cart</p>
                  </CardContent>
                </Card>
              </div>

              {/* Items List */}
              <Card className="border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Package className="h-4.5 w-4.5 text-primary" />
                    Abandoned Product Items ({cart.items?.length || 0})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Items selected by customer prior to leaving the session.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="border rounded-xl divide-y overflow-hidden">
                    {cart.items && cart.items.length > 0 ? (
                      cart.items.map((item: any) => {
                        const unitPrice = parseFloat(item.unit_price || item.product?.price || 0);
                        const lineTotal = item.quantity * unitPrice;
                        const imageSrc = item.product?.images?.[0]?.url || item.product?.image_url;

                        return (
                          <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              {imageSrc ? (
                                <img src={imageSrc} alt={item.product?.name || "Product"} className="h-12 w-12 rounded-lg object-cover border shrink-0" />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {item.product?.name || `Product #${item.product_id?.substring(0, 8)}`}
                                </p>
                                <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                                  <span>SKU: <strong className="font-mono text-foreground">{item.product?.sku || "N/A"}</strong></span>
                                  <span>•</span>
                                  <span>Qty: <strong className="text-foreground">{item.quantity}</strong></span>
                                  <span>•</span>
                                  <span>KSh {unitPrice.toLocaleString()} each</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                              <div className="text-xs text-muted-foreground">Line Total</div>
                              <div className="text-sm font-bold text-foreground">
                                KSh {lineTotal.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-6 text-center text-xs text-muted-foreground italic">
                        No product items recorded in this cart.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* System Info */}
              <Card className="border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                    System Tracking Identifiers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border font-mono">
                    <span className="text-muted-foreground">Cart UUID:</span>
                    <button onClick={() => copyToClipboard(cart.id, "Cart UUID")} className="hover:text-primary font-semibold flex items-center gap-1.5">
                      {cart.id} <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {cart.cart_token && (
                    <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border font-mono">
                      <span className="text-muted-foreground">Cart Session Token:</span>
                      <button onClick={() => copyToClipboard(cart.cart_token, "Cart Token")} className="hover:text-primary font-semibold flex items-center gap-1.5">
                        {cart.cart_token} <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {cart.session_id && (
                    <div className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg border font-mono">
                      <span className="text-muted-foreground">Browser Session ID:</span>
                      <button onClick={() => copyToClipboard(cart.session_id, "Session ID")} className="hover:text-primary font-semibold flex items-center gap-1.5">
                        {cart.session_id} <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Customer Profile & Follow-up Actions */}
            <div className="space-y-6">
              {/* Customer Profile Card */}
              <Card className="border shadow-sm border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <User className="h-4.5 w-4.5 text-primary" />
                    Customer Profile & Contact
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Information required for direct follow-up calls or outreach.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-muted/40 border space-y-3">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">
                        Customer Name
                      </div>
                      <div className="text-sm font-bold text-foreground">{customerName}</div>
                    </div>

                    {customerEmail && (
                      <div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5 flex items-center gap-1">
                          <Mail className="h-3 w-3 text-primary" /> Email Address
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <a href={`mailto:${customerEmail}`} className="font-semibold text-primary hover:underline truncate">
                            {customerEmail}
                          </a>
                          <Button size="icon-sm" variant="ghost" onClick={() => copyToClipboard(customerEmail, "Email")}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {customerPhone && (
                      <div>
                        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5 flex items-center gap-1">
                          <Phone className="h-3 w-3 text-emerald-600" /> Phone Number
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <a href={`tel:${customerPhone}`} className="font-semibold text-emerald-700 dark:text-emerald-400 hover:underline">
                            {customerPhone}
                          </a>
                          <Button size="icon-sm" variant="ghost" onClick={() => copyToClipboard(customerPhone, "Phone Number")}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">
                        Account Role
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] capitalize">
                        {customerUser?.role || "Guest / Unregistered"}
                      </Badge>
                    </div>
                  </div>

                  {customerUser?.id && (
                    <Button asChild variant="outline" size="sm" className="w-full text-xs gap-1.5">
                      <Link href={`/dashboard/users/customers/${customerUser.id}`}>
                        <User className="h-3.5 w-3.5" /> View Full Customer Profile
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Timing & Activity Logs */}
              <Card className="border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    Session Activity Timestamps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">Created At:</span>
                    <span className="font-medium">{new Date(cart.created_at).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">Last Abandoned Activity:</span>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">{new Date(cart.updated_at).toLocaleString()}</span>
                  </div>

                  {cart.expires_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Expiration Timestamp:</span>
                      <span className="font-medium">{new Date(cart.expires_at).toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Outreach Box */}
              <Card className="border shadow-xs bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/60">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> Follow-Up Recommended
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4 text-xs text-amber-900/90 dark:text-amber-200/90 space-y-3">
                  <p className="leading-relaxed">
                    This cart has been inactive for over 24 hours. Dispatching a recovery email or placing a follow-up call increases conversion rate by up to 28%.
                  </p>

                  <Button onClick={handleRecover} disabled={recovering} className="w-full text-xs h-9 gap-2">
                    {recovering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                    Queue Recovery Email
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Cart record not found or has been purged.
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
