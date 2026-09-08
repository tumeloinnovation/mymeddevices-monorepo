import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Product } from "@/types/product";

interface CompareState {
  compare_list: Product[];
  isInCompare: (productId: number) => boolean;
  addToCompare: (product: Product) => void;
  removeFromCompare: (product: Product) => void;
  clearCompare: () => void;
}

const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      compare_list: [],
      isInCompare: (productId: number) => {
        const inCompare = get().compare_list.filter(
          (item) => item.id === productId
        );
        return Boolean(inCompare.length);
      },
      addToCompare: (product: Product) => {
        set((state) => ({
          compare_list: [...state.compare_list, { ...product }],
        }));
      },
      removeFromCompare: (product: Product) => {
        set((state) => ({
          compare_list: state.compare_list.filter(
            (compareProduct) => compareProduct.id !== product.id
          ),
        }));
      },
      clearCompare: () => {
        set({ compare_list: [] });
      },
    }),
    {
      name: "compare-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useCompareStore;
