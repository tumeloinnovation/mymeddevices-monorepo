// app/(shop)/_components/Filters.tsx

"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import { useShopFilters } from '@/lib/context/ShopFiltersContext';

export const Filters: React.FC = () => {
  const { filters, setFilter, clearFilters } = useShopFilters();

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-4 text-foreground border-b border-border pb-2">More Filters</h4>
        <div className="space-y-4">
          {/* On Sale Filter */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.onSaleOnly}
              onChange={() => setFilter("onSaleOnly", !filters.onSaleOnly)}
              className="rounded border-gray-300 accent-primary"
            />
            <span className="text-sm text-muted-foreground">On sale only</span>
          </label>

          {/* Stock Status Filter */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Stock status</label>
            <select
              value={filters.stockStatus}
              onChange={(e) => setFilter("stockStatus", e.target.value as typeof filters.stockStatus)}
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
            >
              <option value="any">Any</option>
              <option value="instock">In stock</option>
              <option value="outofstock">Out of stock</option>
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Brand</label>
            <input
              type="text"
              value={filters.selectedBrand || ''}
              onChange={(e) => setFilter('selectedBrand', e.target.value || undefined)}
              placeholder="Filter by brand name..."
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
            />
          </div>

          {/* Minimum Rating Filter */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Minimum rating</label>
            <select
              value={String(filters.minRating)}
              onChange={(e) => setFilter("minRating", Number(e.target.value))}
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background"
            >
              <option value="0">Any</option>
              <option value="1">1 star & up</option>
              <option value="2">2 stars & up</option>
              <option value="3">3 stars & up</option>
              <option value="4">4 stars & up</option>
              <option value="5">5 stars</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
        <Button variant="ghost" onClick={clearFilters} className="flex-1">
          Clear All Filters
        </Button>
      </div>
    </div>
  );
};

export default Filters;