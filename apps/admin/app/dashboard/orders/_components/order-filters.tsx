"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Filter, Calendar, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OrderFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  dateRange?: { from: Date | null; to: Date | null };
  onDateRangeChange?: (range: { from: Date | null; to: Date | null }) => void;
  amountRange?: { min: number | null; max: number | null };
  onAmountRangeChange?: (range: { min: number | null; max: number | null }) => void;
  className?: string;
}

const AMOUNT_PRESETS = [
  { label: "All Amounts", value: "all" },
  { label: "Under KSh 1,000", value: "0-1000" },
  { label: "KSh 1,000 - 10,000", value: "1000-10000" },
  { label: "KSh 10,000 - 50,000", value: "10000-50000" },
  { label: "KSh 50,000+", value: "50000-" },
];

export function OrderFilters({
  search,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  amountRange,
  onAmountRangeChange,
  className = "",
}: OrderFiltersProps) {
  const [amountPopoverOpen, setAmountPopoverOpen] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const hasActiveFilters =
    search ||
    (dateRange?.from || dateRange?.to) ||
    (amountRange?.min !== null && amountRange?.min !== undefined) ||
    (amountRange?.max !== null && amountRange?.max !== undefined);

  const getAmountLabel = () => {
    if (!amountRange) return "Amount";
    if (amountRange.min === null && amountRange.max === null) return "Amount";
    if (amountRange.min !== null && amountRange.max !== null) {
      return `KSh ${amountRange.min.toLocaleString()} - ${amountRange.max.toLocaleString()}`;
    }
    if (amountRange.min !== null) return `KSh ${amountRange.min.toLocaleString()}+`;
    if (amountRange.max !== null) return `Under KSh ${amountRange.max.toLocaleString()}`;
    return "Amount";
  };

  const getDateLabel = () => {
    if (!dateRange) return "Date Range";
    if (!dateRange.from && !dateRange.to) return "Date Range";
    if (dateRange.from && dateRange.to) {
      return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
    }
    if (dateRange.from) return `Since ${formatDate(dateRange.from)}`;
    if (dateRange.to) return `Until ${formatDate(dateRange.to)}`;
    return "Date Range";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
  };

  const handleAmountPreset = (value: string) => {
    if (!onAmountRangeChange) return;

    if (value === "all") {
      onAmountRangeChange({ min: null, max: null });
    } else if (value === "0-1000") {
      onAmountRangeChange({ min: 0, max: 1000 });
    } else if (value === "1000-10000") {
      onAmountRangeChange({ min: 1000, max: 10000 });
    } else if (value === "10000-50000") {
      onAmountRangeChange({ min: 10000, max: 50000 });
    } else if (value === "50000-") {
      onAmountRangeChange({ min: 50000, max: null });
    }
    setAmountPopoverOpen(false);
  };

  const handleClearDateRange = () => {
    if (onDateRangeChange) {
      onDateRangeChange({ from: null, to: null });
    }
  };

  const handleClearAmountRange = () => {
    if (onAmountRangeChange) {
      onAmountRangeChange({ min: null, max: null });
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-3 items-center justify-between ${className}`}>
      {/* Search Input */}
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by order ID, customer name, email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 text-sm"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Date Range Filter */}
        {onDateRangeChange && (
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                <Calendar className="h-4 w-4" />
                {getDateLabel()}
                {(dateRange?.from || dateRange?.to) && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    Active
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-3" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Date Range</p>
                  {(dateRange?.from || dateRange?.to) && (
                    <Button variant="ghost" size="sm" onClick={handleClearDateRange} className="h-6 text-xs">
                      Clear
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">From</label>
                    <Input
                      type="date"
                      value={dateRange?.from ? dateRange.from.toISOString().split('T')[0] : ''}
                      onChange={(e) =>
                        onDateRangeChange({
                          ...dateRange,
                          from: e.target.value ? new Date(e.target.value) : null,
                          to: dateRange?.to || null,
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">To</label>
                    <Input
                      type="date"
                      value={dateRange?.to ? dateRange.to.toISOString().split('T')[0] : ''}
                      onChange={(e) =>
                        onDateRangeChange({
                          from: dateRange?.from || null,
                          to: e.target.value ? new Date(e.target.value) : null,
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onDateRangeChange({
                        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        to: new Date(),
                      })
                    }
                    className="text-xs h-7"
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      onDateRangeChange({
                        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                        to: new Date(),
                      })
                    }
                    className="text-xs h-7"
                  >
                    Last 30 days
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Amount Range Filter */}
        {onAmountRangeChange && (
          <Popover open={amountPopoverOpen} onOpenChange={setAmountPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1">
                KSh
                {getAmountLabel()}
                {(amountRange?.min !== null || amountRange?.max !== null) && (
                  <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                    Active
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" align="end">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Amount Range (KSh)</p>
                  {(amountRange?.min !== null || amountRange?.max !== null) && (
                    <Button variant="ghost" size="sm" onClick={handleClearAmountRange} className="h-6 text-xs">
                      Clear
                    </Button>
                  )}
                </div>
                <div className="space-y-1">
                  {AMOUNT_PRESETS.map((preset) => (
                    <Button
                      key={preset.value}
                      variant={
                        (amountRange?.min === 0 && amountRange?.max === 1000 && preset.value === "0-1000") ||
                        (amountRange?.min === 1000 && amountRange?.max === 10000 && preset.value === "1000-10000") ||
                        (amountRange?.min === 10000 && amountRange?.max === 50000 && preset.value === "10000-50000") ||
                        (amountRange?.min === 50000 && amountRange?.max === null && preset.value === "50000-") ||
                        (amountRange?.min === null && amountRange?.max === null && preset.value === "all")
                          ? "default"
                          : "ghost"
                      }
                      size="sm"
                      onClick={() => handleAmountPreset(preset.value)}
                      className="w-full justify-start text-xs h-7"
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Min</label>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={amountRange?.min ?? ""}
                      onChange={(e) =>
                        onAmountRangeChange({
                          ...amountRange,
                          min: e.target.value ? Number(e.target.value) : null,
                          max: amountRange?.max || null,
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Max</label>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={amountRange?.max ?? ""}
                      onChange={(e) =>
                        onAmountRangeChange({
                          min: amountRange?.min || null,
                          max: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* More Filters (placeholder for future) */}
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Filter className="h-4 w-4" />
          More Filters
        </Button>
      </div>
    </div>
  );
}
