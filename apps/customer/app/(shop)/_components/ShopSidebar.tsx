// app/(shop)/_components/ShopSidebar.tsx

"use client";
import React from 'react';
import { Category } from '@/lib/data/types';
import { useShopFilters } from '@/lib/context/ShopFiltersContext';
import PriceRangeFilter from './PriceRangeFilter'; // Assuming this is the correct path
import Filters from './Filters'; // Assuming this is the correct path
import LoadingState from '@/components/ui/loading-state';

type CategoryWithChildren = Category & { children?: CategoryWithChildren[] };
interface ShopSidebarProps {
  categories: CategoryWithChildren[];
  categoriesLoading?: boolean;
}
type CategoryWithLevel = Category & { level: number };

// Helper function to get hierarchical categories list (no changes)
const getHierarchicalCategories = (categories: CategoryWithChildren[]): CategoryWithLevel[] => {
  const result: CategoryWithLevel[] = [];

  const traverse = (cats: CategoryWithChildren[], level: number) => {
    cats.forEach(cat => {
      result.push({ ...cat, level });
      if (cat.children && cat.children.length > 0) {
        traverse(cat.children, level + 1);
      }
    });
  };

  traverse(categories, 0);
  return result;
};

export default function ShopSidebar({ categories, categoriesLoading }: ShopSidebarProps) {
  // --- Simplified State Management ---
  // All state is now consumed directly from the context. No more props for filters!
  const { filters, setFilter, clearFilters } = useShopFilters();

  const hierarchicalCategories = getHierarchicalCategories(categories);

  return (
    <aside className="space-y-8">
      {/* Price Range Filter */}
      <div>
        <PriceRangeFilter />
      </div>

      {/* Category Section */}
      <div className="pt-8 border-t border-border">
        <h3 className="text-sm font-semibold mb-4 text-foreground">Categories</h3>
        {categoriesLoading ? (
          <LoadingState
            title="Loading categories"
            description="Fetching categories..."
            size="sm"
          />
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {hierarchicalCategories.map((category) => (
              <div key={category.id} className="flex items-center gap-2" style={{ paddingLeft: `${category.level * 16}px` }}>
                <input
                  type="radio"
                  id={`cat-${category.id}`}
                  name="shop-category"
                  // The UI is now driven by the context state
                  checked={filters.selectedCategory === category.slug}
                  // The action updates the context state
                  onChange={() =>
                    setFilter(
                      "selectedCategory",
                      filters.selectedCategory === category.slug ? undefined : category.slug
                    )
                  }
                  className="accent-primary"
                />
                <label htmlFor={`cat-${category.id}`} className="text-sm cursor-pointer">
                  {category.name}
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Other Filters */}
      <div className="pt-8 border-t border-border">
        <Filters />
      </div>
    </aside>
  );
}