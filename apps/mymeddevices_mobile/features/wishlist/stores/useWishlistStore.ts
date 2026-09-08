import { create } from "zustand";

import { Product } from "@/types/product";

interface WishlistState {
  wishlist_list: Product[];
  isInWishlist: (productId: number) => boolean;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (product: Product) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlist_list: [],
  isInWishlist: (productId: number) => {
    const inWishlist = get().wishlist_list.filter(
      (item) => item.id === productId
    );
    return Boolean(inWishlist.length);
  },
  addToWishlist: (product: Product) => {
    set((state) => ({
      wishlist_list: [...state.wishlist_list, { ...product }],
    }));
  },
  removeFromWishlist: (product: Product) => {
    set((state) => ({
      wishlist_list: state.wishlist_list.filter(
        (item) => item.id !== product.id
      ),
    }));
  },
  clearWishlist: () => {
    set({ wishlist_list: [] });
  },
}));
