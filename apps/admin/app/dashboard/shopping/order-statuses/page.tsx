"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ArrowRight,
  Loader2,
  RefreshCw,
  Search,
  Eye,
  GitBranch,
  ShieldCheck,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { shoppingService } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { toast } from "sonner";

const LIFECYCLE_STATES = [
  {
    status: "pending",
    label: "Pending",
    description: "Order created. Awaiting payment processing.",
    color: "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50",
    next: ["paid", "cancelled"],
    icon: <Clock className="h-5 w-5" />
  },
  {
    status: "paid",
    label: "Paid",
    description: "Payment confirmed. Route optimization starting.",
    color: "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50",
    next: ["processing", "shipped", "cancelled"],
    icon: <CheckCircle2 className="h-5 w-5" />
  },
  {
    status: "processing",
    label: "Processing",
    description: "Package preparing or rider assignments ongoing.",
    color: "text-indigo-700 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50",
    next: ["shipped", "cancelled"],
    icon: <RefreshCw className="h-5 w-5" />
  },
  {
    status: "shipped",
    label: "Shipped",
    description: "Rider has picked up goods and is en route.",
    color: "text-purple-700 bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50",
    next: ["delivered"],
    icon: <Truck className="h-5 w-5" />
  },
  {
    status: "delivered",
    label: "Delivered",
    description: "Order reached customer. Lifecycle finished.",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50",
    next: ["refunded"],
    icon: <CheckCircle2 className="h-5 w-5" />
  },
  {
    status: "cancelled",
    label: "Cancelled",
    description: "Order voided. Items returned to inventory.",
    color: "text-red-700 bg-red-50 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50",
    next: [],
    icon: <XCircle className="h-5 w-5" />
  },
  {
    status: "refunded",
    label: "Refunded",
    description: "Transaction reversed. Funds returned.",
    color: "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50",
    next: [],
    icon: <XCircle className="h-5 w-5" />
  }
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400" },
  paid: { label: "Paid", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" },
  processing: { label: "Processing", color: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400" },
  shipped: { label: "Shipped", color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400" },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" },
  refunded: { label: "Refunded", color: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400" },
};

export default function OrderStatusesPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Simulation state
  const [searchId, setSearchId] = useState("");
  const [searchedOrder, setSearchedOrder] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  const loadStatsAndOrders = async () => {
    setLoading(true);
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        shoppingService.getAnalytics(),
        shoppingService.adminListOrders({ page: 1, page_size: 6 })
      ]);

      const analytics = (analyticsRes as any).data ?? analyticsRes;
      setStats(analytics.status_breakdown || {});

      const ordersData = (ordersRes as any).data ?? ordersRes;
      setRecentOrders(ordersData?.orders || []);
    } catch (error) {
      console.error("Failed to load status breakdown or orders:", error);
      toast.error("Failed to load order lifecycle data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatsAndOrders();
  }, []);

  const handleSearchOrder = async () => {
    if (!searchId.trim()) return;
    setSearching(true);
    setSearchedOrder(null);
    try {
      const res = await shoppingService.getOrderDetails(searchId.trim());
      const data = (res as any)?.data ?? res;
      if (data) {
        setSearchedOrder(data);
        toast.success("Order found!");
      } else {
        toast.error("Order not found");
      }
    } catch (error) {
      console.error(error);
      toast.error("Order details could not be loaded");
    } finally {
      setSearching(false);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!searchedOrder) return;
    setUpdateLoading(true);
    try {
      await shoppingService.adminUpdateOrderStatus(searchedOrder.id, status);
      toast.success(`Order status updated to ${status}`);
      // reload search
      const res = await shoppingService.getOrderDetails(searchedOrder.id);
      const data = (res as any)?.data ?? res;
      setSearchedOrder(data);
      // reload summary
      loadStatsAndOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update status");
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order Lifecycle & Statuses</h1>
            <p className="text-muted-foreground">
              Monitor, audit, and simulate transitions in the checkout and fulfillment workflows.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={loadStatsAndOrders} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Overview
          </Button>
        </div>

        {/* Visual Pipeline & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Path Diagram */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-primary" /> Order Lifecycle Pipeline
                </CardTitle>
                <CardDescription>
                  The normal sequential workflow and logical path of customer orders.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Horizontal Stepper Path */}
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 pt-4">
                  {/* Background Line */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 hidden md:block z-0" />

                  {LIFECYCLE_STATES.slice(0, 5).map((state, idx) => {
                    const activeCount = stats[state.status] || 0;
                    return (
                      <div key={state.status} className="relative z-10 flex flex-col items-center text-center">
                        <div className="flex size-10 items-center justify-center rounded-full bg-white dark:bg-slate-900 border-2 border-primary text-primary font-bold shadow-sm">
                          {state.icon}
                        </div>
                        <div className="mt-2">
                          <p className="font-semibold text-sm">{state.label}</p>
                          <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-mono">
                            {activeCount} orders
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sub-paths & Alternative States */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm mb-3">Alternative Transitions & Terminals</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {LIFECYCLE_STATES.slice(5).map((state) => {
                      const activeCount = stats[state.status] || 0;
                      return (
                        <div key={state.status} className="flex items-start gap-3 p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/30">
                          <div className="flex size-8 items-center justify-center rounded-full bg-white dark:bg-slate-950 border border-slate-200 text-slate-500 shadow-sm shrink-0">
                            {state.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{state.label}</span>
                              <Badge className="font-mono" variant="outline">{activeCount} orders</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{state.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lifecycle Descriptions List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">State Details & Outgoing Transitions</CardTitle>
                <CardDescription>
                  Detailed schema constraints and expected system behavior for each state.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {LIFECYCLE_STATES.map((state) => (
                    <div key={state.status} className="p-4 border rounded-lg space-y-2 bg-white dark:bg-slate-950 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${state.color} border px-2 py-1 font-semibold capitalize flex items-center gap-1.5`}>
                            {state.icon}
                            {state.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground font-mono">({stats[state.status] || 0} active)</span>
                        </div>
                        {state.next.length > 0 ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span>Transitions to:</span>
                            {state.next.map((n) => (
                              <Badge key={n} variant="secondary" className="px-1.5 py-0 capitalize bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {n}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs text-slate-400 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                            Terminal State
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {state.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Search, Simulator and Statistics */}
          <div className="space-y-6">
            {/* Live Audit / Search simulator */}
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/[0.02]">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" /> Lifecycle Simulator
                </CardTitle>
                <CardDescription>
                  Look up a test order and manually trigger status transitions to debug workflows.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Order ID or Order Number</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. 8b80de5f-9cbd..."
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearchOrder()}
                    />
                    <Button onClick={handleSearchOrder} disabled={searching} size="icon">
                      {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {searchedOrder ? (
                  <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-lg space-y-4 bg-white dark:bg-slate-950 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-muted-foreground font-mono uppercase">#{searchedOrder.id.substring(0, 8)}</p>
                          <p className="text-sm font-semibold mt-0.5">KES {searchedOrder.total_amount?.toLocaleString()}</p>
                        </div>
                        <Badge variant="outline" className={STATUS_CONFIG[searchedOrder.status]?.color || "bg-slate-100"}>
                          {STATUS_CONFIG[searchedOrder.status]?.label || searchedOrder.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                        <p>Customer ID: {searchedOrder.user_id?.substring(0, 8)}...</p>
                        <p>Items Count: {searchedOrder.items?.length || 0}</p>
                      </div>
                    </div>

                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs font-semibold text-slate-500">Trigger State Change</p>
                      {updateLoading ? (
                        <div className="flex items-center justify-center py-2 text-muted-foreground text-xs gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Updating status...</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {LIFECYCLE_STATES.map((state) => {
                            // Don't show button for current status
                            if (state.status === searchedOrder.status) return null;
                            return (
                              <Button
                                key={state.status}
                                variant="outline"
                                size="xs"
                                className="text-[10px] h-7 px-2 border capitalize hover:bg-primary/5"
                                onClick={() => handleUpdateStatus(state.status)}
                              >
                                To {state.status}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center text-slate-400 dark:text-slate-600 bg-slate-50/50 dark:bg-slate-900/10">
                    <HelpCircle className="h-8 w-8 mb-2 stroke-[1.5]" />
                    <p className="text-xs">No active search. Look up an Order ID to simulate transitions.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Orders Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Status Changes</CardTitle>
                <CardDescription>
                  Latest orders recorded in the platform database.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : recentOrders.length === 0 ? (
                  <p className="text-center py-6 text-xs text-muted-foreground italic">No recent orders found.</p>
                ) : (
                  <div className="space-y-2">
                    {recentOrders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-900/10 hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs font-mono text-emerald-600 dark:text-emerald-400">
                              {o.order_number || o.id.substring(0, 8).toUpperCase()}
                            </span>
                            <span className="text-[10px] text-slate-400">{new Date(o.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">KES {o.total_amount?.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize ${STATUS_CONFIG[o.status]?.color}`}>
                            {o.status}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <Link href={`/dashboard/shopping/orders/${o.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
