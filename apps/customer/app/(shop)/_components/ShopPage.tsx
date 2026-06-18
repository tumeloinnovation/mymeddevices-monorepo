"use client";
import React, { useState, useCallback, useMemo } from "react";
import type { Product, Category } from "@/lib/data/types";
import { filterProducts } from "@/lib/data/helpers/filter-products";
import { sortProducts } from "@/lib/data/helpers/sort-products";
import { buildCategoryTree } from "@/lib/data/seed/categories";
import ProductGrid from "./ProductGrid";
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

  // Build category tree
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  // Find selected category data
  const selectedCategoryData = useMemo(() => {
    const cat = filters.selectedCategory ?? initialSelectedCategory;
    if (!cat) return null;
    return categories.find((c) => c.slug === cat) ?? null;
  }, [filters.selectedCategory, initialSelectedCategory, categories]);

  // Apply all filters client-side
  const { orderby, order } = getSortParams(filters.sortOrder);
  const filteredProducts = useMemo(() => {
    const filtered = filterProducts(products, {
      category: filters.selectedCategory ?? initialSelectedCategory,
      min_price: filters.priceRange[0],
      max_price: filters.priceRange[1],
      on_sale: filters.onSaleOnly || undefined,
      stock_status:
        filters.stockStatus === "any" ? undefined : filters.stockStatus,
      min_rating: filters.minRating > 0 ? filters.minRating : undefined,
      status: "publish",
    });
    return sortProducts(filtered, orderby, order);
  }, [products, filters, initialSelectedCategory, orderby, order]);

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
            {/* Category header */}
            {selectedCategoryData ? (
              <div className="mb-8 p-6 sm:p-8 rounded-lg bg-card border border-border">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                  {selectedCategoryData.name}
                </h1>
                {selectedCategoryData.description && (
                  <div
                    className="mt-3 text-base text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: selectedCategoryData.description }}
                  />
                )}
              </div>
            ) : title ? (
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                  {title}
                </h1>
              </div>
            ) : null}

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
                />
                <ProductGrid
                  products={filteredProducts}
                  hasMore={false}
                  loadMore={() => {}}
                  isLoading={false}
                />
              </main>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
