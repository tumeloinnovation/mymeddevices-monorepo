import { CategoryQueryParams, ProductQueryParams } from "@/types/api";
import { productApi } from "./product.api";
import { useInfiniteQuery, useQueries, useQuery } from "@tanstack/react-query";
import { queryKeys, CACHE_TIMES } from "@/services/queryKeys";

export const useProducts = (params: ProductQueryParams) => {
  return useInfiniteQuery({
    queryKey: queryKeys.products.list(params),
    enabled: !!params,
    queryFn: ({ pageParam = 1 }) =>
      productApi.getProducts({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage?.length ? pages.length + 1 : undefined,
    ...CACHE_TIMES.SEMI_STATIC,
  });
};

export const useProduct = (id: number | string | undefined) => {
  return useQuery({
    queryKey: queryKeys.products.detail(id!),
    enabled: !!id,
    queryFn: () => productApi.getProduct(id),
    ...CACHE_TIMES.STATIC,
  });
};

export const useRelatedProductsQueries = (relatedIds: number[]) => {
  const ids = Array.isArray(relatedIds) ? relatedIds : [];
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: queryKeys.products.detail(id),
      queryFn: () => productApi.getProduct(id),
      ...CACHE_TIMES.STATIC,
    })),
  });
};

export const category_params: CategoryQueryParams = {
  per_page: 10,
  order: "asc",
  orderby: "name",
  hide_empty: true,
};

export const useCategories = () => {
  // /storefront/categories ignores pagination and returns the full list, so
  // fetching a "next page" would just re-fetch the same categories (dup keys).
  return useInfiniteQuery({
    queryKey: queryKeys.categories.all,
    queryFn: ({ pageParam = 1 }) =>
      productApi.getCategories({ ...category_params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: () => undefined,
    ...CACHE_TIMES.STATIC,
  });
};

export const useCategoryPreviewProducts = (categorySlugOrId?: string | number) => {
  return useQuery({
    queryKey: ["category-preview-products", String(categorySlugOrId)],
    enabled: Boolean(categorySlugOrId),
    queryFn: () =>
      productApi.getProducts({
        category: String(categorySlugOrId),
        per_page: 6,
      }),
    ...CACHE_TIMES.SEMI_STATIC,
  });
};

export const useProductCategories = (params: ProductQueryParams) => {
  return useInfiniteQuery({
    queryKey: ["product-categories", params],
    queryFn: ({ pageParam = 1 }) =>
      productApi.getProductsByCategory({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length ? pages.length + 1 : undefined,
    ...CACHE_TIMES.SEMI_STATIC,
  });
};

export const useSearchProducts = (query: string) => {
  return useInfiniteQuery({
    queryKey: queryKeys.products.search(query),
    enabled: !!query,
    queryFn: ({ pageParam = 1 }) =>
      productApi.getProducts({ search: query, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length ? pages.length + 1 : undefined,
    ...CACHE_TIMES.DYNAMIC,
  });
};

export const useOnSaleProducts = () => {
  return useQuery({
    queryKey: queryKeys.products.onSale(),
    queryFn: () => productApi.getOnSaleProducts(),
    ...CACHE_TIMES.SEMI_STATIC,
  });
};

export const useNewestProducts = () => {
  return useQuery({
    queryKey: queryKeys.products.newest(),
    queryFn: () => productApi.getNewestProducts(),
    ...CACHE_TIMES.SEMI_STATIC,
  });
};
