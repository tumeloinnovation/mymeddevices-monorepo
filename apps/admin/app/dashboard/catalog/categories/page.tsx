"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Loader2,
  Boxes,
  Search,
  Filter,
  X,
  MoreVertical,
  FolderPlus,
} from "lucide-react";
import {
  catalogService,
  CategoryTree,
} from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

type FilterStatus = "all" | "active" | "inactive";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryTree | null>(null);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [userEditedSlug, setUserEditedSlug] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Expansion state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await catalogService.getCategories();
      setCategories(data);
      // Auto-expand top level by default
      setExpandedIds(new Set(data.map((c) => c.id)));
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (!editingCategory && !userEditedSlug && name) {
      const generatedSlug = name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
    }
  }, [name, editingCategory, userEditedSlug]);

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const toggleExpandAll = () => {
    if (expandedIds.size === getAllCategoryIds(categories).size) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(getAllCategoryIds(categories));
    }
  };

  const getAllCategoryIds = (cats: CategoryTree[]): Set<string> => {
    const ids = new Set<string>();
    const collect = (nodes: CategoryTree[]) => {
      nodes.forEach((n) => {
        ids.add(n.id);
        if (n.children?.length) collect(n.children);
      });
    };
    collect(cats);
    return ids;
  };

  const openCreateSheet = (pid?: string) => {
    setEditingCategory(null);
    setUserEditedSlug(false);
    setParentId(pid);
    setName("");
    setSlug("");
    setDescription("");
    setIsActive(true);
    setSheetOpen(true);
  };

  const openEditSheet = (category: CategoryTree) => {
    setEditingCategory(category);
    setUserEditedSlug(true);
    setParentId(undefined);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
    setIsActive(category.is_active);
    setSheetOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCategory) {
        await catalogService.updateCategory(editingCategory.id, {
          name,
          slug,
          description,
          is_active: isActive
        });
        toast.success("Category updated");
      } else {
        await catalogService.createCategory({
          name,
          slug,
          description,
          parent_id: parentId,
          is_active: isActive,
          sort_order: 0
        });
        toast.success("Category created");
      }
      setSheetOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (category: CategoryTree) => {
    try {
      await catalogService.deleteCategory(category.id);
      toast.success("Category deleted");
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    }
  };

  // Stats
  const stats = useMemo(() => {
    let total = 0;
    let active = 0;
    let inactive = 0;
    let withChildren = 0;

    const countNodes = (nodes: CategoryTree[]) => {
      nodes.forEach((n) => {
        total++;
        if (n.is_active) active++;
        else inactive++;
        if (n.children?.length) {
          withChildren++;
          countNodes(n.children);
        }
      });
    };
    countNodes(categories);

    return { total, active, inactive, withChildren };
  }, [categories]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  const hasActiveFilters = searchQuery || statusFilter !== "all";

  // Filtered categories (flat list for rendering)
  const filteredCategories = useMemo(() => {
    const result: { category: CategoryTree; level: number }[] = [];

    const filterNodes = (nodes: CategoryTree[], level: number) => {
      nodes.forEach((node) => {
        const matchesSearch =
          !searchQuery ||
          node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.slug.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && node.is_active) ||
          (statusFilter === "inactive" && !node.is_active);

        // Include if matches, or if children might match
        const hasMatchingChildren = node.children?.some((child) =>
          searchQuery
            ? child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              child.slug.toLowerCase().includes(searchQuery.toLowerCase())
            : statusFilter === "all" ||
              (statusFilter === "active" && child.is_active) ||
              (statusFilter === "inactive" && !child.is_active)
        );

        if (matchesSearch || hasMatchingChildren) {
          result.push({ category: node, level });
          if (node.children?.length && (expandedIds.has(node.id) || hasMatchingChildren)) {
            filterNodes(node.children, level + 1);
          }
        }
      });
    };

    filterNodes(categories, 0);
    return result;
  }, [categories, searchQuery, statusFilter, expandedIds]);

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px]/[28px] font-semibold tracking-tight">
            Categories
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stats.total} total · {stats.active} active · {stats.withChildren} with sub-categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={toggleExpandAll}>
            {expandedIds.size === getAllCategoryIds(categories).size ? (
              <>Collapse all</>
            ) : (
              <>Expand all</>
            )}
          </Button>
          <Button size="default" onClick={() => openCreateSheet()}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Categories"
          value={stats.total}
          trend={null}
        />
        <StatCard
          label="Active"
          value={stats.active}
          trend={{ value: "+3", positive: true }}
          trendLabel="vs last month"
        />
        <StatCard
          label="Inactive"
          value={stats.inactive}
          trend={null}
        />
        <StatCard
          label="Parent Categories"
          value={categories.length}
          trend={null}
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter categories..."
            className="h-8 pl-8 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Categories Tree */}
      {loading ? (
        <TreeSkeleton />
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          hasFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          icon={<Boxes className="h-10 w-10" />}
          noun="categories"
        />
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="h-[34px] bg-muted/30 border-b flex items-center px-4">
            <div className="w-6" />
            <div className="flex-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Category
            </div>
            <div className="w-24 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Children
            </div>
            <div className="w-20 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </div>
            <div className="w-10" />
          </div>

          {/* Tree Rows */}
          {filteredCategories.map(({ category, level }) => (
            <CategoryRow
              key={category.id}
              category={category}
              level={level}
              isExpanded={expandedIds.has(category.id)}
              onToggleExpanded={() => toggleExpanded(category.id)}
              onEdit={openEditSheet}
              onAddChild={(pid) => openCreateSheet(pid)}
              onDelete={handleDeleteCategory}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-[480px] p-0 gap-0">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Boxes className="h-5 w-5" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-semibold">
                    {editingCategory ? "Edit Category" : "Add Category"}
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    {editingCategory
                      ? "Update category details"
                      : parentId
                      ? "Add a sub-category"
                      : "Add a new category to your catalog"}
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
                  placeholder="e.g. Diagnostics"
                  required
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
                  placeholder="diagnostics"
                  className="font-mono text-sm"
                  required
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
                  placeholder="Brief description..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 pt-2">
                <Checkbox
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked as boolean)}
                />
                <div>
                  <Label htmlFor="is_active" className="text-sm cursor-pointer">
                    Active Status
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Visible in storefront
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
                disabled={saving}
                className="h-9 px-4"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="h-9 px-5">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCategory ? "Save Changes" : "Create Category"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
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

// Category Row Component
function CategoryRow({
  category,
  level = 0,
  isExpanded,
  onToggleExpanded,
  onEdit,
  onAddChild,
  onDelete,
}: {
  category: CategoryTree;
  level?: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onEdit: (cat: CategoryTree) => void;
  onAddChild: (pid: string) => void;
  onDelete: (cat: CategoryTree) => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const childCount = category.children?.length || 0;
  const indentWidth = level * 20;

  return (
    <div
      className={`h-[36px] border-b last:border-0 flex items-center hover:bg-muted/30 transition-colors ${
        !category.is_active ? "opacity-50" : ""
      }`}
    >
      {/* Expand/Collapse + Indent */}
      <div
        className="flex items-center"
        style={{ paddingLeft: `${indentWidth + 12}px` }}
      >
        {hasChildren ? (
          <button
            onClick={onToggleExpanded}
            className="p-0.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}
      </div>

      {/* Icon + Name */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <div
          className={`h-5 w-5 rounded flex items-center justify-center shrink-0 ${
            category.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {level === 0 ? (
            <Boxes className="h-3 w-3" />
          ) : (
            <FolderTree className="h-3 w-3" />
          )}
        </div>
        <span className="text-sm font-medium text-foreground truncate">
          {category.name}
        </span>
        <span className="text-xs text-muted-foreground font-mono shrink-0">
          /{category.slug}
        </span>
      </div>

      {/* Children Count */}
      <div className="w-24 text-right pr-4">
        <span className="text-sm text-foreground tabular-nums">
          {childCount > 0 ? childCount : "—"}
        </span>
      </div>

      {/* Status Badge */}
      <div className="w-20 text-center">
        <StatusBadge isActive={category.is_active} />
      </div>

      {/* Actions */}
      <div className="w-10 flex justify-end pr-2">
        <RowActions
          category={category}
          hasChildren={hasChildren}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onDelete={onDelete}
        />
      </div>
    </div>
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
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// Row Actions Component
function RowActions({
  category,
  hasChildren,
  onEdit,
  onAddChild,
  onDelete,
}: {
  category: CategoryTree;
  hasChildren: boolean;
  onEdit: (cat: CategoryTree) => void;
  onAddChild: (pid: string) => void;
  onDelete: (cat: CategoryTree) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" className="h-7 w-7">
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(category)}>Edit category</DropdownMenuItem>
        {hasChildren && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAddChild(category.id)}>
              <FolderPlus className="h-3.5 w-3.5 mr-1.5" />
              Add sub-category
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(category)}>
          Delete category
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Tree Skeleton Component
function TreeSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="h-[34px] bg-muted/30 border-b" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="h-[36px] border-b last:border-0 animate-pulse bg-muted/20"
          style={{ paddingLeft: `${(i % 3) * 20 + 12}px` }}
        />
      ))}
    </div>
  );
}

// Empty State Component
function EmptyState({
  hasFilters,
  onClearFilters,
  icon,
  noun,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  icon: React.ReactNode;
  noun: string;
}) {
  return (
    <div className="border rounded-lg p-12 text-center">
      <div className="text-muted-foreground/30 mx-auto mb-3 flex justify-center">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-foreground mb-1">
        {hasFilters ? `No ${noun} found` : `No ${noun} yet`}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {hasFilters
          ? "Try adjusting your filters to find what you're looking for."
          : `${noun.charAt(0).toUpperCase() + noun.slice(1)} will appear here once created.`}
      </p>
      {hasFilters && (
        <Button size="sm" variant="outline" onClick={onClearFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
