"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ExternalLink,
  Eye,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";

interface Transaction {
  id: string;
  payment_method_id: string;
  payment_method_name: string | null;
  order_id: string | null;
  transaction_type: string;
  status: string;
  amount: number;
  currency: string;
  fee: number | null;
  total_amount: number | null;
  phone_number: string;
  merchant_request_id: string | null;
  checkout_request_id: string | null;
  mpesa_receipt: string | null;
  transaction_date: string | null;
  response_description: string | null;
  failure_reason: string | null;
  created_at: string;
}

interface PaginationData {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    page_size: 25,
    total_pages: 0,
  });

  const [filters, setFilters] = useState({
    status: "",
    phone_number: "",
    search: "",
  });

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        skip: String((page - 1) * pagination.page_size),
        limit: String(pagination.page_size),
      });

      if (filters.status) params.append("status", filters.status);
      if (filters.phone_number) params.append("phone_number", filters.phone_number);

      const response = await fetch(`/api/v1/payments/transactions?${params}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");

      const data = await response.json();
      setTransactions(data.transactions || []);
      setPagination({
        total: data.total,
        page: data.page,
        page_size: data.page_size,
        total_pages: Math.ceil(data.total / data.page_size),
      });
    } catch (error) {
      console.error("Failed to load transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
      case "awaiting_user_action":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            {status === "awaiting_user_action" ? "Awaiting Action" : "Pending"}
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary">
            Cancelled
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case "refunded":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Transaction History</h2>
          <p className="text-muted-foreground">
            View and filter all payment transactions.
          </p>
        </div>
        <Button onClick={() => fetchTransactions(pagination.page)} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                {pagination.total} total transactions
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search phone..."
                  value={filters.phone_number}
                  onChange={(e) => setFilters({ ...filters, phone_number: e.target.value })}
                  className="pl-10 w-48"
                />
              </div>

              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="awaiting_user_action">Awaiting Action</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
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
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions found</h3>
              <p className="text-muted-foreground">
                Transactions will appear here once payments are processed.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>M-Pesa Receipt</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-xs">
                          {transaction.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {transaction.order_id ? (
                            <Link
                              href={`/dashboard/orders/${transaction.order_id}`}
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {transaction.order_id.slice(0, 8)}...
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>{transaction.phone_number}</TableCell>
                        <TableCell className="font-medium">
                          {transaction.currency} {transaction.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="font-mono text-xs">
                          {transaction.mpesa_receipt || "-"}
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(transaction)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
                  {pagination.total} transactions
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(pagination.page + 1)}
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

      {/* Transaction Details Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Full transaction information and status.
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Transaction ID</p>
                  <p className="font-mono text-sm">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div>{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">
                    {selectedTransaction.currency} {selectedTransaction.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fee</p>
                  <p className="font-medium">
                    {selectedTransaction.fee
                      ? `${selectedTransaction.currency} ${selectedTransaction.fee.toLocaleString()}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-medium">
                    {selectedTransaction.total_amount
                      ? `${selectedTransaction.currency} ${selectedTransaction.total_amount.toLocaleString()}`
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{selectedTransaction.phone_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono text-sm">
                    {selectedTransaction.order_id || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created At</p>
                  <p className="text-sm">
                    {new Date(selectedTransaction.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* M-Pesa Details */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">M-Pesa Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Merchant Request ID</p>
                    <p className="font-mono">{selectedTransaction.merchant_request_id || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Checkout Request ID</p>
                    <p className="font-mono">{selectedTransaction.checkout_request_id || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">M-Pesa Receipt</p>
                    <p className="font-mono">{selectedTransaction.mpesa_receipt || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Transaction Date</p>
                    <p>
                      {selectedTransaction.transaction_date
                        ? new Date(selectedTransaction.transaction_date).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Response Details */}
              {(selectedTransaction.response_description || selectedTransaction.failure_reason) && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Response Details</h4>
                  {selectedTransaction.response_description && (
                    <div className="mb-2">
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm">{selectedTransaction.response_description}</p>
                    </div>
                  )}
                  {selectedTransaction.failure_reason && (
                    <div>
                      <p className="text-sm text-muted-foreground">Failure Reason</p>
                      <p className="text-sm text-destructive">{selectedTransaction.failure_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
