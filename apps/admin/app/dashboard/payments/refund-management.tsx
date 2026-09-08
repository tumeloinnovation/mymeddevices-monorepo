"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw,
  Search,
  Check,
  X,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiClient } from "@mymeddevices/shared-core";




interface Refund {
  id: string;
  transaction_id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  refund_fee: number | null;
  net_refund: number | null;
  status: string;
  reason: string;
  reason_details: string | null;
  phone_number: string;
  reversal_id: string | null;
  mpesa_receipt: string | null;
  initiated_at: string;
  processed_at: string | null;
  completed_at: string | null;
  failure_reason: string | null;
  transaction_merchant_request_id: string | null;
  transaction_mpesa_receipt: string | null;
}

interface PaginationData {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function RefundManagement() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    page_size: 25,
    total_pages: 0,
  });

  const [filters, setFilters] = useState({
    status: "",
  });

  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");

  const fetchRefunds = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.page_size),
      });

      if (filters.status) params.append("status", filters.status);

      const data = await apiClient.get<any>(`/returns/admin/list?${params}`).catch(() => ({ items: [], total: 0, page: 1, limit: pagination.page_size }));
      const items = data?.items || [];

      setRefunds(
        items.map((r: any) => ({
          id: r.id,
          transaction_id: r.return_number || r.refund_transaction_id || r.id,
          order_id: r.order_id || null,
          amount: r.refund_amount || 0,
          currency: "KES",
          refund_fee: 0,
          net_refund: r.refund_amount || 0,
          status: r.status || "pending",
          reason: r.reason || "Customer return",
          reason_details: r.description || null,
          phone_number: "—",
          reversal_id: null,
          mpesa_receipt: r.refund_transaction_id || null,
          initiated_at: r.created_at || new Date().toISOString(),
          processed_at: r.resolved_at || null,
          completed_at: r.status === 'completed' ? r.resolved_at : null,
          failure_reason: null,
        }))
      );

      const total = data?.total || items.length;
      setPagination({
        total,
        page: data?.page || page,
        page_size: data?.limit || pagination.page_size,
        total_pages: Math.ceil(total / (data?.limit || pagination.page_size)) || 1,
      });
    } catch (error) {
      console.error("Failed to load refunds:", error);
      toast.error("Failed to load refunds");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchRefunds();
  }, [filters]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <Check className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending Approval
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      customer_request: "Customer Request",
      product_defect: "Product Defect",
      wrong_item: "Wrong Item Delivered",
      order_cancelled: "Order Cancelled",
      duplicate_payment: "Duplicate Payment",
      price_adjustment: "Price Adjustment",
      service_not_provided: "Service Not Provided",
      other: "Other",
    };
    return labels[reason] || reason;
  };

  const handleApproveDialog = (refund: Refund) => {
    setSelectedRefund(refund);
    setApprovalNotes("");
    setApprovalDialogOpen(true);
  };

  const handleApprove = async (approved: boolean) => {
    if (!selectedRefund) return;

    setApproving(true);
    try {
      await apiClient.put(`/returns/${selectedRefund.id}/status`, {
        status: approved ? "approved" : "rejected",
        notes: approvalNotes,
      });

      toast.success(
        approved
          ? "Refund approved and processed"
          : "Refund request rejected"
      );
      setApprovalDialogOpen(false);
      fetchRefunds(pagination.page);
    } catch (error) {
      console.error("Failed to approve refund:", error);
      toast.error("Failed to process refund approval");
    } finally {
      setApproving(false);
    }
  };


  const handleViewDetails = (refund: Refund) => {
    setSelectedRefund(refund);
    setDetailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Refund Management</h2>
          <p className="text-muted-foreground">
            Review and process refund requests.
          </p>
        </div>
        <Button onClick={() => fetchRefunds(pagination.page)} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Refund Requests</CardTitle>
              <CardDescription>
                {pagination.total} total refunds
              </CardDescription>
            </div>

            <div className="flex gap-3">
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : refunds.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No refund requests</h3>
              <p className="text-muted-foreground">
                Refund requests will appear here when initiated.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Refund ID</TableHead>
                      <TableHead>Transaction</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Net Refund</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Initiated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refunds.map((refund) => (
                      <TableRow key={refund.id}>
                        <TableCell className="font-mono text-xs">
                          {refund.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {refund.transaction_merchant_request_id ||
                            refund.transaction_mpesa_receipt ||
                            refund.transaction_id.slice(0, 8) + "..."}
                        </TableCell>
                        <TableCell>{refund.phone_number}</TableCell>
                        <TableCell className="font-medium">
                          {refund.currency} {refund.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium text-muted-foreground">
                          {refund.net_refund
                            ? `${refund.currency} ${refund.net_refund.toLocaleString()}`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {getReasonLabel(refund.reason)}
                          </span>
                          {refund.reason_details && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {refund.reason_details}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(refund.status)}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(refund.initiated_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {refund.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-emerald-600 hover:text-emerald-700"
                                  onClick={() => handleApproveDialog(refund)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleApproveDialog(refund)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(refund)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.page_size) + 1} to{" "}
                  {Math.min(pagination.page * pagination.page_size, pagination.total)} of{" "}
                  {pagination.total} refunds
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchRefunds(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchRefunds(pagination.page + 1)}
                    disabled={pagination.page >= pagination.total_pages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund Request</DialogTitle>
            <DialogDescription>
              Review the refund details and approve or reject the request.
            </DialogDescription>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-4 py-4">
              <div className="rounded-md border p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount:</span>
                  <span className="font-medium">
                    {selectedRefund.currency} {selectedRefund.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Refund Fee:</span>
                  <span className="font-medium">
                    {selectedRefund.refund_fee
                      ? `${selectedRefund.currency} ${selectedRefund.refund_fee.toLocaleString()}`
                      : "KES 50.00 (estimated)"}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Net Refund:</span>
                  <span className="font-bold text-emerald-600">
                    {selectedRefund.currency}{" "}
                    {(
                      (selectedRefund.net_refund || selectedRefund.amount) -
                      (selectedRefund.refund_fee || 50)
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Reason:</span>
                  <span className="text-sm">{getReasonLabel(selectedRefund.reason)}</span>
                </div>
                {selectedRefund.reason_details && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Details:</span>
                    <span className="text-sm">{selectedRefund.reason_details}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="approval-notes">Notes (optional)</Label>
                <Textarea
                  id="approval-notes"
                  placeholder="Add any notes about this approval/rejection..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleApprove(false)}
              disabled={approving}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => handleApprove(true)}
              disabled={approving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {approving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              <Check className="h-4 w-4 mr-2" />
              Approve & Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Details</DialogTitle>
            <DialogDescription>
              Complete refund information and processing history.
            </DialogDescription>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Refund ID</p>
                  <p className="font-mono">{selectedRefund.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div>{getStatusBadge(selectedRefund.status)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">
                    {selectedRefund.currency} {selectedRefund.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Net Refund</p>
                  <p className="font-medium">
                    {selectedRefund.net_refund
                      ? `${selectedRefund.currency} ${selectedRefund.net_refund.toLocaleString()}`
                      : "Processing..."}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Refund Fee</p>
                  <p>
                    {selectedRefund.refund_fee
                      ? `${selectedRefund.currency} ${selectedRefund.refund_fee.toLocaleString()}`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone Number</p>
                  <p>{selectedRefund.phone_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Initiated At</p>
                  <p>{new Date(selectedRefund.initiated_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Processed At</p>
                  <p>
                    {selectedRefund.processed_at
                      ? new Date(selectedRefund.processed_at).toLocaleString()
                      : "-"}
                  </p>
                </div>
              </div>

              {/* M-Pesa Details */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">M-Pesa Reversal Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Reversal ID</p>
                    <p className="font-mono">{selectedRefund.reversal_id || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Original Receipt</p>
                    <p className="font-mono">
                      {selectedRefund.mpesa_receipt ||
                      selectedRefund.transaction_mpesa_receipt ||
                      "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Failure Reason */}
              {selectedRefund.failure_reason && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    Failure Information
                  </h4>
                  <p className="text-sm text-destructive">
                    {selectedRefund.failure_reason}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
