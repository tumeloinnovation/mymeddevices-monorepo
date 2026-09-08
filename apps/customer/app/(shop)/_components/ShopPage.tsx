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
    map.set(cat.id, { ...cat, children: cat.subCategories ? [...cat.subCategories] : [] });
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

function getCategoryMatchIdentifiers(targetCategory: string, categories: Category[]): Set<string> {
  const matches = new Set<string>();
  const normalizedTarget = targetCategory.toLowerCase().trim();
  matches.add(normalizedTarget);
  matches.add(targetCategory);

  const findCategoryNode = (list: any[]): any | null => {
    for (const item of list) {
      if (
        item.slug?.toLowerCase() === normalizedTarget ||
        String(item.id).toLowerCase() === normalizedTarget ||
        item.name?.toLowerCase() === normalizedTarget ||
        item.name?.toLowerCase().replace(/\s+/g, '-') === normalizedTarget
      ) {
        return item;
      }
      const children = item.children || item.subCategories;
      if (children && children.length > 0) {
        const found = findCategoryNode(children);
        if (found) return found;
      }
    }
    return null;
  };

  const targetNode = findCategoryNode(categories);
  if (targetNode) {
    const collectDescendants = (node: any) => {
      if (node.slug) matches.add(node.slug.toLowerCase());
      if (node.id) matches.add(String(node.id).toLowerCase());
      if (node.name) {
        matches.add(node.name.toLowerCase());
        matches.add(node.name.toLowerCase().replace(/\s+/g, '-'));
      }
      const children = node.children || node.subCategories || [];
      for (const child of children) {
        collectDescendants(child);
      }
    };
    collectDescendants(targetNode);
  }

  return matches;
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

  const handleCategoryChange = useCallback(
    (categorySlug?: string) => {
      setFilter("selectedCategory", categorySlug);
      const params = new URLSearchParams(searchParams.toString());
      if (categorySlug) {
        params.set("category", categorySlug);
      } else {
        params.delete("category");
      }
      const queryString = params.toString();
      router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
    },
    [setFilter, searchParams, pathname, router]
  );

  const handleResetFilters = useCallback(() => {
    clearFilters();
    if (searchParams.toString()) {
      router.replace(pathname, { scroll: false });
    }
  }, [clearFilters, searchParams, router, pathname]);

  // Build category tree
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  // Find selected category data recursively
  const selectedCategoryData = useMemo(() => {
    if (!effectiveCategory) return null;
    const normalized = effectiveCategory.toLowerCase().trim();

    const findNode = (list: any[]): Category | null => {
      for (const item of list) {
        if (
          item.slug?.toLowerCase() === normalized ||
          String(item.id).toLowerCase() === normalized ||
          item.name?.toLowerCase() === normalized ||
          item.name?.toLowerCase().replace(/\s+/g, '-') === normalized
        ) {
          return item;
        }
        const children = item.children || item.subCategories;
        if (children && children.length > 0) {
          const found = findNode(children);
          if (found) return found;
        }
      }
      return null;
    };

    return findNode(categories);
  }, [effectiveCategory, categories]);

  // Apply all filters client-side
  const { orderby, order } = getSortParams(filters.sortOrder);
  const filteredProducts = useMemo(() => {
    let result = products;

    // Apply category filter with hierarchy awareness
    if (effectiveCategory) {
      const allowedCategories = getCategoryMatchIdentifiers(effectiveCategory, categories);
      result = result.filter((product) => {
        // Check product.categories array
        if (product.categories && product.categories.length > 0) {
          const matched = product.categories.some((cat) => {
            const slug = (cat.slug || '').toLowerCase();
            const id = String(cat.id || '').toLowerCase();
            const name = (cat.name || '').toLowerCase();
            const nameSlug = name.replace(/\s+/g, '-');
            return (
              allowedCategories.has(slug) ||
              allowedCategories.has(id) ||
              allowedCategories.has(name) ||
              allowedCategories.has(nameSlug)
            );
          });
          if (matched) return true;
        }

        // Check product category string or category_id directly
        const rawCat = (
          (product as any).category_slug ||
          (product as any).category_name ||
          (product as any).category ||
          ''
        ).toLowerCase();
        if (rawCat && (allowedCategories.has(rawCat) || allowedCategories.has(rawCat.replace(/\s+/g, '-')))) {
          return true;
        }
        const rawCatId = String((product as any).category_id || '').toLowerCase();
        if (rawCatId && allowedCategories.has(rawCatId)) {
          return true;
        }

        return false;
      });
    }

    // Apply other filters (price, on sale, rating, etc.)
    const filtered = filterProducts(result, {
      min_price: effectiveMinPrice,
      max_price: effectiveMaxPrice,
      on_sale: filters.onSaleOnly || undefined,
      stock_status: filters.stockStatus === "any" ? undefined : filters.stockStatus,
      min_rating: filters.minRating > 0 ? filters.minRating : undefined,
      status: "publish",
    });

    return sortProducts(filtered, orderby, order);
  }, [products, categories, filters, effectiveCategory, effectiveMinPrice, effectiveMaxPrice, orderby, order]);

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
                <ShopSidebar
                  categories={categoryTree}
                  categoriesLoading={false}
                  selectedCategory={effectiveCategory}
                  onCategoryChange={handleCategoryChange}
                />
              </aside>

              {/* Main content */}
              <main className="col-span-12 lg:col-span-9">
                <ShopFiltersDrawer
                  categories={categoryTree}
                  categoriesLoading={false}
                  selectedCategory={effectiveCategory}
                  onCategoryChange={handleCategoryChange}
                />
                <ShopHeader
                  sortOrder={filters.sortOrder}
                  onSortChange={(value) => setFilter("sortOrder", value)}
                  productCount={filteredProducts.length}
                  selectedCategoryName={selectedCategoryData?.name}
                  onClearCategory={() => handleCategoryChange(undefined)}
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
