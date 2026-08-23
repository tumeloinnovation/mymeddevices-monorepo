"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {

  ChevronLeft,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Ban,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Crown,
  Wrench,
  Eye,
  Building,
  CreditCard,
  Headphones,
  Package,
  Truck,
  Store,
  Users,
  Check,
  Trash2,
  AlertTriangle,
  UserCog,
  Sliders,
  ArrowRight,
  ShieldAlert,
  Key,
  RefreshCw,
  EyeOff,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import {
  usersService,
  type StaffDetail,
  type StaffPermissionsDetail,
} from "@mymeddevices/shared-core";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";


export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [permissionsDetail, setPermissionsDetail] = useState<StaffPermissionsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Customization Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [staffGranted, setStaffGranted] = useState<string[]>([]);
  const [staffRevoked, setStaffRevoked] = useState<string[]>([]);
  const [staffRoleEdit, setStaffRoleEdit] = useState<string>("");
  const [savingOverrides, setSavingOverrides] = useState(false);

  // Password reset state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(true);
  const [notifyUser, setNotifyUser] = useState(true);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [staffData, permData] = await Promise.all([
        usersService.getStaffMember(id),
        usersService.getStaffPermissions(id).catch(() => null),
      ]);

      if (staffData) {
        setStaff(staffData);
        if (permData) {
          setPermissionsDetail(permData);
          setStaffGranted(permData.granted_overrides || []);
          setStaffRevoked(permData.revoked_overrides || []);
          setStaffRoleEdit(permData.role || staffData.role || "worker");
        }
      } else {
        setError("Staff member not found");
      }
    } catch (err: any) {
      console.error("Failed to load staff details", err);
      const msg = err?.response?.data?.detail || err?.message || "Failed to load staff details";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleStatusToggle = async () => {
    if (!staff) return;
    setActionLoading(true);
    const action = staff.is_active ? "deactivate" : "activate";
    try {
      await usersService.updateStaffStatus(id, action);
      const nextActive = !staff.is_active;
      setStaff({
        ...staff,
        is_active: nextActive,
        status: nextActive ? "active" : "inactive",
      });
      toast.success(`Staff member account ${action}d successfully`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to update staff status";
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePrivileges = async () => {
    if (!staff) return;
    setSavingOverrides(true);
    try {
      const result = await usersService.updateStaffPermissions(id, {
        granted: staffGranted,
        revoked: staffRevoked,
        role: staffRoleEdit,
      });
      toast.success("Staff privileges updated successfully");
      setSheetOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update staff privileges");
    } finally {
      setSavingOverrides(false);
    }
  };

  const handleResetPrivileges = async () => {
    if (!staff) return;
    setSavingOverrides(true);
    try {
      await usersService.resetStaffPermissions(id);
      toast.success("Staff privileges reset to base role defaults");
      setStaffGranted([]);
      setStaffRevoked([]);
      setSheetOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to reset privileges");
    } finally {
      setSavingOverrides(false);
    }
  };

  const handleDelete = async () => {
    if (!staff) return;
    setDeleting(true);
    try {
      await usersService.deleteStaff(id);
      toast.success(`Staff member "${staff.name}" deleted successfully`);
      router.push("/dashboard/users/staff");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to delete staff member";
      toast.error(msg);
      setDeleting(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPasswordValue(password);
  };

  const handlePasswordReset = async () => {
    if (!passwordValue || passwordValue.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setPasswordSaving(true);
    try {
      await usersService.setStaffPassword(id, {
        password: passwordValue,
        force_change: forcePasswordChange,
        notify_user: notifyUser,
      });
      toast.success("Password updated successfully");
      setPasswordDialogOpen(false);
      setPasswordValue("");
      setShowPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setPasswordSaving(false);
    }
  };


  const getInitials = (name?: string) => {
    return (name || "Staff Member")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "ST";
  };

  const formatDate = (dateString?: string, formatTime = false) => {
    if (!dateString) return "Never";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    if (formatTime) {
      return d.toLocaleDateString("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    }
    return d.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getRoleBadge = (role?: string) => {
    const r = (role || "").toLowerCase();
    switch (r) {
      case "admin":
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 gap-1 font-medium">
            <Crown className="h-3 w-3" /> Administrator
          </Badge>
        );
      case "worker":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 gap-1 font-medium">
            <Wrench className="h-3 w-3" /> Operations Worker
          </Badge>
        );
      case "finance":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 gap-1 font-medium">
            <CreditCard className="h-3 w-3" /> Finance & Billing
          </Badge>
        );
      case "compliance":
        return (
          <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 gap-1 font-medium">
            <ShieldCheck className="h-3 w-3" /> Compliance & Quality
          </Badge>
        );
      case "support":
        return (
          <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300 gap-1 font-medium">
            <Headphones className="h-3 w-3" /> Customer Support
          </Badge>
        );
      case "logistics":
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 gap-1 font-medium">
            <Package className="h-3 w-3" /> Logistics Manager
          </Badge>
        );
      case "driver":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 gap-1 font-medium">
            <Truck className="h-3 w-3" /> Delivery Driver
          </Badge>
        );
      case "vendor":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 gap-1 font-medium">
            <Store className="h-3 w-3" /> Vendor Partner
          </Badge>
        );
      case "customer":
        return (
          <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 gap-1 font-medium">
            <Users className="h-3 w-3" /> Procurement Client
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1 font-medium">
            <Eye className="h-3 w-3" /> {role || "Member"}
          </Badge>
        );
    }
  };

  const getRolePermissions = (role?: string) => {
    const r = (role || "").toLowerCase();
    switch (r) {
      case "admin":
        return [
          { key: "users:manage", label: "User & Role Administration", desc: "Create, moderate, and suspend admin, worker, and customer accounts" },
          { key: "system:settings", label: "System Security & Configuration", desc: "Modify dynamic rate limits, security tokens, and payment gateways" },
          { key: "finance:reconcile", label: "Financial Reconciliations", desc: "Approve payouts, ledger audits, transaction refunds & VAT reports" },
          { key: "catalog:moderate", label: "Catalog & Device Moderation", desc: "Publish medical products and verify regulatory certifications" },
          { key: "vendors:approve", label: "Vendor Verification", desc: "Review and approve B2B medical distributor applications" },
          { key: "audit:view", label: "System Audit Logs", desc: "Access comprehensive platform operation logs and security trace history" },
        ];
      case "finance":
        return [
          { key: "finance:payouts", label: "Vendor Payout Processing", desc: "Initiate and track B2B vendor bank & M-Pesa disbursements" },
          { key: "finance:reconcile", label: "Payment Reconciliation", desc: "Reconcile M-Pesa STK push and bank transfer transactions" },
          { key: "finance:tax", label: "Tax & VAT Ledger", desc: "Generate VAT returns and gross margin reporting" },
          { key: "orders:read", label: "Order Transaction Receipts", desc: "Inspect customer receipts and vendor commissions" },
        ];
      case "compliance":
        return [
          { key: "catalog:kmpdb", label: "KMPDB / PPB Verification", desc: "Validate Kenya Pharmacy & Poisons Board device registrations" },
          { key: "catalog:ce_fda", label: "CE / FDA Medical Clearance", desc: "Verify international quality certifications for healthcare devices" },
          { key: "vendor:kyc", label: "Vendor KYC & Facility Licensing", desc: "Audit medical premises licensing and practitioner credentials" },
        ];
      case "support":
        return [
          { key: "tickets:resolve", label: "Customer Support Threads", desc: "Manage and resolve customer inquiry helpdesk tickets" },
          { key: "returns:process", label: "Return & Refund Approvals", desc: "Inspect defective equipment claims and trigger returns" },
          { key: "orders:view", label: "Order Lookup & Tracking", desc: "Inspect shipment status and customer delivery history" },
        ];
      case "logistics":
      case "driver":
        return [
          { key: "dispatch:manage", label: "Dispatch & Route Tracking", desc: "Assign shipments and monitor healthcare delivery drops" },
          { key: "orders:fulfill", label: "Fulfillment & Packing", desc: "Update parcel tracking status from warehouse to doorstep" },
          { key: "inventory:stock", label: "Inventory Transfers", desc: "Track medical equipment serial numbers and hub stock" },
        ];
      default:
        return [
          { key: "catalog:manage", label: "Catalog Operations", desc: "Create, update, and manage medical device listings" },
          { key: "orders:process", label: "Order Fulfillment", desc: "Review and process incoming procurement orders" },
          { key: "tickets:view", label: "Support Assistance", desc: "View and respond to assigned operational inquiries" },
        ];
    }
  };

  const getRoleBasedTabs = (role?: string) => {
    const r = (role || "").toLowerCase();
    const commonTabs = [
      { value: "overview", label: "Overview" },
      { value: "department", label: "Department" },
      { value: "security", label: "Security & Access" },
    ];

    // Add role-specific tabs
    switch (r) {
      case "admin":
        return [
          ...commonTabs,
          { value: "activity", label: "Activity Log" },
          { value: "permissions", label: "Advanced Permissions" },
        ];
      case "finance":
        return [
          ...commonTabs,
          { value: "transactions", label: "Financial Activity" },
          { value: "reports", label: "Reports" },
        ];
      case "support":
        return [
          ...commonTabs,
          { value: "tickets", label: "Support Tickets" },
          { value: "interactions", label: "Customer Interactions" },
        ];
      case "logistics":
      case "driver":
        return [
          ...commonTabs,
          { value: "deliveries", label: "Delivery History" },
          { value: "routes", label: "Route Assignments" },
        ];
      case "compliance":
        return [
          ...commonTabs,
          { value: "audits", label: "Compliance Audits" },
          { value: "certifications", label: "Certifications" },
        ];
      default:
        return commonTabs;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[450px] gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading member details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !staff) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-muted-foreground flex flex-col items-center justify-center gap-4">
          <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <XCircle className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Staff Member Not Found</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              {error || "The staff account you are looking for does not exist or may have been deleted."}
            </p>
          </div>
          <Button variant="outline" className="mt-2" asChild>
            <Link href="/dashboard/users/staff">
              <ChevronLeft className="mr-1.5 h-4 w-4" /> Back to Staff Directory
            </Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isActive = staff.is_active;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              asChild
              className="h-9 w-9 rounded-lg shrink-0"
            >
              <Link href="/dashboard/users/staff">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>

            <Avatar className="h-12 w-12 border shadow-xs shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
                {getInitials(staff.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{staff.name}</h1>
                {getRoleBadge(staff.role)}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-muted-foreground">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-muted text-muted-foreground border"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                  {isActive ? "Active Account" : "Inactive Access"}
                </span>
                <span>•</span>
                <span>
                  ID: <span className="font-mono text-foreground font-medium">{staff.id.slice(0, 8)}...</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setPasswordDialogOpen(true)} className="gap-2">
                  <Key className="h-4 w-4" /> Reset Password
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleStatusToggle}
                  disabled={actionLoading}
                  className={isActive ? "text-amber-600" : "text-emerald-600"}
                >
                  {isActive ? (
                    <>
                      <Ban className="mr-2 h-4 w-4" /> Deactivate Account
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Activate Account
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant={isActive ? "outline" : "default"}
              size="sm"
              onClick={handleStatusToggle}
              disabled={actionLoading}
              className="gap-1.5"
            >
              {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isActive ? "Deactivate" : "Activate Account"}
            </Button>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-card border shadow-xs">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Department</p>
                <p className="text-sm font-semibold text-foreground mt-1 truncate">{staff.department || "Operations"}</p>
              </div>
              <div className="border-l pl-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">System Role</p>
                <p className="text-sm font-semibold text-primary mt-1 uppercase">{staff.role || "worker"}</p>
              </div>
              <div className="border-l pl-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Account Status</p>
                <p className={`text-sm font-semibold mt-1 capitalize ${isActive ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {isActive ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="border-l pl-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Last Active</p>
                <p className="text-sm font-semibold text-foreground mt-1">{formatDate(staff.last_login)}</p>
              </div>
            </div>

            {/* Role-based Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-6">
                {getRoleBasedTabs(staff.role).map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none border-b-2 border-transparent data-active:border-primary data-active:text-primary font-semibold text-xs py-2.5 px-1 shadow-none"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-4 space-y-4">
                <div className="bg-card border rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">Account Overview</h3>
                      <p className="text-xs text-muted-foreground">Basic information and role assignment</p>
                    </div>
                    {getRoleBadge(staff.role)}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Full Name</p>
                      <p className="text-sm font-semibold text-foreground">{staff.first_name} {staff.last_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Email Address</p>
                      <p className="text-sm font-semibold text-foreground">{staff.email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Department</p>
                      <p className="text-sm font-semibold text-foreground">{staff.department || "Not Assigned"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</p>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-2 w-2 rounded-full ${staff.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                        <p className="text-sm font-semibold text-foreground">{staff.is_active ? "Active" : "Inactive"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permissions & Capabilities Overview */}
                <div className="bg-card border rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground text-sm">Active Role Capabilities</h3>
                        <Badge variant="outline" className="font-mono text-xs bg-primary/5 text-primary border-primary/20">
                          {permissionsDetail?.effective_permissions.length ?? (staff.permissions?.length || getRolePermissions(staff.role).length)} Granted
                        </Badge>
                        {permissionsDetail?.is_customized && (
                          <Badge className="bg-amber-500 text-white text-[10px] uppercase font-bold">
                            Custom Overrides Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Operational permissions governing catalog, orders, finance, and moderation access
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSheetOpen(true)}
                        className="text-xs h-8 gap-1.5"
                      >
                        <UserCog className="h-3.5 w-3.5" /> Customize Privileges
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        asChild
                        className="text-xs h-8 text-primary"
                      >
                        <Link href="/dashboard/settings/permissions">
                          Matrix Settings →
                        </Link>
                      </Button>
                    </div>
                  </div>

                  {permissionsDetail?.categories ? (
                    <div className="space-y-4 pt-1">
                      {permissionsDetail.categories.map((cat) => {
                        const effectiveSet = new Set(permissionsDetail.effective_permissions);
                        const baseSet = new Set(permissionsDetail.base_permissions);
                        const grantedSet = new Set(permissionsDetail.granted_overrides);
                        const revokedSet = new Set(permissionsDetail.revoked_overrides);

                        const catPerms = cat.permissions.filter((p: any) =>
                          effectiveSet.has(p.key) || grantedSet.has(p.key) || revokedSet.has(p.key)
                        );

                        if (catPerms.length === 0) return null;

                        return (
                          <div key={cat.id} className="space-y-2">
                            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
                              {cat.name}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {catPerms.map((p: any) => {
                                const isEffective = effectiveSet.has(p.key);
                                const isExtra = grantedSet.has(p.key);
                                const isRevoked = revokedSet.has(p.key);

                                return (
                                  <div
                                    key={p.key}
                                    className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${
                                      isRevoked
                                        ? "bg-destructive/5 border-destructive/20 opacity-60"
                                        : isExtra
                                        ? "bg-emerald-500/5 border-emerald-500/20"
                                        : "bg-muted/20"
                                    }`}
                                  >
                                    <div
                                      className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                        isRevoked
                                          ? "bg-destructive/10 text-destructive"
                                          : "bg-emerald-500/10 text-emerald-600"
                                      }`}
                                    >
                                      {isRevoked ? (
                                        <XCircle className="h-3.5 w-3.5" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="text-xs font-semibold text-foreground">
                                          {p.label}
                                        </p>
                                        {isExtra && (
                                          <Badge className="bg-emerald-600 text-white text-[9px] py-0 px-1">
                                            +Custom Grant
                                          </Badge>
                                        )}
                                        {isRevoked && (
                                          <Badge variant="destructive" className="text-[9px] py-0 px-1">
                                            -Revoked
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-muted-foreground mt-0.5">
                                        {p.description}
                                      </p>
                                      <span className="inline-block mt-1 font-mono text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
                                        {p.key}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {getRolePermissions(staff.role).map((perm) => (
                        <div key={perm.key} className="p-3 rounded-lg border bg-muted/20 flex items-start gap-3">
                          <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground">{perm.label}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{perm.desc}</p>
                            <span className="inline-block mt-1.5 font-mono text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
                              {perm.key}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Department Tab */}
              <TabsContent value="department" className="mt-4">
                <div className="p-5 bg-card border rounded-xl shadow-xs space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{staff.department || "Operations Division"}</h4>
                      <p className="text-xs text-muted-foreground">Internal Operational Group</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t">
                    Team members in this department participate in daily workflow execution, system records management, and cross-functional operations.
                  </p>
                </div>
              </TabsContent>


              {/* Security Tab */}
              <TabsContent value="security" className="mt-4">
                <div className="p-5 bg-card border rounded-xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-xs font-medium text-foreground">Email Verification</span>
                    <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                      {staff.is_verified ? "Verified" : "Pending Verification"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-1 border-t">
                    <span className="text-xs font-medium text-foreground">Access State</span>
                    <Badge variant="outline" className={isActive ? "text-emerald-600" : "text-muted-foreground"}>
                      {isActive ? "Allowed (Active)" : "Blocked (Inactive)"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-1 border-t">
                    <span className="text-xs font-medium text-foreground">Authentication Policy</span>
                    <span className="text-xs text-muted-foreground">RS256 JWT Token Session</span>
                  </div>
                </div>
              </TabsContent>

              {/* Role-specific tab placeholders */}
              {getRoleBasedTabs(staff.role).filter(t => !["overview", "department", "security"].includes(t.value)).map((tab) => (
                <TabsContent key={tab.value} value={tab.value} className="mt-4">
                  <div className="p-8 bg-card border rounded-xl shadow-xs text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Building className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">{tab.label}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          This section will display {tab.label.toLowerCase()} for {staff.first_name} {staff.last_name}.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Account Details Card */}
            <div className="bg-card border rounded-xl p-5 shadow-xs space-y-3.5">
              <h3 className="font-semibold text-foreground text-sm">Account Overview</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Full Name</span>
                  <span className="font-medium text-foreground">{staff.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Assigned Role</span>
                  <span className="font-mono text-foreground uppercase font-semibold">{staff.role}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium text-foreground">{staff.department || "Operations"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Joined Date</span>
                  <span className="font-medium text-foreground">{formatDate(staff.joined_date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Login</span>
                  <span className="font-medium text-foreground">{formatDate(staff.last_login, true)}</span>
                </div>
              </div>
            </div>

            {/* Direct Contact Card */}
            <div className="bg-card border rounded-xl p-5 shadow-xs space-y-3.5">
              <h3 className="font-semibold text-foreground text-sm">Contact Information</h3>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg border bg-muted/20 text-xs flex items-center justify-between gap-2">
                  <span className="truncate text-foreground font-medium">{staff.email}</span>
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </div>
                {staff.phone && (
                  <div className="p-2.5 rounded-lg border bg-muted/20 text-xs flex items-center justify-between gap-2">
                    <span className="text-foreground font-medium">{staff.phone}</span>
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  </div>
                )}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-card border border-destructive/20 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-destructive text-sm font-semibold">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Permanently delete this user account. This will invalidate all active sessions and revoke portal credentials.
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-2 mt-1"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete Member Account
              </Button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Alert Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-2.5 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <AlertDialogTitle>Delete Member Account</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-sm text-muted-foreground pt-1">
                Are you sure you want to delete <strong className="text-foreground">{staff?.name}</strong> ({staff?.email})? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-2">
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete();
                }}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete Account"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Customization Sheet for Staff Privileges */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="sm:max-w-xl flex flex-col justify-between overflow-y-auto p-0">
            <div className="p-6 border-b bg-muted/20">
              <SheetHeader>
                <SheetTitle className="text-base font-bold flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-primary" />
                  Customize Staff Privileges
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Fine-tune granular capabilities for {staff?.name}
                </SheetDescription>
              </SheetHeader>

              {staff && (
                <div className="mt-4 p-3 bg-card rounded-xl border flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                        {getInitials(staff.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-xs text-foreground">{staff.name}</p>
                      <p className="text-[11px] text-muted-foreground">{staff.email}</p>
                    </div>
                  </div>

                  <div className="w-[140px]">
                    <Select value={staffRoleEdit} onValueChange={setStaffRoleEdit}>
                      <SelectTrigger className="text-xs h-7.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {permissionsDetail?.available_roles ? (
                          permissionsDetail.available_roles.map((r: any) => (
                            <SelectItem key={r.key} value={r.key} className="text-xs">
                              {r.label}
                            </SelectItem>
                          ))
                        ) : (
                          <>
                            <SelectItem value="admin" className="text-xs">Admin</SelectItem>
                            <SelectItem value="worker" className="text-xs">Worker</SelectItem>
                            <SelectItem value="finance" className="text-xs">Finance</SelectItem>
                            <SelectItem value="compliance" className="text-xs">Compliance</SelectItem>
                            <SelectItem value="support" className="text-xs">Support</SelectItem>
                            <SelectItem value="logistics" className="text-xs">Logistics</SelectItem>
                            <SelectItem value="driver" className="text-xs">Driver</SelectItem>
                            <SelectItem value="viewer" className="text-xs">Viewer</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border text-xs">
                <div>
                  <span className="text-muted-foreground">Override State: </span>
                  <span className="font-semibold text-foreground">
                    {staffGranted.length > 0 || staffRevoked.length > 0
                      ? `Modified (+${staffGranted.length} granted, -${staffRevoked.length} revoked)`
                      : "Standard Role Defaults"}
                  </span>
                </div>
                {(staffGranted.length > 0 || staffRevoked.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetPrivileges}
                    disabled={savingOverrides}
                    className="text-xs h-6 px-2 text-destructive hover:text-destructive"
                  >
                    Clear All Overrides
                  </Button>
                )}
              </div>

              {permissionsDetail?.categories && (
                <div className="space-y-4">
                  {permissionsDetail.categories.map((cat: any) => {
                    const basePerms = new Set(permissionsDetail.base_permissions);
                    return (
                      <div key={cat.id} className="border rounded-xl p-3.5 space-y-2 bg-card">
                        <h4 className="font-bold text-xs text-foreground flex items-center justify-between">
                          <span>{cat.name}</span>
                        </h4>
                        <div className="space-y-2 pt-1">
                          {cat.permissions.map((p: any) => {
                            const isBaseGranted = basePerms.has(p.key);
                            const isExplicitlyGranted = staffGranted.includes(p.key);
                            const isExplicitlyRevoked = staffRevoked.includes(p.key);
                            const isEffective = (isBaseGranted || isExplicitlyGranted) && !isExplicitlyRevoked;

                            return (
                              <div
                                key={p.key}
                                className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-medium text-foreground">
                                      {p.label}
                                    </span>
                                    {isExplicitlyGranted && (
                                      <Badge className="bg-emerald-600 text-white text-[9px] py-0 px-1">
                                        +Extra Granted
                                      </Badge>
                                    )}
                                    {isExplicitlyRevoked && (
                                      <Badge variant="destructive" className="text-[9px] py-0 px-1">
                                        -Revoked
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {p.description}
                                  </p>
                                </div>

                                <Switch
                                  checked={isEffective}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      if (isBaseGranted) {
                                        setStaffRevoked((prev) => prev.filter((k) => k !== p.key));
                                      } else {
                                        setStaffGranted((prev) => Array.from(new Set([...prev, p.key])));
                                      }
                                    } else {
                                      if (isBaseGranted) {
                                        setStaffRevoked((prev) => Array.from(new Set([...prev, p.key])));
                                      } else {
                                        setStaffGranted((prev) => prev.filter((k) => k !== p.key));
                                      }
                                    }
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-muted/20 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSheetOpen(false)}
                disabled={savingOverrides}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSavePrivileges}
                disabled={savingOverrides}
                className="text-xs h-8"
              >
                {savingOverrides ? "Saving..." : "Apply Privileges"}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Password Reset Dialog */}
        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Reset Staff Password
              </DialogTitle>
              <DialogDescription>
                Set a new password for {staff?.name}. You can generate a random secure password or enter a custom one.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="staff-password">New Password</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="staff-password"
                      type={showPassword ? "text" : "password"}
                      value={passwordValue}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      placeholder="Enter new password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={generateRandomPassword}
                    className="shrink-0"
                    title="Generate random password"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                {passwordValue && (
                  <p className="text-xs text-muted-foreground">
                    Password strength: {passwordValue.length < 8 ? "Weak" : passwordValue.length < 12 ? "Medium" : "Strong"}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="staff-force-change" className="cursor-pointer">
                    Require password change on next login
                  </Label>
                  <input
                    id="staff-force-change"
                    type="checkbox"
                    checked={forcePasswordChange}
                    onChange={(e) => setForcePasswordChange(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Staff member will be prompted to create their own password after logging in.
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="staff-notify-user" className="cursor-pointer">
                    Send email notification to staff
                  </Label>
                  <input
                    id="staff-notify-user"
                    type="checkbox"
                    checked={notifyUser}
                    onChange={(e) => setNotifyUser(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Staff member will receive an email informing them of the password change.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setPasswordDialogOpen(false);
                  setPasswordValue("");
                  setShowPassword(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordReset}
                disabled={!passwordValue || passwordValue.length < 8 || passwordSaving}
              >
                {passwordSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

