'use client'

/**
 * Customer Store - Centralized WooCommerce Customer State Management
 * 
 * This store is the single source of truth for customer data.
 * - Syncs with WooCommerce on login
 * - Persists to local storage
 * - Auto-syncs changes back to WooCommerce
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import type { WooCommerceCustomer } from '@/lib/data/types';
import type { Address } from '@/lib/store/useAddressStore';
import { useAuthStore } from './useAuthStore';
import {
  deserializeAddressesFromMeta,
  serializeAddressesForMeta,
  ADDRESSES_META_KEY,
  CUSTOM_TAGS_META_KEY,
} from '@/lib/utils/address-mapper';

interface CustomerState {
  // WooCommerce customer data
  customer: WooCommerceCustomer | null;
  
  // Hydration state
  hydrated: boolean;
  
  // Sync state
  isSyncing: boolean;
  lastSyncedAt: number | null;
  syncError: string | null;
  
  // Actions
  setCustomer: (customer: WooCommerceCustomer) => void;
  updateCustomer: (updates: Partial<WooCommerceCustomer>) => void;
  clearCustomer: () => void;
  
  // Sync actions
  fetchCustomer: (customerId: number) => Promise<WooCommerceCustomer | null>;
  syncToWooCommerce: (updates: Partial<WooCommerceCustomer>) => Promise<boolean>;
  
  // Address helpers from meta_data
  getSavedAddresses: () => Address[];
  getCustomTags: () => string[];
  
  // Save addresses to meta_data and sync
  saveAddressesToMeta: (addresses: Address[], customTags?: string[]) => Promise<boolean>;
  
  // Getters
  getCustomerId: () => number | null;
  getBilling: () => WooCommerceCustomer['billing'] | null;
  getShipping: () => WooCommerceCustomer['shipping'] | null;
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customer: null,
      hydrated: false,
      isSyncing: false,
      lastSyncedAt: null,
      syncError: null,

      setCustomer: (customer) => {
        set({
          customer,
          syncError: null,
          lastSyncedAt: Date.now(),
        });
        
        // Update auth store user with billing/shipping from customer
        const authStore = useAuthStore.getState();
        if (authStore.user && authStore.user.id === customer.id) {
          authStore.updateUser({
            billing: customer.billing,
            shipping: customer.shipping,
          });
        }
      },

      updateCustomer: (updates) => {
        set((state) => ({
          customer: state.customer
            ? { ...state.customer, ...updates }
            : null,
        }));
        
        // Update auth store user with updated billing/shipping
        const authStore = useAuthStore.getState();
        if (authStore.user && updates.billing) {
          authStore.updateUser({ billing: updates.billing });
        }
        if (authStore.user && updates.shipping) {
          authStore.updateUser({ shipping: updates.shipping });
        }
      },

      clearCustomer: () => {
        set({
          customer: null,
          lastSyncedAt: null,
          syncError: null,
        });
      },

      fetchCustomer: async (customerId: number) => {
        set({ isSyncing: true, syncError: null });
        
        try {
          const response = await fetch(`/api/woocommerce/customers/${customerId}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch customer');
          }
          
          const customer: WooCommerceCustomer = await response.json();
          
          set({
            customer,
            isSyncing: false,
            lastSyncedAt: Date.now(),
          });
          
          return customer;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch customer';
          set({
            isSyncing: false,
            syncError: message,
          });
          console.error('[CustomerStore] Fetch failed:', error);
          return null;
        }
      },

      syncToWooCommerce: async (updates: Partial<WooCommerceCustomer>) => {
        const { customer } = get();
        
        if (!customer?.id) {
          console.warn('[CustomerStore] No customer ID, cannot sync');
          return false;
        }
        
        set({ isSyncing: true, syncError: null });
        
        try {
          const response = await fetch(`/api/woocommerce/customers/${customer.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update customer');
          }
          
          const updatedCustomer: WooCommerceCustomer = await response.json();
          
          set({
            customer: updatedCustomer,
            isSyncing: false,
            lastSyncedAt: Date.now(),
          });
          
          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to sync customer';
          set({
            isSyncing: false,
            syncError: message,
          });
          console.error('[CustomerStore] Sync failed:', error);
          return false;
        }
      },

      getSavedAddresses: () => {
        const { customer } = get();
        if (!customer?.meta_data) return [];
        
        const addressesMeta = customer.meta_data.find(
          (m) => m.key === ADDRESSES_META_KEY
        );
        
        if (!addressesMeta) return [];
        
        return deserializeAddressesFromMeta(
          typeof addressesMeta.value === 'string' 
            ? addressesMeta.value 
            : JSON.stringify(addressesMeta.value)
        );
      },

      getCustomTags: () => {
        const { customer } = get();
        if (!customer?.meta_data) return [];
        
        const tagsMeta = customer.meta_data.find(
          (m) => m.key === CUSTOM_TAGS_META_KEY
        );
        
        if (!tagsMeta) return [];
        
        try {
          const value = typeof tagsMeta.value === 'string' 
            ? JSON.parse(tagsMeta.value) 
            : tagsMeta.value;
          return Array.isArray(value) ? value : [];
        } catch {
          return [];
        }
      },

      saveAddressesToMeta: async (addresses: Address[], customTags?: string[]) => {
        const { customer, syncToWooCommerce } = get();
        
        if (!customer?.id) {
          console.warn('[CustomerStore] No customer ID, cannot save addresses');
          return false;
        }
        
        const meta_data: Array<{ key: string; value: string }> = [
          {
            key: ADDRESSES_META_KEY,
            value: serializeAddressesForMeta(addresses),
          },
        ];
        
        if (customTags && customTags.length > 0) {
          meta_data.push({
            key: CUSTOM_TAGS_META_KEY,
            value: JSON.stringify(customTags),
          });
        }
        
        return syncToWooCommerce({ meta_data } as any);
      },

      getCustomerId: () => {
        return get().customer?.id || null;
      },

      getBilling: () => {
        return get().customer?.billing || null;
      },

      getShipping: () => {
        return get().customer?.shipping || null;
      },
    }),
    {
      name: 'mymed_customer_v1',
      partialize: (state) => ({
        customer: state.customer,
        lastSyncedAt: state.lastSyncedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
        }
      },
    }
  )
);

/**
 * Hook to initialize customer store on login
 * Should be called after successful authentication
 * Also syncs customer data to auth store for profile display
 */
export async function initializeCustomerOnLogin(customerId: number): Promise<WooCommerceCustomer | null> {
  const store = useCustomerStore.getState();
  const customer = await store.fetchCustomer(customerId);
  
  return customer;
}

/**
 * Hook to clear customer store on logout
 */
export function clearCustomerOnLogout(): void {
  useCustomerStore.getState().clearCustomer();
}
