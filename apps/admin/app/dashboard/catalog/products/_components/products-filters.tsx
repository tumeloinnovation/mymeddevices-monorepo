"use client";

import { useMemo, useState, useEffect } from "react";
import { Search, X, Building2, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@/components/ui/autocomplete";
import { CategoryTree, ProductStats } from "@mymeddevices/shared-core";

interface CategoryItem {
  id: string;
  value: string;
}

interface ProductsFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  vendorFilter?: string;
  onVendorChange?: (value: string) => void;
  stockFilter?: string;
  onStockChange?: (value: string) => void;
  categories: CategoryTree[];
  vendors?: { id: string; name: string }[];
  stats?: ProductStats;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function ProductsFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  vendorFilter = "all",
  onVendorChange,
  stockFilter = "all",
  onStockChange,
  categories,
  vendors = [],
  stats,
  hasActiveFilters,
  onClearFilters,
}: ProductsFiltersProps) {
  const [categoryInputValue, setCategoryInputValue] = useState<string>("");

  // Sync category input value when filter is cleared or changed externally
  useEffect(() => {
    if (categoryFilter === "all" || !categoryFilter) {
      setCategoryInputValue("");
    } else {
      const found = categories.find((c) => c.id === categoryFilter || c.slug === categoryFilter);
      if (found) {
        setCategoryInputValue(found.name);
      }
    }
  }, [categoryFilter, categories]);

  const categoryItems: CategoryItem[] = useMemo(() => {
    const list: CategoryItem[] = [{ id: "all", value: "All Categories" }];
    categories.forEach((cat) => {
      if (cat.id && cat.name) {
        list.push({ id: cat.id, value: cat.name });
      }
    });
    return list;
  }, [categories]);

  const filteredCategoryItems = useMemo(() => {
    if (!categoryInputValue) return categoryItems;
    return categoryItems.filter((item) =>
      item.value.toLowerCase().includes(categoryInputValue.toLowerCase())
    );
  }, [categoryItems, categoryInputValue]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Left: Search & Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Search by SKU, device name, brand..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8 text-xs bg-slate-50/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="h-8 w-[170px] text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-medium">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">
              All Statuses {stats?.total ? `(${stats.total})` : ""}
            </SelectItem>
            <SelectItem value="published" className="text-xs">
              Published {stats?.published ? `(${stats.published})` : ""}
            </SelectItem>
            <SelectItem value="pending_review" className="text-xs">
              Pending {stats?.pending_review ? `(${stats.pending_review})` : ""}
            </SelectItem>
            <SelectItem value="draft" className="text-xs">
              Drafts {stats?.draft ? `(${stats.draft})` : ""}
            </SelectItem>
            <SelectItem value="archived" className="text-xs">
              Archive {stats?.archived ? `(${stats.archived})` : ""}
            </SelectItem>
            <SelectItem value="low_stock" className="text-xs">
              Low Stock {stats?.low_stock ? `(${stats.low_stock})` : ""}
            </SelectItem>
            <SelectItem value="outofstock" className="text-xs">
              Out of Stock
            </SelectItem>
            <SelectItem value="clinical_pick" className="text-xs">
              Clinical Picks
            </SelectItem>
            <SelectItem value="featured" className="text-xs">
              Featured
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Category Autocomplete Component */}
        <div className="w-[220px]">
          <Autocomplete<CategoryItem>
            value={categoryInputValue}
            onValueChange={(val) => {
              setCategoryInputValue(val);
              if (!val) {
                onCategoryChange("all");
              }
            }}
            items={filteredCategoryItems}
            itemToStringValue={(item) => (item as CategoryItem).value}
            onSelectItem={(item) => {
              if (item.id === "all") {
                onCategoryChange("all");
                setCategoryInputValue("");
              } else {
                onCategoryChange(item.id);
                setCategoryInputValue(item.value);
              }
            }}
          >
            <AutocompleteInput 
              placeholder="Category autocomplete..." 
              showClear 
              className="h-8 text-xs"
              onClear={() => {
                setCategoryInputValue("");
                onCategoryChange("all");
              }}
            />
            <AutocompleteContent>
              <AutocompleteEmpty>No categories found.</AutocompleteEmpty>
              <AutocompleteList>
                {(item: CategoryItem) => (
                  <AutocompleteItem key={item.id} value={item}>
                    {item.value}
                  </AutocompleteItem>
                )}
              </AutocompleteList>
            </AutocompleteContent>
          </Autocomplete>
        </div>

        {/* Vendor Dropdown */}
        {onVendorChange && vendors.length > 0 && (
          <Select value={vendorFilter} onValueChange={onVendorChange}>
            <SelectTrigger className="h-8 w-[160px] text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <Building2 className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="Vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                All Vendors
              </SelectItem>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id} className="text-xs">
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Stock Status Dropdown */}
        {onStockChange && (
          <Select value={stockFilter} onValueChange={onStockChange}>
            <SelectTrigger className="h-8 w-[140px] text-xs bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <Layers className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Stock</SelectItem>
              <SelectItem value="instock" className="text-xs">In Stock</SelectItem>
              <SelectItem value="low_stock" className="text-xs">Low Stock</SelectItem>
              <SelectItem value="outofstock" className="text-xs">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCategoryInputValue("");
              onClearFilters();
            }}
            className="h-8 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 font-medium"
          >
            <X className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
