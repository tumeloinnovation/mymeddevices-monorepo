"use client";

import React, { useState } from "react";
import { KeyRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { RoleDefinition } from "@mymeddevices/shared-core";

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  editingRole: RoleDefinition | null;
  baseRoleKey: string;
  baseRoles: RoleDefinition[];
  onSave: (
    role: { key: string; label: string; description: string },
    baseRoleKey: string
  ) => boolean;
  onUpdate: (roleKey: string, updates: { label: string; description: string }) => void;
}

export function RoleDialog({
  open,
  onOpenChange,
  mode,
  editingRole,
  baseRoleKey,
  baseRoles,
  onSave,
  onUpdate,
}: RoleDialogProps) {
  const [key, setKey] = useState(editingRole?.key || "");
  const [label, setLabel] = useState(editingRole?.label || "");
  const [description, setDescription] = useState(editingRole?.description || "");
  const [base, setBase] = useState(baseRoleKey);

  const handleSubmit = () => {
    if (mode === "create") {
      if (!key.trim() || !label.trim()) {
        toast.error("Role key and label are required");
        return;
      }
      const ok = onSave(
        { key, label, description },
        base
      );
      if (ok) onOpenChange(false);
    } else {
      if (!editingRole) return;
      onUpdate(editingRole.key, { label, description });
      onOpenChange(false);
    }
  };

  const isCreate = mode === "create";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            {isCreate ? "Create Custom Role" : "Edit Custom Role"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isCreate
              ? "Define a new administrative or operational role with preset capabilities cloned from a base template."
              : "Update the label and description for this custom role. Capabilities are managed in the Role Matrix."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
          <div>
            <label className="block font-medium text-foreground mb-1">Role Identifier (Slug)</label>
            <Input
              placeholder="e.g. clinical_auditor"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={!isCreate}
              className="text-xs h-8.5 font-mono disabled:opacity-60"
            />
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isCreate
                ? "Lowercase letters, numbers, and underscores only."
                : "Role keys cannot be changed after creation."}
            </p>
          </div>

          <div>
            <label className="block font-medium text-foreground mb-1">Display Label</label>
            <Input
              placeholder="e.g. Clinical Trial Auditor"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="text-xs h-8.5"
            />
          </div>

          {isCreate && (
            <div>
              <label className="block font-medium text-foreground mb-1">Clone Permissions Template From</label>
              <Select value={base} onValueChange={setBase}>
                <SelectTrigger className="text-xs h-8.5">
                  <SelectValue placeholder="Select template role" />
                </SelectTrigger>
                <SelectContent>
                  {baseRoles.map((r) => (
                    <SelectItem key={r.key} value={r.key} className="text-xs">
                      {r.label} ({r.key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="block font-medium text-foreground mb-1">Description</label>
            <Input
              placeholder="Brief summary of duties and responsibilities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs h-8.5"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            className="text-xs h-8"
          >
            {isCreate ? "Create Role" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}