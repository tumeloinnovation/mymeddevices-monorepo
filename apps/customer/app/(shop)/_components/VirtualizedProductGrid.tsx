"use client";

import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import ProductCard from "@/app/(shop)/products/_components/ProductCard";
import { Product } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

interface VirtualizedProductGridProps {
  products: Product[];
  hasMore: boolean;
  loadMore: () => void;
  isLoading: boolean;
}

/**
 * A high-performance grid that only renders the visible cards.
 * Great for >40 items or long scrolls.
 */
export default function VirtualizedProductGrid({
  products,
  hasMore,
  loadMore,
  isLoading,
}: VirtualizedProductGridProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);

   const isMd = useMediaQuery("(min-width: 768px)");
  const isSm = useMediaQuery("(min-width: 640px)");

    const columnCount = isMd ? 4 : isSm ? 3 : 2;
  const rowCount = Math.ceil(products.length / columnCount);
  const estimateSize = 380;


  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 2,
  });

  return (
    <div className="space-y-6">
      {/* Virtualized scroll container */}
      <div
        ref={parentRef}
        className="relative max-h-[80vh] overflow-y-auto border border-border rounded-lg"
      >
        <div
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          className="relative w-full"
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const productsInRow = [];
            const startIndex = virtualRow.index * columnCount;
            const endIndex = Math.min(startIndex + columnCount, products.length);

            for (let i = startIndex; i < endIndex; i++) {
              productsInRow.push(products[i]);
            }
            return (
              <div
                key={virtualRow.key}
                className="absolute top-0 left-0 w-full"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {/* --- Step 4: Render the chunk of products in a grid --- */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 h-full">
                  {productsInRow.map((product) => (
                    <div key={product.id} className="w-full h-full flex justify-center items-center">
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Load more button */}
      {hasMore && (
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
    </div>
  );
}
