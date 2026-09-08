"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Hash,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Loader2,
  Trash2,
  Package,
  Palette,
  ExternalLink,
  ShieldCheck,
  Eye,
  Edit3,
  Filter,
  RefreshCw,
  AlertTriangle,
  Tag as TagIcon,
} from "lucide-react";
import { catalogService, Tag } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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

type SortField = "name" | "slug" | "product_count" | "created_at";
type SortOrder = "asc" | "desc";
type FilterStatus = "all" | "active" | "inactive";
type FilterProducts = "all" | "has_products" | "empty";

const COLOR_PRESETS = [
  { label: "Emerald", color: "#10b981" },
  { label: "Blue", color: "#3b82f6" },
  { label: "Indigo", color: "#6366f1" },
  { label: "Violet", color: "#8b5cf6" },
  { label: "Rose", color: "#f43f5e" },
  { label: "Amber", color: "#f59e0b" },
  { label: "Orange", color: "#ea580c" },
  { label: "Slate", color: "#64748b" },
];

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Modal Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTagDetails, setSelectedTagDetails] = useState<Tag | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Delete confirmation modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userEditedSlug, setUserEditedSlug] = useState(false);

  // Filters and sorting
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [productsFilter, setProductsFilter] = useState<FilterProducts>("all");

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
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
    }
  }, [name, editingTag, userEditedSlug]);

  // Filter and sort tags
  const filteredTags = useMemo(() => {
    let filtered = tags.filter((tag) => {
      const matchesSearch =
        !search ||
        tag.name.toLowerCase().includes(search.toLowerCase()) ||
        tag.slug.toLowerCase().includes(search.toLowerCase()) ||
        (tag.description && tag.description.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && tag.is_active) ||
        (statusFilter === "inactive" && !tag.is_active);

      const matchesProducts =
        productsFilter === "all" ||
        (productsFilter === "has_products" && (tag.product_count ?? 0) > 0) ||
        (productsFilter === "empty" && (tag.product_count ?? 0) === 0);

      return matchesSearch && matchesStatus && matchesProducts;
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
          aVal = a.product_count ?? 0;
          bVal = b.product_count ?? 0;
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
  }, [tags, search, statusFilter, productsFilter, sortField, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    const activeCount = tags.filter((t) => t.is_active).length;
    const inactiveCount = tags.filter((t) => !t.is_active).length;
    const emptyCount = tags.filter((t) => (t.product_count ?? 0) === 0).length;
    const totalProducts = tags.reduce((sum, t) => sum + (t.product_count ?? 0), 0);

    return {
      total: tags.length,
      active: activeCount,
      inactive: inactiveCount,
      emptyCount,
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

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setProductsFilter("all");
  };

  const hasActiveFilters = !!search || statusFilter !== "all" || productsFilter !== "all";

  const handleToggleActiveStatus = async (tag: Tag, newStatus: boolean) => {
    setTags((prev) =>
      prev.map((t) => (t.id === tag.id ? { ...t, is_active: newStatus } : t))
    );

    try {
      await catalogService.updateTag(tag.id, {
        is_active: newStatus,
      });
      toast.success(`Tag marked ${newStatus ? "active" : "draft"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update tag status");
      fetchTags();
    }
  };

  const openCreateDialog = () => {
    setEditingTag(null);
    setUserEditedSlug(false);
    setName("");
    setSlug("");
    setDescription("");
    setColor("#3b82f6");
    setIsActive(true);
    setFormDialogOpen(true);
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag(tag);
    setUserEditedSlug(true);
    setName(tag.name);
    setSlug(tag.slug);
    setDescription(tag.description || "");
    setColor(tag.color || "#3b82f6");
    setIsActive(tag.is_active);
    setFormDialogOpen(true);
  };

  const openDetailsDialog = (tag: Tag) => {
    setSelectedTagDetails(tag);
    setDetailsDialogOpen(true);
  };

  const promptDeleteTag = (tag: Tag) => {
    setTagToDelete(tag);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!tagToDelete) return;
    setDeleting(true);
    try {
      await catalogService.deleteTag(tagToDelete.id);
      toast.success(`Tag "${tagToDelete.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setTagToDelete(null);
      fetchTags();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete tag");
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTag) {
        await catalogService.updateTag(editingTag.id, {
          name,
          slug,
          description: description || undefined,
          color,
          is_active: isActive,
        });
        toast.success("Tag updated successfully");
      } else {
        await catalogService.createTag({
          name,
          slug,
          description: description || undefined,
          color,
          is_active: isActive,
        });
        toast.success("Tag created successfully");
      }
      setFormDialogOpen(false);
      fetchTags();
    } catch (error: any) {
      console.error("Failed to save tag:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save tag");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Catalog Tags
            </h1>
            <Badge variant="outline" className="text-xs font-medium">
              Metadata & Discovery
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Create medical device promotional tags, badges, certifications, and filter markers.
          </p>
        </div>
        <Button size="default" onClick={openCreateDialog} className="h-9">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Tag
        </Button>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Tags"
          value={stats.total}
          subtext="Catalog discovery markers"
          icon={<Hash className="h-4 w-4 text-primary" />}
        />
        <StatCard
          label="Active Tags"
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
          label="Tagged Products"
          value={stats.totalProducts}
          subtext="Total items with tags"
          icon={<Package className="h-4 w-4 text-blue-600" />}
        />
        <StatCard
          label="Unassigned Tags"
          value={stats.emptyCount}
          subtext="Tags with 0 items"
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
              placeholder="Search by tag name, slug, keywords..."
              className="h-9 pl-9 pr-8 text-sm bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Select Inventory Filter */}
          <div className="flex items-center gap-2">
            <Select
              value={productsFilter}
              onValueChange={(val) => setProductsFilter(val as FilterProducts)}
            >
              <SelectTrigger className="h-9 text-xs w-[150px] bg-background">
                <SelectValue placeholder="All Inventory" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Tags
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
              Showing {filteredTags.length} of {total} tags
            </span>
          </div>
        </div>
      </div>

      {/* Tags Table */}
      {loading ? (
        <TableSkeleton />
      ) : filteredTags.length === 0 ? (
        <EmptyState
          hasFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          icon={<Hash className="h-10 w-10" />}
          noun="tags"
        />
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow className="h-10 bg-muted/40 border-b">
                <TableHead className="h-10">
                  <SortButton
                    field="name"
                    label="Tag & Route"
                    active={sortField === "name"}
                    order={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="h-10 text-center w-36">
                  Visual Badge
                </TableHead>
                <TableHead className="h-10 text-center w-28">
                  <SortButton
                    field="product_count"
                    label="Products"
                    active={sortField === "product_count"}
                    order={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="h-10 text-center w-24">
                  Status
                </TableHead>
                <TableHead className="h-10 text-right w-36 pr-3">
                  Quick Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {filteredTags.map((tag) => (
                <TableRow
                  key={tag.id}
                  className={`min-h-[56px] hover:bg-muted/40 transition-colors group ${
                    !tag.is_active ? "opacity-60 bg-muted/10" : ""
                  }`}
                >
                  {/* Tag Name (Top: Title, Bottom: Route) */}
                  <TableCell className="py-2.5 px-4">
                    <div className="flex items-center gap-3">
                      {/* Color Indicator */}
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center font-bold text-white shadow-2xs shrink-0"
                        style={{ backgroundColor: tag.color || "#3b82f6" }}
                      >
                        <Hash className="h-3.5 w-3.5" />
                      </div>

                      {/* Title (Top) & Route (Bottom) */}
                      <div className="flex flex-col justify-center min-w-0">
                        <button
                          onClick={() => openDetailsDialog(tag)}
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate text-left"
                        >
                          {tag.name}
                        </button>
                        <span className="text-xs text-muted-foreground font-mono leading-tight truncate mt-0.5 opacity-80">
                          /tag/{tag.slug}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Visual Badge Preview */}
                  <TableCell className="py-2.5 px-4 text-center">
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-2xs"
                      style={{ backgroundColor: tag.color || "#3b82f6" }}
                    >
                      <TagIcon className="h-3 w-3" />
                      <span>{tag.name}</span>
                    </span>
                  </TableCell>

                  {/* Products Count & Direct Link */}
                  <TableCell className="py-2.5 px-4 text-center">
                    <Link
                      href={`/dashboard/catalog/products?tag=${encodeURIComponent(tag.slug)}`}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                        (tag.product_count ?? 0) > 0
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      title={`View ${tag.product_count} products for ${tag.name}`}
                    >
                      <Package className="h-3 w-3" />
                      <span className="tabular-nums">{tag.product_count ?? 0}</span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                    </Link>
                  </TableCell>

                  {/* Inline Status Toggle */}
                  <TableCell className="py-2.5 px-4 text-center">
                    <div className="flex items-center justify-center">
                      <Switch
                        size="sm"
                        checked={tag.is_active}
                        onCheckedChange={(checked) => handleToggleActiveStatus(tag, checked)}
                        title={`Click to mark ${tag.is_active ? "inactive" : "active"}`}
                      />
                    </div>
                  </TableCell>

                  {/* Direct Visible Action Icons */}
                  <TableCell className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* View Details */}
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="View Details"
                        onClick={() => openDetailsDialog(tag)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Edit */}
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="Edit Tag"
                        onClick={() => openEditDialog(tag)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete Tag"
                        onClick={() => promptDeleteTag(tag)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {total > pageSize && (
            <div className="flex items-center justify-between px-6 py-3 border-t bg-muted/20 text-xs">
              <span className="text-muted-foreground tabular-nums">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, total)} of {total} tags
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8"
                >
                  Previous
                </Button>
                <span className="text-muted-foreground tabular-nums">
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
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Tag Modal Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden flex flex-col max-h-[85vh] shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[85vh]">
            {/* Header */}
            <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-2xs shrink-0"
                  style={{ backgroundColor: color }}
                >
                  <Hash className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-foreground">
                    {editingTag ? "Edit Catalog Tag" : "Add Catalog Tag"}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5 text-muted-foreground">
                    {editingTag
                      ? `Update tag name, badge color, and description for ${editingTag.name}`
                      : "Create a promotional or classification tag for catalog products"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Tag Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tag Label <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sterile, Hospital Grade, New Arrival, FDA Approved"
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
                    /tag/
                  </span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setUserEditedSlug(true);
                    }}
                    placeholder="hospital-grade"
                    className="h-10 pl-16 font-mono text-sm"
                    required
                  />
                </div>
              </div>

              {/* Badge Color & Presets */}
              <div className="space-y-2 bg-muted/20 p-3.5 rounded-xl border">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Badge Color & Swatch
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 w-12 rounded-lg border cursor-pointer bg-transparent"
                  />
                  <Input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="h-9 font-mono text-xs w-28 uppercase"
                  />
                  {/* Live preview pill */}
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-2xs ml-auto"
                    style={{ backgroundColor: color }}
                  >
                    <TagIcon className="h-3 w-3" />
                    <span>{name || "Preview"}</span>
                  </span>
                </div>

                {/* Quick Color Presets */}
                <div className="flex items-center gap-1.5 pt-2 border-t mt-2">
                  <span className="text-[11px] text-muted-foreground mr-1">Presets:</span>
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setColor(preset.color)}
                      className={`h-5 w-5 rounded-full border transition-transform hover:scale-110 ${
                        color.toLowerCase() === preset.color.toLowerCase()
                          ? "ring-2 ring-primary ring-offset-1 scale-110"
                          : ""
                      }`}
                      style={{ backgroundColor: preset.color }}
                      title={preset.label}
                    />
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description & Usage Scope
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Purpose of this tag and which medical device categories it applies to..."
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>

              {/* Active Status Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-muted/20 border rounded-xl">
                <div>
                  <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                    Active Catalog Status
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Active tags are displayed on product cards and storefront filters.
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            </div>

            {/* Modal Footer with proper padding */}
            <DialogFooter className="p-4 sm:p-5 border-t bg-muted/15 shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                <span>{editingTag ? "Editing tag" : "New tag"}</span>
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
                  {editingTag ? "Save Changes" : "Create Tag"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Details Inspection Modal Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 flex flex-col overflow-hidden max-h-[85vh] shadow-xl">
          {selectedTagDetails && (
            <div className="h-full flex flex-col max-h-[85vh]">
              <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center font-bold text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: selectedTagDetails.color || "#3b82f6" }}
                    >
                      <Hash className="h-6 w-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-foreground">
                        {selectedTagDetails.name}
                      </DialogTitle>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">
                        /tag/{selectedTagDetails.slug}
                      </p>
                    </div>
                  </div>
                  <Badge variant={selectedTagDetails.is_active ? "default" : "secondary"}>
                    {selectedTagDetails.is_active ? "Active" : "Draft"}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Tag Description
                  </h4>
                  <p className="text-sm text-foreground bg-muted/20 p-3.5 rounded-xl border">
                    {selectedTagDetails.description || "No description provided for this tag."}
                  </p>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-card border rounded-xl">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Tagged Products
                    </span>
                    <span className="text-xl font-bold text-foreground mt-0.5 block">
                      {selectedTagDetails.product_count ?? 0}
                    </span>
                    <Link
                      href={`/dashboard/catalog/products?tag=${encodeURIComponent(selectedTagDetails.slug)}`}
                      className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 mt-1 font-medium"
                    >
                      View tagged products <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="p-3 bg-card border rounded-xl">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Badge Color
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className="h-4 w-4 rounded-full border shadow-2xs shrink-0"
                        style={{ backgroundColor: selectedTagDetails.color || "#3b82f6" }}
                      />
                      <span className="text-xs font-mono font-semibold text-foreground uppercase">
                        {selectedTagDetails.color || "#3b82f6"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <DialogFooter className="p-4 sm:p-5 border-t bg-muted/15 shrink-0 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    openEditDialog(selectedTagDetails);
                  }}
                  className="h-9"
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                  Edit Tag
                </Button>
                <Button variant="default" size="sm" asChild className="h-9">
                  <Link href={`/dashboard/catalog/products?tag=${encodeURIComponent(selectedTagDetails.slug)}`}>
                    View in Products
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
                Delete Tag?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm space-y-2">
              <p>
                Are you sure you want to delete tag{" "}
                <strong className="text-foreground font-semibold">
                  &ldquo;{tagToDelete?.name}&rdquo;
                </strong>
                ?
              </p>
              {tagToDelete && (tagToDelete.product_count ?? 0) > 0 && (
                <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20 font-medium">
                  ⚠️ Notice: This tag is currently attached to {tagToDelete.product_count} product(s).
                  Deleting it will remove the tag marker from those products.
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
              Delete Tag
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
      className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      {active && (
        <span className="text-foreground">
          {order === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </span>
      )}
    </button>
  );
}

// Table Skeleton Component
function TableSkeleton() {
  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <div className="h-10 bg-muted/40 border-b" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-14 border-b last:border-0 flex items-center px-4 animate-pulse gap-3"
        >
          <div className="h-7 w-7 rounded-lg bg-muted" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 w-32 bg-muted rounded" />
            <div className="h-3 w-24 bg-muted rounded" />
          </div>
          <div className="h-6 w-20 bg-muted rounded ml-auto" />
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
          ? "No tags matched your search filters. Try adjusting your query or reset filters to view all."
          : `Get started by creating promotional and classification tags for your catalog.`}
      </p>
      {hasFilters && (
        <Button size="sm" variant="outline" onClick={onClearFilters} className="h-8">
          Clear filters
        </Button>
      )}
    </div>
  );
}
