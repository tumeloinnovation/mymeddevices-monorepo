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
  Plus,
  Loader2,
  Trash2,
  Package,
  Palette,
} from "lucide-react";
import { catalogService, Tag } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

  // Sheet/Dialog states
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#e0752b");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEditedSlug, setUserEditedSlug] = useState(false);

  // Bulk operations state
  const [bulkUpdating, setBulkUpdating] = useState(false);

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

  // Auto-generate slug from name
  useEffect(() => {
    if (!editingTag && !userEditedSlug && name) {
      const generatedSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      setSlug(generatedSlug);
    }
  }, [name, editingTag, userEditedSlug]);

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

  const hasActiveFilters = !!search || statusFilter !== "all";

  // Open create sheet
  const openCreateSheet = () => {
    setEditingTag(null);
    setUserEditedSlug(false);
    setName("");
    setSlug("");
    setDescription("");
    setColor("#e0752b");
    setIsActive(true);
    setSheetOpen(true);
  };

  // Open edit sheet
  const openEditSheet = (tag: Tag) => {
    setEditingTag(tag);
    setUserEditedSlug(true);
    setName(tag.name);
    setSlug(tag.slug);
    setDescription(tag.description || "");
    setColor(tag.color || "#e0752b");
    setIsActive(tag.is_active);
    setSheetOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingTag) {
        await catalogService.updateTag(editingTag.id, {
          name,
          slug,
          description,
          color,
          is_active: isActive,
        });
        toast.success("Tag updated successfully");
      } else {
        await catalogService.createTag({
          name,
          slug,
          description,
          color,
          is_active: isActive,
        });
        toast.success("Tag created successfully");
      }
      setSheetOpen(false);
      fetchTags();
    } catch (error) {
      console.error("Failed to save tag:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save tag"
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const openDeleteDialog = (tag: Tag) => {
    setTagToDelete(tag);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!tagToDelete) return;

    setSaving(true);
    try {
      await catalogService.deleteTag(tagToDelete.id);
      toast.success("Tag deleted successfully");
      setDeleteDialogOpen(false);
      fetchTags();
    } catch (error) {
      console.error("Failed to delete tag:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete tag"
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle bulk activate/deactivate
  const handleBulkActivate = async () => {
    if (selectedIds.size === 0) return;

    setBulkUpdating(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          catalogService.updateTag(id, { is_active: true })
        )
      );
      toast.success(`${selectedIds.size} tag${selectedIds.size !== 1 ? "s" : ""} activated`);
      setSelectedIds(new Set());
      fetchTags();
    } catch (error) {
      console.error("Failed to activate tags:", error);
      toast.error("Failed to activate tags");
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedIds.size === 0) return;

    setBulkUpdating(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          catalogService.updateTag(id, { is_active: false })
        )
      );
      toast.success(`${selectedIds.size} tag${selectedIds.size !== 1 ? "s" : ""} deactivated`);
      setSelectedIds(new Set());
      fetchTags();
    } catch (error) {
      console.error("Failed to deactivate tags:", error);
      toast.error("Failed to deactivate tags");
    } finally {
      setBulkUpdating(false);
    }
  };

  // Handle view products
  const handleViewProducts = (tag: Tag) => {
    // Navigate to products page with tag filter
    window.location.href = `/dashboard/catalog/products?tag=${encodeURIComponent(tag.slug)}`;
  };

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
        <Button size="default" onClick={openCreateSheet}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Tag
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Tags" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Inactive" value={stats.inactive} />
        <StatCard label="Tagged Products" value={stats.totalProducts} />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            className="h-8 pl-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
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
            Clear
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
            <Button
              size="sm"
              variant="secondary"
              onClick={handleBulkActivate}
              disabled={bulkUpdating}
            >
              {bulkUpdating ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1" />
              )}
              Activate
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDeactivate}
              disabled={bulkUpdating}
            >
              {bulkUpdating ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <X className="h-3.5 w-3.5 mr-1" />
              )}
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
                      checked={
                        selectedIds.size === filteredTags.length &&
                        filteredTags.length > 0
                      }
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
                  <TableHead className="h-[34px] text-center">
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
                    <TableCell className="p-2 text-center">
                      <span className="text-sm text-foreground tabular-nums inline-flex items-center gap-1.5">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        {tag.product_count.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="p-2 text-center">
                      <StatusBadge isActive={tag.is_active} />
                    </TableCell>
                    <TableCell className="p-2">
                      <RowActions
                        tag={tag}
                        onEdit={openEditSheet}
                        onDelete={openDeleteDialog}
                        onViewProducts={handleViewProducts}
                      />
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

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-[480px] p-0 gap-0">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Hash className="h-5 w-5" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-semibold">
                    {editingTag ? "Edit Tag" : "Add Tag"}
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    {editingTag
                      ? "Update tag details"
                      : "Add a new tag to your catalog"}
                  </SheetDescription>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., New Arrival"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-sm">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setUserEditedSlug(true);
                  }}
                  placeholder="new-arrival"
                  className="font-mono text-sm"
                  pattern="[a-z0-9-]+"
                  title="Slug must contain only lowercase letters, numbers, and hyphens"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-generated from name (edit to customize)
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this tag..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Color */}
              <div className="space-y-1.5">
                <Label htmlFor="color" className="text-sm">Color</Label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-md border border-border shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="color"
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="h-9 flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Choose a color to visually identify this tag
                    </p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 pt-2">
                <Checkbox
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={(checked) =>
                    setIsActive(checked as boolean)
                  }
                />
                <div>
                  <Label htmlFor="is_active" className="text-sm cursor-pointer">
                    Active Status
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Visible in storefront filters
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t flex items-center justify-end gap-3 bg-muted/20">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setSheetOpen(false)}
                className="h-9 px-4"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="h-9 px-5">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingTag ? "Save Changes" : "Create Tag"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the tag{" "}
              <span className="font-semibold">"{tagToDelete?.name}"</span>?
              {tagToDelete && tagToDelete.product_count > 0 && (
                <>
                  {" "}
                  This tag is currently used by{" "}
                  <span className="font-semibold">
                    {tagToDelete.product_count}
                  </span>{" "}
                  product{tagToDelete.product_count !== 1 ? "s" : ""}. The tag
                  will be removed from these products.
                </>
              )}
              {" "}This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={buttonVariants({ variant: "destructive" })}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Tag
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="px-4 py-3 bg-card border rounded-lg">
      <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-[24px] font-semibold tabular-nums tracking-tight">
        {value.toLocaleString()}
      </div>
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
      className={`h-7 px-3 rounded-md text-xs font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
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
      className="h-4 w-4 rounded-sm shrink-0 border border-border/30 shadow-sm"
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
function RowActions({
  tag,
  onEdit,
  onDelete,
  onViewProducts,
}: {
  tag: Tag;
  onEdit: (tag: Tag) => void;
  onDelete: (tag: Tag) => void;
  onViewProducts: (tag: Tag) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" className="h-7 w-7">
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={() => onEdit(tag)}>
          Edit tag
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onViewProducts(tag)}>
          <Package className="h-3.5 w-3.5 mr-2" />
          View products
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(tag)}
          className="text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5 mr-2" />
          Delete tag
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
