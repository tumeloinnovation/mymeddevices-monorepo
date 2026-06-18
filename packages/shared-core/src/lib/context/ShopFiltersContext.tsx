// lib/context/ShopFiltersContext.tsx

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from "react";

export type StockStatus = "any" | "instock" | "outofstock";

export interface ShopFilters {
  selectedCategory: string | undefined;
  selectedBrand: string | undefined;
  priceRange: [number, number];
  onSaleOnly: boolean;
  stockStatus: StockStatus;
  minRating: number;
  sortOrder: string;
}

interface ShopFiltersContextValue {
  filters: ShopFilters;
  setFilter: <K extends keyof ShopFilters>(
    key: K,
    value: ShopFilters[K]
  ) => void;
  clearFilters: () => void;
}

// The single source of truth for default filter values
const defaultFilters: ShopFilters = {
  selectedCategory: undefined,
  selectedBrand: undefined,
  priceRange: [0, 10000], // A reasonable default max price
  onSaleOnly: false,
  stockStatus: "instock",
  minRating: 0,
  sortOrder: "default",
};

const ShopFiltersContext = createContext<ShopFiltersContextValue | undefined>(
  undefined
);

export function ShopFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<ShopFilters>(defaultFilters);

  const setFilter = useCallback(<K extends keyof ShopFilters>(
    key: K,
    value: ShopFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => setFilters(defaultFilters), []);

  const value = useMemo(
    () => ({ filters, setFilter, clearFilters }),
    [filters, setFilter, clearFilters]
  );

  return (
    <ShopFiltersContext.Provider value={value}>
      {children}
    </ShopFiltersContext.Provider>
  );
}

export function useShopFilters() {
  const ctx = useContext(ShopFiltersContext);
  if (!ctx)
    throw new Error("useShopFilters must be used within a ShopFiltersProvider");
  return ctx;
}