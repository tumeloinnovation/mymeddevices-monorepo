"use client";

import { useState, useEffect, Suspense, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Download, Trash2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Product } from "@mymeddevices/shared-core";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

function ProductsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMounted = useRef(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search, 300);
  const pageSize = 15;

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Products</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Browse and manage your product catalog.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export
            </Button>
            <Button size="sm" className="h-8 text-xs" asChild>
              <Link href="/dashboard/catalog/products/new">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Product
              </Link>
            </Button>
          </div>
        </div>

        <Card className="shadow-sm border-muted/50">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>

        <Card className="shadow-sm border-muted/50 overflow-hidden">
          <CardContent className="p-0">
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
          </CardContent>
        </Card>

        {/* Delete Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mb-3">
                <Trash2 className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-bold">Delete Product?</DialogTitle>
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
                className="rounded-lg h-9"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={mutations.delete.isPending}
                className="rounded-lg h-9 text-xs"
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
          <DialogContent className="sm:max-w-[480px] rounded-2xl">
            <DialogHeader>
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                <XCircle className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-bold">Reject Product Submission</DialogTitle>
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
                className="min-h-[100px] rounded-xl text-sm border-muted-foreground/20"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectTarget(null)}
                disabled={mutations.reject.isPending}
                className="rounded-lg h-9"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleReject}
                disabled={!rejectionReason.trim() || mutations.reject.isPending}
                className="rounded-lg h-9 text-xs"
              >
                {mutations.reject.isPending && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                Send Feedback & Reject
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
