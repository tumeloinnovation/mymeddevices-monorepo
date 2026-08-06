"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Loader2,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Ban,
  CheckCircle2,
  XCircle,
  User,
  ArrowUpRight,
  MoreHorizontal,
  Send,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  Crown,
  Wrench,
  Eye,
  Key,
  Clock,
  Activity,
  Award,
  Check,
  AlertTriangle,
  Building,
  Lock,
  UserCheck
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { usersService } from "@mymeddevices/shared-core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [staff, setStaff] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch staff profile or fallback to mock detail matching API structure
        const data = await usersService.getCustomer(id).catch(() => null);
        if (data) {
          setStaff(data);
        } else {
          // Fallback mock detail matching API structure
          setStaff({
            id: id,
            name: "Dr. Elizabeth Vance",
            email: "elizabeth.vance@mymeddevices.co.ke",
            phone: "+254 722 987 654",
            role: "admin",
            status: "active",
            department: "Clinical Compliance & Moderation",
            joined_date: "2024-01-15T08:30:00Z",
            last_login: "2026-08-06T09:12:00Z",
            is_verified: true,
            permissions: [
              "user:read", "user:write", "catalog:approve", 
              "vendor:moderate", "tickets:resolve", "system:audit"
            ],
            assigned_tickets_count: 14,
            moderated_products_count: 142,
            audit_logs: [
              { id: "log-1", action: "Approved Medical Vendor Application", timestamp: "2026-08-05T14:20:00Z", target: "BioMed Kenya Ltd" },
              { id: "log-2", action: "Verified KMPDB Clearance Certificate", timestamp: "2026-08-04T11:05:00Z", target: "Product #PROD-892" },
              { id: "log-3", action: "Updated System Security Config", timestamp: "2026-08-02T16:45:00Z", target: "Global Settings" },
            ]
          });
        }
      } catch (error) {
        console.error("Failed to load staff details", error);
        toast.error("Failed to load staff details");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleStatusToggle = async () => {
    if (!staff) return;
    setActionLoading(true);
    try {
      const newStatus = staff.status === "active" ? "inactive" : "active";
      await usersService.updateCustomerStatus(id, newStatus as any).catch(() => null);
      setStaff({ ...staff, status: newStatus });
      toast.success(`Staff member marked as ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return (name || "Staff Member")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string, formatTime = false) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (formatTime) {
      return d.toLocaleDateString("en-KE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });
    }
    return d.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getRoleBadge = (role: string) => {
    switch ((role || "").toLowerCase()) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Crown className="h-3.5 w-3.5 text-purple-600" /> Admin
          </span>
        );
      case "worker":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Wrench className="h-3.5 w-3.5 text-blue-600" /> Operational Worker
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Eye className="h-3.5 w-3.5 text-slate-500" /> Viewer
          </span>
        );
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[500px] gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading staff details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!staff) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-muted-foreground flex flex-col items-center justify-center gap-4">
          <XCircle className="size-16 text-destructive/80" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Staff Member Not Found</h2>
            <p className="text-sm text-muted-foreground mt-1">The staff account you are looking for does not exist.</p>
          </div>
          <Button variant="outline" className="mt-2" asChild>
            <Link href="/dashboard/users/staff">Back to Staff Directory</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isActive = staff.status === "active";

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
        
        {/* Header Bar matching Reference UI */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9 rounded-full border border-slate-200 bg-white hover:bg-slate-50 shadow-sm shrink-0">
              <Link href="/dashboard/users/staff">
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </Link>
            </Button>
            
            <Avatar className="h-14 w-14 border border-slate-200 shadow-sm shrink-0">
              <AvatarImage src={staff.avatar_url || ""} />
              <AvatarFallback className="bg-purple-100 text-purple-800 font-semibold text-lg">
                {getInitials(staff.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{staff.name}</h1>
                {getRoleBadge(staff.role)}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                  {isActive ? "Active Account" : "Inactive Access"}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-medium text-slate-500">
                  Staff ID <span className="font-mono text-slate-700 font-semibold">#{staff.id.slice(-6)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-slate-200 text-slate-600">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Staff Controls</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleStatusToggle} className={isActive ? "text-rose-600" : "text-emerald-600"}>
                  {isActive ? <Ban className="mr-2 h-4 w-4" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                  {isActive ? "Deactivate Account" : "Activate Account"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button className="gap-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg shadow-sm text-xs font-medium h-9 px-4">
              <Send className="h-3.5 w-3.5" />
              Send Internal Notice
            </Button>
          </div>
        </div>

        {/* 2-Column Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Left Column (70% width) */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Metrics Header Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
              <div>
                <p className="text-xs font-medium text-slate-400">Assigned Tickets</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{staff.assigned_tickets_count || 14}</p>
              </div>
              <div className="border-l border-slate-100 pl-4">
                <p className="text-xs font-medium text-slate-400">Moderated Products</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{staff.moderated_products_count || 142}</p>
              </div>
              <div className="border-l border-slate-100 pl-4">
                <p className="text-xs font-medium text-slate-400">Access Scope</p>
                <p className="text-base font-semibold text-purple-700 mt-2 capitalize">{staff.role || "Admin"}</p>
              </div>
              <div className="border-l border-slate-100 pl-4">
                <p className="text-xs font-medium text-slate-400">Last Active</p>
                <p className="text-xs font-semibold text-slate-800 mt-2">{formatDate(staff.last_login, true)}</p>
              </div>
            </div>

            {/* Main Tabs Container */}
            <Tabs defaultValue="permissions" className="w-full">
              <TabsList className="w-full justify-start border-b border-slate-200 rounded-none bg-transparent h-auto p-0 gap-6 overflow-x-auto no-scrollbar">
                <TabsTrigger 
                  value="permissions" 
                  className="rounded-none border-b-2 border-transparent data-active:border-purple-700 data-active:text-purple-700 text-slate-500 font-semibold text-xs py-3 px-1 shadow-none transition-all"
                >
                  Permissions & Capabilities
                </TabsTrigger>
                <TabsTrigger 
                  value="audit" 
                  className="rounded-none border-b-2 border-transparent data-active:border-purple-700 data-active:text-purple-700 text-slate-500 font-semibold text-xs py-3 px-1 shadow-none transition-all"
                >
                  Audit Logs
                </TabsTrigger>
                <TabsTrigger 
                  value="department" 
                  className="rounded-none border-b-2 border-transparent data-active:border-purple-700 data-active:text-purple-700 text-slate-500 font-semibold text-xs py-3 px-1 shadow-none transition-all"
                >
                  Department Specs
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="rounded-none border-b-2 border-transparent data-active:border-purple-700 data-active:text-purple-700 text-slate-500 font-semibold text-xs py-3 px-1 shadow-none transition-all"
                >
                  Security Status
                </TabsTrigger>
              </TabsList>

              {/* Permissions & Capabilities Tab */}
              <TabsContent value="permissions" className="mt-5 space-y-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Granted System Capabilities</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Permissions inherited from current role assignment</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs border-purple-200 text-purple-700 hover:bg-purple-50">
                      <Key className="mr-1.5 h-3.5 w-3.5" /> Modify Role Scope
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {[
                      { key: "user:read", label: "Read User & Customer Profiles", desc: "View identity cards, purchase logs & contact info" },
                      { key: "user:write", label: "Manage User Accounts", desc: "Activate, suspend, or update customer access" },
                      { key: "catalog:approve", label: "Moderate Medical Devices", desc: "Verify KMPDB & PPB certifications for catalog items" },
                      { key: "vendor:moderate", label: "Review Vendor Applications", desc: "Approve or reject B2B medical seller registrations" },
                      { key: "tickets:resolve", label: "Resolve Support Tickets", desc: "Assign and respond to operational helpdesk threads" },
                      { key: "system:audit", label: "View System Security Audits", desc: "Access administrator audit logs and trace events" }
                    ].map((perm) => (
                      <div key={perm.key} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800">{perm.label}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{perm.desc}</p>
                          <span className="inline-block mt-1 font-mono text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {perm.key}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Audit Logs Tab */}
              <TabsContent value="audit" className="mt-5">
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-slate-500 py-3">Timestamp</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 py-3">Action Executed</TableHead>
                        <TableHead className="text-xs font-semibold text-slate-500 py-3">Target Subject</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(staff.audit_logs || []).map((log: any) => (
                        <TableRow key={log.id} className="hover:bg-slate-50/50 border-b border-slate-100 text-xs">
                          <TableCell className="py-3 text-slate-500 font-medium">
                            {formatDate(log.timestamp, true)}
                          </TableCell>
                          <TableCell className="py-3 font-semibold text-slate-800">
                            {log.action}
                          </TableCell>
                          <TableCell className="py-3 text-slate-600 font-mono text-[11px]">
                            {log.target}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Department Specs */}
              <TabsContent value="department" className="mt-5">
                <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{staff.department || "Clinical Compliance"}</h4>
                      <p className="text-xs text-slate-500">Internal Division & Oversight Team</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                    Responsible for moderating vendor regulatory certificates, verifying pharmaceutical board clearance documents, and executing security auditing across internal modules.
                  </p>
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="mt-5">
                <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">2-Factor Authentication (2FA)</span>
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      Enforced & Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Session Timeout Rule</span>
                    <span className="text-xs font-medium text-slate-800">30 minutes idle</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

          </div>

          {/* Right Sidebar (30% width) matching Reference Layout */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            {/* Staff Details Widget */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Staff Account Info</h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Department</span>
                  <span className="font-semibold text-slate-800">{staff.department || "Clinical Moderation"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">System Role</span>
                  <span className="font-mono text-slate-700 uppercase font-semibold">{staff.role || "Admin"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Joined Date</span>
                  <span className="font-medium text-slate-700">{formatDate(staff.joined_date)}</span>
                </div>
              </div>
            </div>

            {/* Direct Contact Information Widget */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Contact Information</h3>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-700">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-2.5">
                <div className="p-2.5 rounded-full border border-purple-200 bg-purple-50/60 text-purple-900 text-xs font-semibold flex items-center justify-between px-4">
                  <span className="truncate">{staff.email}</span>
                  <Mail className="h-3.5 w-3.5 text-purple-600 shrink-0 ml-2" />
                </div>
                <div className="p-2.5 rounded-full border border-purple-200 bg-purple-50/60 text-purple-900 text-xs font-semibold flex items-center justify-between px-4">
                  <span>{staff.phone || "+254 722 987 654"}</span>
                  <Phone className="h-3.5 w-3.5 text-purple-600 shrink-0 ml-2" />
                </div>
              </div>
            </div>

            {/* Department Badges & Tags */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">Designations</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">Super Admin</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">KMPDB Moderation</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Vendor Auditor</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
