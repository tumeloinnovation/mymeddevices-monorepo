"use client";

import { useState, useEffect } from "react";
import {
  UserCog,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Mail,
  Shield,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Ban,
  CheckCircle,
  XCircle,
  Download,
  RefreshCw,
  Crown,
  Wrench,
  Eye,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { usersService, type StaffMember as ApiStaffMember } from "@mymeddevices/shared-core";

type StaffRole = "admin" | "worker" | "viewer";
type StaffStatus = "active" | "inactive" | "pending";

// Local interface extending API type with UI-specific properties
interface StaffMember extends ApiStaffMember {
  permissions: string[];
  avatar?: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | StaffRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | StaffStatus>("all");
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    async function loadStaff() {
      setLoading(true);
      try {
        const response = await usersService.getStaff({
          search: search || undefined,
          role_filter: (roleFilter === "admin" || roleFilter === "worker") ? roleFilter : undefined,
          status_filter: statusFilter === "all" ? undefined : statusFilter,
          page: pagination.page,
          page_size: pagination.pageSize,
        });

        // Add empty permissions array for UI display
        const staffWithPermissions = response.staff.map((member) => ({
          ...member,
          permissions: [], // Will be populated from permissions system later
          avatar: undefined,
        }));

        setStaff(staffWithPermissions);
        setPagination({
          page: response.page,
          pageSize: response.page_size,
          total: response.total,
          totalPages: response.total_pages,
        });
      } catch (error) {
        console.error("Failed to load staff", error);
        setStaff([]);
        setPagination((prev) => ({ ...prev, total: 0, totalPages: 0 }));
      } finally {
        setLoading(false);
      }
    }
    loadStaff();
  }, [search, roleFilter, statusFilter, pagination.page]);

  const getRoleBadge = (role: StaffRole) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-100 text-purple-800"><Crown className="mr-1 h-3 w-3" /> Admin</Badge>;
      case "worker":
        return <Badge className="bg-blue-100 text-blue-800"><Wrench className="mr-1 h-3 w-3" /> Worker</Badge>;
      case "viewer":
        return <Badge variant="secondary"><Eye className="mr-1 h-3 w-3" /> Viewer</Badge>;
    }
  };

  const getStatusBadge = (status: StaffStatus) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="mr-1 h-3 w-3" /> Active</Badge>;
      case "inactive":
        return <Badge variant="secondary"><XCircle className="mr-1 h-3 w-3" /> Inactive</Badge>;
      case "pending":
        return <Badge variant="outline"><Calendar className="mr-1 h-3 w-3" /> Pending</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleSelectAll = () => {
    if (selectedStaff.size === staff.length) {
      setSelectedStaff(new Set());
    } else {
      setSelectedStaff(new Set(staff.map((s) => s.id)));
    }
  };

  const toggleSelectStaff = (id: string) => {
    const newSelected = new Set(selectedStaff);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedStaff(newSelected);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-KE", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
            <p className="text-muted-foreground">
              Manage admin, worker, and viewer accounts with role-based permissions.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/users">
                <ChevronLeft className="mr-2 h-4 w-4" /> Back to Users
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/users/staff/new">
                <Plus className="mr-2 h-4 w-4" /> Add Staff Member
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{pagination.total}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">All staff members</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Now</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{staff.filter((s) => s.status === "active").length}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Currently active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Calendar className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{staff.filter((s) => s.status === "pending").length}</div>
              )}
              <p className="text-xs text-amber-600 mt-1">Awaiting activation</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {new Set(staff.map((s) => s.department)).size}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Active departments</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Staff Members</CardTitle>
                <CardDescription>{pagination.total} staff accounts</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {selectedStaff.size > 0 && (
                  <Badge variant="secondary">{selectedStaff.size} selected</Badge>
                )}
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    {roleFilter === "all" ? "All Roles" : roleFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setRoleFilter("all")}>
                    All Roles
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setRoleFilter("admin")}>
                    <Crown className="mr-2 h-4 w-4 text-purple-500" /> Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("worker")}>
                    <Wrench className="mr-2 h-4 w-4 text-blue-500" /> Worker
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("viewer")}>
                    <Eye className="mr-2 h-4 w-4 text-gray-500" /> Viewer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    {statusFilter === "all" ? "All Status" : statusFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    All Status
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Active
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                    <XCircle className="mr-2 h-4 w-4 text-gray-500" /> Inactive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                    <Calendar className="mr-2 h-4 w-4 text-amber-500" /> Pending
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStaff.size === staff.length && staff.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                      </TableRow>
                    ))
                  ) : staff.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <UserCog className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No staff members found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    staff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStaff.has(member.id)}
                            onCheckedChange={() => toggleSelectStaff(member.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-xs">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.department}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" /> {member.email}
                          </p>
                        </TableCell>
                        <TableCell>{getRoleBadge(member.role)}</TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell>{member.department || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {member.permissions.length} permission{member.permissions.length !== 1 ? "s" : ""}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatLastLogin(member.last_login)}</TableCell>
                        <TableCell>{formatDate(member.joined_date)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/users/staff/${member.id}`}>
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/users/staff/${member.id}/edit`}>
                                  Edit Staff
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/users/staff/${member.id}/permissions`}>
                                  Manage Permissions
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {member.status === "active" ? (
                                <DropdownMenuItem className="text-red-600">
                                  <Ban className="mr-2 h-4 w-4" /> Deactivate
                                </DropdownMenuItem>
                              ) : member.status === "pending" ? (
                                <DropdownMenuItem className="text-green-600">
                                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem className="text-green-600">
                                  <CheckCircle className="mr-2 h-4 w-4" /> Activate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{" "}
                {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} staff
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={page === pagination.page ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8"
                      onClick={() => setPagination({ ...pagination, page })}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
            <CardDescription>Overview of permissions for each staff role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-purple-500" />
                  <h4 className="font-medium">Admin</h4>
                </div>
                <p className="text-sm text-muted-foreground">Full system access including user management, system settings, and all operational controls.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-blue-500" />
                  <h4 className="font-medium">Worker</h4>
                </div>
                <p className="text-sm text-muted-foreground">Access to assigned departments and operational tasks. Cannot manage users or change system settings.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <h4 className="font-medium">Viewer</h4>
                </div>
                <p className="text-sm text-muted-foreground">Read-only access to designated areas. Suitable for auditors and reporting staff.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
