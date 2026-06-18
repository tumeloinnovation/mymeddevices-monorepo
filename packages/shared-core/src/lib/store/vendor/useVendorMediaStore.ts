import { create } from 'zustand';

interface VendorMediaStoreState {
  uploadImage: (file: File) => Promise<{ id: number, url: string }>;
  isLoading: boolean;
}

export const useVendorMediaStore = create<VendorMediaStoreState>((set) => ({
  isLoading: false,
  uploadImage: async (file: File) => {
    set({ isLoading: true });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    set({ isLoading: false });
    // Return a mock object
    return {
        id: Math.floor(Math.random() * 100000),
        url: URL.createObjectURL(file)
    };
  },
}));
