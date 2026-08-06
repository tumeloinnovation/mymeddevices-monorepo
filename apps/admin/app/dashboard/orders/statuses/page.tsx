"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  ArrowRight,
  RefreshCw,
  GitBranch,
  ShieldCheck,
  ArrowLeft,
  Filter,
  ExternalLink,
  Info,
  Check,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { shoppingService } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";

interface StatusDefinition {
  status: string;
  label: string;
  stageNumber: number;
  stageCategory: "initial" | "processing" | "fulfillment" | "completed" | "terminal";
  description: string;
  details: string;
  color: string;
  badgeStyle: string;
  borderAccent: string;
  next: string[];
  icon: any;
}

const LIFECYCLE_STATES: StatusDefinition[] = [
  {
    status: "pending",
    label: "Pending Payment",
    stageNumber: 1,
    stageCategory: "initial",
    description: "Order created by customer. Awaiting payment authorization or M-Pesa STK confirmation.",
    details: "Automated timeout releases reserved stock if unpaid within 24 hours.",
    color: "text-amber-700 bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50",
    badgeStyle: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300",
    borderAccent: "border-l-amber-500",
    next: ["paid", "cancelled"],
    icon: Clock,
  },
  {
    status: "paid",
    label: "Paid & Verified",
    stageNumber: 2,
    stageCategory: "processing",
    description: "Funds verified via M-Pesa / Card ledger. Ready for fulfillment allocation.",
    details: "Notifies vendor dispatch team to begin item verification and packaging.",
    color: "text-blue-700 bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/50",
    badgeStyle: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300",
    borderAccent: "border-l-blue-500",
    next: ["processing", "shipped", "cancelled"],
    icon: CheckCircle2,
  },
  {
    status: "processing",
    label: "In Processing",
    stageNumber: 3,
    stageCategory: "processing",
    description: "Package preparation, batch serial verification, or delivery rider matching.",
    details: "Requires KMPDB / PPB batch compliance checks prior to courier dispatch.",
    color: "text-indigo-700 bg-indigo-50/50 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/50",
    badgeStyle: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300",
    borderAccent: "border-l-indigo-500",
    next: ["shipped", "cancelled"],
    icon: RefreshCw,
  },
  {
    status: "shipped",
    label: "Shipped / In Transit",
    stageNumber: 4,
    stageCategory: "fulfillment",
    description: "Order dispatched with courier or delivery driver en route to clinic/facility.",
    details: "Live tracking active. Customer receives automated SMS delivery PIN.",
    color: "text-purple-700 bg-purple-50/50 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/50",
    badgeStyle: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300",
    borderAccent: "border-l-purple-500",
    next: ["delivered"],
    icon: Truck,
  },
  {
    status: "delivered",
    label: "Delivered & Complete",
    stageNumber: 5,
    stageCategory: "completed",
    description: "Order received and validated by clinic contact or customer.",
    details: "Vendor payout unlocked following mandatory 48-hour inspection period.",
    color: "text-emerald-700 bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50",
    badgeStyle: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300",
    borderAccent: "border-l-emerald-500",
    next: ["refunded"],
    icon: Check,
  },
  {
    status: "cancelled",
    label: "Cancelled",
    stageNumber: 0,
    stageCategory: "terminal",
    description: "Order voided before fulfillment completed. Inventory restocked automatically.",
    details: "Terminal state. Cannot transition forward to any active state.",
    color: "text-red-700 bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/50",
    badgeStyle: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300",
    borderAccent: "border-l-red-500",
    next: [],
    icon: XCircle,
  },
  {
    status: "refunded",
    label: "Refunded",
    stageNumber: 0,
    stageCategory: "terminal",
    description: "Payment transaction reversed and customer account credited or refunded.",
    details: "Terminal state triggered via customer service approval or return workflow.",
    color: "text-rose-700 bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50",
    badgeStyle: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-300",
    borderAccent: "border-l-rose-500",
    next: [],
    icon: RotateCcw,
  },
];

export default function OrderStatusesDashboard() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const analyticsRes = await shoppingService.getAnalytics().catch(() => null);
      const analyticsData = (analyticsRes as any)?.data ?? analyticsRes;
      if (analyticsData?.status_breakdown) {
        setStats(analyticsData.status_breakdown);
      }
    } catch (error) {
      console.error("Failed to load status breakdown:", error);
      toast.error("Could not fetch order workflow metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalOrders = Object.values(stats).reduce((acc, count) => acc + count, 0);
  const activeFulfillmentOrders = (stats.paid || 0) + (stats.processing || 0) + (stats.shipped || 0);

  return (
    <DashboardLayout>
      <div className="space-y-8 p-6 max-w-7xl mx-auto">
        {/* Navigation back bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-2 text-xs">
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" /> Back to All Orders
            </Link>
          </Button>

          <Button onClick={fetchData} variant="outline" size="sm" disabled={loading} className="gap-2 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Metrics
          </Button>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
              <GitBranch className="h-6 w-6 text-primary" />
              Order Status Rules & Lifecycle Engine
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
              Overview of state transition guardrails, active inventory volumes per fulfillment stage, and backend validation rules enforcing order progression.
            </p>
          </div>
        </div>

        {/* Top Metric Cards Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border shadow-sm">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Managed Orders</CardTitle>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-20" /> : totalOrders.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all order status categories</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-blue-50/30 dark:bg-blue-950/10 border-blue-200/60 dark:border-blue-900/40">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Active Fulfillment Pipeline</CardTitle>
              <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {loading ? <Skeleton className="h-8 w-16" /> : activeFulfillmentOrders.toLocaleString()}
              </div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400 mt-1">Paid, Processing, & Shipped orders</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200/60 dark:border-emerald-900/40">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Completed Orders</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">
                {loading ? <Skeleton className="h-8 w-16" /> : (stats.delivered || 0).toLocaleString()}
              </div>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400 mt-1">Successfully fulfilled & verified</p>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Fulfillment Pipeline Ribbon */}
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-primary" />
              Primary Fulfillment Sequence
            </CardTitle>
            <CardDescription className="text-xs">
              Sequential flow enforced for standard orders. Click any stage to filter orders in the main list.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Scrollable / Responsive Stepper Bar */}
            <div className="flex flex-col xl:flex-row items-stretch gap-3 overflow-x-auto pb-1">
              {LIFECYCLE_STATES.filter((s) => s.stageCategory !== "terminal").map((state, idx) => {
                const count = stats[state.status] || 0;
                const Icon = state.icon;
                return (
                  <div key={state.status} className="flex-1 min-w-[200px] flex flex-col xl:flex-row items-stretch relative group">
                    <Link
                      href={`/dashboard/orders?status=${state.status}`}
                      className={`w-full p-3.5 rounded-xl border-l-4 ${state.borderAccent} border bg-card hover:shadow-md transition-all flex flex-col justify-between`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                            Stage {state.stageNumber}
                          </span>
                          <Badge variant="outline" className={`text-[11px] font-semibold shrink-0 ${state.badgeStyle}`}>
                            {loading ? "..." : count}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{state.label}</span>
                        </div>
                      </div>
                      <div className="pt-2 text-[11px] text-primary flex items-center gap-1 font-medium group-hover:underline">
                        View {count} orders <ExternalLink className="h-3 w-3 shrink-0" />
                      </div>
                    </Link>

                    {/* Step indicator arrow */}
                    {idx < 4 && (
                      <div className="flex xl:hidden justify-center py-1.5 text-muted-foreground/50 shrink-0">
                        <ArrowRight className="h-4 w-4 rotate-90" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* State Machine Catalog & Rules Specifications */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              State Machine Rules & Transition Matrix
            </CardTitle>
            <CardDescription className="text-xs">
              Backend validators ensure orders only move along permitted paths. Click transition tags or filter buttons to inspect orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {LIFECYCLE_STATES.map((state) => {
                const count = stats[state.status] || 0;
                const Icon = state.icon;
                return (
                  <div
                    key={state.status}
                    className={`p-4 rounded-xl border border-l-4 ${state.borderAccent} ${state.color} flex flex-col justify-between space-y-4`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-semibold text-sm min-w-0">
                          <Icon className="h-4.5 w-4.5 shrink-0" />
                          <span className="truncate">{state.label}</span>
                        </div>
                        <Badge variant="outline" className={`font-mono text-xs font-bold shrink-0 ${state.badgeStyle}`}>
                          {loading ? "..." : `${count} orders`}
                        </Badge>
                      </div>

                      <p className="text-xs text-foreground/85 leading-relaxed">{state.description}</p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-current/15 text-xs">
                      <div className="flex items-start gap-1.5 text-muted-foreground text-[11px] leading-snug">
                        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{state.details}</span>
                      </div>

                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider opacity-75 mb-1.5 flex items-center gap-1">
                          Permitted Next Transitions
                        </div>
                        {state.next.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {state.next.map((n) => {
                              const targetConfig = LIFECYCLE_STATES.find((s) => s.status === n);
                              return (
                                <Link key={n} href={`/dashboard/orders?status=${n}`}>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-medium bg-background/90 hover:bg-background hover:border-primary/50 transition-colors cursor-pointer py-0.5 px-2 flex items-center gap-1"
                                  >
                                    <span>{targetConfig?.label || n}</span>
                                    <ArrowRight className="h-2.5 w-2.5 opacity-60" />
                                  </Badge>
                                </Link>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[11px] italic opacity-75 flex items-center gap-1.5 text-muted-foreground">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                            Terminal State — No further transitions permitted
                          </span>
                        )}
                      </div>

                      <div className="pt-1">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs font-medium bg-background/90 hover:bg-background shadow-xs gap-1.5"
                        >
                          <Link href={`/dashboard/orders?status=${state.status}`}>
                            <Filter className="h-3.5 w-3.5 shrink-0" />
                            <span>Filter Orders ({state.label})</span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

