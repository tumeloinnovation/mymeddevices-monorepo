"use client";

import { useState, useEffect, Suspense, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Download, Trash2, XCircle, Loader2, Package, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  useProductMutations,
} from "./_hooks/use-products-query";
import { ProductsFilters } from "./_components/products-filters";
import { ProductsTable } from "./_components/products-table";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Stat Card Component
function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
}: {
  label: string;
  value: number;
  trend?: { value: string; positive: boolean } | null;
  trendLabel?: string;
  icon: any;
}) {
  return (
    <div className="px-4 py-3 bg-card border rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-6 w-6 rounded bg-primary/10 text-primary flex items-center justify-center">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
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

function ProductsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMounted = useRef(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);
  const pageSize = 50;

  const { data: productsData, isLoading } = useProducts({
    page,
    pageSize,
    search: debouncedSearch,
    status: statusFilter,
    categoryId: categoryFilter,
  });
  const { data: categories = [] } = useCategories();
  const { data: vendorMap } = useVendors();
  const mutations = useProductMutations();

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [pendingProductId, setPendingProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialMounted.current) {
      initialMounted.current = true;
      const initialStatus = searchParams.get("status");
      if (
        initialStatus &&
        ["draft", "pending_review", "published", "archived"].includes(initialStatus)
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

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    router.push(`/dashboard/catalog/products?${params.toString()}`, {
      scroll: false,
    });
  }, [router, searchParams]);

  const hasActiveFilters =
    search !== "" || statusFilter !== "all" || categoryFilter !== "all";

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
        onSuccess: () => toast.success("Product updated successfully"),
        onError: (err: any) => toast.error(err.message || `Failed to ${action} product`),
        onSettled: () => setPendingProductId(null),
      });
    },
    [mutations, productsData]
  );

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    setPendingProductId(deleteTarget.id);
    mutations.delete.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success("Product deleted successfully");
        setDeleteTarget(null);
      },
      onError: (err: any) => toast.error(err.message || "Failed to delete product"),
      onSettled: () => setPendingProductId(null),
    });
  }, [deleteTarget, mutations.delete]);

  const handleReject = useCallback(() => {
    if (!rejectTarget || !rejectionReason.trim()) return;
    setPendingProductId(rejectTarget.id);
    mutations.reject.mutate(
      { id: rejectTarget.id, reason: rejectionReason },
      {
        onSuccess: () => {
          toast.success("Product rejected with feedback");
          setRejectTarget(null);
          setRejectionReason("");
        },
        onError: (err: any) => toast.error(err.message || "Failed to reject product"),
        onSettled: () => setPendingProductId(null),
      }
    );
  }, [rejectTarget, rejectionReason, mutations.reject]);

  const actionLoadingId = pendingProductId;

  const products = productsData?.products ?? [];
  const total = productsData?.total ?? 0;

  // Stats
  const stats = useMemo(() => {
    return {
      total: total,
      published: products.filter((p) => p.status === "published").length,
      pending: products.filter((p) => p.status === "pending_review").length,
      lowStock: products.filter((p) => p.stock_quantity <= (p.low_stock_threshold || 5)).length,
    };
  }, [products, total]);

  const productsWithVendors = vendorMap
    ? products.map((p) => ({
        ...p,
        vendor_name: vendorMap.get(p.vendor_id),
      }))
    : products;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[20px]/[28px] font-semibold tracking-tight">
              Products
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse and manage your product catalog
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
            <Button size="default" asChild>
              <Link href="/dashboard/catalog/products/new">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Total Products"
            value={stats.total}
            trend={{ value: "+8.2%", positive: true }}
            trendLabel="vs last month"
            icon={Package}
          />
          <StatCard
            label="Published"
            value={stats.published}
            trend={{ value: "+12", positive: true }}
            trendLabel="vs last month"
            icon={TrendingUp}
          />
          <StatCard
            label="Pending Review"
            value={stats.pending}
            trend={null}
            icon={XCircle}
          />
          <StatCard
            label="Low Stock"
            value={stats.lowStock}
            trend={stats.lowStock > 0 ? { value: "!", positive: false } : null}
            trendLabel="needs attention"
            icon={Package}
          />
        </div>

        {/* Filters */}
        <div className="border rounded-lg p-4">
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
            categories={categories}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />
        </div>

        {/* Table */}
        <ProductsTable
          products={productsWithVendors}
          total={total}
          page={page}
          pageSize={pageSize}
          isLoading={isLoading}
          actionLoadingId={actionLoadingId}
          onPageChange={handlePageChange}
          onQuickAction={handleQuickAction}
          onDelete={(product) => setDeleteTarget(product)}
        />

        {/* Delete Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <div className="h-10 w-10 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center mb-3">
                <Trash2 className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-semibold">Delete Product?</DialogTitle>
              <DialogDescription className="text-sm pt-1">
                This will permanently delete{" "}
                <span className="font-semibold text-foreground">
                  &ldquo;{deleteTarget?.name}&rdquo;
                </span>{" "}
                and remove all associated data. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={mutations.delete.isPending}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={mutations.delete.isPending}
                className="h-9"
              >
                {mutations.delete.isPending && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                Yes, Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <div className="h-10 w-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center mb-3">
                <XCircle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-semibold">Reject Product</DialogTitle>
              <DialogDescription className="text-sm pt-1">
                Provide feedback for{" "}
                <span className="font-semibold text-foreground">
                  &ldquo;{rejectTarget?.name}&rdquo;
                </span>
                . The vendor will use this to correct the listing.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Reason for rejection (e.g., missing certifications, low-quality images)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px] text-sm"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectTarget(null)}
                disabled={mutations.reject.isPending}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || mutations.reject.isPending}
                className="h-9"
              >
                {mutations.reject.isPending && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                Send & Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
      }
    >
      <ProductsPageInner />
    </Suspense>
  );
}
