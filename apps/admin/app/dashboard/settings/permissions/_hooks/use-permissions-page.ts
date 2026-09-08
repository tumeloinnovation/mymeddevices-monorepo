"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  systemService,
  usersService,
  type PermissionsMatrixData,
  type RoleDefinition,
} from "@mymeddevices/shared-core";
import { toast } from "sonner";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function usePermissionsPage() {
  const queryClient = useQueryClient();

  // ============================================================
  // Server data fetching
  // ============================================================

  const {
    data: permissionsData,
    isLoading: loadingPermissions,
    refetch: refetchPermissions,
  } = useQuery<PermissionsMatrixData>({
    queryKey: ["admin", "system", "permissions"],
    queryFn: () => systemService.getPermissions(),
  });

  // Local state for the editable matrix (synced once from server)
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});
  const [customRoles, setCustomRoles] = useState<RoleDefinition[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [isDirty, setIsDirty] = useState(false);
  const syncedServerData = useRef(false);

  // Staff list filters + pagination (server-side)
  const [staffSearch, setStaffSearch] = useState("");
  const [staffRole, setStaffRole] = useState("all");
  const [staffStatus, setStaffStatus] = useState<"all" | "active" | "inactive" | "pending">("all");
  const [staffPage, setStaffPage] = useState(1);
  const debouncedStaffSearch = useDebounce(staffSearch, 300);
  const staffPageSize = 8;

  const {
    data: staffResponse,
    isLoading: loadingStaff,
    isFetching: fetchingStaff,
    refetch: refetchStaff,
  } = useQuery({
    queryKey: [
      "admin",
      "users",
      "staff-privileges",
      { search: debouncedStaffSearch, role: staffRole, status: staffStatus, page: staffPage },
    ],
    queryFn: () =>
      usersService.getStaff({
        search: debouncedStaffSearch || undefined,
        role_filter: staffRole === "all" ? undefined : staffRole,
        status_filter: staffStatus === "all" ? undefined : staffStatus,
        page: staffPage,
        page_size: staffPageSize,
      }),
  });

  // Sync initial matrix/roles from server (once, to avoid clobbering local edits)
  useEffect(() => {
    if (!permissionsData?.matrix || syncedServerData.current) return;
    syncedServerData.current = true;
    setMatrix(permissionsData.matrix);
    setCustomRoles(permissionsData.roles.filter((r) => !r.is_system));
    setIsDirty(false);
  }, [permissionsData]);

  // ============================================================
  // Mutations
  // ============================================================

  const saveMatrixMutation = useMutation({
    mutationFn: (payload: { matrix: Record<string, string[]>; custom_roles: RoleDefinition[] }) =>
      systemService.updatePermissions(payload),
    onSuccess: (data) => {
      if (data?.matrix) setMatrix(data.matrix);
      if (data?.custom_roles) setCustomRoles(data.custom_roles);
      queryClient.invalidateQueries({ queryKey: ["admin", "system", "permissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "staff"] });
      setIsDirty(false);
      toast.success("Role permissions matrix successfully saved to database");
    },
    onError: (err: Error) => {
      toast.error(err?.message || "Failed to save permissions matrix");
    },
  });

  const resetMatrixMutation = useMutation({
    mutationFn: () => systemService.resetPermissions(),
    onSuccess: (data) => {
      if (data?.matrix) setMatrix(data.matrix);
      if (data?.roles) setCustomRoles(data.roles.filter((r) => !r.is_system));
      setSelectedRole("admin");
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "system", "permissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", "staff"] });
      toast.success("Permissions matrix reset to default system parameters");
    },
    onError: (err: Error) => {
      toast.error(err?.message || "Failed to reset permissions matrix");
    },
  });

  // ============================================================
  // Derived values
  // ============================================================

  const allRoles = useMemo<RoleDefinition[]>(() => {
    const serverRoles = permissionsData?.roles || [];
    const localKeys = new Set(customRoles.map((r) => r.key));
    return [...serverRoles.filter((r) => !localKeys.has(r.key)), ...customRoles];
  }, [permissionsData?.roles, customRoles]);

  const categories = useMemo(() => permissionsData?.categories || [], [permissionsData?.categories]);

  const totalPermCount = useMemo(
    () => categories.reduce((acc, cat) => acc + cat.permissions.length, 0),
    [categories]
  );

  const selectedRoleObj = allRoles.find((r) => r.key === selectedRole) || allRoles[0];
  const selectedRolePermCount = (matrix[selectedRole] || []).length;

  // ============================================================
  // Matrix editing handlers
  // ============================================================

  const handleTogglePermission = (roleKey: string, permKey: string) => {
    setMatrix((prev) => {
      const current = prev[roleKey] || [];
      const has = current.includes(permKey);
      return {
        ...prev,
        [roleKey]: has ? current.filter((p) => p !== permKey) : [...current, permKey],
      };
    });
    setIsDirty(true);
  };

  const handleToggleCategory = (permKeys: string[], enable: boolean) => {
    setMatrix((prev) => {
      const current = new Set(prev[selectedRole] || []);
      permKeys.forEach((k) => {
        if (enable) current.add(k);
        else current.delete(k);
      });
      return { ...prev, [selectedRole]: Array.from(current) };
    });
    setIsDirty(true);
  };

  // ============================================================
  // Custom role handlers
  // ============================================================

  const createCustomRole = (role: Omit<RoleDefinition, "is_system" | "badge_color">, baseRoleKey: string) => {
    const cleanKey = role.key.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    if (allRoles.some((r) => r.key === cleanKey)) {
      toast.error(`A role with key '${cleanKey}' already exists`);
      return false;
    }

    const newRole: RoleDefinition = {
      ...role,
      key: cleanKey,
      badge_color: "blue",
      is_system: false,
    };

    const basePerms = matrix[baseRoleKey] || [];
    setCustomRoles((prev) => [...prev, newRole]);
    setMatrix((prev) => ({ ...prev, [cleanKey]: [...basePerms] }));
    setSelectedRole(cleanKey);
    setIsDirty(true);
    return true;
  };

  const updateCustomRole = (roleKey: string, updates: Partial<Pick<RoleDefinition, "label" | "description">>) => {
    setCustomRoles((prev) => prev.map((r) => (r.key === roleKey ? { ...r, ...updates } : r)));
    setIsDirty(true);
  };

  const deleteCustomRole = (roleKey: string) => {
    setCustomRoles((prev) => prev.filter((r) => r.key !== roleKey));
    setMatrix((prev) => {
      const next = { ...prev };
      delete next[roleKey];
      return next;
    });
    if (selectedRole === roleKey) setSelectedRole("admin");
    setIsDirty(true);
  };

  // ============================================================
  // Staff override helpers
  // ============================================================

  const invalidateStaff = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "users", "staff"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "system", "permissions"] });
  };

  return {
    // Data
    permissionsData,
    loadingPermissions,
    refetchPermissions,
    staffResponse,
    loadingStaff,
    fetchingStaff,
    refetchStaff,

    // Matrix state
    matrix,
    setMatrix,
    customRoles,
    setCustomRoles,
    selectedRole,
    setSelectedRole,
    isDirty,
    setIsDirty,
    allRoles,
    categories,
    totalPermCount,
    selectedRoleObj,
    selectedRolePermCount,

    // Handlers
    handleTogglePermission,
    handleToggleCategory,
    createCustomRole,
    updateCustomRole,
    deleteCustomRole,

    // Mutations
    saveMatrixMutation,
    resetMatrixMutation,
    invalidateStaff,
    saveMatrix: () =>
      saveMatrixMutation.mutate({ matrix, custom_roles: customRoles }),

    // Staff filters
    staffSearch,
    setStaffSearch,
    staffRole,
    setStaffRole,
    staffStatus,
    setStaffStatus,
    staffPage,
    setStaffPage,
    staffPageSize,
  };
}

export type PermissionsPage = ReturnType<typeof usePermissionsPage>;
