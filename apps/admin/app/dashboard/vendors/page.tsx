"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search, ExternalLink, CheckCircle2, XCircle, Ban, RotateCcw, ShieldAlert, MoreHorizontal, Building2, Plus } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { useAuthStore, VendorListItem, ApprovalStatus } from "@mymeddevices/shared-core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AddVendorModal } from "./add-vendor-modal";

const STATUS_OPTIONS: { label: string; value: ApprovalStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Suspended", value: "suspended" },
  { label: "Rejected", value: "rejected" },
];

const STATUS_BADGE = {
  pending: { variant: "outline" as const, label: "Pending" },
  approved: { variant: "default" as const, label: "Approved" },
  suspended: { variant: "secondary" as const, label: "Suspended" },
  rejected: { variant: "destructive" as const, label: "Rejected" },
};

const STATUS_COUNT_LABELS: Record<string, string> = {
  all: "All Vendors",
  pending: "Pending Review",
  approved: "Active",
  suspended: "Suspended",
  rejected: "Rejected",
};

export default function VendorsListPage() {
  const router = useRouter();
  const { listVendorsAdmin, approveVendor, rejectVendor, suspendVendor, reactivateVendor } = useAuthStore();
  const [vendors, setVendors] = useState<VendorListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [actionVendor, setActionVendor] = useState<VendorListItem | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "suspend" | "reactivate" | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [addVendorModalOpen, setAddVendorModalOpen] = useState(false);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, page_size: pageSize };
      if (statusFilter !== "all") params.status = statusFilter;
      const result = await listVendorsAdmin(params);
      
      // Handle potential wrapped response or missing fields
      const vendorsData = Array.isArray(result?.vendors) ? result.vendors : [];
      const totalCount = typeof result?.total === 'number' ? result.total : 0;
      
      setVendors(vendorsData);
      setTotal(totalCount);
    } catch (err) {
      console.error("Failed to fetch vendors:", err);
      toast.error("Failed to load vendors");
      setVendors([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [listVendorsAdmin, page, statusFilter]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const filteredVendors = searchQuery && Array.isArray(vendors)
    ? vendors.filter(v =>
        v.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : (Array.isArray(vendors) ? vendors : []);

  const totalPages = Math.ceil(total / pageSize);

  const handleAction = async () => {
    if (!actionVendor || !actionType) return;
    setActionLoading(true);
    try {
      if (actionType === "approve") {
        await approveVendor(actionVendor.id);
      } else if (actionType === "reject") {
        if (!actionReason) { toast.error("A reason is required for rejection"); setActionLoading(false); return; }
        await rejectVendor(actionVendor.id, actionReason);
      } else if (actionType === "suspend") {
        if (!actionReason) { toast.error("A reason is required for suspension"); setActionLoading(false); return; }
        await suspendVendor(actionVendor.id, actionReason);
      } else if (actionType === "reactivate") {
        await reactivateVendor(actionVendor.id);
      }
      setActionVendor(null);
      setActionType(null);
      setActionReason("");
      fetchVendors();
    } catch {
      // toast already handled by store
    } finally {
      setActionLoading(false);
    }
  };

  const openAction = (vendor: VendorListItem, type: "approve" | "reject" | "suspend" | "reactivate") => {
    setActionVendor(vendor);
    setActionType(type);
    setActionReason("");
  };

  const vendorsList = Array.isArray(vendors) ? vendors : [];
  const counts = {
    all: total,
    pending: vendorsList.filter(v => v.approval_status === "pending").length,
    approved: vendorsList.filter(v => v.approval_status === "approved").length,
    suspended: vendorsList.filter(v => v.approval_status === "suspended").length,
    rejected: vendorsList.filter(v => v.approval_status === "rejected").length,
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
            <p className="text-muted-foreground">Manage vendor applications and profiles</p>
          </div>
          <Button onClick={() => setAddVendorModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {STATUS_OPTIONS.map(opt => (
            <Card
              key={opt.value}
              className={`cursor-pointer transition-colors hover:bg-accent ${statusFilter === opt.value ? "ring-2 ring-primary" : ""}`}
              onClick={() => { setStatusFilter(opt.value); setPage(1); }}
            >
              <CardHeader className="p-3">
                <CardTitle className="text-lg">{totalPages ? (opt.value === "all" ? total : vendorsList.filter(v => v.approval_status === opt.value).length) : 0}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 text-sm text-muted-foreground">
                {STATUS_COUNT_LABELS[opt.value]}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>{STATUS_COUNT_LABELS[statusFilter]}</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <Building2 className="size-8 mb-2" />
                <p>No vendors found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Store Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map(vendor => {
                    const badge = STATUS_BADGE[vendor.approval_status];
                    return (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.company_name || "—"}</TableCell>
                        <TableCell>{vendor.store_name || "—"}</TableCell>
                        <TableCell>{vendor.email}</TableCell>
                        <TableCell>
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(vendor.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/dashboard/vendors/${vendor.id}`}>
                                <ExternalLink className="size-4" />
                              </Link>
                            </Button>
                            {vendor.approval_status === "pending" && (
                              <>
                                <Button variant="ghost" size="icon" className="text-green-600" onClick={() => openAction(vendor, "approve")}>
                                  <CheckCircle2 className="size-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openAction(vendor, "reject")}>
                                  <XCircle className="size-4" />
                                </Button>
                              </>
                            )}
                            {vendor.approval_status === "approved" && (
                              <Button variant="ghost" size="icon" className="text-amber-600" onClick={() => openAction(vendor, "suspend")}>
                                <Ban className="size-4" />
                              </Button>
                            )}
                            {vendor.approval_status === "suspended" && (
                              <Button variant="ghost" size="icon" className="text-green-600" onClick={() => openAction(vendor, "reactivate")}>
                                <RotateCcw className="size-4" />
                              </Button>
                            )}
                            {vendor.approval_status === "rejected" && (
                              <Button variant="ghost" size="icon" className="text-green-600" onClick={() => openAction(vendor, "approve")}>
                                <CheckCircle2 className="size-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({total} total)
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!actionVendor} onOpenChange={open => !open && setActionVendor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "Approve Vendor"}
              {actionType === "reject" && "Reject Vendor"}
              {actionType === "suspend" && "Suspend Vendor"}
              {actionType === "reactivate" && "Reactivate Vendor"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" && `Are you sure you want to approve ${actionVendor?.company_name || actionVendor?.email}?`}
              {actionType === "reject" && `Are you sure you want to reject ${actionVendor?.company_name || actionVendor?.email}?`}
              {actionType === "suspend" && `Are you sure you want to suspend ${actionVendor?.company_name || actionVendor?.email}?`}
              {actionType === "reactivate" && `Reactivate ${actionVendor?.company_name || actionVendor?.email}?`}
            </DialogDescription>
          </DialogHeader>
          {(actionType === "reject" || actionType === "suspend") && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={actionReason}
                onChange={e => setActionReason(e.target.value)}
                placeholder="Provide a reason for this action..."
                className="h-20"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionVendor(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              variant={actionType === "reject" ? "destructive" : "default"}
              onClick={handleAction}
              disabled={actionLoading || ((actionType === "reject" || actionType === "suspend") && !actionReason)}
            >
              {actionLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
              {actionType === "approve" && "Approve"}
              {actionType === "reject" && "Reject"}
              {actionType === "suspend" && "Suspend"}
              {actionType === "reactivate" && "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddVendorModal
        open={addVendorModalOpen}
        onOpenChange={setAddVendorModalOpen}
        onSuccess={fetchVendors}
      />
    </DashboardLayout>
  );
}
