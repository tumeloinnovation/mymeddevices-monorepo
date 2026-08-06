import { create } from 'zustand';
import { Order } from '@/lib/data/types';

interface VendorOrdersState {
  orders: Order[];
  isLoading: boolean;
  fetchOrders: () => Promise<void>;
  fetchOrder: (id: number) => Promise<Order | undefined>;
  updateOrderStatus: (id: number, status: Order['status']) => Promise<boolean>;
}

export const useVendorOrdersStore = create<VendorOrdersState>((set, get) => ({
  orders: [],
  isLoading: false,
  fetchOrders: async () => {
    set({ isLoading: true });
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ orders: [], isLoading: false });
  },
  fetchOrder: async (id: number) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    const order = get().orders.find(o => o.id === id);
    set({ isLoading: false });
    return order;
  },
  updateOrderStatus: async (id: number, status: Order['status']) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const updatedOrders = get().orders.map(o => 
      o.id === id ? { ...o, status } : o
    );
    set({ orders: updatedOrders, isLoading: false });
    return true;
  },
}));
