"use client";

import React, { useState } from "react";
import {
  Shield,
  Key,
  Sparkles,
  Users,
  FileDown,
  RotateCcw,
  Save,
  AlertTriangle,
  ShieldCheck,
  UserCog,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { usePermissionsPage } from "./_hooks/use-permissions-page";
import { RoleMatrixTab } from "./_components/role-matrix-tab";
import { StaffPrivilegesTab } from "./_components/staff-privileges-tab";
import { CustomRolesTab } from "./_components/custom-roles-tab";
import { SecurityPolicyTab } from "./_components/security-policy-tab";
import { StaffPermissionsSheet } from "./_components/staff-permissions-sheet";
import { RoleDialog } from "./_components/role-dialog";
import type { RoleDefinition } from "@mymeddevices/shared-core";

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  hint,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  hint?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function PermissionsSettingsPage() {
  const page = usePermissionsPage();

  // Dialog / sheet state
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleDialogMode, setRoleDialogMode] = useState<"create" | "edit">("create");
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [baseRoleKey, setBaseRoleKey] = useState("worker");
  const [deleteRoleKey, setDeleteRoleKey] = useState<string | null>(null);
  const [staffSheetOpen, setStaffSheetOpen] = useState(false);
  const [staffSheetId, setStaffSheetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("matrix");

  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            exported_at: new Date().toISOString(),
            roles: page.allRoles,
            matrix: page.matrix,
            categories: page.categories,
          },
          null,
          2
        )
      );
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `mymeddevices-permissions-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    toast.success("Permissions matrix exported as JSON");
  };

  const handleOpenCreate = () => {
    setRoleDialogMode("create");
    setEditingRole(null);
    setBaseRoleKey("worker");
    setRoleDialogOpen(true);
  };

  const handleOpenEdit = (roleKey: string) => {
    const role = page.allRoles.find((r) => r.key === roleKey);
    if (!role) return;
    setRoleDialogMode("edit");
    setEditingRole(role);
    setRoleDialogOpen(true);
  };

  const handleDeleteRole = () => {
    if (!deleteRoleKey) return;
    page.deleteCustomRole(deleteRoleKey);
    setDeleteRoleKey(null);
    toast.success("Custom role removed. Save changes to persist.");
  };

  const handleEditMatrix = (roleKey: string) => {
    page.setSelectedRole(roleKey);
    setActiveTab("matrix");
  };

  const customizedStaff = page.staffResponse?.staff?.filter((s) => s.status === "active").length || 0;

  return (
    <>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  Roles & Permissions
                  {page.isDirty && (
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-medium animate-pulse"
                    >
                      Unsaved Changes
                    </Badge>
                  )}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure role capability matrices, staff privilege overrides, and medical compliance governance
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleExportJson} className="text-xs h-8.5 gap-1.5">
              <FileDown className="h-3.5 w-3.5" /> Export Matrix
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResetDialogOpen(true)}
              disabled={!permissionsDataIsCustomized(page)}
              className="text-xs h-8.5 text-destructive hover:text-destructive gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset Defaults
            </Button>
            <Button
              size="sm"
              disabled={!page.isDirty || page.saveMatrixMutation.isPending}
              onClick={page.saveMatrix}
              className="text-xs h-8.5 gap-1.5 shadow-xs"
            >
              <Save className="h-3.5 w-3.5" />
              {page.saveMatrixMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            label="Total Roles"
            value={page.allRoles.length}
            icon={Shield}
            loading={page.loadingPermissions}
            hint="System + custom roles"
          />
          <StatCard
            label="Total Capabilities"
            value={page.totalPermCount}
            icon={Key}
            loading={page.loadingPermissions}
            hint="Across all categories"
          />
          <StatCard
            label="Custom Roles"
            value={page.customRoles.length}
            icon={Sparkles}
            loading={page.loadingPermissions}
            hint="Specialized workflows"
          />
          <StatCard
            label="Active Staff"
            value={customizedStaff}
            icon={Users}
            loading={page.loadingStaff}
            hint="Accounts with privileges"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-2xl bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="matrix" className="text-xs font-semibold rounded-lg">
              Role Matrix
            </TabsTrigger>
            <TabsTrigger value="staff" className="text-xs font-semibold rounded-lg">
              Staff Privileges ({page.staffResponse?.total || 0})
            </TabsTrigger>
            <TabsTrigger value="custom-roles" className="text-xs font-semibold rounded-lg">
              Custom Roles
            </TabsTrigger>
            <TabsTrigger value="security-policy" className="text-xs font-semibold rounded-lg">
              Security Policy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matrix">
            <RoleMatrixTab page={page} />
          </TabsContent>

          <TabsContent value="staff">
            <StaffPrivilegesTab
              page={page}
              onCustomize={(staffId) => {
                setStaffSheetId(staffId);
                setStaffSheetOpen(true);
              }}
            />
          </TabsContent>

          <TabsContent value="custom-roles">
            <CustomRolesTab
              page={page}
              onCreate={handleOpenCreate}
              onEdit={handleOpenEdit}
              onDelete={setDeleteRoleKey}
              onEditMatrix={handleEditMatrix}
            />
          </TabsContent>

          <TabsContent value="security-policy">
            <SecurityPolicyTab />
          </TabsContent>
        </Tabs>
      </div>

      {/* Role Dialog */}
      <RoleDialog
        key={`${roleDialogMode}-${editingRole?.key ?? "new"}-${roleDialogOpen ? "open" : "closed"}`}
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        mode={roleDialogMode}
        editingRole={editingRole}
        baseRoleKey={baseRoleKey}
        baseRoles={page.allRoles.filter((r) => r.key !== "customer")}
        onSave={(role, base) => {
          const ok = page.createCustomRole(role, base);
          if (ok) toast.success(`Custom role '${role.label}' created. Save changes to persist.`);
          return ok;
        }}
        onUpdate={(roleKey, updates) => {
          page.updateCustomRole(roleKey, updates);
          toast.success("Custom role updated. Save changes to persist.");
        }}
      />

      {/* Reset Dialog */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Reset Permissions Matrix?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              This will restore all default system capabilities across all standard roles and remove
              every custom role. Any customized role permissions and staff overrides derived from them
              will be overwritten with factory defaults.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                page.resetMatrixMutation.mutate();
                setResetDialogOpen(false);
              }}
              className="text-xs h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {page.resetMatrixMutation.isPending ? "Resetting..." : "Confirm Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Role Dialog */}
      <AlertDialog open={!!deleteRoleKey} onOpenChange={(o) => !o && setDeleteRoleKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <UserCog className="h-5 w-5" /> Delete Custom Role?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              This will permanently remove the custom role and its capability matrix. Staff members
              currently assigned to this role will fall back to their previous configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              className="text-xs h-8 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Staff Permissions Sheet */}
      <StaffPermissionsSheet
        key={staffSheetId ?? "none"}
        page={page}
        staffId={staffSheetId}
        open={staffSheetOpen}
        onOpenChange={setStaffSheetOpen}
      />
    </>
  );
}

function permissionsDataIsCustomized(page: ReturnType<typeof usePermissionsPage>) {
  return (
    (page.permissionsData?.is_customized ?? false) ||
    page.customRoles.length > 0 ||
    page.isDirty
  );
}
