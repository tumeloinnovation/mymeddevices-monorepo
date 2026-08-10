"use client";
import React, { useState, useCallback, useMemo } from "react";
import type { Product, Category } from "@/lib/data/types";
import { filterProducts } from "@/lib/data/helpers/filter-products";
import { sortProducts } from "@/lib/data/helpers/sort-products";
import ProductGrid from "./ProductGrid";

function buildCategoryTree(categories: Category[]): Category[] {
  if (!categories || !Array.isArray(categories)) return [];
  const map = new Map<number | string, any>();
  const roots: any[] = [];
  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });
  categories.forEach((cat) => {
    const node = map.get(cat.id)!;
    if (cat.parent && map.has(cat.parent)) {
      map.get(cat.parent)!.children?.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots as Category[];
}
import ShopHeader from "./ShopHeader";
import ShopSidebar from "./ShopSidebar";
import ShopFiltersDrawer from "./ShopFiltersDrawer";
import { ProductGridSkeleton } from "@/components/common/ProductGridSkeleton";
import { useShopFilters } from "@/lib/context/ShopFiltersContext";

const getSortParams = (
  sortOrder: string
): {
  orderby: "date" | "price" | "rating" | "popularity" | "title" | undefined;
  order: "asc" | "desc" | undefined;
} => {
  switch (sortOrder) {
    case "price-asc":
      return { orderby: "price", order: "asc" };
    case "price-desc":
      return { orderby: "price", order: "desc" };
    case "rating-desc":
      return { orderby: "rating", order: "desc" };
    case "default":
    default:
      return { orderby: "popularity", order: "desc" };
  }
};

import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface ShopPageProps {
  products: Product[];
  categories: Category[];
  initialSelectedCategory?: string;
  title?: string;
  isLoading?: boolean;
}

export default function ShopPage({
  products,
  categories,
  initialSelectedCategory,
  title,
  isLoading = false,
}: ShopPageProps) {
  const { filters, setFilter, clearFilters } = useShopFilters();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Sync URL search parameters (min_price, max_price, category, etc.)
  const minPriceParam = searchParams.get("min_price");
  const maxPriceParam = searchParams.get("max_price");
  const categoryParam = searchParams.get("category");

  const effectiveMinPrice = minPriceParam !== null ? parseFloat(minPriceParam) : filters.priceRange[0];
  const effectiveMaxPrice = maxPriceParam !== null ? parseFloat(maxPriceParam) : filters.priceRange[1];
  const effectiveCategory = categoryParam || filters.selectedCategory || initialSelectedCategory;

  const handleResetFilters = useCallback(() => {
    clearFilters();
    if (searchParams.toString()) {
      router.push(pathname);
    }
  }, [clearFilters, searchParams, router, pathname]);

  // Build category tree
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  // Find selected category data
  const selectedCategoryData = useMemo(() => {
    if (!effectiveCategory) return null;
    return categories.find((c) => c.slug === effectiveCategory) ?? null;
  }, [effectiveCategory, categories]);

  // Apply all filters client-side
  const { orderby, order } = getSortParams(filters.sortOrder);
  const filteredProducts = useMemo(() => {
    const filtered = filterProducts(products, {
      category: effectiveCategory,
      min_price: effectiveMinPrice,
      max_price: effectiveMaxPrice,
      on_sale: filters.onSaleOnly || undefined,
      stock_status:
        filters.stockStatus === "any" ? undefined : filters.stockStatus,
      min_rating: filters.minRating > 0 ? filters.minRating : undefined,
      status: "publish",
    });
    return sortProducts(filtered, orderby, order);
  }, [products, filters, effectiveCategory, effectiveMinPrice, effectiveMaxPrice, orderby, order]);

  return (
    <div className="min-h-[calc(100vh-120px)] py-6">
      <div className="container mx-auto px-4">
        {/* Loading State */}
        {isLoading ? (
          <>
            {/* Category header skeleton */}
            {title && (
              <div className="mb-8">
                <div className="h-10 w-48 bg-muted rounded animate-pulse" />
              </div>
            )}
            <ProductGridSkeleton count={12} />
          </>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-6">
              {/* Sidebar */}
              <aside className="hidden md:block md:col-span-3">
                <ShopSidebar categories={categoryTree} categoriesLoading={false} />
              </aside>

              {/* Main content */}
              <main className="col-span-12 lg:col-span-9">
                <ShopFiltersDrawer categories={categoryTree} categoriesLoading={false} />
                <ShopHeader
                  sortOrder={filters.sortOrder}
                  onSortChange={(value) => setFilter("sortOrder", value)}
                  productCount={filteredProducts.length}
                  selectedCategoryName={selectedCategoryData?.name}
                  onClearCategory={() => {
                    setFilter("selectedCategory", undefined);
                    if (searchParams.get("category")) {
                      router.push(pathname);
                    }
                  }}
                />
                <ProductGrid
                  products={filteredProducts}
                  hasMore={false}
                  loadMore={() => {}}
                  isLoading={false}
                  onClearFilters={handleResetFilters}
                />
              </main>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
