"use client";

import React, { useEffect } from "react";
import {
  Search,
  RefreshCw,
  Download,
  UserCog,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { RoleBadge, RoleIcon, StatusBadge, formatDate } from "./permissions-shared";
import type { StaffMember } from "@mymeddevices/shared-core";
import type { PermissionsPage } from "../_hooks/use-permissions-page";

const STATUS_OPTIONS = ["active", "inactive", "pending"] as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function StaffPrivilegesTab({
  page,
  onCustomize,
}: {
  page: PermissionsPage;
  onCustomize: (staffId: string) => void;
}) {
  const { staffResponse, staffPage, setStaffPage } = page;

  const total = staffResponse?.total || 0;
  const totalPages = staffResponse?.total_pages || 1;

  // Reset to page 1 whenever a filter changes
  useEffect(() => {
    setStaffPage(1);
  }, [page.staffSearch, page.staffRole, page.staffStatus, setStaffPage]);

  const handleExport = () => {
    const rows = staffResponse?.staff || [];
    if (rows.length === 0) {
      toast.error("No staff to export");
      return;
    }
    const exportData = rows.map((m) => ({
      Name: m.name,
      Email: m.email,
      Role: m.role,
      Department: m.department || "Operations",
      Status: m.status,
      "Active Capabilities": m.permissions_count,
      "Last Login": formatDate(m.last_login, true),
      Joined: formatDate(m.joined_date),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Staff Privileges");
    XLSX.writeFile(wb, `staff-privileges-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Staff privileges exported successfully");
  };

  return (
    <div className="mt-6 flex flex-col gap-5">
      {/* Summary + Actions */}
      <div className="bg-card border rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Active Staff Directory & Role Privileges</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inspect and customize individual capability grants or revocations on top of assigned role defaults
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-mono">
            {total} accounts
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!staffResponse?.staff?.length}
            className="text-xs h-8.5 gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => page.refetchStaff()}
            disabled={page.fetchingStaff}
            className="text-xs h-8.5 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${page.fetchingStaff ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={page.staffSearch}
            onChange={(e) => page.setStaffSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
          {page.staffSearch && (
            <button
              onClick={() => page.setStaffSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 text-xs justify-between min-w-[140px]">
              <span className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                {page.staffRole === "all" ? "All Roles" : page.staffRole}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Filter by role
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => page.setStaffRole("all")} className="cursor-pointer">
              All Roles
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {page.allRoles.map((r) => (
              <DropdownMenuItem
                key={r.key}
                onClick={() => page.setStaffRole(r.key)}
                className="cursor-pointer gap-2"
              >
                <RoleIcon role={r.key} className="h-3.5 w-3.5 text-muted-foreground" />
                {r.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Select
          value={page.staffStatus}
          onValueChange={(v) =>
            page.setStaffStatus(v as "all" | "active" | "inactive" | "pending")
          }
        >
          <SelectTrigger className="h-9 text-xs min-w-[130px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="text-xs capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Staff Table */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-xs">Staff Member</TableHead>
              <TableHead className="text-xs">Assigned Role</TableHead>
              <TableHead className="text-xs">Department</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Active Capabilities</TableHead>
              <TableHead className="text-xs">Last Login</TableHead>
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.loadingStaff ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-7 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : !staffResponse?.staff?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-14">
                  <div className="flex flex-col items-center gap-2">
                    <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-foreground">No staff members found</p>
                    <p className="text-xs text-muted-foreground">
                      Try adjusting your search or filters.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              staffResponse.staff.map((member: StaffMember) => (
                <TableRow key={member.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border">
                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-xs text-foreground">{member.name}</p>
                        <p className="text-[11px] text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={member.role} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {member.department || "Operations"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={member.status} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[11px] bg-primary/5 text-primary border-primary/20">
                      {member.permissions_count} Capabilities
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">
                    {formatDate(member.last_login)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCustomize(member.id)}
                      className="text-xs h-7 px-2.5 gap-1"
                    >
                      <UserCog className="h-3.5 w-3.5" /> Customize
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!page.loadingStaff && (staffResponse?.staff?.length ?? 0) > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing{" "}
            {(staffPage - 1) * page.staffPageSize + 1} to{" "}
            {Math.min(staffPage * page.staffPageSize, total)} of {total} staff
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={staffPage === 1}
              onClick={() => setStaffPage(staffPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium text-muted-foreground min-w-[80px] text-center">
              Page {staffPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={staffPage >= totalPages}
              onClick={() => setStaffPage(staffPage + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
