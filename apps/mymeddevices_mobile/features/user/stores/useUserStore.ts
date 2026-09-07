import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { User } from "@/types/user";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Guest {
  first_name: string;
  last_name: string;
  phone_number: string;
}

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  guest: Guest | null;
  setGuest: (guest: Guest | null) => void;
  isGuestOpen: boolean;
  setIsGuestOpen: (state: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user: User | null) => set({ user }),
      guest: null,
      setGuest: (guest: Guest | null) => set({ guest }),
      isGuestOpen: false,
      setIsGuestOpen: (state: boolean) => set({ isGuestOpen: state }),
      clearUser: () =>
        set({
          user: null,
          guest: null,
          isGuestOpen: false,
        }),
    }),
    {
      name: "customer",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        guest: state.guest,
      }),
    }
  )
);
