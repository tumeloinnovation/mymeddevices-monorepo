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
import { ChevronDown } from "lucide-react";

interface ShopHeaderProps {
  sortOrder: string;
  onSortChange: (value: string) => void;
  productCount: number;
}

export default function ShopHeader({ sortOrder, onSortChange, productCount }: ShopHeaderProps) {
  return (
    <div className="rounded-xl bg-gradient-to-r p-3 mb-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Products</h1>
          <span className="font-serif text-foreground">{productCount} results</span>
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