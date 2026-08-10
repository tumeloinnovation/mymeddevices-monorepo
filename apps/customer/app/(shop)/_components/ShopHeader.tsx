'use client';
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, X } from "lucide-react";

interface ShopHeaderProps {
  sortOrder: string;
  onSortChange: (value: string) => void;
  productCount: number;
  selectedCategoryName?: string;
  onClearCategory?: () => void;
}

export default function ShopHeader({
  sortOrder,
  onSortChange,
  productCount,
  selectedCategoryName,
  onClearCategory,
}: ShopHeaderProps) {
  return (
    <div className="pt-3 pb-2 mb-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Products</h1>
            {selectedCategoryName && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                <span>{selectedCategoryName}</span>
                {onClearCategory && (
                  <button
                    type="button"
                    onClick={onClearCategory}
                    aria-label="Clear category filter"
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
          <span className="font-serif text-xs text-muted-foreground mt-0.5 block">{productCount} results</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[180px] justify-between">
                Sort by
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortOrder} onValueChange={onSortChange}>
                <DropdownMenuRadioItem value="default">Most Popular</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="rating-desc">Most Rated</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="price-asc">Price: Low to High</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="price-desc">Price: High to Low</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}