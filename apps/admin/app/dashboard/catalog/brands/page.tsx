"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Globe,
  Building2,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  ShieldCheck,
  Eye,
  Trash2,
  Edit3,
  Package,
  Filter,
  RefreshCw,
  ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { catalogService, Brand } from "@mymeddevices/shared-core";
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
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod";

const brandFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional()
    .or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  logo_url: z.string().max(200000).optional().or(z.literal("")),
  website_url: z.string().url("Invalid URL (e.g. https://example.com)").optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

type BrandFormData = z.infer<typeof brandFormSchema>;
type SortField = "name" | "slug" | "product_count" | "created_at";
type SortOrder = "asc" | "desc";
type FilterStatus = "all" | "active" | "inactive";
type FilterProducts = "all" | "has_products" | "empty";
type FilterWebsite = "all" | "with_website" | "without_website";

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Modals state
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedBrandDetails, setSelectedBrandDetails] = useState<Brand | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // Delete confirmation modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Filters & sorting
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [productsFilter, setProductsFilter] = useState<FilterProducts>("all");
  const [websiteFilter, setWebsiteFilter] = useState<FilterWebsite>("all");

  const [userEditedSlug, setUserEditedSlug] = useState(false);
  const [apiErrors, setApiErrors] = useState<Record<string, string>>({});

  const form = useForm<BrandFormData>({
    resolver: standardSchemaResolver(brandFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      logo_url: "",
      website_url: "",
      is_active: true,
    },
  });

  const nameValue = form.watch("name");
  const logoUrlValue = form.watch("logo_url");

  // Auto-generate slug from name
  useEffect(() => {
    if (!editingBrand && !userEditedSlug && nameValue) {
      const generatedSlug = nameValue
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
      form.setValue("slug", generatedSlug);
      if (apiErrors.slug) {
        setApiErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.slug;
          return newErrors;
        });
      }
    }
  }, [nameValue, editingBrand, userEditedSlug, form, apiErrors]);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const response = await catalogService.getBrands({
        active_only: false,
        page,
        page_size: pageSize,
      });

      if (response?.brands) {
        setBrands(response.brands);
        setTotal(response.total);
      }
    } catch (error) {
      console.error("Failed to load brands:", error);
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [page]);

  // Filter & sort brands
  const filteredBrands = useMemo(() => {
    let filtered = brands.filter((brand) => {
      const matchesSearch =
        !search ||
        brand.name.toLowerCase().includes(search.toLowerCase()) ||
        brand.slug.toLowerCase().includes(search.toLowerCase()) ||
        (brand.description && brand.description.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && brand.is_active) ||
        (statusFilter === "inactive" && !brand.is_active);

      const matchesProducts =
        productsFilter === "all" ||
        (productsFilter === "has_products" && (brand.product_count ?? 0) > 0) ||
        (productsFilter === "empty" && (brand.product_count ?? 0) === 0);

      const matchesWebsite =
        websiteFilter === "all" ||
        (websiteFilter === "with_website" && !!brand.website_url) ||
        (websiteFilter === "without_website" && !brand.website_url);

      return matchesSearch && matchesStatus && matchesProducts && matchesWebsite;
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
  }, [brands, search, statusFilter, productsFilter, websiteFilter, sortField, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    const activeCount = brands.filter((b) => b.is_active).length;
    const inactiveCount = brands.filter((b) => !b.is_active).length;
    const withWebsite = brands.filter((b) => b.website_url).length;
    const emptyCount = brands.filter((b) => (b.product_count ?? 0) === 0).length;
    const totalProducts = brands.reduce((sum, b) => sum + (b.product_count ?? 0), 0);

    return {
      total: brands.length,
      active: activeCount,
      inactive: inactiveCount,
      withWebsite,
      emptyCount,
      totalProducts,
    };
  }, [brands]);

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
    setWebsiteFilter("all");
  };

  const hasActiveFilters =
    !!search ||
    statusFilter !== "all" ||
    productsFilter !== "all" ||
    websiteFilter !== "all";

  const handleToggleActiveStatus = async (brand: Brand, newStatus: boolean) => {
    setBrands((prev) =>
      prev.map((b) => (b.id === brand.id ? { ...b, is_active: newStatus } : b))
    );

    try {
      await catalogService.updateBrand(brand.id, {
        is_active: newStatus,
      });
      toast.success(`Brand marked ${newStatus ? "active" : "draft"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update brand status");
      fetchBrands();
    }
  };

  const openCreateDialog = () => {
    setEditingBrand(null);
    setUserEditedSlug(false);
    setApiErrors({});
    form.reset({
      name: "",
      slug: "",
      description: "",
      logo_url: "",
      website_url: "",
      is_active: true,
    });
    setFormDialogOpen(true);
  };

  const openEditDialog = (brand: Brand) => {
    setEditingBrand(brand);
    setUserEditedSlug(true);
    setApiErrors({});
    form.reset({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || "",
      logo_url: brand.logo_url || "",
      website_url: brand.website_url || "",
      is_active: brand.is_active,
    });
    setFormDialogOpen(true);
  };

  const openDetailsDialog = (brand: Brand) => {
    setSelectedBrandDetails(brand);
    setDetailsDialogOpen(true);
  };

  const promptDeleteBrand = (brand: Brand) => {
    setBrandToDelete(brand);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!brandToDelete) return;
    setDeleting(true);
    try {
      await catalogService.deleteBrand(brandToDelete.id);
      toast.success(`Brand "${brandToDelete.name}" removed from catalog`);
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
      fetchBrands();
    } catch (error: any) {
      toast.error(error.message || "Deletion failed. Ensure no products are linked to this brand.");
    } finally {
      setDeleting(false);
    }
  };

  const onSubmit = async (data: BrandFormData) => {
    setSubmitting(true);
    setApiErrors({});
    try {
      const payload = {
        name: data.name,
        slug: data.slug || undefined,
        description: data.description || undefined,
        logo_url: data.logo_url || undefined,
        website_url: data.website_url || undefined,
        is_active: data.is_active ?? true,
      };

      if (editingBrand) {
        await catalogService.updateBrand(editingBrand.id, payload);
        toast.success("Brand profile updated");
      } else {
        await catalogService.createBrand(payload);
        toast.success("New brand added to catalog");
      }

      setFormDialogOpen(false);
      setEditingBrand(null);
      form.reset();
      fetchBrands();
    } catch (error: any) {
      console.error("Failed to save brand:", error);
      const errorMsg = error?.message || String(error);
      const fieldErrors: Record<string, string> = {};

      if (errorMsg.includes("slug")) {
        fieldErrors.slug = errorMsg.includes("already exists")
          ? "This slug is already in use. Please choose a different one."
          : "Invalid slug format. Use only lowercase letters, numbers, and hyphens.";
      }
      if (errorMsg.includes("name")) {
        fieldErrors.name = errorMsg.includes("already exists")
          ? "A brand with this name already exists."
          : "Name validation failed";
      }
      if (errorMsg.includes("logo_url") || errorMsg.includes("logo")) {
        fieldErrors.logo_url = "Invalid logo URL";
      }
      if (errorMsg.includes("website_url") || errorMsg.includes("website")) {
        fieldErrors.website_url = "Invalid website URL";
      }

      if (Object.keys(fieldErrors).length > 0) {
        setApiErrors(fieldErrors);
        toast.error("Please fix the form errors");
      } else {
        toast.error(errorMsg || "Failed to save brand");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Medical Device Brands
            </h1>
            <Badge variant="outline" className="text-xs font-medium">
              Manufacturers & OEM
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage certified medical device manufacturers, official logos, and OEM product catalogs.
          </p>
        </div>
        <Button size="default" onClick={openCreateDialog} className="h-9">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Brand
        </Button>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Brands"
          value={stats.total}
          subtext={`${stats.withWebsite} verified websites`}
          icon={<Building2 className="h-4 w-4 text-primary" />}
        />
        <StatCard
          label="Active Brands"
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
          subtext="Manufactured items in catalog"
          icon={<Package className="h-4 w-4 text-blue-600" />}
        />
        <StatCard
          label="Unassigned Brands"
          value={stats.emptyCount}
          subtext="Brands with 0 items"
          icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          highlight={stats.emptyCount > 0 ? "warning" : undefined}
        />
      </div>

      {/* Enhanced Search & Filter Bar */}
      <div className="bg-card p-3.5 rounded-xl border space-y-3 mb-4 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by brand name, slug, keywords..."
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

          {/* Select Filters */}
          <div className="flex items-center gap-2">
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
                  All Products
                </SelectItem>
                <SelectItem value="has_products" className="text-xs">
                  Has Products (&gt;0)
                </SelectItem>
                <SelectItem value="empty" className="text-xs">
                  Unassigned (0)
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Website Status Selector */}
            <Select
              value={websiteFilter}
              onValueChange={(val) => setWebsiteFilter(val as FilterWebsite)}
            >
              <SelectTrigger className="h-9 text-xs w-[150px] bg-background">
                <SelectValue placeholder="All Websites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  All Websites
                </SelectItem>
                <SelectItem value="with_website" className="text-xs">
                  Has Website Link
                </SelectItem>
                <SelectItem value="without_website" className="text-xs">
                  No Website
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
              Showing {filteredBrands.length} of {total} brands
            </span>
          </div>
        </div>
      </div>

      {/* Brands Table */}
      {loading ? (
        <TableSkeleton />
      ) : filteredBrands.length === 0 ? (
        <EmptyState
          hasFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          icon={<Building2 className="h-10 w-10" />}
          noun="brands"
        />
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card shadow-2xs">
          <Table>
            <TableHeader>
              <TableRow className="h-10 bg-muted/40 border-b">
                <TableHead className="h-10">
                  <SortButton
                    field="name"
                    label="Manufacturer & Route"
                    active={sortField === "name"}
                    order={sortOrder}
                    onSort={handleSort}
                  />
                </TableHead>
                <TableHead className="h-10 text-center w-36">
                  Official Website
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
              {filteredBrands.map((brand) => (
                <TableRow
                  key={brand.id}
                  className={`min-h-[56px] hover:bg-muted/40 transition-colors group ${
                    !brand.is_active ? "opacity-60 bg-muted/10" : ""
                  }`}
                >
                  {/* Brand Logo & Name (Top: Title, Bottom: Route) */}
                  <TableCell className="py-2.5 px-4">
                    <div className="flex items-center gap-3">
                      {/* Logo Thumbnail */}
                      <BrandLogoRenderer logoUrl={brand.logo_url} brandName={brand.name} />

                      {/* Title (Top) & Route (Bottom) */}
                      <div className="flex flex-col justify-center min-w-0">
                        <button
                          onClick={() => openDetailsDialog(brand)}
                          className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate text-left"
                        >
                          {brand.name}
                        </button>
                        <span className="text-xs text-muted-foreground font-mono leading-tight truncate mt-0.5 opacity-80">
                          /brand/{brand.slug}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Official Website */}
                  <TableCell className="py-2.5 px-4 text-center">
                    {brand.website_url ? (
                      <a
                        href={brand.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors max-w-[140px] truncate"
                        title={brand.website_url}
                      >
                        <Globe className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {brand.website_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                        </span>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">—</span>
                    )}
                  </TableCell>

                  {/* Products Count & Direct Link */}
                  <TableCell className="py-2.5 px-4 text-center">
                    <Link
                      href={`/dashboard/catalog/products?search=${encodeURIComponent(brand.name)}`}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors ${
                        brand.product_count > 0
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      title={`View ${brand.product_count} products for ${brand.name}`}
                    >
                      <Package className="h-3 w-3" />
                      <span className="tabular-nums">{brand.product_count ?? 0}</span>
                      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                    </Link>
                  </TableCell>

                  {/* Inline Status Toggle */}
                  <TableCell className="py-2.5 px-4 text-center">
                    <div className="flex items-center justify-center">
                      <Switch
                        size="sm"
                        checked={brand.is_active}
                        onCheckedChange={(checked) => handleToggleActiveStatus(brand, checked)}
                        title={`Click to mark ${brand.is_active ? "inactive" : "active"}`}
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
                        onClick={() => openDetailsDialog(brand)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Edit */}
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                        title="Edit Brand"
                        onClick={() => openEditDialog(brand)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>

                      {/* Delete */}
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete Brand"
                        onClick={() => promptDeleteBrand(brand)}
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
                {Math.min(page * pageSize, total)} of {total} brands
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

      {/* Create / Edit Brand Modal Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden flex flex-col max-h-[85vh] shadow-xl">
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full max-h-[85vh]">
            {/* Header */}
            <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  {editingBrand ? <Edit3 className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-foreground">
                    {editingBrand ? "Edit Brand Profile" : "Add Brand Manufacturer"}
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-0.5 text-muted-foreground">
                    {editingBrand
                      ? `Update manufacturer profile and logo for ${editingBrand.name}`
                      : "Register a certified medical device OEM manufacturer"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Brand Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Manufacturer Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="e.g. Medtronic, Philips Healthcare, GE Healthcare"
                  className={`h-10 text-sm ${form.formState.errors.name || apiErrors.name ? "border-destructive" : ""}`}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
                {apiErrors.name && !form.formState.errors.name && (
                  <p className="text-xs text-destructive">{apiErrors.name}</p>
                )}
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  URL Slug <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                    /brand/
                  </span>
                  <Input
                    id="slug"
                    {...form.register("slug")}
                    placeholder="medtronic"
                    className={`h-10 pl-20 font-mono text-sm ${form.formState.errors.slug || apiErrors.slug ? "border-destructive" : ""}`}
                    onChange={() => {
                      setUserEditedSlug(true);
                      if (apiErrors.slug) {
                        setApiErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.slug;
                          return newErrors;
                        });
                      }
                    }}
                  />
                </div>
                {form.formState.errors.slug && (
                  <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
                )}
                {apiErrors.slug && !form.formState.errors.slug && (
                  <p className="text-xs text-destructive">{apiErrors.slug}</p>
                )}
              </div>

              {/* Logo URL */}
              <div className="space-y-1.5">
                <Label htmlFor="logo_url" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Brand Logo URL
                </Label>
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-lg border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                    <BrandLogoRenderer
                      logoUrl={logoUrlValue}
                      brandName={nameValue || "B"}
                      className="h-8 w-8"
                    />
                  </div>
                  <Input
                    id="logo_url"
                    {...form.register("logo_url")}
                    placeholder="https://example.com/logo.png"
                    className={`h-10 text-xs font-mono flex-1 ${apiErrors.logo_url ? "border-destructive" : ""}`}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Direct URL to official PNG or SVG manufacturer logo.
                </p>
                {apiErrors.logo_url && (
                  <p className="text-xs text-destructive">{apiErrors.logo_url}</p>
                )}
              </div>

              {/* Official Website */}
              <div className="space-y-1.5">
                <Label htmlFor="website_url" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Official Website
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website_url"
                    {...form.register("website_url")}
                    placeholder="https://www.medtronic.com"
                    className={`h-10 pl-9 text-sm font-mono ${form.formState.errors.website_url || apiErrors.website_url ? "border-destructive" : ""}`}
                  />
                </div>
                {form.formState.errors.website_url && (
                  <p className="text-xs text-destructive">{form.formState.errors.website_url.message}</p>
                )}
                {apiErrors.website_url && !form.formState.errors.website_url && (
                  <p className="text-xs text-destructive">{apiErrors.website_url}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description & Specialties
                </Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Overview of manufacturer certifications, clinical specialties, and warranties..."
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
                    Active brands are selectable in vendor product forms and visible on storefront.
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={form.watch("is_active")}
                  onCheckedChange={(checked) => form.setValue("is_active", checked as boolean)}
                />
              </div>
            </div>

            {/* Modal Footer with generous padding */}
            <DialogFooter className="p-4 sm:p-5 border-t bg-muted/15 shrink-0 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                <span>{editingBrand ? "Editing brand" : "New manufacturer"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormDialogOpen(false)}
                  disabled={submitting}
                  className="h-9 px-4"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="h-9 px-5">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingBrand ? "Save Changes" : "Create Brand"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Details Inspection Modal Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[520px] p-0 flex flex-col overflow-hidden max-h-[85vh] shadow-xl">
          {selectedBrandDetails && (
            <div className="h-full flex flex-col max-h-[85vh]">
              <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <BrandLogoRenderer
                      logoUrl={selectedBrandDetails.logo_url}
                      brandName={selectedBrandDetails.name}
                      className="h-12 w-12 text-lg"
                    />
                    <div>
                      <DialogTitle className="text-lg font-bold text-foreground">
                        {selectedBrandDetails.name}
                      </DialogTitle>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">
                        /brand/{selectedBrandDetails.slug}
                      </p>
                    </div>
                  </div>
                  <Badge variant={selectedBrandDetails.is_active ? "default" : "secondary"}>
                    {selectedBrandDetails.is_active ? "Active" : "Draft"}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Manufacturer Overview
                  </h4>
                  <p className="text-sm text-foreground bg-muted/20 p-3.5 rounded-xl border">
                    {selectedBrandDetails.description || "No description provided for this brand."}
                  </p>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-card border rounded-xl">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Total Products
                    </span>
                    <span className="text-xl font-bold text-foreground mt-0.5 block">
                      {selectedBrandDetails.product_count ?? 0}
                    </span>
                    <Link
                      href={`/dashboard/catalog/products?search=${encodeURIComponent(selectedBrandDetails.name)}`}
                      className="text-[11px] text-primary hover:underline inline-flex items-center gap-1 mt-1 font-medium"
                    >
                      View brand products <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="p-3 bg-card border rounded-xl">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      Official Website
                    </span>
                    {selectedBrandDetails.website_url ? (
                      <a
                        href={selectedBrandDetails.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1.5 font-medium truncate block"
                      >
                        Visit Website <Globe className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground block mt-1.5">
                        Not configured
                      </span>
                    )}
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
                    openEditDialog(selectedBrandDetails);
                  }}
                  className="h-9"
                >
                  <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                  Edit Brand
                </Button>
                <Button variant="default" size="sm" asChild className="h-9">
                  <Link href={`/dashboard/catalog/products?search=${encodeURIComponent(selectedBrandDetails.name)}`}>
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
                Delete Brand?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm space-y-2">
              <p>
                Are you sure you want to delete brand{" "}
                <strong className="text-foreground font-semibold">
                  &ldquo;{brandToDelete?.name}&rdquo;
                </strong>
                ?
              </p>
              {brandToDelete && (brandToDelete.product_count ?? 0) > 0 && (
                <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg border border-destructive/20 font-medium">
                  ⚠️ Warning: There are {brandToDelete.product_count} product(s) associated with this brand.
                  You must reassign products before deleting.
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
              Delete Brand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

// Brand Logo Renderer Component
function BrandLogoRenderer({
  logoUrl,
  brandName,
  className = "h-8 w-8 text-xs",
}: {
  logoUrl?: string | null;
  brandName: string;
  className?: string;
}) {
  if (logoUrl) {
    return (
      <div className={`${className} rounded-lg bg-muted/40 border flex items-center justify-center overflow-hidden shrink-0`}>
        <img
          src={logoUrl}
          alt={brandName}
          className="h-full w-full object-contain p-1"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.parentElement!.innerHTML = `<span class="font-bold text-muted-foreground">${brandName.charAt(0).toUpperCase()}</span>`;
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${className} rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shrink-0`}>
      {brandName ? brandName.charAt(0).toUpperCase() : "B"}
    </div>
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
          ? "No brands matched your search filters. Try adjusting your query or reset filters to view all."
          : `Get started by adding certified medical device manufacturers to your catalog.`}
      </p>
      {hasFilters && (
        <Button size="sm" variant="outline" onClick={onClearFilters} className="h-8">
          Clear filters
        </Button>
      )}
    </div>
  );
}
