'use client'

import type { Product } from "@/lib/data/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";

interface WishlistState {
  items: Product[];
  hydrated: boolean;
  isInWishlist: (productId: number | string) => boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: number | string) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      hydrated: false,
      isInWishlist: (productId: number | string) => {
        return get().items.some(
          (item) => item.id === productId || item.sku === productId
        );
      },
      addItem: (product: Product) => {
        set((state) => {
          if (
            state.items.some(
              (item) => item.id === product.id || item.sku === product.sku
            )
          ) {
            toast("Already in wishlist");
            return state;
          }
          toast.success("Added to wishlist");
          return { items: [...state.items, { ...product }] };
        });
      },
      removeItem: (productId: number | string) => {
        set((state) => {
          const newItems = state.items.filter(
            (item) => item.id !== productId && item.sku !== productId
          );
          toast("Removed from wishlist");
          return { items: newItems };
        });
      },
      clear: () => {
        toast("Wishlist cleared");
        return set({ items: [] });
      },
    }),
    {
      name: "mymed_wishlist_v1",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
        }
      },
    }
  )
);
