import { create } from 'zustand';
import { Category } from '@/lib/data/types';
import { SEED_CATEGORIES } from '@/lib/data/seed/categories';

interface VendorCategoriesState {
  categories: Category[];
  isLoading: boolean;
  fetchCategories: () => Promise<void>;
}

export const useVendorCategoriesStore = create<VendorCategoriesState>((set) => ({
  categories: SEED_CATEGORIES,
  isLoading: false,
  fetchCategories: async () => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ categories: SEED_CATEGORIES, isLoading: false });
  },
}));
