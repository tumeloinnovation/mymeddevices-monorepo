"use client";

import React, { useEffect, useMemo, useState } from "react";
import { UserCog, Search, X, RotateCcw, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usersService, type StaffPermissionsDetail } from "@mymeddevices/shared-core";
import { toast } from "sonner";
import type { PermissionsPage } from "../_hooks/use-permissions-page";

interface StaffPermissionsSheetProps {
  page: PermissionsPage;
  staffId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Something went wrong";
}

export function StaffPermissionsSheet({
  page,
  staffId,
  open,
  onOpenChange,
}: StaffPermissionsSheetProps) {
  const [detail, setDetail] = useState<StaffPermissionsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [granted, setGranted] = useState<string[]>([]);
  const [revoked, setRevoked] = useState<string[]>([]);
  const [roleEdit, setRoleEdit] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Dirty tracking: snapshot original granted/revoked/role when sheet opens
  const [original, setOriginal] = useState<{ granted: string[]; revoked: string[]; role: string } | null>(null);

  useEffect(() => {
    if (!open || !staffId) return;
    let cancelled = false;
    usersService
      .getStaffPermissions(staffId)
      .then((data) => {
        if (cancelled) return;
        setDetail(data);
        setGranted(data.granted_overrides || []);
        setRevoked(data.revoked_overrides || []);
        setRoleEdit(data.role || "worker");
        setOriginal({
          granted: data.granted_overrides || [],
          revoked: data.revoked_overrides || [],
          role: data.role || "worker",
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        toast.error(errorMessage(err) || "Failed to load staff permissions");
        onOpenChange(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, staffId, onOpenChange]);

  const isDirty = useMemo(() => {
    if (!original) return false;
    const sameArray = (a: string[], b: string[]) =>
      a.length === b.length && a.every((v) => b.includes(v));
    return (
      !sameArray(granted, original.granted) ||
      !sameArray(revoked, original.revoked) ||
      roleEdit !== original.role
    );
  }, [granted, revoked, roleEdit, original]);

  const basePerms = useMemo(() => new Set(page.matrix[roleEdit] || []), [page.matrix, roleEdit]);

  const effectiveCount = useMemo(() => {
    const set = new Set(basePerms);
    granted.forEach((k) => set.add(k));
    revoked.forEach((k) => set.delete(k));
    return set.size;
  }, [basePerms, granted, revoked]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return page.categories;
    return page.categories
      .map((cat) => ({
        ...cat,
        permissions: cat.permissions.filter(
          (p) =>
            p.label.toLowerCase().includes(q) ||
            p.key.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        ),
      }))
      .filter((cat) => cat.permissions.length > 0);
  }, [page.categories, searchQuery]);

  const togglePermission = (p: { key: string }, isBaseGranted: boolean) => {
    const key = p.key;
    if (isBaseGranted) {
      setRevoked((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      );
    } else {
      setGranted((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      );
    }
  };

  const handleSave = async () => {
    if (!staffId) return;
    setSaving(true);
    try {
      await usersService.updateStaffPermissions(staffId, {
        granted,
        revoked,
        role: roleEdit,
      });
      toast.success("Staff member permissions updated successfully");
      onOpenChange(false);
      page.invalidateStaff();
      page.refetchStaff();
    } catch (err: unknown) {
      toast.error(errorMessage(err) || "Failed to update staff permissions");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!staffId) return;
    setSaving(true);
    try {
      await usersService.resetStaffPermissions(staffId);
      toast.success("Staff member custom overrides reset to base role defaults");
      setGranted([]);
      setRevoked([]);
      setOriginal((prev) => (prev ? { ...prev, granted: [], revoked: [] } : prev));
      page.invalidateStaff();
      page.refetchStaff();
    } catch (err: unknown) {
      toast.error(errorMessage(err) || "Failed to reset staff overrides");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl flex flex-col justify-between overflow-y-auto p-0">
        {/* Header */}
        <div className="p-6 border-b bg-muted/20">
          <SheetHeader>
            <SheetTitle className="text-base font-bold flex items-center gap-2">
              <UserCog className="h-4 w-4 text-primary" />
              Customize Staff Privileges
            </SheetTitle>
            <SheetDescription className="text-xs">
              Fine-tune granular permissions for {detail?.name || "staff member"}
            </SheetDescription>
          </SheetHeader>

          {detail && (
            <div className="mt-4 p-3 bg-card rounded-xl border flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                    {getInitials(detail.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-foreground truncate">{detail.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{detail.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {detail.is_customized && (
                  <Badge className="bg-amber-500 text-white text-[10px] uppercase font-bold">
                    Customized
                  </Badge>
                )}
                <div className="w-[140px]">
                  <Select value={roleEdit} onValueChange={setRoleEdit}>
                    <SelectTrigger className="text-xs h-7.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {detail.available_roles?.map((r: { key: string; label: string }) => (
                        <SelectItem key={r.key} value={r.key} className="text-xs">
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : !detail ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              Failed to load staff details
            </div>
          ) : (
            <>
              {/* Summary strip */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/40 p-3 rounded-xl border text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Role Base</p>
                  <p className="font-bold text-sm text-foreground mt-0.5">{basePerms.size}</p>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-600">Granted</p>
                  <p className="font-bold text-sm text-emerald-600 mt-0.5">+{granted.length}</p>
                </div>
                <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-rose-600">Revoked</p>
                  <p className="font-bold text-sm text-rose-600 mt-0.5">−{revoked.length}</p>
                </div>
              </div>

              <div className="flex items-center justify-between bg-muted/40 p-3 rounded-xl border text-xs">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-muted-foreground">Effective Capabilities:</span>
                  <span className="font-bold text-foreground">{effectiveCount}</span>
                </div>
                {(granted.length > 0 || revoked.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    disabled={saving}
                    className="text-xs h-6 px-2 text-destructive hover:text-destructive"
                  >
                    <RotateCcw className="h-3 w-3" /> Clear Overrides
                  </Button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search capabilities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Categories & permissions */}
              {filteredCategories.length === 0 ? (
                <div className="text-center py-10">
                  <ShieldAlert className="h-7 w-7 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-muted-foreground">No matching capabilities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCategories.map((cat) => {
                    const catGranted = cat.permissions.filter((p) => granted.includes(p.key)).length;
                    const catRevoked = cat.permissions.filter((p) => revoked.includes(p.key)).length;
                    return (
                      <div key={cat.id} className="border rounded-xl p-3.5 space-y-2 bg-card">
                        <h4 className="font-bold text-xs text-foreground flex items-center justify-between">
                          <span>{cat.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            +{catGranted} / −{catRevoked}
                          </span>
                        </h4>
                        <div className="space-y-2 pt-1">
                          {cat.permissions.map((p) => {
                            const isBaseGranted = basePerms.has(p.key);
                            const isExplicitlyGranted = granted.includes(p.key);
                            const isExplicitlyRevoked = revoked.includes(p.key);
                            const isEffective = (isBaseGranted || isExplicitlyGranted) && !isExplicitlyRevoked;

                            return (
                              <div
                                key={p.key}
                                className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/30 transition-colors"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-xs font-medium text-foreground">{p.label}</span>
                                    {isExplicitlyGranted && (
                                      <Badge className="bg-emerald-600 text-white text-[9px] py-0 px-1">
                                        +Extra Granted
                                      </Badge>
                                    )}
                                    {isExplicitlyRevoked && (
                                      <Badge variant="destructive" className="text-[9px] py-0 px-1">
                                        −Revoked
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground truncate">{p.description}</p>
                                </div>

                                <Switch
                                  checked={isEffective}
                                  onCheckedChange={() => togglePermission(p, isBaseGranted)}
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
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/20 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving} className="text-xs h-8">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="text-xs h-8"
          >
            {saving ? "Saving..." : isDirty ? "Apply Privileges" : "No Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}