import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface DeliveryLocation {
  id?: string;
  code: string;
  state: string;
  price: number;
  formattedAddress?: string;
  label?: string;
  isDefault?: boolean;
}

interface DeliveryLocationState {
  currentLocation: DeliveryLocation | null;
  savedAddresses: DeliveryLocation[];
  isDeliveryOptionsOpen: boolean;
  setDeliveryLocation: (location: DeliveryLocation | null) => void;
  addSavedAddress: (location: DeliveryLocation) => void;
  removeSavedAddress: (idOrAddress: string) => void;
  clearAllSavedAddresses: () => void;
  clearDeliveryLocation: () => void;
  openDeliveryOptions: () => void;
  closeDeliveryOptions: () => void;
}

export const useDeliveryLocationStore = create<DeliveryLocationState>()(
  persist(
    (set, get) => ({
      currentLocation: null,
      savedAddresses: [],
      isDeliveryOptionsOpen: false,

      setDeliveryLocation: (location: DeliveryLocation | null) => {
        if (!location) {
          set({
            currentLocation: null,
            isDeliveryOptionsOpen: false,
          });
          return;
        }

        const { savedAddresses } = get();
        // Check if this location already exists in saved addresses; if not, add it
        const exists = savedAddresses.some(
          (addr) =>
            (addr.formattedAddress &&
              addr.formattedAddress.trim() === location.formattedAddress?.trim()) ||
            (addr.state.toLowerCase() === location.state.toLowerCase() &&
              !location.formattedAddress)
        );

        let updatedSaved = savedAddresses;
        if (!exists) {
          const newEntry: DeliveryLocation = {
            ...location,
            id: location.id || `loc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          };
          updatedSaved = [newEntry, ...savedAddresses];
        }

        set({
          currentLocation: location,
          savedAddresses: updatedSaved,
          isDeliveryOptionsOpen: false,
        });
      },

      addSavedAddress: (location: DeliveryLocation) => {
        const { savedAddresses } = get();
        const exists = savedAddresses.some(
          (addr) =>
            (addr.formattedAddress &&
              addr.formattedAddress.trim() === location.formattedAddress?.trim()) ||
            (addr.state.toLowerCase() === location.state.toLowerCase() &&
              !location.formattedAddress)
        );

        if (exists) {
          set({ currentLocation: location });
          return;
        }

        const newEntry: DeliveryLocation = {
          ...location,
          id: location.id || `loc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        };

        set({
          savedAddresses: [newEntry, ...savedAddresses],
          currentLocation: newEntry,
        });
      },

      removeSavedAddress: (idOrAddress: string) => {
        const { savedAddresses, currentLocation } = get();
        const target = idOrAddress.trim().toLowerCase();
        const updated = savedAddresses.filter(
          (item) =>
            item.id !== idOrAddress &&
            item.formattedAddress?.trim().toLowerCase() !== target &&
            item.state?.trim().toLowerCase() !== target
        );

        const isCurrentMatched =
          currentLocation?.id === idOrAddress ||
          currentLocation?.formattedAddress?.trim().toLowerCase() === target ||
          currentLocation?.state?.trim().toLowerCase() === target;

        const newCurrent = isCurrentMatched
          ? (updated[0] || null)
          : (updated.length === 0 ? null : currentLocation);

        set({
          savedAddresses: updated,
          currentLocation: newCurrent,
        });
      },

      clearAllSavedAddresses: () => {
        set({
          savedAddresses: [],
          currentLocation: null,
        });
      },

      clearDeliveryLocation: () => {
        set({ currentLocation: null });
      },

      openDeliveryOptions: () => set({ isDeliveryOptionsOpen: true }),
      closeDeliveryOptions: () => set({ isDeliveryOptionsOpen: false }),
    }),
    {
      name: "mmd_delivery_location_v2", // bumped to v2 to purge old persisted "Nairobi County" from AsyncStorage
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persistedState: any) => {
        // If an old persisted state had "Nairobi County" as default, clear it
        if (
          persistedState &&
          persistedState.currentLocation &&
          (persistedState.currentLocation.state === "Nairobi County" ||
            persistedState.currentLocation.formattedAddress === "Nairobi, Kenya")
        ) {
          return {
            ...persistedState,
            currentLocation: null,
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        currentLocation: state.currentLocation,
        savedAddresses: state.savedAddresses.filter(
          (item) =>
            item.id !== "default-nairobi" &&
            item.label !== "Default Location" &&
            item.state !== "Nairobi County"
        ),
      }),
    }
  )
);

export default useDeliveryLocationStore;
