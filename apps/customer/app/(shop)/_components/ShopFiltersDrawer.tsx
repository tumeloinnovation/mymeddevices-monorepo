"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import ShopSidebar from "./ShopSidebar";
import { useShopFilters } from "@/lib/context/ShopFiltersContext";
import { Category } from "@/lib/data/types";


export default function ShopFiltersDrawer({ categories, categoriesLoading }: { categories: Category[], categoriesLoading?: boolean }) {
  const [open, setOpen] = useState(false);
  const { filters, setFilter, clearFilters } = useShopFilters();

  return (
    <div className="md:hidden mb-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 w-full justify-center"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="p-4 overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-semibold">
              Filters
            </SheetTitle>
            <SheetDescription>
              Adjust filters and tap “Apply” or “Close”
            </SheetDescription>
          </SheetHeader>

          <ShopSidebar categories={categories} categoriesLoading={categoriesLoading} />

          <div className="pt-6">
            <SheetClose asChild>
              <Button variant="default" className="w-full">
                Apply Filters
              </Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
