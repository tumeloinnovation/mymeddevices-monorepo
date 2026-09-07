import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { Order } from "@/types/order";

const MAX_GUEST_ORDERS = 25;

interface GuestOrderHistoryState {
  orders: Order[];
  addOrder: (order: Order) => void;
  clearOrders: () => void;
}

export const useGuestOrderHistoryStore = create<GuestOrderHistoryState>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) =>
        set((state) => {
          const filteredOrders = state.orders.filter((item) => item.id !== order.id);
          const ordered = [order, ...filteredOrders];
          return { orders: ordered.slice(0, MAX_GUEST_ORDERS) };
        }),
      clearOrders: () => set({ orders: [] }),
    }),
    {
      name: "guest-order-history",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
