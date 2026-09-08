import { create } from "zustand";

import { ProductQueryParams } from "@/types/api";

interface StoreState {
  params: ProductQueryParams;
  tempParams: ProductQueryParams;
  setTempParam: (key: string, value: any) => void;
  applyParams: () => void;
  resetTempParams: () => void;
  resetParams: () => void;
  setParam: (key: string, value: any) => void;
  isSortActive: (key: string) => boolean;
  isFilterActive: (key: string) => boolean;
}

const defaultParams: ProductQueryParams = {
  per_page: 10,
  orderby: "popularity",
  order: "asc",
};

const useShopStore = create<StoreState>((set, get) => ({
  params: defaultParams,
  tempParams: {},
  setTempParam: (key, value) =>
    set((state) => ({
      tempParams: {
        ...state.tempParams,
        [key]: value,
      },
    })),
  setParam: (key, value) =>
    set((state) => ({
      params: {
        ...state.params,
        [key]: value,
      },
    })),
  applyParams: () => {
    return set((state) => ({
      params: {
        ...state.params,
        ...state.tempParams,
      },
      tempParams: {},
    }));
  },
  resetTempParams: () => set({ tempParams: {} }),
  resetParams: () => set({ params: defaultParams, tempParams: {} }),
  isSortActive: (key) => get().params.orderby === key,
  isFilterActive: (key) => key in get().params,
}));

export default useShopStore;
