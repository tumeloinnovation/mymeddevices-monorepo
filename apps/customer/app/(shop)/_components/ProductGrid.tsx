"use client";

import React from "react";
import ProductCard from "@/app/(shop)/products/_components/ProductCard";
import { Product } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { PackageSearch } from "lucide-react";

interface ProductGridProps {
  products: Product[];
  hasMore: boolean;
  loadMore: () => void;
  isLoading: boolean;
  onClearFilters?: () => void;
}

export default function ProductGrid({
  products,
  hasMore,
  loadMore,
  isLoading,
  onClearFilters,
}: ProductGridProps) {
  return (
    <div className="space-y-6">
      {/* Grid / Empty State */}
      {products.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border bg-card/50 my-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
            <PackageSearch className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">No products match your filters</h3>
          <p className="text-xs text-muted-foreground max-w-sm mb-5 leading-relaxed">
            We couldn't find any medical devices matching your current filter selections. Try adjusting or clearing your filters.
          </p>
          {onClearFilters && (
            <Button
              onClick={onClearFilters}
              variant="default"
              size="sm"
              className="px-5 font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all"
            >
              Reset All Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {products.map((p) => (
            <div key={p.id} className="w-full flex justify-center">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}

      {/* Load-more section */}
      {hasMore && products.length > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={loadMore}
            disabled={isLoading}
            variant="outline"
            className="min-w-[160px]"
          >
            {isLoading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      {/* Optional global loading state */}
      {isLoading && products.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Loading products…
        </div>
      )}
    </div>
  );
}
