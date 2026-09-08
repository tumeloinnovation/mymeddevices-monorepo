"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Loader2,
  Boxes,
  Search,
  X,
  FolderPlus,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Eye,
  Trash2,
  Edit3,
  Layers,
  Package,
  Filter,
  RefreshCw,
  ImageIcon,
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";

type FilterStatus = "all" | "active" | "inactive";
type FilterProducts = "all" | "has_products" | "empty";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedCategoryDetails, setSelectedCategoryDetails] = useState<CategoryTree | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryTree | null>(null);

  // Delete confirmation modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryTree | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form field state
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [userEditedSlug, setUserEditedSlug] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [minWarrantyMonths, setMinWarrantyMonths] = useState<number>(0);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Advanced Filters and expansion
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [productsFilter, setProductsFilter] = useState<FilterProducts>("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
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

  const openCreateDialog = (pid?: string) => {
    setEditingCategory(null);
    setUserEditedSlug(false);
    setParentId(pid);
    setName("");
    setSlug("");
    setDescription("");
    setIconUrl("");
    setMinWarrantyMonths(0);
    setSortOrder(0);
    setIsActive(true);
    setFormDialogOpen(true);
  };

  const openEditDialog = (category: CategoryTree) => {
    setEditingCategory(category);
    setUserEditedSlug(true);
    setParentId(category.parent_id || undefined);
    setName(category.name);
    setSlug(category.slug);
    setDescription(category.description || "");
    setIconUrl(category.icon_url || "");
    setMinWarrantyMonths(category.min_warranty_months || 0);
    setSortOrder(category.sort_order ?? 0);
    setIsActive(category.is_active);
    setFormDialogOpen(true);
  };

  const openDetailsDialog = (category: CategoryTree) => {
    setSelectedCategoryDetails(category);
    setDetailsDialogOpen(true);
  };

  const handleToggleActiveStatus = async (category: CategoryTree, newStatus: boolean) => {
    // Optimistically update
    const updateTreeStatus = (nodes: CategoryTree[]): CategoryTree[] => {
      return nodes.map((node) => {
        if (node.id === category.id) {
          return { ...node, is_active: newStatus };
        }
        if (node.children?.length) {
          return { ...node, children: updateTreeStatus(node.children) };
        }
        return node;
      });
    };

    setCategories((prev) => updateTreeStatus(prev));

    try {
      await catalogService.updateCategory(category.id, {
        is_active: newStatus,
      });
      toast.success(`Category marked ${newStatus ? "active" : "draft"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update category status");
      fetchCategories();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCategory) {
        await catalogService.updateCategory(editingCategory.id, {
          name,
          slug,
          description: description || undefined,
          icon_url: iconUrl || undefined,
          min_warranty_months: Number(minWarrantyMonths) || 0,
          parent_id: parentId || null,
          sort_order: Number(sortOrder) || 0,
          is_active: isActive,
        });
        toast.success("Category updated successfully");
      } else {
        await catalogService.createCategory({
          name,
          slug,
          description: description || undefined,
          icon_url: iconUrl || undefined,
          min_warranty_months: Number(minWarrantyMonths) || 0,
          parent_id: parentId || undefined,
          is_active: isActive,
          sort_order: Number(sortOrder) || 0,
        });
        toast.success("Category created successfully");
      }
      setFormDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const promptDeleteCategory = (category: CategoryTree) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      await catalogService.deleteCategory(categoryToDelete.id);
      toast.success(`Category "${categoryToDelete.name}" deleted`);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  // Comprehensive stats
  const stats = useMemo(() => {
    let total = 0;
    let active = 0;
    let inactive = 0;
    let withChildren = 0;
    let emptyCount = 0;
    let totalProducts = 0;

    const countNodes = (nodes: CategoryTree[], isRoot = false) => {
      nodes.forEach((n) => {
        total++;
        if (n.is_active) active++;
        else inactive++;
        if (n.children?.length) {
          withChildren++;
          countNodes(n.children, false);
        }
        if ((n.product_count ?? 0) === 0) {
          emptyCount++;
        }
        if (isRoot) {
          totalProducts += n.product_count ?? 0;
        }
      });
    };
    countNodes(categories, true);

    return { total, active, inactive, withChildren, emptyCount, totalProducts };
  }, [categories]);

  // Options for parent category selection (prevent cycles)
  const parentOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const excludedIds = new Set<string>();
    if (editingCategory) {
      const collectDescendants = (node: CategoryTree) => {
        excludedIds.add(node.id);
        if (node.children) {
          node.children.forEach(collectDescendants);
        }
      };
      collectDescendants(editingCategory);
    }

    const flatten = (cats: CategoryTree[], prefix = "") => {
      cats.forEach((cat) => {
        if (!excludedIds.has(cat.id)) {
          options.push({
            value: cat.id,
            label: prefix ? `${prefix} › ${cat.name}` : cat.name,
          });
          if (cat.children?.length) {
            flatten(cat.children, prefix ? `${prefix} › ${cat.name}` : cat.name);
          }
        }
      });
    };

    flatten(categories);
    return options;
  }, [categories, editingCategory]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setProductsFilter("all");
    setDomainFilter("all");
  };

  const hasActiveFilters =
    !!searchQuery ||
    statusFilter !== "all" ||
    productsFilter !== "all" ||
    domainFilter !== "all";

  // Filtered categories with ancestry context
  const filteredCategories = useMemo(() => {
    const result: { category: CategoryTree; level: number; breadcrumbs: string[] }[] = [];

    const filterNodes = (nodes: CategoryTree[], level: number, ancestorNames: string[]) => {
      nodes.forEach((node) => {
        const matchesSearch =
          !searchQuery ||
          node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (node.description && node.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && node.is_active) ||
          (statusFilter === "inactive" && !node.is_active);

        const matchesProducts =
          productsFilter === "all" ||
          (productsFilter === "has_products" && (node.product_count ?? 0) > 0) ||
          (productsFilter === "empty" && (node.product_count ?? 0) === 0);

        const matchesDomain =
          domainFilter === "all" ||
          (level === 0
            ? node.id === domainFilter
            : ancestorNames.length > 0 &&
              categories.find((c) => c.id === domainFilter)?.name === ancestorNames[0]);

        const directMatch = matchesSearch && matchesStatus && matchesProducts && matchesDomain;

        // Check if any children match
        const hasMatchingChildren =
          hasActiveFilters &&
          !!node.children?.some((child) =>
            searchQuery
              ? child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                child.slug.toLowerCase().includes(searchQuery.toLowerCase())
              : true
          );

        if (directMatch || hasMatchingChildren) {
          result.push({
            category: node,
            level,
            breadcrumbs: ancestorNames,
          });
          if (node.children?.length && (expandedIds.has(node.id) || hasMatchingChildren)) {
            filterNodes(node.children, level + 1, [...ancestorNames, node.name]);
          }
        }
      });
    };

    filterNodes(categories, 0, []);
    return result;
  }, [
    categories,
    searchQuery,
    statusFilter,
    productsFilter,
    domainFilter,
    expandedIds,
    hasActiveFilters,
  ]);

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Categories
            </h1>
            <Badge variant="outline" className="text-xs font-medium">
              Catalog Taxonomy
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Configure categories, icon/image URLs, warranty thresholds, and parent-child hierarchy.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button size="sm" variant="outline" onClick={toggleExpandAll} className="h-9">
            <Layers className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            {expandedIds.size === getAllCategoryIds(categories).size
              ? "Collapse All"
              : "Expand All"}
          </Button>
          <Button size="default" onClick={() => openCreateDialog()} className="h-9">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Categories"
          value={stats.total}
          subtext={`${categories.length} root domains`}
          icon={<Boxes className="h-4 w-4 text-primary" />}
        />
        <StatCard
          label="Active Categories"
          value={stats.active}
          subtext={
            stats.total > 0
              ? `${Math.round((stats.active / stats.total) * 100)}% active in catalog`
              : "0% active"
          }
          icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
          highlight="active"
        />
        <StatCard
          label="Total Products"
          value={stats.totalProducts}
          subtext="Assigned across catalog tree"
          icon={<Package className="h-4 w-4 text-blue-600" />}
        />
        <StatCard
          label="Unassigned Categories"
          value={stats.emptyCount}
          subtext="Categories with 0 items"
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          highlight={stats.emptyCount > 0 ? "warning" : undefined}
        />
      </div>

      {/* Enhanced Filter & Search Bar */}
      <div className="bg-card p-3.5 rounded-xl border space-y-3 mb-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by category name, slug, keywords..."
              className="h-9 pl-9 pr-8 text-sm bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Root Domain Selector */}
          <div className="flex items-center gap-2">
            <Select value={domainFilter} onValueChange={setDomainFilter}>
              <SelectTrigger className="h-9 text-xs w-[180px] bg-background">
                <SelectValue placeholder="All Domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-medium">
                  All Domains ({categories.length})
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-xs">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Inventory Status Selector */}
            <Select
              value={productsFilter}
              onValueChange={(val) => setProductsFilter(val as FilterProducts)}
            >
              <SelectTrigger className="h-9 text-xs w-[150px] bg-background">
                <SelectValue placeholder="All Inventory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Items
                </SelectItem>
                <SelectItem value="has_products" className="text-xs">
                  Has Products (&gt;0)
                </SelectItem>
                <SelectItem value="empty" className="text-xs">
                  Unassigned (0)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Secondary Filter Chips Row */}
        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Status:
            </span>
            <FilterChip
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
            >
              All ({stats.total})
            </FilterChip>
            <FilterChip
              active={statusFilter === "active"}
              onClick={() => setStatusFilter("active")}
            >
              Active ({stats.active})
            </FilterChip>
            <FilterChip
              active={statusFilter === "inactive"}
              onClick={() => setStatusFilter("inactive")}
            >
              Drafts ({stats.inactive})
            </FilterChip>
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
                onClick={clearFilters}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset filters
              </Button>
            )}
            <span className="text-muted-foreground font-medium">
              Showing {filteredCategories.length} of {stats.total} categories
            </span>
          </div>
        </div>
      </div>

      {/* Categories Tree Table */}
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
        <div className="border rounded-xl overflow-hidden bg-card shadow-2xs">
          {/* Header */}
          <div className="h-10 bg-muted/40 border-b flex items-center px-4 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            <div className="w-8" />
            <div className="flex-1">Category & Route</div>
            <div className="w-28 text-center">Products</div>
            <div className="w-28 text-center hidden sm:block">Sub-Cats</div>
            <div className="w-24 text-center">Status</div>
            <div className="w-36 text-right pr-2">Quick Actions</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {filteredCategories.map(({ category, level, breadcrumbs }) => (
              <CategoryRow
                key={category.id}
                category={category}
                level={level}
                breadcrumbs={breadcrumbs}
                isExpanded={expandedIds.has(category.id)}
                onToggleExpanded={() => toggleExpanded(category.id)}
                onToggleActive={handleToggleActiveStatus}
                onEdit={openEditDialog}
                onViewDetails={openDetailsDialog}
                onAddChild={(pid) => openCreateDialog(pid)}
                onDelete={promptDeleteCategory}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit Category Modal Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden flex flex-col max-h-[85vh] shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
            {/* Header */}
            <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  {editingCategory ? <Edit3 className="h-5 w-5" /> : <FolderPlus className="h-5 w-5" />}
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-foreground">
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5 text-muted-foreground">
                    {editingCategory
                      ? `Modify category details for ${editingCategory.name}`
                      : parentId
                      ? "Create a nested sub-category under chosen parent"
                      : "Define a top-level product category"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Parent Category */}
              <div className="space-y-1.5">
                <Label htmlFor="parent" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Parent Category
                </Label>
                <SearchableSelect
                  options={parentOptions}
                  value={parentId || ""}
                  onChange={(val) => setParentId(val || undefined)}
                  placeholder="None (Top-Level Domain)"
                  searchPlaceholder="Search parent categories..."
                  emptyMessage="No categories found."
                  className="w-full h-10 text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  Leave empty to create a primary root category.
                </p>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Category Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Diagnostic Imaging & Ultrasound"
                  className="h-10 text-sm"
                  required
                />
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  URL Slug <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                    /category/
                  </span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setUserEditedSlug(true);
                    }}
                    placeholder="diagnostic-imaging"
                    className="h-10 pl-24 font-mono text-sm"
                    required
                  />
                </div>
              </div>

              {/* Image / Icon URL */}
              <div className="space-y-1.5">
                <Label htmlFor="icon_url" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Image or Icon URL
                </Label>
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-lg border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                    <CategoryIconRenderer
                      iconUrl={iconUrl}
                      className="h-5 w-5 text-primary"
                      fallback={<ImageIcon className="h-5 w-5 text-muted-foreground/50" />}
                    />
                  </div>
                  <Input
                    id="icon_url"
                    value={iconUrl}
                    onChange={(e) => setIconUrl(e.target.value)}
                    placeholder="https://... or /static/icons/image.png"
                    className="h-10 text-xs font-mono flex-1"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Provide a direct URL to an image or icon for this category.
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Scope, accepted medical devices, and procurement details..."
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>

              {/* Min Warranty Months & Sort Order */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="min_warranty" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Min Warranty (Months)
                  </Label>
                  <Input
                    id="min_warranty"
                    type="number"
                    min="0"
                    max="120"
                    value={minWarrantyMonths}
                    onChange={(e) => setMinWarrantyMonths(parseInt(e.target.value) || 0)}
                    placeholder="e.g. 12"
                    className="h-10 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">0 for consumables / disposables</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sort_order" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Sort Order Weight
                  </Label>
                  <Input
                    id="sort_order"
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="h-10 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">Lower numbers appear first (0 = top)</p>
                </div>
              </div>

              {/* Active Status Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-muted/20 border rounded-xl">
                <div>
                  <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                    Active Catalog Status
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Active categories are visible to customers and vendors.
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>

            {/* Modal Footer with proper padding & breathing room */}
            <DialogFooter className="p-4 sm:p-5 border-t bg-muted/15 shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                <span>{editingCategory ? "Editing category" : "New category"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormDialogOpen(false)}
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Details Inspection Modal Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[520px] p-0 flex flex-col overflow-hidden max-h-[85vh] shadow-xl">
          {selectedCategoryDetails && (
            <div className="h-full flex flex-col max-h-[85vh]">
              <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center overflow-hidden shrink-0">
                      <CategoryIconRenderer
                        iconUrl={selectedCategoryDetails.icon_url}
                        className="h-6 w-6 text-primary"
                      />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-foreground">
                        {selectedCategoryDetails.name}
                      </DialogTitle>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">
                        /{selectedCategoryDetails.slug}
                      </p>
                    </div>
                  </div>
                  <Badge variant={selectedCategoryDetails.is_active ? "default" : "secondary"}>
                    {selectedCategoryDetails.is_active ? "Active" : "Draft"}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Description
                  </h4>
                  <p className="text-sm text-foreground bg-muted/20 p-3.5 rounded-xl border">
                    {selectedCategoryDetails.description || "No description provided."}
                  </p>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-card border rounded-xl">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Total Products
                    </span>
                    <span className="text-xl font-bold text-foreground mt-0.5 block">
                      {selectedCategoryDetails.product_count ?? 0}
                    </span>
                    <Link
                      href={`/dashboard/catalog/products?category=${selectedCategoryDetails.slug}`}
                      className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 mt-1 font-medium"
                    >
                      View in catalog <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="p-3 bg-card border rounded-xl">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Sub-Categories
                    </span>
                    <span className="text-xl font-bold text-foreground mt-0.5 block">
                      {selectedCategoryDetails.children?.length ?? 0}
                    </span>
                    <span className="text-xs text-muted-foreground">Direct children</span>
                  </div>

                  <div className="p-3 bg-card border rounded-xl">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Min Warranty
                    </span>
                    <span className="text-sm font-semibold text-foreground mt-1 block">
                      {selectedCategoryDetails.min_warranty_months
                        ? `${selectedCategoryDetails.min_warranty_months} Mos`
                        : "None"}
                    </span>
                  </div>
                </div>

                {/* Subcategories List */}
                {selectedCategoryDetails.children?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Sub-Categories ({selectedCategoryDetails.children.length})
                    </h4>
                    <div className="divide-y border rounded-xl bg-card overflow-hidden">
                      {selectedCategoryDetails.children.map((child) => (
                        <div
                          key={child.id}
                          className="p-2.5 flex items-center justify-between text-xs hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-2.5">
                            <CategoryIconRenderer iconUrl={child.icon_url} className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-foreground">{child.name}</span>
                          </div>
                          <span className="text-muted-foreground font-mono">
                            {child.product_count ?? 0} products
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer with proper padding */}
              <DialogFooter className="p-4 sm:p-5 border-t bg-muted/15 shrink-0 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    openEditDialog(selectedCategoryDetails);
                  }}
                  className="h-9"
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                  Edit Category
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  asChild
                  className="h-9"
                >
                  <Link href={`/dashboard/catalog/products?category=${selectedCategoryDetails.slug}`}>
                    Open in Catalog
                    <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                  </Link>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-destructive mb-2">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <AlertDialogTitle className="text-lg">
                Delete Category?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm space-y-2">
              <p>
                Are you sure you want to delete category{" "}
                <strong className="text-foreground font-semibold">
                  &ldquo;{categoryToDelete?.name}&rdquo;
                </strong>
                ?
              </p>
              {categoryToDelete && categoryToDelete.children && categoryToDelete.children.length > 0 && (
                <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20 font-medium">
                  ⚠️ Warning: This category contains {categoryToDelete.children.length} sub-category(ies).
                  Deleting it will unlink or delete child categories.
                </div>
              )}
              {categoryToDelete && (categoryToDelete.product_count ?? 0) > 0 && (
                <div className="p-3 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs rounded-lg border border-amber-500/20 font-medium">
                  ℹ️ Notice: There are {categoryToDelete.product_count} products currently associated with this category.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

// Dynamic Icon & Image Renderer Component
function CategoryIconRenderer({
  iconUrl,
  className = "h-4 w-4",
  fallback = <Boxes className="h-4 w-4" />,
}: {
  iconUrl?: string | null;
  className?: string;
  fallback?: React.ReactNode;
}) {
  if (!iconUrl) return <>{fallback}</>;

  return (
    <img
      src={iconUrl}
      alt="Category icon"
      className={`${className} object-contain rounded`}
      onError={(e) => {
        (e.target as HTMLElement).style.display = "none";
      }}
    />
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  subtext,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  subtext?: string;
  icon?: React.ReactNode;
  highlight?: "active" | "warning";
}) {
  return (
    <div className="p-4 bg-card border rounded-xl shadow-2xs relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        {icon && <div className="p-1.5 rounded-lg bg-muted/50">{icon}</div>}
      </div>
      <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
        {value.toLocaleString()}
      </div>
      {subtext && (
        <div
          className={`text-xs mt-1 font-medium ${
            highlight === "warning"
              ? "text-amber-600 dark:text-amber-400"
              : highlight === "active"
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-muted-foreground"
          }`}
        >
          {subtext}
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
      className={`h-6 px-2.5 rounded-full text-xs font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
          : "border border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// Category Row Component (Title on Top, Route on Bottom, Direct Visible Action Icons)
function CategoryRow({
  category,
  level = 0,
  breadcrumbs = [],
  isExpanded,
  onToggleExpanded,
  onToggleActive,
  onEdit,
  onViewDetails,
  onAddChild,
  onDelete,
}: {
  category: CategoryTree;
  level?: number;
  breadcrumbs?: string[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onToggleActive: (cat: CategoryTree, newStatus: boolean) => void;
  onEdit: (cat: CategoryTree) => void;
  onViewDetails: (cat: CategoryTree) => void;
  onAddChild: (pid: string) => void;
  onDelete: (cat: CategoryTree) => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const childCount = category.children?.length || 0;
  const productCount = category.product_count ?? 0;
  const indentWidth = level * 20;

  return (
    <div
      className={`min-h-[56px] py-2 flex items-center hover:bg-muted/40 transition-colors group ${
        !category.is_active ? "opacity-60 bg-muted/10" : ""
      }`}
    >
      {/* Expand/Collapse Toggle & Indent */}
      <div
        className="flex items-center shrink-0"
        style={{ paddingLeft: `${indentWidth + 12}px` }}
      >
        {hasChildren ? (
          <button
            onClick={onToggleExpanded}
            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}
      </div>

      {/* Category & Route (Top: Title, Bottom: Route) */}
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
        {/* Category Icon / Image */}
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
            category.is_active
              ? "bg-primary/10 text-primary"
              : "border border-border/80 text-muted-foreground bg-muted"
          }`}
        >
          <CategoryIconRenderer
            iconUrl={category.icon_url}
            className="h-4 w-4"
            fallback={level === 0 ? <Boxes className="h-4 w-4" /> : <FolderTree className="h-3.5 w-3.5" />}
          />
        </div>

        {/* Title (Top) & Route (Bottom) */}
        <div className="flex flex-col justify-center min-w-0">
          {/* TOP: Category Title / Name */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewDetails(category)}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate text-left"
            >
              {category.name}
            </button>
            {level === 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-medium uppercase tracking-wider hidden sm:inline">
                Domain
              </span>
            )}
          </div>

          {/* BOTTOM: Route / Slug Path */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono leading-tight truncate mt-0.5">
            {breadcrumbs.length > 0 ? (
              <span className="truncate opacity-80">
                /{breadcrumbs.map((b) => b.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")).join("/")}/{category.slug}
              </span>
            ) : (
              <span className="truncate opacity-80">
                /{category.slug}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Product Count & Direct Link */}
      <div className="w-28 text-center">
        <Link
          href={`/dashboard/catalog/products?category=${category.slug}`}
          title={`View ${productCount} products in ${category.name}`}
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
            productCount > 0
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          <Package className="h-3 w-3" />
          <span className="tabular-nums">{productCount}</span>
          <ExternalLink className="h-2.5 w-2.5 opacity-60" />
        </Link>
      </div>

      {/* Sub-categories Count */}
      <div className="w-28 text-center hidden sm:block">
        <span className="text-xs text-muted-foreground tabular-nums font-medium">
          {childCount > 0 ? `${childCount} sub-cats` : "—"}
        </span>
      </div>

      {/* Active Toggle Switch */}
      <div className="w-24 flex items-center justify-center">
        <Switch
          size="sm"
          checked={category.is_active}
          onCheckedChange={(checked) => onToggleActive(category, checked)}
          title={`Click to mark ${category.is_active ? "inactive" : "active"}`}
        />
      </div>

      {/* Direct Visible Action Icons */}
      <div className="w-36 flex items-center justify-end gap-1 pr-2">
        {/* Add Subcategory */}
        <Button
          size="icon-sm"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
          title="Add Sub-Category"
          onClick={() => onAddChild(category.id)}
        >
          <FolderPlus className="h-4 w-4" />
        </Button>

        {/* View Details */}
        <Button
          size="icon-sm"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
          title="View Details"
          onClick={() => onViewDetails(category)}
        >
          <Eye className="h-4 w-4" />
        </Button>

        {/* Edit */}
        <Button
          size="icon-sm"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
          title="Edit Category"
          onClick={() => onEdit(category)}
        >
          <Edit3 className="h-4 w-4" />
        </Button>

        {/* Delete */}
        <Button
          size="icon-sm"
          variant="ghost"
          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          title="Delete Category"
          onClick={() => onDelete(category)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Tree Skeleton Component
function TreeSkeleton() {
  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <div className="h-10 bg-muted/40 border-b" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-14 border-b last:border-0 flex items-center px-4 animate-pulse gap-3"
          style={{ paddingLeft: `${(i % 3) * 20 + 16}px` }}
        >
          <div className="h-8 w-8 rounded-lg bg-muted" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-40 bg-muted rounded" />
            <div className="h-3 w-28 bg-muted rounded" />
          </div>
          <div className="h-6 w-24 bg-muted rounded ml-auto" />
        </div>
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
    <div className="border rounded-xl p-12 text-center bg-card">
      <div className="text-muted-foreground/40 mx-auto mb-3 flex justify-center">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        {hasFilters ? `No ${noun} found` : `No ${noun} created yet`}
      </h3>
      <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5">
        {hasFilters
          ? "No categories matched your search filters. Try adjusting your query or clear filters to view all."
          : `Get started by creating your first medical device category.`}
      </p>
      {hasFilters && (
        <Button size="sm" variant="outline" onClick={onClearFilters} className="h-8">
          Clear filters
        </Button>
      )}
    </div>
  );
}
