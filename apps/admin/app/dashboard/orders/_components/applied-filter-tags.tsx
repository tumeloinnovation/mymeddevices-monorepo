"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { ActiveFilter } from "../types";

interface AppliedFilterTagsProps {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

export function AppliedFilterTags({ filters, onRemove, onClearAll }: AppliedFilterTagsProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Active Filters:</span>
      {filters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="gap-1 px-2 py-0.5 text-xs"
        >
          {filter.label}
          <button
            onClick={() => onRemove(filter.key)}
            className="ml-1 rounded-full hover:bg-background/20 p-0.5"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 text-xs gap-1 hover:text-destructive"
      >
        <X className="h-3 w-3" />
        Clear All
      </Button>
    </div>
  );
}
