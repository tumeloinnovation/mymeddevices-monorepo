"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Sparkles,
  UserCog,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleIcon, RiskBadge } from "./permissions-shared";
import type { PermissionsPage } from "../_hooks/use-permissions-page";

// Track collapsed state per category
interface CollapsedState {
  [categoryId: string]: boolean;
}

export function RoleMatrixTab({ page }: { page: PermissionsPage }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [collapsedCategories, setCollapsedCategories] = useState<CollapsedState>({});

  const filteredCategories = useMemo(() => {
    let result = page.categories;
    if (categoryFilter !== "all") {
      result = result.filter((c) => c.id === categoryFilter);
    }
    return result
      .map((cat) => {
        let perms = cat.permissions;
        const q = searchQuery.trim().toLowerCase();
        if (q) {
          perms = perms.filter(
            (p) =>
              p.label.toLowerCase().includes(q) ||
              p.key.toLowerCase().includes(q) ||
              p.description.toLowerCase().includes(q)
          );
        }
        if (riskFilter !== "all") {
          perms = perms.filter((p) => p.risk === riskFilter);
        }
        return { ...cat, permissions: perms };
      })
      .filter((cat) => cat.permissions.length > 0);
  }, [page.categories, categoryFilter, searchQuery, riskFilter]);

  const selectedRoleObj = page.selectedRoleObj;
  const selectedRoleKey = selectedRoleObj?.key || page.selectedRole;

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const expandAll = () => {
    const newCollapsed: CollapsedState = {};
    filteredCategories.forEach((cat) => {
      newCollapsed[cat.id] = false;
    });
    setCollapsedCategories(newCollapsed);
  };

  const collapseAll = () => {
    const newCollapsed: CollapsedState = {};
    filteredCategories.forEach((cat) => {
      newCollapsed[cat.id] = true;
    });
    setCollapsedCategories(newCollapsed);
  };

  return (
    <div className="mt-6 flex flex-col gap-6">
      {/* Role Switcher Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {page.loadingPermissions ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 rounded-xl border bg-card">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))
        ) : (
          page.allRoles.map((r) => {
            const count = (page.matrix[r.key] || []).length;
            const pct = Math.round((count / (page.totalPermCount || 1)) * 100);
            const isSelected = page.selectedRole === r.key;
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => page.setSelectedRole(r.key)}
                className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
                    : "border-border/70 hover:border-border hover:bg-muted/30 bg-card"
                }`}
              >
                <div className="flex items-center justify-between gap-1 w-full mb-2">
                  <div className="flex items-center gap-1.5">
                    <RoleIcon role={r.key} className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-xs text-foreground truncate">{r.label}</span>
                  </div>
                  {!r.is_system && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase text-blue-600 border-blue-500/30 bg-blue-500/10">
                      Custom
                    </Badge>
                  )}
                </div>
                <div className="mt-auto space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{count} capabilities</span>
                    <span className="font-mono text-[10px]">{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-1" />
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Selected Role Banner */}
      <div className="bg-card border rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {page.loadingPermissions ? (
          <div className="flex items-center gap-3.5">
            <Skeleton className="h-11 w-11 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-72" />
            </div>
          </div>
        ) : (
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <RoleIcon role={selectedRoleKey} className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-foreground">
                  {selectedRoleObj?.label || selectedRoleKey} Permissions
                </h2>
                <Badge variant="secondary" className="font-mono text-xs">
                  {selectedRoleKey}
                </Badge>
                {!selectedRoleObj?.is_system && (
                  <Badge className="bg-blue-600 text-white text-[10px]">
                    <Sparkles className="h-3 w-3" /> Custom Role
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
                {selectedRoleObj?.description || "Role capabilities and functional access boundaries"}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs self-start md:self-auto bg-muted/40 px-3.5 py-2 rounded-xl border">
          <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Granted Capabilities:</span>
          <span className="font-bold text-foreground">
            {page.selectedRolePermCount} / {page.totalPermCount}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-md relative">
          <Search className="h-4 w-4 absolute left-3 text-muted-foreground" />
          <Input
            placeholder="Search capabilities by name, key, or scope..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 text-muted-foreground hover:text-foreground text-xs"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={expandAll}
            className="h-9 text-[11px] px-3"
          >
            Expand All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={collapseAll}
            className="h-9 text-[11px] px-3"
          >
            Collapse All
          </Button>
          <span className="text-muted-foreground/40 text-xs">|</span>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 text-xs w-[170px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
              {page.categories.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="h-9 text-xs w-[140px]">
              <SelectValue placeholder="All Risk Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Risk Levels</SelectItem>
              <SelectItem value="low" className="text-xs">Standard</SelectItem>
              <SelectItem value="medium" className="text-xs">Moderate</SelectItem>
              <SelectItem value="high" className="text-xs">High Risk</SelectItem>
              <SelectItem value="critical" className="text-xs">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category Groups */}
      {page.loadingPermissions ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 bg-muted/20 border-b space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
              </div>
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="p-4 border-b flex items-center gap-3">
                  <Skeleton className="h-5 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-56" />
                    <Skeleton className="h-3 w-80 max-w-full" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-2xl p-6">
          <ShieldAlert className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium text-foreground">No matching permissions found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search query or filters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCategories.map((cat) => {
            const rolePerms = page.matrix[selectedRoleKey] || [];
            const activeCount = cat.permissions.filter((p) => rolePerms.includes(p.key)).length;
            const allActive = activeCount === cat.permissions.length;
            const isCollapsed = collapsedCategories[cat.id] ?? false;

            return (
              <div key={cat.id} className="bg-card border rounded-2xl overflow-hidden shadow-xs">
                {/* Collapsible Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full p-4 bg-muted/20 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">{cat.name}</h3>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {activeCount} / {cat.permissions.length} Active
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        page.handleToggleCategory(cat.permissions.map((p) => p.key), true);
                      }}
                      disabled={allActive}
                      className="h-7 text-[11px] px-2 text-emerald-600"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Grant All
                    </Button>
                    <span className="text-muted-foreground/40 text-xs">|</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        page.handleToggleCategory(cat.permissions.map((p) => p.key), false);
                      }}
                      disabled={activeCount === 0}
                      className="h-7 text-[11px] px-2 text-muted-foreground hover:text-destructive"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Revoke All
                    </Button>
                  </div>
                </button>

                {/* Permissions List - 2 Column Grid */}
                {!isCollapsed && (
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cat.permissions.map((perm) => {
                        const isGranted = rolePerms.includes(perm.key);
                        return (
                          <div
                            key={perm.key}
                            className={`p-3 rounded-xl border transition-all hover:bg-muted/20 ${
                              isGranted ? "bg-primary/[0.015] border-primary/20" : "border-border/60"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="pt-0.5">
                                <Switch
                                  checked={isGranted}
                                  onCheckedChange={() => page.handleTogglePermission(selectedRoleKey, perm.key)}
                                  className="shrink-0"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-xs text-foreground">{perm.label}</span>
                                  <RiskBadge risk={perm.risk} />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                                  {perm.description}
                                </p>
                                <code className="text-[9px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/50 mt-1.5 inline-block">
                                  {perm.key}
                                </code>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
