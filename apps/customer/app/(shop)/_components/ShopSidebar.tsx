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
  selectedCategory?: string;
  onCategoryChange?: (categorySlug?: string) => void;
}
type CategoryWithLevel = Category & { level: number };

// Helper function to get hierarchical categories list (no changes)
const getHierarchicalCategories = (categories: CategoryWithChildren[]): CategoryWithLevel[] => {
  const result: CategoryWithLevel[] = [];

  const traverse = (cats: CategoryWithChildren[], level: number) => {
    cats.forEach(cat => {
      result.push({ ...cat, level });
      const sub = cat.children || (cat as any).subCategories;
      if (sub && sub.length > 0) {
        traverse(sub, level + 1);
      }
    });
  };

  traverse(categories, 0);
  return result;
};

export default function ShopSidebar({
  categories,
  categoriesLoading,
  selectedCategory,
  onCategoryChange,
}: ShopSidebarProps) {
  const { filters, setFilter } = useShopFilters();

  const hierarchicalCategories = getHierarchicalCategories(categories);
  const activeCategory = selectedCategory !== undefined ? selectedCategory : filters.selectedCategory;

  const handleToggle = (slug: string) => {
    const nextSlug = activeCategory === slug ? undefined : slug;
    if (onCategoryChange) {
      onCategoryChange(nextSlug);
    } else {
      setFilter("selectedCategory", nextSlug);
    }
  };

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
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {hierarchicalCategories.map((category) => (
              <div key={category.id} className="flex items-center gap-2" style={{ paddingLeft: `${category.level * 14}px` }}>
                <input
                  type="radio"
                  id={`cat-${category.id}`}
                  name="shop-category"
                  checked={activeCategory === category.slug}
                  onChange={() => handleToggle(category.slug)}
                  className="accent-primary cursor-pointer"
                />
                <label htmlFor={`cat-${category.id}`} className="text-sm cursor-pointer flex-1 flex items-center justify-between">
                  <span className={activeCategory === category.slug ? "font-medium text-primary" : "text-foreground"}>
                    {category.name}
                  </span>
                  {typeof category.count === "number" && category.count > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">({category.count})</span>
                  )}
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