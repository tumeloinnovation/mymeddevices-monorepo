import { create } from "zustand";

interface AppState {
  isRelatedProductsOpen: boolean;
  related_ids: number[];
  tabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
  openRelatedProducts: (relatedIDs?: number[]) => void;
  closeRelatedProducts: () => void;
  setRelatedIDs: (relatedIDs: number[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isRelatedProductsOpen: false,
  related_ids: [],
  tabBarVisible: true,
  setTabBarVisible: (visible) => set({ tabBarVisible: visible }),
  openRelatedProducts: (relatedIDs) =>
    set({
      isRelatedProductsOpen: true,
      ...(relatedIDs ? { related_ids: relatedIDs } : {}),
    }),
  closeRelatedProducts: () => set({ isRelatedProductsOpen: false }),
  setRelatedIDs: (relatedIDs: number[]) => set({ related_ids: relatedIDs }),
}));

export default useAppStore;

