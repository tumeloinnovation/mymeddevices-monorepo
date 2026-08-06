import { create } from 'zustand';
import { Category } from '@/lib/data/types';

interface VendorCategoriesState {
  categories: Category[];
  isLoading: boolean;
  fetchCategories: () => Promise<void>;
}

export const useVendorCategoriesStore = create<VendorCategoriesState>((set) => ({
  categories: [],
  isLoading: false,
  fetchCategories: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ categories: [], isLoading: false });
  },
}));
