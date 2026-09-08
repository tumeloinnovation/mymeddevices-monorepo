"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  UserCog,
  Search,
  Filter,
  Plus,
  MoreVertical,
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
  ArrowUp,
  ArrowDown,
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
import { StaffSheet } from "@/components/staff-sheet";
import {
  Trash2,
  Store,
  Truck,
  Users,
  CreditCard,
  Headphones,
  Package,
  ShieldCheck,
  AlertTriangle,
  Key,
} from "lucide-react";
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
import { toast } from "sonner";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import * as XLSX from "xlsx";

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

// Sortable header component
function SortableHeader({
  children,
  column,
}: {
  children: React.ReactNode;
  column: any;
}) {
  return (
    <button
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      className="flex items-center gap-1 hover:text-foreground text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors group cursor-pointer"
    >
      {children}
      {column.getIsSorted() === "asc" ? (
        <ArrowUp className="h-3 w-3 text-primary" />
      ) : column.getIsSorted() === "desc" ? (
        <ArrowDown className="h-3 w-3 text-primary" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/50" />
      )}
    </button>
  );
}

// Staff member cell component
function StaffMemberCell({ member }: { member: StaffMember }) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9">
        <AvatarFallback className="text-xs">
          {getInitials(member.name)}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{member.name}</p>
        <p className="text-xs text-muted-foreground">
          {member.department || "No department"}
        </p>
      </div>
    </div>
  );
}

// Role and status cell component
function RoleStatusCell({ member }: { member: StaffMember }) {
  const getRoleBadge = (role?: string) => {
    const r = (role || "").toLowerCase();
    switch (r) {
      case "admin":
        return (
          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 gap-1 font-medium">
            <Crown className="h-3 w-3" /> Admin
          </Badge>
        );
      case "worker":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 gap-1 font-medium">
            <Wrench className="h-3 w-3" /> Worker
          </Badge>
        );
      case "finance":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 gap-1 font-medium">
            <CreditCard className="h-3 w-3" /> Finance
          </Badge>
        );
      case "compliance":
        return (
          <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 gap-1 font-medium">
            <ShieldCheck className="h-3 w-3" /> Compliance
          </Badge>
        );
      case "support":
        return (
          <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300 gap-1 font-medium">
            <Headphones className="h-3 w-3" /> Support
          </Badge>
        );
      case "logistics":
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 gap-1 font-medium">
            <Package className="h-3 w-3" /> Logistics
          </Badge>
        );
      case "driver":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 gap-1 font-medium">
            <Truck className="h-3 w-3" /> Driver
          </Badge>
        );
      case "vendor":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 gap-1 font-medium">
            <Store className="h-3 w-3" /> Vendor
          </Badge>
        );
      case "customer":
        return (
          <Badge className="bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300 gap-1 font-medium">
            <Users className="h-3 w-3" /> Customer
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1 font-medium">
            <Eye className="h-3 w-3" /> {role || "Viewer"}
          </Badge>
        );
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

  return (
    <div className="flex flex-col gap-1">
      {getRoleBadge(member.role)}
      {getStatusBadge(member.status)}
    </div>
  );
}

// Last login cell component
function LastLoginCell({ date }: { date?: string }) {
  if (!date) return <span className="text-sm text-muted-foreground">Never</span>;

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString("en-KE", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <span className="text-sm text-muted-foreground">
      {formatLastLogin(date)}
    </span>
  );
}

// Actions cell component
function StaffActionsCell({
  member,
  onStatusUpdate,
  onDelete,
}: {
  member: StaffMember;
  onStatusUpdate: (id: string, action: "activate" | "deactivate") => void;
  onDelete: (member: StaffMember) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/users/staff/${member.id}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/users/staff/${member.id}/edit`}>
          <Wrench className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          onStatusUpdate(
            member.id,
            member.status === "active" ? "deactivate" : "activate"
          )
        }
        className={
          member.status === "active"
            ? "text-amber-600 hover:text-amber-700"
            : "text-emerald-600 hover:text-emerald-700"
        }
      >
        {member.status === "active" ? (
          <Ban className="h-4 w-4" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/users/staff/${member.id}`}>
              <ShieldCheck className="mr-2 h-4 w-4" /> View Privileges
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings/permissions">
              <Key className="mr-2 h-4 w-4" /> Global Matrix
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(member)}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete Member
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

const columnHelper = createColumnHelper<StaffMember>();

export default function StaffPage() {
  const searchParams = useSearchParams();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | StaffStatus>("all");
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  // TanStack Table state
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [sorting, setSorting] = useState<SortingState>([]);

  // Check URL params for deep link to open invite sheet
  useEffect(() => {
    const shouldOpen =
      searchParams?.get("create") === "true" ||
      searchParams?.get("action") === "new";
    if (shouldOpen) {
      setIsInviteOpen(true);
    }
  }, [searchParams]);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const response = await usersService.getStaff({
        search: search || undefined,
        role_filter: roleFilter === "all" ? undefined : roleFilter,
        status_filter: statusFilter === "all" ? undefined : statusFilter,
        page: pagination.page,
        page_size: pagination.pageSize,
      });

      // Add empty permissions array for UI display
      const staffWithPermissions = response.staff.map((member) => ({
        ...member,
        permissions: [],
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
  }, [search, roleFilter, statusFilter, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleStatusUpdate = async (id: string, action: "activate" | "deactivate") => {
    try {
      await usersService.updateStaffStatus(id, action);
      toast.success(`Staff member ${action}d successfully`);
      fetchStaff();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to update status";
      toast.error(msg);
    }
  };

  const handleDeleteStaff = async () => {
    if (!staffToDelete) return;
    setDeleting(true);
    try {
      await usersService.deleteStaff(staffToDelete.id);
      toast.success(`Staff member "${staffToDelete.name}" deleted successfully`);
      setStaffToDelete(null);
      fetchStaff();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to delete staff member";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    // Create export data with meaningful headers
    const exportData = staff.map((member) => ({
      Name: member.name,
      Email: member.email,
      Role: member.role,
      Status: member.status,
      Department: member.department || "N/A",
      "Last Login": member.last_login ? formatLastLogin(member.last_login) : "Never",
      "Joined Date": new Date(member.joined_date).toLocaleDateString("en-KE", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `staff-export-${timestamp}.xlsx`);

    toast.success("Staff data exported successfully");
  };

  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString("en-KE", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Sync row selection with selectedStaff Set
  useEffect(() => {
    const selectedIds = new Set(
      Object.entries(rowSelection)
        .filter(([_, selected]) => selected)
        .map(([id]) => id)
    );
    setSelectedStaff(selectedIds);
  }, [rowSelection]);

  // Column definitions
  const columns = useMemo(
    () => [
      // Checkbox Selection Column
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllRowsSelected() ||
                (table.getIsSomeRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
              aria-label="Select all"
              className="border-muted-foreground/30 data-[state=checked]:bg-primary"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              className="border-muted-foreground/30 data-[state=checked]:bg-primary"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      }),

      // Staff Member Column
      columnHelper.accessor((row) => row, {
        id: "staff_member",
        sortingFn: (rowA, rowB) =>
          rowA.original.name.localeCompare(rowB.original.name),
        header: ({ column }) => <SortableHeader column={column}>Staff Member</SortableHeader>,
        cell: ({ getValue }) => <StaffMemberCell member={getValue()} />,
      }),

      // Email Column
      columnHelper.accessor("email", {
        id: "email",
        header: ({ column }) => <SortableHeader column={column}>Email</SortableHeader>,
        cell: ({ getValue }) => (
          <span className="text-sm text-muted-foreground">{getValue()}</span>
        ),
      }),

      // Role & Status Combined Column
      columnHelper.accessor((row) => row, {
        id: "role_status",
        sortingFn: (rowA, rowB) => {
          const roleA = rowA.original.role || "";
          const roleB = rowB.original.role || "";
          return roleA.localeCompare(roleB);
        },
        header: ({ column }) => <SortableHeader column={column}>Role & Status</SortableHeader>,
        cell: ({ getValue }) => <RoleStatusCell member={getValue()} />,
      }),

      // Capabilities Column
      columnHelper.accessor("permissions_count", {
        id: "permissions_count",
        header: ({ column }) => <SortableHeader column={column}>Capabilities</SortableHeader>,
        cell: ({ getValue }) => (
          <Badge variant="outline" className="font-mono text-[11px] bg-primary/5 text-primary border-primary/20">
            {getValue() ?? 0} Active
          </Badge>
        ),
      }),

      // Last Login Column
      columnHelper.accessor("last_login", {
        id: "last_login",
        header: ({ column }) => <SortableHeader column={column}>Last Login</SortableHeader>,
        cell: ({ getValue }) => <LastLoginCell date={getValue()} />,
      }),


      // Joined Date Column
      columnHelper.accessor("joined_date", {
        id: "joined_date",
        header: ({ column }) => <SortableHeader column={column}>Joined</SortableHeader>,
        cell: ({ getValue }) => {
          const date = new Date(getValue());
          return (
            <span className="text-sm text-muted-foreground">
              {date.toLocaleDateString("en-KE", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          );
        },
      }),

      // Actions Column
      columnHelper.display({
        id: "actions",
        header: () => null,
        cell: ({ row }) => (
          <StaffActionsCell
            member={row.original}
            onStatusUpdate={handleStatusUpdate}
            onDelete={setStaffToDelete}
          />
        ),
      }),
    ],
    [] // No dependencies needed - handleStatusUpdate is passed directly
  );

  // Table instance
  const table = useReactTable({
    data: staff,
    columns,
    state: {
      rowSelection,
      sorting,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages || 1,
    getRowId: (row) => row.id,
  });

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
            <Button onClick={() => setIsInviteOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Staff Member
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
                <Button variant="outline" size="sm" onClick={handleExport} disabled={staff.length === 0}>
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button variant="outline" size="sm" onClick={() => fetchStaff()} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
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
                  <DropdownMenuItem onClick={() => setRoleFilter("finance")}>
                    <CreditCard className="mr-2 h-4 w-4 text-emerald-500" /> Finance
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("compliance")}>
                    <ShieldCheck className="mr-2 h-4 w-4 text-teal-500" /> Compliance
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("support")}>
                    <Headphones className="mr-2 h-4 w-4 text-cyan-500" /> Support
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("logistics")}>
                    <Package className="mr-2 h-4 w-4 text-orange-500" /> Logistics
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("driver")}>
                    <Truck className="mr-2 h-4 w-4 text-amber-500" /> Driver
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("vendor")}>
                    <Store className="mr-2 h-4 w-4 text-emerald-500" /> Vendor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("customer")}>
                    <Users className="mr-2 h-4 w-4 text-sky-500" /> Customer
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
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className={header.id === "actions" ? "text-right" : ""}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                        <TableCell><Skeleton className="h-10 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-16 w-32" /></TableCell>
                      </TableRow>
                    ))
                  ) : table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <UserCog className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No staff members found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className={cell.column.id === "actions" ? "text-right" : ""}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
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

        {/* Staff Sheet Drawer */}
        <StaffSheet
          open={isInviteOpen}
          onOpenChange={setIsInviteOpen}
          onSuccess={fetchStaff}
        />

        {/* Delete Confirmation Alert Dialog */}
        <AlertDialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-2.5 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-sm text-muted-foreground pt-1">
                Are you sure you want to delete <strong className="text-foreground">{staffToDelete?.name}</strong> ({staffToDelete?.email})? This action will remove portal access and credentials.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-2">
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteStaff();
                }}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting..." : "Delete Member"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
