"use client";

import { useState, useEffect, Suspense, useCallback, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Plus, 
  Download, 
  Trash2, 
  XCircle, 
  Loader2, 
  Package, 
  TrendingUp, 
  Upload, 
  FileEdit, 
  Clock, 
  Archive, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle,
  Building2,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { Product } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useProducts,
  useCategories,
  useVendors,
  useProductStats,
  useProductMutations,
} from "./_hooks/use-products-query";
import { ProductsFilters } from "./_components/products-filters";
import { ProductsTable } from "./_components/products-table";
import { ProductsBulkImportModal } from "./_components/products-bulk-import-modal";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Executive Stat Card Component
function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: number | string;
  subtext?: string;
  icon: any;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const variantStyles = {
    default: "border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white",
    success: "border-emerald-200/80 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-100 bg-emerald-50/30 dark:bg-emerald-950/10",
    warning: "border-amber-200/80 dark:border-amber-900/40 text-amber-900 dark:text-amber-100 bg-amber-50/30 dark:bg-amber-950/10",
    danger: "border-rose-200/80 dark:border-rose-900/40 text-rose-900 dark:text-rose-100 bg-rose-50/30 dark:bg-rose-950/10",
    info: "border-blue-200/80 dark:border-blue-900/40 text-blue-900 dark:text-blue-100 bg-blue-50/30 dark:bg-blue-950/10",
  };

  const iconStyles = {
    default: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    success: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300",
    warning: "bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300",
    danger: "bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300",
    info: "bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300",
  };

  return (
    <div className={`p-4 bg-white dark:bg-slate-900 border rounded-xl shadow-xs flex flex-col justify-between ${variantStyles[variant]}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${iconStyles[variant]}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight tabular-nums text-slate-900 dark:text-white">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        {subtext && (
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

function ProductsPageInner() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMounted = useRef(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);
  const [pageSize, setPageSize] = useState(50);

  // Real-time catalog stats
  const { data: stats, isLoading: isStatsLoading, refetch: refetchStats } = useProductStats(vendorFilter !== "all" ? vendorFilter : undefined);

  const { data: productsData, isLoading, refetch: refetchProducts } = useProducts({
    page,
    pageSize,
    search: debouncedSearch,
    status: ["low_stock", "outofstock", "clinical_pick", "featured"].includes(statusFilter) ? "all" : statusFilter,
    categoryId: categoryFilter,
    vendorId: vendorFilter,
  });
  
  const { data: categories = [] } = useCategories();
  const { data: vendorMap } = useVendors();
  const mutations = useProductMutations();

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Product | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<Product | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialMounted.current) {
      initialMounted.current = true;
      const initialStatus = searchParams.get("status");
      if (
        initialStatus &&
        ["draft", "pending_review", "published", "archived", "low_stock", "outofstock", "clinical_pick", "featured"].includes(initialStatus)
      ) {
        setStatusFilter(initialStatus);
      }
    }
  }, [searchParams]);

  const handleStatusChange = useCallback(
    (value: string) => {
      setStatusFilter(value);
      setPage(1);
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete("status");
      } else {
        params.set("status", value);
      }
      router.push(`/dashboard/catalog/products?${params.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams]
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleCategoryChange = useCallback((value: string) => {
    setCategoryFilter(value);
    setPage(1);
  }, []);

  const handleVendorChange = useCallback((value: string) => {
    setVendorFilter(value);
    setPage(1);
  }, []);

  const handleStockChange = useCallback((value: string) => {
    setStockFilter(value);
    setPage(1);
  }, []);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setVendorFilter("all");
    setStockFilter("all");
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    router.push(`/dashboard/catalog/products?${params.toString()}`, {
      scroll: false,
    });
  }, [router, searchParams]);

  const hasActiveFilters =
    search !== "" || 
    statusFilter !== "all" || 
    categoryFilter !== "all" || 
    vendorFilter !== "all" || 
    stockFilter !== "all";

  const handleQuickAction = useCallback(
    (id: string, action: "verify" | "publish" | "archive" | "unarchive" | "reject") => {
      if (action === "reject") {
        const product = productsData?.products.find((p) => p.id === id);
        if (product) {
          setRejectTarget(product);
          setRejectionReason("");
        }
        return;
      }

      setPendingProductId(id);

      const mutationMap = {
        verify: mutations.verify,
        publish: mutations.publish,
        archive: mutations.archive,
        unarchive: mutations.unarchive,
      } as const;

      const mutation = mutationMap[action];
      mutation.mutate(id, {
        onSuccess: () => {
          toast.success("Product updated successfully");
          queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
        },
        onError: (err: any) => toast.error(err.message || `Failed to ${action} product`),
        onSettled: () => setPendingProductId(null),
      });
    },
    [mutations, productsData, queryClient]
  );

  const handleDelete = useCallback(() => {
    if (!deleteTarget || mutations.delete.isPending) return;
    setPendingProductId(deleteTarget.id);
    mutations.delete.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Product deleted successfully");
        setDeleteTarget(null);
        queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      },
      onError: (err: any) => toast.error(err.message || "Failed to delete product"),
      onSettled: () => setPendingProductId(null),
    });
  }, [deleteTarget, mutations.delete, queryClient]);

  const handleReject = useCallback(() => {
    if (!rejectTarget || !rejectionReason.trim()) return;
    setPendingProductId(rejectTarget.id);
    mutations.reject.mutate(
      { id: rejectTarget.id, reason: rejectionReason },
      {
        onSuccess: () => {
          toast.success("Product rejected with clinical feedback");
          setRejectTarget(null);
          setRejectionReason("");
          queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
        },
        onError: (err: any) => toast.error(err.message || "Failed to reject product"),
        onSettled: () => setPendingProductId(null),
      }
    );
  }, [rejectTarget, rejectionReason, mutations.reject, queryClient]);

  const handleProductStatusChange = useCallback(() => {
    if (!statusChangeTarget || !newStatus) return;
    setPendingProductId(statusChangeTarget.id);
    mutations.changeStatus.mutate(
      { id: statusChangeTarget.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Product status changed to ${newStatus}`);
          setStatusChangeTarget(null);
          setNewStatus("");
          queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
        },
        onError: (err: any) => toast.error(err.message || "Failed to change product status"),
        onSettled: () => setPendingProductId(null),
      }
    );
  }, [statusChangeTarget, newStatus, mutations.changeStatus, queryClient]);

  const handleImportComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    refetchStats();
  }, [queryClient, refetchStats]);

  const handleBulkAction = useCallback(
    async (ids: string[], action: "verify" | "publish" | "archive" | "unarchive" | "delete") => {
      const mutationMap = {
        verify: mutations.verify,
        publish: mutations.publish,
        archive: mutations.archive,
        unarchive: mutations.unarchive,
        delete: mutations.delete,
      } as const;

      const mutation = mutationMap[action];
      const promises = ids.map(
        (id) =>
          new Promise<void>((resolve, reject) => {
            mutation.mutate(id, {
              onSuccess: () => resolve(),
              onError: (err) => reject(err),
            });
          })
      );

      toast.promise(Promise.all(promises), {
        loading: `Performing bulk ${action} on ${ids.length} products...`,
        success: `Successfully updated ${ids.length} products.`,
        error: (err: any) => err.message || `Failed to perform bulk ${action}.`,
      });
    },
    [mutations]
  );

  const handleExportCatalog = () => {
    const prods = productsData?.products || [];
    if (prods.length === 0) {
      toast.error("No products to export");
      return;
    }

    const rows = [
      ["ID", "SKU", "Name", "Category", "Brand", "Price (KES)", "Stock", "Status", "PPB Classification", "KMPDB Reg", "Verified"],
      ...prods.map((p) => [
        p.id,
        p.sku || "",
        `"${p.name.replace(/"/g, '""')}"`,
        p.category_id || "",
        p.brand || "",
        p.price || 0,
        p.stock_quantity || 0,
        p.status,
        (p as any).ppb_classification || "",
        (p as any).kmpdb_registration_number || "",
        p.is_verified ? "Yes" : "No",
      ]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MyMedDevices_Catalog_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${prods.length} products to CSV`);
  };

  const actionLoadingId = pendingProductId;
  const rawProducts = productsData?.products ?? [];
  const total = productsData?.total ?? 0;

  // Filter client-side by stock status, curation tags, or low stock tab if requested
  const filteredProducts = useMemo(() => {
    let list = rawProducts;
    if (statusFilter === "low_stock") {
      list = list.filter((p) => (p.stock_quantity ?? 0) <= (p.low_stock_threshold || 5));
    } else if (statusFilter === "outofstock") {
      list = list.filter((p) => (p.stock_quantity ?? 0) === 0);
    } else if (statusFilter === "clinical_pick") {
      list = list.filter((p) => p.is_clinical_pick);
    } else if (statusFilter === "featured") {
      list = list.filter((p) => p.is_featured);
    }

    if (stockFilter === "instock") {
      list = list.filter((p) => (p.stock_quantity ?? 0) > (p.low_stock_threshold || 5));
    } else if (stockFilter === "low_stock") {
      list = list.filter((p) => (p.stock_quantity ?? 0) > 0 && (p.stock_quantity ?? 0) <= (p.low_stock_threshold || 5));
    } else if (stockFilter === "outofstock") {
      list = list.filter((p) => (p.stock_quantity ?? 0) === 0);
    }
    return list;
  }, [rawProducts, statusFilter, stockFilter]);

  const vendorList = useMemo(() => {
    if (!vendorMap) return [];
    return Array.from(vendorMap.entries()).map(([id, name]) => ({ id, name }));
  }, [vendorMap]);

  const productsWithVendors = vendorMap
    ? filteredProducts.map((p) => ({
        ...p,
        vendor_name: vendorMap.get(p.vendor_id),
      }))
    : filteredProducts;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-[1600px] mx-auto font-sans">
        
        {/* Executive Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Medical Device Catalog
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                <Package className="w-3 h-3" />
                {stats?.total ?? total} Registered Devices
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage medical equipment listings, review PPB/KMPDB certifications, track inventory levels, and approve seller submissions.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => { refetchProducts(); refetchStats(); }}
              disabled={isLoading}
              className="h-9 text-xs gap-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setImportModalOpen(true)}
              className="h-9 text-xs gap-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            >
              <Upload className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
              Import CSV
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleExportCatalog}
              className="h-9 text-xs gap-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            >
              <Download className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
              Export
            </Button>
            <Button size="sm" asChild className="h-9 text-xs gap-1.5 bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 font-semibold shadow-xs">
              <Link href="/dashboard/catalog/products/new">
                <Plus className="h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>

        {/* Global Catalog Telemetry Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Total Catalog SKUs"
            value={stats?.total ?? total}
            subtext="All active marketplace listings"
            icon={Package}
            variant="default"
          />
          <StatCard
            label="Published & Live"
            value={stats?.published ?? 0}
            subtext="Live for clinic procurement"
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            label="Pending Review"
            value={stats?.pending_review ?? 0}
            subtext={stats?.pending_review ? "Action needed: verify specs" : "All submissions reviewed"}
            icon={Clock}
            variant={stats?.pending_review ? "warning" : "default"}
          />
          <StatCard
            label="Low Stock Watchlist"
            value={stats?.low_stock ?? 0}
            subtext={stats?.low_stock ? "Items below safety threshold" : "Inventory buffer healthy"}
            icon={AlertTriangle}
            variant={stats?.low_stock ? "danger" : "default"}
          />
          <StatCard
            label="Drafts & Staging"
            value={stats?.draft ?? 0}
            subtext={stats?.draft ? "Unpublished seller drafts" : "No draft items"}
            icon={FileEdit}
            variant="default"
          />
        </div>

        {/* Filters Card */}
        <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 shadow-xs">
          <ProductsFilters
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            statusFilter={statusFilter}
            onStatusChange={handleStatusChange}
            categoryFilter={categoryFilter}
            onCategoryChange={handleCategoryChange}
            vendorFilter={vendorFilter}
            onVendorChange={handleVendorChange}
            stockFilter={stockFilter}
            onStockChange={handleStockChange}
            categories={categories}
            vendors={vendorList}
            stats={stats}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Table */}
        <ProductsTable
          products={productsWithVendors}
          categories={categories}
          total={total}
          page={page}
          pageSize={pageSize}
          isLoading={isLoading}
          actionLoadingId={actionLoadingId}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onQuickAction={handleQuickAction}
          onDelete={(product) => setDeleteTarget(product)}
          onStatusChange={(product) => setStatusChangeTarget(product)}
          onBulkAction={handleBulkAction}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

        {/* Delete Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <Trash2 className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Delete Product?</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 pt-1">
                This will soft-delete{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  &ldquo;{deleteTarget?.name}&rdquo;
                </span>{" "}
                and remove it from storefront search. This action can be audited in stock logs.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={mutations.delete.isPending}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={mutations.delete.isPending}
                className="h-9 text-xs font-semibold"
              >
                {mutations.delete.isPending && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <XCircle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Reject Listing with Clinical Feedback</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 pt-1">
                Provide regulatory feedback for{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  &ldquo;{rejectTarget?.name}&rdquo;
                </span>
                . The medical supplier will receive this notice to update device registration or technical documentation.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3">
              <Textarea
                placeholder="Explain missing regulatory certificates, invalid batch numbers, or image resolution issues..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[110px] text-xs"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectTarget(null)}
                disabled={mutations.reject.isPending}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || mutations.reject.isPending}
                className="h-9 text-xs font-semibold"
              >
                {mutations.reject.isPending && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                Submit Rejection Notice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Change Dialog */}
        <Dialog open={!!statusChangeTarget} onOpenChange={() => setStatusChangeTarget(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Change Product Lifecycle Status</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 pt-1">
                Select a new status for{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  &ldquo;{statusChangeTarget?.name}&rdquo;
                </span>
                .
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 space-y-3">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "draft", label: "Draft", icon: FileEdit },
                    { value: "pending_review", label: "Pending Review", icon: Clock },
                    { value: "published", label: "Published", icon: CheckCircle2 },
                    { value: "archived", label: "Archived", icon: Archive },
                  ].map((status) => {
                    const Icon = status.icon;
                    const isSelected = newStatus === status.value;
                    return (
                      <button
                        key={status.value}
                        type="button"
                        onClick={() => setNewStatus(status.value)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs"
                            : "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {status.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusChangeTarget(null)}
                disabled={mutations.changeStatus.isPending}
                className="h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleProductStatusChange}
                disabled={!newStatus || mutations.changeStatus.isPending}
                className="h-9 text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              >
                {mutations.changeStatus.isPending && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Import Modal */}
        <ProductsBulkImportModal
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          onComplete={handleImportComplete}
        />
      </div>
    </DashboardLayout>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-slate-800 dark:border-t-white" />
        </div>
      }
    >
      <ProductsPageInner />
    </Suspense>
  );
}
