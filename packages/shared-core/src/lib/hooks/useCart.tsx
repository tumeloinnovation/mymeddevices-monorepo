"use client";

import useCartStore from "@/lib/store/useCartStore";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
};

export function useCart() {
  const store = useCartStore();

  // Map store items to the simplified CartItem type expected by components
  const mappedItems = Array.isArray(store.items) ? store.items.map(item => ({
    id: item.id,
    price: Number(item.price) || 0,
    image: (item.images?.[0] as any)?.url || (item.images?.[0] as any)?.src || (item as any).image_url,
    quantity: item.quantity,
  })) : [];

  return {
    items: mappedItems,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clear: store.clear,
    getTotal: store.getTotal,
    getCount: store.getCount,
  } as const;
}

export default useCart;
