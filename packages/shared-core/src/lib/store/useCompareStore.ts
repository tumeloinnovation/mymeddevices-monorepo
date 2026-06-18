'use client'

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/data/types";
import { toast } from "sonner";

interface CompareStore {
  items: Product[];
  maxItems: number;
  hydrated: boolean;
  addItem: (item: Product) => void;
  removeItem: (id: string | number) => void;
  clear: () => void;
  isInCompare: (id: string | number) => boolean;
  getCount: () => number;
  canAddMore: () => boolean;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      maxItems: 4,
      hydrated: false,
      addItem: (item) => {
        set((state) => {
          const incomingIds = [
            String((item as any).id ?? ""),
            String((item as any).sku ?? ""),
            String((item as any).slug ?? ""),
          ].filter(Boolean);

          if (
            state.items.find((p) => {
              const candidates = [
                String((p as any).id ?? ""),
                String((p as any).sku ?? ""),
                String((p as any).slug ?? ""),
              ];
              return incomingIds.some((i) => candidates.includes(i));
            })
          ) {
            toast("Already in compare");
            return state;
          }
          if (state.items.length >= state.maxItems) {
            toast.error(`You can compare up to ${state.maxItems} products`);
            return state;
          }

          toast.success("Added to compare");
          return { items: [...state.items, item] };
        });
      },
      removeItem: (id) => {
        set((state) => {
          const idStr = String(id);
          const newItems = state.items.filter((p) => {
            const candidates = [
              String((p as any).id ?? ""),
              String((p as any).sku ?? ""),
              String((p as any).slug ?? ""),
            ];
            return !candidates.includes(idStr);
          });
          toast("Removed from compare");
          return { items: newItems };
        });
      },
      clear: () => {
        toast("Compare cleared");
        return set({ items: [] });
      },
      isInCompare: (id) => {
        const idStr = String(id);
        return get().items.some((item) => {
          const candidates = [
            String((item as any).id ?? ""),
            String((item as any).sku ?? ""),
            String((item as any).slug ?? ""),
          ];
          return candidates.includes(idStr);
        });
      },
      getCount: () => get().items.length,
      canAddMore: () => get().items.length < get().maxItems,
    }),
    {
      name: "mymed_compare_v1",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
        }
      },
    }
  )
);

export default useCompareStore;
