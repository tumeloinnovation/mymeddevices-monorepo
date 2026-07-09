'use client'

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import {
  generateAddressId,
  areAddressesDuplicates,
} from "@/lib/utils/address-mapper";

// Predefined tags
export const PREDEFINED_TAGS = ['home', 'work', 'office', 'other'] as const;
export type PredefinedTag = typeof PREDEFINED_TAGS[number];

// Tag can be predefined or custom string
export type AddressTag = PredefinedTag | string;

export interface Address {
  id: string;
  address: string;
  lat?: string;
  lon?: string;
  tag?: AddressTag;
  label?: string;
  isDefault?: boolean;
  region?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address_2?: string;
}

interface AddressState {
  addresses: Address[];
  customTags: string[];
  hydrated: boolean;
  
  // Address CRUD
  addAddress: (address: Omit<Address, 'id'>) => void;
  updateAddress: (id: string, updates: Partial<Omit<Address, 'id'>>) => void;
  removeAddress: (id: string) => void;
  
  // Getters
  getAddresses: () => Address[];
  getAddressesByTag: (tag: AddressTag) => Address[];
  getDefaultAddress: () => Address | null;
  
  // Default management
  setDefaultAddress: (id: string) => void;
  
  // Tag management
  addCustomTag: (tag: string) => void;
  removeCustomTag: (tag: string) => void;
  getAllTags: () => AddressTag[];
  
  // Bulk operations
  clear: () => void;
  setAddresses: (addresses: Address[], customTags?: string[]) => void;
  
  // Sync flag for external sync management
  markSyncNeeded: () => void;
  syncNeeded: boolean;
  clearSyncNeeded: () => void;
}


export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],
      customTags: [],
      hydrated: false,
      syncNeeded: false,

      addAddress: (addressData) => {
        set((state) => {
          let updatedAddresses = Array.isArray(state.addresses) ? state.addresses : [];

          // Check for duplicate using normalized comparison
          const isDuplicate = updatedAddresses.some(addr =>
            areAddressesDuplicates(addr, addressData)
          );

          if (isDuplicate) {
            toast.info("This address is already saved");
            return state;
          }

          // If this is set as default, remove default from others
          if (addressData.isDefault) {
            updatedAddresses = updatedAddresses.map(addr => ({
              ...addr,
              isDefault: false
            }));
          }

          const newAddress: Address = {
            ...addressData,
            id: generateAddressId(),
          };

          toast.success("Address added successfully");
          return {
            addresses: [...updatedAddresses, newAddress],
            syncNeeded: true,
          };
        });
      },

      updateAddress: (id, updates) => {
        set((state) => {
          let updatedAddresses = Array.isArray(state.addresses) ? [...state.addresses] : [];

          // If setting this as default, remove default from others
          if (updates.isDefault) {
            updatedAddresses = updatedAddresses.map(addr => ({
              ...addr,
              isDefault: addr.id === id ? true : false
            }));
          }

          // Apply other updates
          updatedAddresses = updatedAddresses.map(addr => {
            if (addr.id === id) {
              return { ...addr, ...updates };
            }
            return addr;
          });

          toast.success("Address updated successfully");
          return { 
            addresses: updatedAddresses,
            syncNeeded: true,
          };
        });
      },

      removeAddress: (id) => {
        set((state) => {
          const addressToRemove = state.addresses.find(addr => addr.id === id);
          if (!addressToRemove) {
            toast.error("Address not found");
            return state;
          }

          const updatedAddresses = state.addresses.filter(addr => addr.id !== id);
          toast.success("Address removed successfully");
          return { 
            addresses: updatedAddresses,
            syncNeeded: true,
          };
        });
      },

      getAddresses: () => {
        return get().addresses;
      },

      getAddressesByTag: (tag) => {
        return get().addresses.filter(addr => addr.tag === tag);
      },

      getDefaultAddress: () => {
        const list = get().addresses;
        return list.find(addr => addr.isDefault) || list[0] || null;
      },

      setDefaultAddress: (id) => {
        set((state) => {
          const updatedAddresses = Array.isArray(state.addresses) ? state.addresses.map(addr => ({
            ...addr,
            isDefault: addr.id === id
          })) : [];

          toast.success("Default address updated");
          return { 
            addresses: updatedAddresses,
            syncNeeded: true,
          };
        });
      },

      addCustomTag: (tag) => {
        set((state) => {
          const normalizedTag = tag.toLowerCase().trim();
          if (PREDEFINED_TAGS.includes(normalizedTag as PredefinedTag)) {
            toast.info("This is a predefined tag");
            return state;
          }
          if (state.customTags.includes(normalizedTag)) {
            toast.info("This tag already exists");
            return state;
          }
          toast.success("Custom tag added");
          return { 
            customTags: [...state.customTags, normalizedTag],
            syncNeeded: true,
          };
        });
      },

      removeCustomTag: (tag) => {
        set((state) => {
          const normalizedTag = tag.toLowerCase().trim();
          return {
            customTags: state.customTags.filter(t => t !== normalizedTag),
            // Also remove the tag from any addresses that have it
            addresses: state.addresses.map(addr =>
              addr.tag === normalizedTag ? { ...addr, tag: undefined } : addr
            ),
            syncNeeded: true,
          };
        });
      },

      getAllTags: () => {
        const state = get();
        return [...PREDEFINED_TAGS, ...state.customTags];
      },

      clear: () => {
        toast.success("All addresses cleared");
        set({ addresses: [], customTags: [], syncNeeded: true });
      },

      setAddresses: (addresses, customTags) => {
        set({
          addresses,
          customTags: customTags || [],
          syncNeeded: false, // Don't mark sync needed when loading from external source
        });
      },

      markSyncNeeded: () => {
        set({ syncNeeded: true });
      },

      clearSyncNeeded: () => {
        set({ syncNeeded: false });
      },
    }),
    {
      name: "mymed_addresses_v3",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
        }
      },
    }
  )
);