"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  catalogService,
  CategoryTree,
} from "@mymeddevices/shared-core";
import { usersService } from "@mymeddevices/shared-core";

export interface ProductFilters {
  page: number;
  pageSize: number;
  search: string;
  status: string;
  categoryId: string;
  vendorId?: string;
}

export function useProductStats(vendorId?: string) {
  return useQuery({
    queryKey: ["admin", "products", "stats", vendorId],
    queryFn: () => catalogService.getProductStats(vendorId),
    staleTime: 30 * 1000,
  });
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: ["admin", "products", filters],
    queryFn: () =>
      catalogService.getVendorProducts({
        page: filters.page,
        page_size: filters.pageSize,
        search: filters.search || undefined,
        status_filter: filters.status !== "all" ? filters.status : undefined,
        category_id: filters.categoryId !== "all" ? filters.categoryId : undefined,
        vendor_id: filters.vendorId !== "all" ? filters.vendorId : undefined,
      }),
    placeholderData: (prev) => prev,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const cats = await catalogService.getCategories();
      const flat: CategoryTree[] = [];
      const flatten = (list: CategoryTree[]) => {
        list.forEach((cat) => {
          flat.push(cat);
          if (cat.children?.length > 0) flatten(cat.children);
        });
      };
      flatten(cats);
      return flat;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useVendors() {
  return useQuery({
    queryKey: ["admin", "vendors", "overview-map"],
    queryFn: async () => {
      const data = await usersService.getVendorsOverview({
        page: 1,
        page_size: 1000,
      });
      const map = new Map<string, string>();
      data.vendors.forEach((v) => {
        map.set(v.id, v.company_name || v.name || v.store_name || "Unknown Vendor");
      });
      return map;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ["admin", "brands", "overview-map"],
    queryFn: async () => {
      const data = await catalogService.getBrands({
        active_only: false,
        page_size: 100,
      });
      const map = new Map<string, string>();
      (data.brands || []).forEach((b) => {
        map.set(b.id, b.name);
      });
      return map;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useProductMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "products"] });

  const verify = useMutation({
    mutationFn: (id: string) => catalogService.verifyProduct(id),
    onSuccess: invalidate,
  });

  const publish = useMutation({
    mutationFn: (id: string) => catalogService.publishProduct(id),
    onSuccess: invalidate,
  });

  const archive = useMutation({
    mutationFn: (id: string) => catalogService.archiveProduct(id),
    onSuccess: invalidate,
  });

  const unarchive = useMutation({
    mutationFn: (id: string) => catalogService.unarchiveProduct(id),
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      catalogService.rejectProduct(id, reason),
    onSuccess: invalidate,
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => catalogService.deleteProduct(id),
    onSuccess: invalidate,
  });

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      catalogService.changeStatus(id, status as any),
    onSuccess: invalidate,
  });

  return { verify, publish, archive, unarchive, reject, delete: deleteProduct, changeStatus };
}
