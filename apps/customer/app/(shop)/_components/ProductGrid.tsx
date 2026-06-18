"use client";

import React from "react";
import ProductCard from "@/app/(shop)/products/_components/ProductCard";
import { Product } from "@/lib/data/types";
import { Button } from "@/components/ui/button";

interface ProductGridProps {
  products: Product[];
  hasMore: boolean;
  loadMore: () => void;
  isLoading: boolean;
}

export default function ProductGrid({
  products,
  hasMore,
  loadMore,
  isLoading,
}: ProductGridProps) {
  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {products.length === 0 ? (
          <div className="col-span-full text-center text-sm text-muted-foreground">
            No products match your filters.
          </div>
        ) : (
          products.map((p) => (
            <div key={p.id} className="w-full flex justify-center">
              <ProductCard product={p} />
            </div>
          ))
        )}
      </div>

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
