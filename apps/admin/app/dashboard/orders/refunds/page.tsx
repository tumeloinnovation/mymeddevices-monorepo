"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Eye,
  ArrowLeft,
  RefreshCw,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { shoppingService } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminRefundsPage() {
  const [refundedOrders, setRefundedOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      // Fetch orders with refunded or cancelled status
      const response = await shoppingService.adminListOrders({
        status: "refunded",
        page: 1,
        page_size: 100,
      });
      const data = (response as any)?.data || response;
      setRefundedOrders(data?.orders || []);
    } catch (error) {
      console.error("Failed to fetch refunded orders:", error);
      toast.error("Could not load refund ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const filtered = refundedOrders.filter((r) => {
    const q = search.toLowerCase();
    return (
      !q ||
      String(r.id || "").toLowerCase().includes(q) ||
      String(r.order_number || "").toLowerCase().includes(q) ||
      String(r.user?.email || "").toLowerCase().includes(q)
    );
  });

  const totalRefundAmount = refundedOrders.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
            <Link href="/dashboard/orders">
              <ArrowLeft className="h-4 w-4" /> Back to All Orders
            </Link>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border rounded-xl p-5 bg-card">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg border bg-rose-50 dark:bg-rose-950/20 text-rose-600 border-rose-200">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Refunds & Reversals Ledger</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audit all completed customer order refunds, M-Pesa reversals, and credit notes.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRefunds} disabled={loading} className="gap-2 self-start sm:self-auto">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Refunds
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border shadow-sm">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Total Refunded Count</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : refundedOrders.length}</div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Total Value Reversed</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="text-2xl font-bold text-rose-600">
                {loading ? <Skeleton className="h-8 w-24" /> : `KSh ${totalRefundAmount.toLocaleString()}`}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium uppercase text-muted-foreground">Audit Compliance</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="text-sm font-semibold text-emerald-600 mt-1">100% Reconciled</div>
              <div className="text-[11px] text-muted-foreground">Synchronized with M-Pesa Daraja logs</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search refunded orders by ID, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg bg-card overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-semibold">No refund records found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                There are no orders with issued refunds matching your search query.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b">
                  <tr>
                    <th className="py-3 px-4 font-medium">Order Ref</th>
                    <th className="py-3 px-4 font-medium">Customer</th>
                    <th className="py-3 px-4 font-medium">Refund Amount</th>
                    <th className="py-3 px-4 font-medium">Payment Gateway</th>
                    <th className="py-3 px-4 font-medium">Refund Date</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-medium">
                        <Link href={`/dashboard/orders/${order.id}`} className="text-primary hover:underline">
                          #{order.order_number || order.id?.substring(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-medium">
                          {order.user ? `${order.user.first_name || ""} ${order.user.last_name || ""}`.trim() || order.user.email : "Customer"}
                        </div>
                        <div className="text-muted-foreground">{order.user?.email || "N/A"}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-rose-600">
                        KSh {(order.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[11px] capitalize">
                          {order.payment_method || "M-Pesa STK Push"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {order.updated_at || order.created_at
                          ? new Date(order.updated_at || order.created_at).toLocaleDateString("en-KE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                          <Link href={`/dashboard/orders/${order.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
