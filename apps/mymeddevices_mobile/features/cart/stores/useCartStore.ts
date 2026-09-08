import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Product } from "@/types/product";

interface CartItem extends Product {
  quantity: number;
  variation_id?: number;
}

interface CartState {
  cart_items: number;
  cart_list: CartItem[];
  getProductQuantity: (productId: number, variationId?: number) => number;
  isInCart: (productId: number, variationId?: number) => boolean;
  getTotalCost: () => number;
  addToCart: (product: Product, variationId?: number) => void;
  reduceFromCart: (product: Product, variationId?: number) => void;
  removeFromCart: (product: Product, variationId?: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart_items: 0,
      cart_list: [],

      getProductQuantity: (productId: number, variationId?: number) => {
        const item = get().cart_list.find(
          (i) =>
            i.id === productId &&
            (variationId === undefined || i.variation_id === variationId)
        );
        return item?.quantity || 0;
      },

      isInCart: (productId: number, variationId?: number) => {
        return get().cart_list.some(
          (i) =>
            i.id === productId &&
            (variationId === undefined || i.variation_id === variationId)
        );
      },

      getTotalCost: () => {
        return get().cart_list.reduce(
          (acc, curr) => acc + Number(curr.price) * curr.quantity,
          0
        );
      },

      addToCart: (product: Product, variationId?: number) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        set((state) => {
          const existingItem = state.cart_list.find(
            (item) =>
              item.id === product.id &&
              (variationId === undefined || item.variation_id === variationId)
          );
          const currentQuantity = existingItem?.quantity || 0;
          const availableStock = (product.stock_quantity ?? 10) - currentQuantity;

          if (availableStock < 1) {
            return state;
          }

          const updatedCartList = existingItem
            ? state.cart_list.map((item) =>
                item.id === product.id &&
                (variationId === undefined || item.variation_id === variationId)
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              )
            : [
                ...state.cart_list,
                { ...product, quantity: 1, variation_id: variationId },
              ];

          const totalItems = updatedCartList.reduce(
            (sum, item) => sum + item.quantity,
            0
          );

          return {
            cart_items: totalItems,
            cart_list: updatedCartList,
          };
        });
      },

      reduceFromCart: (product: Product, variationId?: number) =>
        set((state) => {
          const existingItem = state.cart_list.find(
            (item) =>
              item.id === product.id &&
              (variationId === undefined || item.variation_id === variationId)
          );

          if (!existingItem) {
            return state;
          }

          const updatedCartList =
            existingItem.quantity <= 1
              ? state.cart_list.filter(
                  (item) =>
                    !(
                      item.id === product.id &&
                      (variationId === undefined || item.variation_id === variationId)
                    )
                )
              : state.cart_list.map((item) =>
                  item.id === product.id &&
                  (variationId === undefined || item.variation_id === variationId)
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
                );

          const totalItems = updatedCartList.reduce(
            (sum, item) => sum + item.quantity,
            0
          );

          return {
            cart_items: totalItems,
            cart_list: updatedCartList,
          };
        }),

      removeFromCart: (product: Product, variationId?: number) =>
        set((state) => {
          const updatedCartList = state.cart_list.filter(
            (item) =>
              !(
                item.id === product.id &&
                (variationId === undefined || item.variation_id === variationId)
              )
          );

          const totalItems = updatedCartList.reduce(
            (sum, item) => sum + item.quantity,
            0
          );

          return {
            cart_items: totalItems,
            cart_list: updatedCartList,
          };
        }),

      clearCart: () => set({ cart_items: 0, cart_list: [] }),
    }),
    {
      name: "mmd_cart_storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        cart_items: state.cart_items,
        cart_list: state.cart_list,
      }),
    }
  )
);

export default useCartStore;

