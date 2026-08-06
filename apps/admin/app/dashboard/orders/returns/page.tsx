"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Undo,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { apiClient } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface ReturnRequest {
  id: string;
  order_id: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "completed";
  comments?: string;
  created_at?: string;
  items?: any[];
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<any>("/returns/admin/list");
      const data = response.data?.items || response.data || [];
      setReturns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load return requests:", error);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleUpdateStatus = async (returnId: string, newStatus: string) => {
    setActionLoading(returnId);
    try {
      await apiClient.put(`/returns/${returnId}/status`, { status: newStatus });
      toast.success(`Return request marked as ${newStatus}`);
      fetchReturns();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update return request");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = returns.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.id?.toLowerCase().includes(q) ||
      r.order_id?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q) ||
      r.user?.email?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-rose-100 text-rose-700 border-rose-200">Rejected</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Completed</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending Review</Badge>;
    }
  };

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
            <div className="p-3 rounded-lg border bg-amber-50 dark:bg-amber-950/20 text-amber-600 border-amber-200">
              <Undo className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Return Requests & RMA</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review, approve, or decline medical device customer returns and replacements.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchReturns} disabled={loading} className="gap-2 self-start sm:self-auto">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh Returns
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            {["all", "pending", "approved", "rejected", "completed"].map((st) => (
              <Button
                key={st}
                variant={statusFilter === st ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(st)}
                className="text-xs capitalize"
              >
                {st}
              </Button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search return requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {/* List Table */}
        <div className="border rounded-lg bg-card overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Undo className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-semibold">No return requests found</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                There are no active customer return requests matching this filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b">
                  <tr>
                    <th className="py-3 px-4 font-medium">Return ID</th>
                    <th className="py-3 px-4 font-medium">Order Ref</th>
                    <th className="py-3 px-4 font-medium">Reason</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Requested Date</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((ret) => (
                    <tr key={ret.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs font-medium">
                        #{ret.id?.substring(0, 8)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-primary">
                        <Link href={`/dashboard/orders/${ret.order_id}`} className="hover:underline">
                          #{ret.order_id?.substring(0, 8)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">
                        {ret.reason}
                        {ret.comments && (
                          <div className="text-[11px] text-muted-foreground font-normal line-clamp-1">
                            {ret.comments}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(ret.status)}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {ret.created_at
                          ? new Date(ret.created_at).toLocaleDateString("en-KE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {ret.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                                onClick={() => handleUpdateStatus(ret.id, "approved")}
                                disabled={actionLoading === ret.id}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-rose-500 text-rose-600 hover:bg-rose-50"
                                onClick={() => handleUpdateStatus(ret.id, "rejected")}
                                disabled={actionLoading === ret.id}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                            <Link href={`/dashboard/orders/${ret.order_id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
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
