"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Globe,
  Building2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MoreVertical,
  Filter,
} from "lucide-react";
import { catalogService, Brand } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import * as z from "zod";

const brandFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().optional(),
  description: z.string().optional(),
  logo_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  website_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  is_active: z.boolean().optional(),
});

type BrandFormData = z.infer<typeof brandFormSchema>;
type SortField = "name" | "slug" | "product_count" | "created_at";
type SortOrder = "asc" | "desc";
type FilterStatus = "all" | "active" | "inactive";

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  // Auto-generate slug from name
  const nameValue = form.watch("name");
  const slugValue = form.watch("slug");
  const [userEditedSlug, setUserEditedSlug] = useState(false);

  useEffect(() => {
    if (!editingBrand && !userEditedSlug && nameValue) {
      const generatedSlug = nameValue
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      form.setValue("slug", generatedSlug);
    }
  }, [nameValue, editingBrand, userEditedSlug, form]);

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

  // Filter and sort brands
  const filteredBrands = useMemo(() => {
    let filtered = brands.filter((brand) => {
      const matchesSearch =
        brand.name.toLowerCase().includes(search.toLowerCase()) ||
        brand.slug.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && brand.is_active) ||
        (statusFilter === "inactive" && !brand.is_active);

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
  }, [brands, search, statusFilter, sortField, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    const activeCount = brands.filter((b) => b.is_active).length;
    const inactiveCount = brands.filter((b) => !b.is_active).length;
    const withWebsite = brands.filter((b) => b.website_url).length;
    const totalProducts = brands.reduce((sum, b) => sum + b.product_count, 0);

    return {
      total: brands.length,
      active: activeCount,
      inactive: inactiveCount,
      withWebsite,
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

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredBrands.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBrands.map((b) => b.id)));
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

  const onSubmit = async (data: BrandFormData) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        slug: data.slug || undefined,
        logo_url: data.logo_url || undefined,
        website_url: data.website_url || undefined,
      };

      if (editingBrand) {
        await catalogService.updateBrand(editingBrand.id, payload);
        toast.success("Manufacturer profile updated");
      } else {
        await catalogService.createBrand(payload);
        toast.success("New brand added to catalog");
      }

      setSheetOpen(false);
      setEditingBrand(null);
      form.reset();
      fetchBrands();
    } catch (error) {
      console.error("Failed to save brand:", error);
      toast.error(editingBrand ? "Failed to update brand" : "Failed to create brand");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setUserEditedSlug(true);
    form.reset({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || "",
      logo_url: brand.logo_url || "",
      website_url: brand.website_url || "",
      is_active: brand.is_active,
    });
    setSheetOpen(true);
  };

  const handleDelete = async (brand: Brand) => {
    try {
      await catalogService.deleteBrand(brand.id);
      toast.success("Brand removed from catalog");
      fetchBrands();
    } catch (error) {
      console.error("Failed to delete brand:", error);
      toast.error("Deletion failed. Ensure no products are linked to this brand.");
    }
  };

  const openCreateSheet = () => {
    setEditingBrand(null);
    setUserEditedSlug(false);
    form.reset({
      name: "",
      slug: "",
      description: "",
      logo_url: "",
      website_url: "",
      is_active: true,
    });
    setSheetOpen(true);
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px]/[28px] font-semibold tracking-tight">
            Brands
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total} total · {stats.active} active · {stats.inactive} inactive
          </p>
        </div>
        <Button size="default" onClick={openCreateSheet}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Brand
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Brands"
          value={stats.total}
          trend={null}
        />
        <StatCard
          label="Active"
          value={stats.active}
          trend={{ value: "+8", positive: true }}
          trendLabel="vs last month"
        />
        <StatCard
          label="Inactive"
          value={stats.inactive}
          trend={null}
        />
        <StatCard
          label="Brand Products"
          value={stats.totalProducts}
          trend={{ value: "+12.4%", positive: true }}
          trendLabel="vs last month"
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter brands..."
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
            {selectedIds.size} brand{selectedIds.size !== 1 ? "s" : ""} selected
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
      ) : filteredBrands.length === 0 ? (
        <EmptyState
          hasFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          icon={<Building2 className="h-10 w-10" />}
          noun="brands"
        />
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="h-[34px] bg-muted/30">
                  <TableHead className="h-[34px] w-10">
                    <Checkbox
                      checked={selectedIds.size === filteredBrands.length && filteredBrands.length > 0}
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
                {filteredBrands.map((brand) => (
                  <TableRow
                    key={brand.id}
                    className="h-[36px] hover:bg-muted/30 data-[state=selected]:bg-primary/10"
                    data-state={selectedIds.has(brand.id) ? "selected" : undefined}
                  >
                    <TableCell className="p-2">
                      <Checkbox
                        checked={selectedIds.has(brand.id)}
                        onCheckedChange={() => toggleSelect(brand.id)}
                        aria-label={`Select ${brand.name}`}
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <div className="flex items-center gap-2">
                        <BrandLogo brand={brand} />
                        <span className="text-sm font-medium text-foreground">
                          {brand.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-2">
                      <span className="text-sm text-muted-foreground font-mono">
                        {brand.slug}
                      </span>
                    </TableCell>
                    <TableCell className="p-2 text-right">
                      <span className="text-sm text-foreground tabular-nums">
                        {brand.product_count.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="p-2 text-center">
                      <StatusBadge isActive={brand.is_active} />
                    </TableCell>
                    <TableCell className="p-2">
                      <RowActions brand={brand} onEdit={handleEdit} onDelete={handleDelete} />
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-semibold">
                    {editingBrand ? "Edit Brand" : "Add Brand"}
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    {editingBrand ? "Update brand details" : "Add a new brand to your catalog"}
                  </SheetDescription>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm">Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="e.g. Medtronic"
                  className={form.formState.errors.name ? "border-destructive" : ""}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <Label htmlFor="slug" className="text-sm">Slug</Label>
                <Input
                  id="slug"
                  {...form.register("slug")}
                  placeholder="medtronic"
                  className="font-mono text-sm"
                  onChange={() => setUserEditedSlug(true)}
                />
                <p className="text-xs text-muted-foreground">Auto-generated from name (edit to customize)</p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-sm">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Brief overview of the brand..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* URLs */}
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground font-medium">Online Presence</Label>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="logo_url" className="text-xs text-muted-foreground">Logo URL</Label>
                    <Input
                      id="logo_url"
                      {...form.register("logo_url")}
                      placeholder="https://example.com/logo.png"
                      className="text-sm font-mono"
                    />
                  </div>

                  {/* Logo Preview */}
                  {form.watch("logo_url") && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                      <div className="h-12 w-12 rounded bg-background flex items-center justify-center overflow-hidden">
                        <img
                          src={form.watch("logo_url")}
                          alt="Logo preview"
                          className="h-full w-full object-contain p-1"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.parentElement!.innerHTML = `<span class="text-xs text-muted-foreground">Invalid</span>`;
                          }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">Preview</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="website_url" className="text-xs text-muted-foreground">Website</Label>
                    <Input
                      id="website_url"
                      {...form.register("website_url")}
                      placeholder="https://example.com"
                      className="text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 pt-2">
                <Checkbox
                  id="is_active"
                  checked={form.watch("is_active")}
                  onCheckedChange={(checked) => form.setValue("is_active", checked as boolean)}
                />
                <div>
                  <Label htmlFor="is_active" className="text-sm cursor-pointer">Active Status</Label>
                  <p className="text-xs text-muted-foreground">Visible in storefront filters</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t flex items-center justify-end gap-3 bg-muted/20">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSheetOpen(false);
                  setEditingBrand(null);
                  form.reset();
                }}
                className="h-9 px-4"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="h-9 px-5">
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingBrand ? "Save Changes" : "Create Brand"}
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

// Brand Logo Component
function BrandLogo({ brand }: { brand: Brand }) {
  return (
    <div className="h-5 w-5 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
      {brand.logo_url ? (
        <img
          src={brand.logo_url}
          alt={brand.name}
          className="h-full w-full object-contain p-0.5"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            (e.currentTarget.parentElement!.innerHTML = `<span class="text-[10px] font-medium">${brand.name.charAt(0)}</span>`);
          }}
        />
      ) : (
        <span className="text-[10px] font-medium">{brand.name.charAt(0)}</span>
      )}
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
  brand,
  onEdit,
  onDelete,
}: {
  brand: Brand;
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" className="h-7 w-7">
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(brand)}>Edit brand</DropdownMenuItem>
        {brand.website_url && (
          <>
            <DropdownMenuItem asChild>
              <a
                href={brand.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <Globe className="h-3.5 w-3.5" />
                Visit website
              </a>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(brand)}>
          Delete brand
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
