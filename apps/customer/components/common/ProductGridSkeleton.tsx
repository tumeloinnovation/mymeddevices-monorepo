import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridSkeletonProps {
  /** Number of skeleton cards to display */
  count?: number;
}

/**
 * Reusable skeleton loader for product grids.
 * Matches ProductCard dimensions and layout for seamless loading states.
 */
export function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="w-full flex justify-center"
        >
          <div className="w-[200px] sm:w-[220px] md:w-[240px] m-1.5 rounded-xl overflow-hidden border border-border">
            {/* Image Section - matches ProductCard h-40 sm:h-36 md:h-40 */}
            <div className="relative bg-muted/30 h-40 sm:h-36 md:h-40" />

            {/* Content Section */}
            <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1 h-full">
              {/* Category badge */}
              <div className="h-3 bg-muted rounded w-12 mb-1" />

              {/* Product title - 2 lines */}
              <div className="space-y-1.5 mb-2">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>

              {/* Price section */}
              <div className="flex items-center gap-2 mt-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>

              {/* Bottom Action Section - matches ProductCard h-[38px] sm:h-[44px] */}
              <div className="mt-3 h-[38px] sm:h-[44px]">
                <Skeleton className="h-full w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Single product card skeleton for use in other contexts
 */
export function ProductCardSkeleton() {
  return (
    <div className="w-[200px] sm:w-[220px] md:w-[240px] m-1.5 rounded-xl overflow-hidden border border-border">
      {/* Image Section */}
      <div className="relative bg-muted/30 h-40 sm:h-36 md:h-40" />

      {/* Content Section */}
      <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1 h-full">
        {/* Category badge */}
        <div className="h-3 bg-muted rounded w-12 mb-1" />

        {/* Product title - 2 lines */}
        <div className="space-y-1.5 mb-2">
          <div className="h-4 bg-muted rounded" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>

        {/* Price section */}
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-4 w-12" />
        </div>

        {/* Bottom Action Section */}
        <div className="mt-3 h-[38px] sm:h-[44px]">
          <Skeleton className="h-full w-full rounded-md" />
        </div>
      </div>
    </div>
  );
}
