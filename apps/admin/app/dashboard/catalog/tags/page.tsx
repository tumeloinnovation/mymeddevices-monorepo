"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Hash,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MoreVertical,
  Filter,
} from "lucide-react";
import { catalogService, Tag } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";

type SortField = "name" | "slug" | "product_count" | "created_at";
type SortOrder = "asc" | "desc";
type FilterStatus = "all" | "active" | "inactive";

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchTags = async () => {
    setLoading(true);
    try {
      const response = await catalogService.getTags({
        active_only: false,
        page,
        page_size: pageSize,
      });

      if (response?.tags) {
        setTags(response.tags);
        setTotal(response.total);
      }
    } catch (error) {
      console.error("Failed to load tags:", error);
      toast.error("Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [page]);

  // Filter and sort tags
  const filteredTags = useMemo(() => {
    let filtered = tags.filter((tag) => {
      const matchesSearch =
        tag.name.toLowerCase().includes(search.toLowerCase()) ||
        tag.slug.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && tag.is_active) ||
        (statusFilter === "inactive" && !tag.is_active);

      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "slug":
          aVal = a.slug.toLowerCase();
          bVal = b.slug.toLowerCase();
          break;
        case "product_count":
          aVal = a.product_count;
          bVal = b.product_count;
          break;
        case "created_at":
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tags, search, statusFilter, sortField, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    const activeCount = tags.filter((t) => t.is_active).length;
    const inactiveCount = tags.filter((t) => !t.is_active).length;
    const totalProducts = tags.reduce((sum, t) => sum + t.product_count, 0);

    return {
      total: tags.length,
      active: activeCount,
      inactive: inactiveCount,
      totalProducts,
    };
  }, [tags]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredTags.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTags.map((t) => t.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const hasActiveFilters = search || statusFilter !== "all";

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px]/[28px] font-semibold tracking-tight">
            Tags
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total} total · {stats.active} active · {stats.inactive} inactive
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary">
            <Filter className="h-3.5 w-3.5 mr-1" />
            Filter
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Tags"
          value={stats.total}
          trend={null}
        />
        <StatCard
          label="Active"
          value={stats.active}
          trend={{ value: "+12", positive: true }}
          trendLabel="vs last month"
        />
        <StatCard
          label="Inactive"
          value={stats.inactive}
          trend={null}
        />
        <StatCard
          label="Tagged Products"
          value={stats.totalProducts}
          trend={{ value: "+8.2%", positive: true }}
          trendLabel="vs last month"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter tags..."
            className="h-8 pl-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1">
          <FilterChip
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          >
            All
          </FilterChip>
          <FilterChip
            active={statusFilter === "active"}
            onClick={() => setStatusFilter("active")}
          >
            Active
          </FilterChip>
          <FilterChip
            active={statusFilter === "inactive"}
            onClick={() => setStatusFilter("inactive")}
          >
            Inactive
          </FilterChip>
        </div>

        {hasActiveFilters && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 ml-auto"
            onClick={clearFilters}
          >
            <X className="h-3 w-3 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-4 py-2 mb-2 bg-secondary/30 border border-border rounded-lg">
          <span className="text-sm text-foreground">
            {selectedIds.size} tag{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary">
              Activate
            </Button>
            <Button size="sm" variant="destructive">
              Deactivate
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <TableSkeleton />
      ) : filteredTags.length === 0 ? (
        <EmptyState
          hasFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="h-[34px] bg-muted/30">
                  <TableHead className="h-[34px] w-10">
                    <Checkbox
                      checked={selectedIds.size === filteredTags.length && filteredTags.length > 0}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="h-[34px]">
                    <SortButton
                      field="name"
                      label="Name"
                      active={sortField === "name"}
                      order={sortOrder}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="h-[34px]">
                    <SortButton
                      field="slug"
                      label="Slug"
                      active={sortField === "slug"}
                      order={sortOrder}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="h-[34px] text-right">
                    <SortButton
                      field="product_count"
                      label="Products"
                      active={sortField === "product_count"}
                      order={sortOrder}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="h-[34px] text-center">
                    Status
                  </TableHead>
                  <TableHead className="h-[34px] w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTags.map((tag) => (
                  <TableRow
                    key={tag.id}
                    className="h-[36px] hover:bg-muted/30 data-[state=selected]:bg-primary/10"
                    data-state={selectedIds.has(tag.id) ? "selected" : undefined}
                  >
                    <TableCell className="p-2">
                      <Checkbox
                        checked={selectedIds.has(tag.id)}
                        onCheckedChange={() => toggleSelect(tag.id)}
                        aria-label={`Select ${tag.name}`}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <div className="flex items-center gap-2">
                        <ColorDot color={tag.color} />
                        <span className="text-sm font-medium text-foreground">
                          {tag.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-2">
                      <span className="text-sm text-muted-foreground font-mono">
                        {tag.slug}
                      </span>
                    </TableCell>
                    <TableCell className="p-2 text-right">
                      <span className="text-sm text-foreground tabular-nums">
                        {tag.product_count.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="p-2 text-center">
                      <StatusBadge isActive={tag.is_active} />
                    </TableCell>
                    <TableCell className="p-2">
                      <RowActions tag={tag} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground tabular-nums">
                Page {page} of {Math.ceil(total / pageSize)}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= Math.ceil(total / pageSize)}
                onClick={() => setPage((p) => p + 1)}
                className="h-8"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  trend,
  trendLabel,
}: {
  label: string;
  value: number;
  trend?: { value: string; positive: boolean } | null;
  trendLabel?: string;
}) {
  return (
    <div className="px-4 py-3 bg-card border rounded-lg">
      <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-[24px] font-semibold tabular-nums tracking-tight">
        {value.toLocaleString()}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-1">
          <span
            className={`text-xs font-medium tabular-nums ${
              trend.positive ? "text-success" : "text-destructive"
            }`}
          >
            {trend.value}
          </span>
          {trendLabel && (
            <span className="text-xs text-muted-foreground">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

// Filter Chip Component
function FilterChip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-7 px-2.5 rounded-md text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted/50 text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

// Sort Button Component
function SortButton({
  field,
  label,
  active,
  order,
  onSort,
}: {
  field: SortField;
  label: string;
  active: boolean;
  order: SortOrder;
  onSort: (field: SortField) => void;
}) {
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      {active && (
        <span className="text-foreground">
          {order === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </span>
      )}
    </button>
  );
}

// Color Dot Component
function ColorDot({ color }: { color?: string }) {
  return (
    <div
      className="h-5 w-5 rounded shrink-0"
      style={{ backgroundColor: color || "#e0752b" }}
    />
  );
}

// Status Badge Component
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
        isActive
          ? "bg-success/15 text-success border border-success/20"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {isActive ? (
        <>
          <Check className="h-2.5 w-2.5" />
          Active
        </>
      ) : (
        <>
          <X className="h-2.5 w-2.5" />
          Inactive
        </>
      )}
    </span>
  );
}

// Row Actions Component
function RowActions({ tag }: { tag: Tag }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon-sm"
          variant="ghost"
          className="h-7 w-7"
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem>Edit tag</DropdownMenuItem>
        <DropdownMenuItem>View products</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          {tag.is_active ? "Deactivate" : "Activate"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Table Skeleton Component
function TableSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="h-[34px] bg-muted/30 border-b" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="h-[36px] border-b last:border-0 animate-pulse bg-muted/20"
        />
      ))}
    </div>
  );
}

// Empty State Component
function EmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="border rounded-lg p-12 text-center">
      <Hash className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
      <h3 className="text-sm font-medium text-foreground mb-1">
        {hasFilters ? "No tags found" : "No tags yet"}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {hasFilters
          ? "Try adjusting your filters to find what you're looking for."
          : "Tags will appear here once created."}
      </p>
      {hasFilters && (
        <Button size="sm" variant="outline" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
