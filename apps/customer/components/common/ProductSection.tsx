'use client';

import React, { useRef } from 'react';
import type { FC } from 'react';
import ProductCard from '../../app/(shop)/products/_components/ProductCard';
import SectionHeader from './SectionHeader';
import { Product } from '@/lib/data/types';
import ErrorState from '@/components/ui/error-state';
import { PackageSearch } from 'lucide-react';


interface ProductSectionProps {
  items?: Product[];
  title?: string;
  description?: string;
  headerClassName?: string;
  gridClassName?: string;
  showLoadMore?: boolean;
  renderItem?: (item: Product) => React.ReactNode;
  emptyMessage?: string;
  emptyTitle?: string;
  loading?: boolean;
  error?: Error | null;
  layout?: 'scroll' | 'grid';
}

export const ProductSection: FC<ProductSectionProps> = ({
  items = [],
  title = "Featured Products",
  description = "Hand-picked medical devices and equipment curated for quality and reliability.",
  headerClassName = "",
  gridClassName = "",
  renderItem,
  emptyMessage = "No products found.",
  emptyTitle = "No Products Available",
  loading = false,
  error = null,
  layout = 'scroll',
}) => {
  const [mounted, setMounted] = React.useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const showLoading = !mounted || loading;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const productWidth = (scrollRef.current.children[0] as HTMLElement)?.offsetWidth || 240;
    const gap = 8; // gap-2
    const scrollAmount = productWidth * 2 + gap;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative w-full py-2">
      {/* Header */}
      <div className="mb-4">
        <SectionHeader
          title={title}
          description={description}
          className={headerClassName}
          onLeftClick={layout === 'scroll' ? () => scroll('left') : undefined}
          onRightClick={layout === 'scroll' ? () => scroll('right') : undefined}
          showArrows={layout === 'scroll'}
        />
      </div>

      {/* Product Container */}
      {error ? (
        <ErrorState
          title="Failed to load products"
          description="We couldn't load the products at this time. Please try again."
          onRetry={() => window.location.reload()}
          retryLabel="Reload"
        />
      ) : showLoading ? (
        <div className={layout === 'grid' 
          ? `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 ${gridClassName}`
          : `flex gap-2 overflow-x-auto overflow-y-hidden scroll-smooth hide-scrollbar snap-x snap-mandatory ${gridClassName}`
        }>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className={layout === 'grid' ? "" : "snap-start shrink-0"}>
              <div className="w-full sm:w-[220px] md:w-[240px] m-0 rounded-xl overflow-hidden shadow-sm border border-border min-h-[360px] bg-card animate-pulse">
                {/* Image skeleton */}
                <div className="h-40 sm:h-36 md:h-40 bg-muted/30"></div>
                {/* Content skeleton */}
                <div className="p-2.5 sm:p-3 flex flex-col justify-between flex-1">
                  <div>
                    <div className="h-3 bg-muted rounded w-16 mb-2"></div>
                    <div className="h-4 bg-muted rounded mb-1"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </div>
                  <div className="mt-2">
                    <div className="h-5 bg-muted rounded w-20 mb-3"></div>
                    <div className="flex gap-2">
                      <div className="h-7 sm:h-8 bg-muted rounded flex-1"></div>
                      <div className="h-7 sm:h-8 w-7 sm:w-8 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-xl border border-dashed border-border bg-muted/10 my-2">
          <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
            <PackageSearch className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">{emptyTitle}</h3>
          <p className="text-sm text-muted-foreground max-w-md">{emptyMessage}</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className={layout === 'grid' 
            ? `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 ${gridClassName}`
            : `flex gap-2 overflow-x-auto overflow-y-hidden scroll-smooth hide-scrollbar snap-x snap-mandatory ${gridClassName}`
          }
        >
          {Array.isArray(items) && items.map((p) => (
            <div key={p.id} className={layout === 'grid' ? "" : "snap-start shrink-0"}>
              {renderItem ? (
                renderItem(p)
              ) : (
                <ProductCard product={p}             />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductSection;
