"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import clsx from "clsx";
import { useProductSearch } from "@/lib/hooks/useProductSearch";
import { Product } from "@/lib/data/types";
import { Search, X, TrendingUp, Package } from "lucide-react";

type Props = {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  query?: string;
  initialQuery?: string;
  onQueryChange?: (v: string) => void;
  onSelect?: (product: Product) => void;
};

export default function ProductCommandSearch({
  open = false,
  onOpenChange,
  query: controlledQuery,
  initialQuery = "",
  onQueryChange,
  onSelect,
}: Props) {
  const router = useRouter();
  const isControlled = controlledQuery !== undefined;
  const [internalQuery, setInternalQuery] = useState(initialQuery);
  const query = isControlled ? (controlledQuery as string) : internalQuery;

  const { data: products = [], isLoading, isSearching, debouncedQuery } =
    useProductSearch(query);

  const [highlightIndex, setHighlightIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } else {
      setHighlightIndex(-1);
    }
  }, [open]);

  useEffect(() => {
    setHighlightIndex(products.length > 0 ? 0 : -1);
  }, [products]);

  const close = () => onOpenChange?.(false);

  const handleSelect = (product: Product) => {
    close();
    onSelect?.(product);
    router.push(`/products/${product.slug}`);
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(products.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && products[highlightIndex]) {
        handleSelect(products[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  const showLoading = isLoading || isSearching;

  return (
    <>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center px-4 py-12 sm:py-20 animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          {/* Backdrop with blur */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />

          <div
            className="relative z-10 w-full max-w-2xl animate-in zoom-in-95 slide-in-from-top-4 duration-300"
            role="document"
            style={{ maxHeight: "85vh" }}
          >
            {/* Main container with gradient border effect */}
            <div className="overflow-hidden rounded-2xl bg-gradient-to-b from-primary/5 to-transparent p-[2px]">
              <div className="rounded-2xl bg-popover shadow-2xl">
                {/* Header with gradient */}
                <div className="border-b border-border/50 bg-gradient-to-r from-background via-muted/30 to-background px-5 py-4">
                  <div className="relative flex items-center gap-3">
                    <Search className="h-5 w-5 flex-shrink-0 text-primary" />
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (isControlled) onQueryChange?.(v);
                        else setInternalQuery(v);
                      }}
                      onKeyDown={onInputKeyDown}
                      placeholder="Search for medical devices..."
                      aria-label="Search products"
                      className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                    />

                    <div className="flex items-center gap-2">
                      {showLoading && (
                        <div className="text-muted-foreground">
                          <svg
                            className="h-5 w-5 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="3"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                            />
                          </svg>
                        </div>
                      )}

                      {query && !showLoading && (
                        <button
                          onClick={() => {
                            if (isControlled) onQueryChange?.("");
                            else setInternalQuery("");
                          }}
                          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          aria-label="Clear search"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={close}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        aria-label="Close search"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Keyboard shortcuts hint */}
                  <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↑↓</kbd>
                      Navigate
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Enter</kbd>
                      Select
                    </span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Esc</kbd>
                      Close
                    </span>
                  </div>
                </div>

                {/* Results */}
                <div className="max-h-[calc(85vh-140px)] overflow-auto px-3 py-3">
                  {/* Loading state */}
                  {showLoading && query.length >= 2 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 animate-pulse mb-3 opacity-50" />
                      <p className="text-sm">Searching products...</p>
                    </div>
                  )}

                  {/* Empty state - no query */}
                  {!query && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Search className="h-12 w-12 mb-3 opacity-50" />
                      <p className="text-sm font-medium mb-1">Search for medical devices</p>
                      <p className="text-xs">Try searching for blood pressure monitor, thermometer...</p>
                    </div>
                  )}

                  {/* No results */}
                  {!showLoading &&
                    debouncedQuery.length >= 2 &&
                    products.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mb-3 opacity-50" />
                        <p className="text-sm font-medium mb-1">No products found</p>
                        <p className="text-xs">Try adjusting your search terms</p>
                      </div>
                    )}

                  {/* Results list */}
                  {Array.isArray(products) && products.length > 0 && (
                    <div className="space-y-2">
                      {/* Results header */}
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>{products.length} {products.length === 1 ? 'result' : 'results'} found</span>
                      </div>

                      <ul
                        ref={listRef}
                        className="space-y-1.5 outline-none"
                        tabIndex={0}
                      >
                        {products.map((p, idx) => {
                          const selected = idx === highlightIndex;
                          const imageSrc = p.images?.[0]?.src || "/placeholder.png";
                          const category =
                            p.categories?.[0]?.name || "Uncategorized";
                          return (
                            <li
                              key={p.id}
                              onMouseEnter={() => setHighlightIndex(idx)}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleSelect(p)}
                              role="option"
                              aria-selected={selected}
                              className={clsx(
                                "group flex cursor-pointer items-center gap-4 rounded-xl px-3 py-3 transition-all duration-200",
                                selected
                                  ? "bg-primary/10 shadow-md ring-2 ring-primary/20 scale-[1.02]"
                                  : "hover:bg-muted/50 hover:shadow-sm"
                              )}
                            >
                              {/* Product image with enhanced styling */}
                              <div className={clsx(
                                "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200",
                                selected
                                  ? "border-primary shadow-lg"
                                  : "border-border group-hover:border-primary/30"
                              )}>
                                <Image
                                  src={imageSrc}
                                  alt={p.name}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              </div>

                              {/* Product info */}
                              <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <span className={clsx(
                                  "truncate font-semibold transition-colors",
                                  selected ? "text-primary" : "text-foreground"
                                )}>
                                  {p.name}
                                </span>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="truncate rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                                    {category}
                                  </span>
                                </div>
                              </div>

                              {/* Price */}
                              <div className="flex flex-shrink-0 flex-col items-end gap-1">
                                <span className={clsx(
                                  "font-bold text-sm transition-colors",
                                  selected ? "text-primary" : "text-foreground"
                                )}>
                                  {(Number(p.price) || 0).toLocaleString("en-KE", {
                                    style: "currency",
                                    currency: "KES",
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                  })}
                                </span>
                                {selected && (
                                  <span className="text-xs text-primary">
                                    Press Enter →
                                  </span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
