"use client";

import React from "react";
import { Plus, Pencil, Trash2, ArrowRight, Sparkles, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleIcon } from "./permissions-shared";
import type { PermissionsPage } from "../_hooks/use-permissions-page";

interface CustomRolesTabProps {
  page: PermissionsPage;
  onCreate: () => void;
  onEdit: (roleKey: string) => void;
  onDelete: (roleKey: string) => void;
  onEditMatrix: (roleKey: string) => void;
}

export function CustomRolesTab({ page, onCreate, onEdit, onDelete, onEditMatrix }: CustomRolesTabProps) {
  if (page.loadingPermissions) {
    return (
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    );
  }

  const customRoles = page.allRoles.filter((r) => !r.is_system);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="bg-card border rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground">Custom Platform Roles</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Define specialized operational roles (e.g. Clinical Trial Auditor, Regional Logistics Lead) with fine-tuned capability sets
          </p>
        </div>
        <Button size="sm" onClick={onCreate} className="text-xs h-8.5 gap-1.5 self-start sm:self-auto">
          <Plus className="h-3.5 w-3.5" /> Create New Role
        </Button>
      </div>

      {customRoles.length === 0 ? (
        <div className="text-center py-14 bg-card border rounded-2xl p-6">
          <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-foreground">No custom roles yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Create specialized roles for auditing, regional operations, or any custom workflow by
            cloning a base role&apos;s permissions.
          </p>
          <Button size="sm" onClick={onCreate} className="mt-4 text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Create First Role
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customRoles.map((role) => {
            const count = (page.matrix[role.key] || []).length;
            return (
              <div key={role.key} className="bg-card border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center shrink-0">
                        <RoleIcon role={role.key} className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-xs text-foreground truncate">{role.label}</h3>
                        <code className="text-[10px] font-mono text-muted-foreground">{role.key}</code>
                      </div>
                    </div>
                    <Badge className="bg-blue-600 text-white text-[10px] shrink-0">
                      <Crown className="h-2.5 w-2.5" /> Custom
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{role.description}</p>
                </div>

                <div className="mt-5 pt-3 border-t flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {count} Active Capabilities
                  </span>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-primary"
                      onClick={() => onEdit(role.key)}
                      title="Edit role"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onDelete(role.key)}
                      title="Delete role"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditMatrix(role.key)}
                      className="text-xs h-7 px-2 text-primary"
                    >
                      Edit Matrix <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}