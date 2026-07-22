'use client'

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import type { Product } from '../../types/catalog';
import { cartService, type Cart, type CartItem } from '../services/cart-service';

// ============================================================================
// Constants
// ============================================================================

export const CART_STORAGE_KEY = 'cart-storage';

// ============================================================================
// Types
// ============================================================================

interface LocalCartItem extends Partial<Product> {
  id?: string;
  price?: number;
  stock_quantity?: number;
  manage_stock?: boolean;
  quantity: number;
}

interface CartState {
  // Local state (for backward compatibility)
  items: LocalCartItem[];
  hydrated: boolean;

  // Backend state
  cart: Cart | null;
  cartToken: string | null;
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;

  // Sync state tracking
  pendingOps: Set<string>; // Track pending operations by key
  syncRequested: boolean; // Flag to request a sync after current operations complete

  // Rollback state
  rollbackSnapshot: LocalCartItem[] | null;

  // Computed helpers (backward compatibility)
  getCount: () => number;
  isInCart: (productId: number | string) => boolean;
  getItemQuantity: (productId: number | string) => number;
  getTotal: () => number;

  // Local actions (backward compatibility)
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number | string, quantity: number) => void;
  removeItem: (productId: number | string) => void;
  clear: () => void;
  clearLocalOnly: () => void;

  // Backend sync actions
  syncWithBackend: (options?: { force?: boolean }) => Promise<void>;
  syncLocalItemsToBackend: () => Promise<void>;
  addItemToBackend: (productId: string, quantity?: number, notes?: string) => Promise<CartItem>;
  updateItemInBackend: (itemId: string, update: { quantity?: number; notes?: string }) => Promise<void>;
  removeItemFromBackend: (itemId: string) => Promise<void>;
  clearBackendCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: (discountId: string) => Promise<void>;

  // Cart token management
  setCartToken: (token: string) => void;
  clearCartToken: () => void;
  mergeCart: (method?: 'merge' | 'replace') => Promise<void>;

  // Rollback actions
  createSnapshot: () => void;
  rollback: () => void;
  clearSnapshot: () => void;

  // Internal state management
  _setIsLoading: (loading: boolean) => void;
  _setError: (error: string | null) => void;
  _setSyncing: (syncing: boolean) => void;
}

// ============================================================================
// Cart Store
// ============================================================================

/**
 * Enhanced cart store with backend integration
 *
 * Features:
 * - Local cart operations (backward compatible)
 * - Backend sync with shopping cart API
 * - Guest cart token management
 * - Optimistic updates with rollback
 * - Proper race condition handling
 */

// Track sync state to prevent concurrent operations
let syncInProgress = false;

/**
 * Generate a unique key for tracking operations
 */
function getOpKey(type: string, id: string): string {
  return `${type}:${id}`;
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial State
      items: [],
      hydrated: false,
      cart: null,
      cartToken: null,
      isLoading: false,
      error: null,
      isSyncing: false,
      pendingOps: new Set(),
      syncRequested: false,
      rollbackSnapshot: null,

      // ============================================================================
      // Internal State Management
      // ============================================================================

      _setIsLoading: (loading: boolean) => set({ isLoading: loading }),
      _setError: (error: string | null) => set({ error }),
      _setSyncing: (syncing: boolean) => set({ isSyncing: syncing }),

      // ============================================================================
      // Computed Helpers (backward compatibility)
      // ============================================================================

      getCount: () => {
        const state = get();
        // Use backend cart item count when available (more accurate)
        if (state.cart?.items) {
          return state.cart.items.reduce((acc, item) => acc + item.quantity, 0);
        }
        // Fallback to local items
        return state.items.reduce((acc, item) => acc + item.quantity, 0);
      },

      isInCart: (productId: number | string) => {
        const state = get();
        const id = String(productId);

        // Check backend cart first (source of truth)
        const inBackendCart = state.cart?.items?.some((item) => item.product_id === id);
        if (inBackendCart) return true;

        // Also check local items (for pending changes not yet synced)
        return state.items.some((item) => String(item.id) === id);
      },

      getItemQuantity: (productId: number | string) => {
        const state = get();
        const id = String(productId);

        // Check backend cart first (source of truth)
        if (state.cart?.items) {
          const item = state.cart.items.find((item) => item.product_id === id);
          if (item) return item.quantity;
        }

        // Fallback to local items
        const localItem = state.items.find((item) => String(item.id) === id);
        return localItem?.quantity || 0;
      },

      getTotal: () => {
        const state = get();

        // Use backend cart totals when available (more accurate)
        if (state.cart?.items && state.cart.items.length > 0) {
          return state.cart.items.reduce((acc, item) => {
            const price = parseFloat(item.unit_price || item.product?.price || '0');
            return acc + price * item.quantity;
          }, 0);
        }

        // Fallback to local items
        if (state.items.length > 0) {
          return (
            state.items.reduce((acc, curr) => {
              const price = Math.round(Number(curr.price) * 100); // work in cents
              return acc + price * curr.quantity;
            }, 0) / 100
          ); // convert back to currency
        }

        return 0;
      },

      // ============================================================================
      // Local Actions (backward compatibility)
      // ============================================================================

      addItem: (product: Product, quantity: number = 1) => {
        const validQuantity = Math.max(1, Math.floor(quantity || 1));
        const productId = String(product.id);
        const opKey = getOpKey('add', productId);

        // Check stock if managed
        const state = get();
        const existingItem = state.items.find((item) => String(item.id) === productId);
        const currentQuantity = existingItem?.quantity || 0;

        if ((product as any).manage_stock) {
          const stockQuantity = Number((product as any).stock_quantity) || 0;
          const availableStock = stockQuantity - currentQuantity;
          if (availableStock < validQuantity) {
            toast.error(`Only ${availableStock} items available in stock`);
            return;
          }
        }

        // Optimistic update
        const updatedItems = existingItem
          ? state.items.map((item) =>
              String(item.id) === productId
                ? { ...item, quantity: item.quantity + validQuantity }
                : item
            )
          : [...state.items, { ...product, quantity: validQuantity, id: productId }];

        set({ items: updatedItems });

        // Mark operation as pending and sync to backend
        get().pendingOps.add(opKey);
        get().addItemToBackend(productId, validQuantity)
          .then(() => {
            // Success - remove from pending ops
            get().pendingOps.delete(opKey);
            // No need to sync again - addItemToBackend already returns the full cart
            // and updates the cart state with the latest data from backend
          })
          .catch((err) => {
            console.error('Failed to add item to backend:', err);
            // Rollback on failure
            get().pendingOps.delete(opKey);
            get().rollback();
            // Note: toast is already shown by cart-service
          });
      },

      updateQuantity: (productId: number | string, quantity: number) => {
        const id = String(productId);
        if (!id || typeof quantity !== 'number' || isNaN(quantity) || !isFinite(quantity)) {
          return;
        }

        const state = get();
        const item = state.items.find((item) => String(item.id) === id);
        if (!item) return;

        const opKey = getOpKey('update', id);

        // Create snapshot for potential rollback
        get().createSnapshot();

        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          set({
            items: state.items.filter((item) => String(item.id) !== id),
          });

          // Mark operation as pending and sync to backend
          get().pendingOps.add(opKey);
          const backendItem = state.cart?.items?.find(i => i.product_id === id);
          if (backendItem) {
            get().removeItemFromBackend(backendItem.id)
              .then(() => {
                get().pendingOps.delete(opKey);
                get().syncWithBackend({ force: false });
              })
              .catch((err) => {
                console.error('Failed to remove item from backend:', err);
                get().pendingOps.delete(opKey);
                get().rollback();
                // Note: toast is already shown by cart-service
              });
          }
          return;
        }

        const validQuantity = Math.max(1, Math.floor(quantity));

        // Check stock if managed
        if (item.manage_stock) {
          const stockQuantity = Number(item.stock_quantity) || 0;
          if (validQuantity > stockQuantity) {
            toast.error(`Only ${stockQuantity} items available in stock`);
            return;
          }
        }

        // Optimistic update
        set({
          items: state.items.map((item) =>
            String(item.id) === id
              ? { ...item, quantity: validQuantity }
              : item
          ),
        });

        // Mark operation as pending and sync to backend
        get().pendingOps.add(opKey);
        const backendItem = state.cart?.items?.find(i => i.product_id === id);
        if (backendItem) {
          get().updateItemInBackend(backendItem.id, { quantity: validQuantity })
            .then(() => {
              get().pendingOps.delete(opKey);
              get().syncWithBackend({ force: false });
            })
            .catch((err) => {
              console.error('Failed to update item in backend:', err);
              get().pendingOps.delete(opKey);
              get().rollback();
              // Note: toast is already shown by cart-service
            });
        } else {
          // Item not in backend yet, add it
          get().addItemToBackend(id, validQuantity)
            .then(() => {
              get().pendingOps.delete(opKey);
              get().syncWithBackend({ force: false });
            })
            .catch((err) => {
              console.error('Failed to add item to backend:', err);
              get().pendingOps.delete(opKey);
              get().rollback();
              // Note: toast is already shown by cart-service
            });
        }
      },

      removeItem: (productId: number | string) => {
        const id = String(productId);
        if (!id) return;

        const state = get();
        const opKey = getOpKey('remove', id);

        // Create snapshot for potential rollback
        get().createSnapshot();

        // Optimistic update
        set({
          items: state.items.filter((item) => String(item.id) !== id),
        });

        // Mark operation as pending and sync to backend
        get().pendingOps.add(opKey);
        const backendItem = state.cart?.items?.find(i => i.product_id === id);
        if (backendItem) {
          get().removeItemFromBackend(backendItem.id)
            .then(() => {
              get().pendingOps.delete(opKey);
              get().syncWithBackend({ force: false });
            })
            .catch((err) => {
              console.error('Failed to remove item from backend:', err);
              get().pendingOps.delete(opKey);
              get().rollback();
              // Note: toast is already shown by cart-service
            });
        }
      },

      clear: () => {
        const state = get();

        // Create snapshot for potential rollback
        get().createSnapshot();

        // Optimistic update
        set({ items: [] });

        // Clear backend cart
        get().clearBackendCart()
          .catch((err) => {
            console.error('Failed to clear backend cart:', err);
            // Rollback on failure
            get().rollback();
            // Note: toast is already shown by cart-service
          });
      },

      clearLocalOnly: () => {
        set({
          items: [],
          cart: null,
          cartToken: null,
        });
      },

      // ============================================================================
      // Backend Sync Actions
      // ============================================================================

      syncWithBackend: async (options = {}) => {
        const state = get();

        // If there are pending operations, don't sync yet
        // (unless force is true)
        if (!options.force && state.pendingOps.size > 0) {
          console.log('[Cart] Sync deferred - pending operations:', state.pendingOps.size);
          set({ syncRequested: true });
          return;
        }

        // If sync is already in progress, don't start another
        if (syncInProgress) {
          return;
        }

        syncInProgress = true;
        set({ isSyncing: true, error: null, syncRequested: false });

        try {
          const cart = await cartService.getCart(state.cartToken || undefined);

          // Check if cart is valid
          if (!cart) {
            set({ isSyncing: false, cart: null, items: [] });
            return;
          }

          // Save cart token for future requests
          if (cart?.cart_token && cart.cart_token !== state.cartToken) {
            get().setCartToken(cart.cart_token);
          }

          // Convert backend cart items to local format for backward compatibility
          const cartItems = cart.items || [];
          const localItems: LocalCartItem[] = cartItems.map((item) => ({
            ...item.product,
            id: item.product_id,
            quantity: item.quantity,
            price: Number(item.unit_price || item.product?.price || 0),
          }));

          // Only update items if there are no pending operations
          // This prevents overwriting optimistic updates
          if (state.pendingOps.size === 0) {
            set({
              cart,
              items: localItems,
              isSyncing: false,
            });
          } else {
            // Just update cart reference, don't touch items (they have pending changes)
            set({
              cart,
              isSyncing: false,
            });
          }

          console.log('[Cart] Synced with backend:', {
            itemCount: cartItems.length,
            localItemCount: localItems.length,
            pendingOps: state.pendingOps.size,
          });
        } catch (error) {
          console.error('[Cart] Failed to sync with backend:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to sync cart';
          set({
            isSyncing: false,
            error: errorMessage,
          });

          // If error indicates invalid cart token, clear it
          if (errorMessage.includes('not found') ||
              errorMessage.includes('expired') ||
              errorMessage.includes('invalid') ||
              errorMessage.includes('500')) {
            console.log('[Cart] Clearing invalid cart token after sync failure');
            get().clearCartToken();
            set({ cart: null, items: [] });
          }
        } finally {
          syncInProgress = false;

          // If a sync was requested while we were syncing, do it now
          const newState = get();
          if (newState.syncRequested && newState.pendingOps.size === 0) {
            newState.syncWithBackend({ force: false });
          }
        }
      },

      syncLocalItemsToBackend: async () => {
        const state = get();

        if (state.isSyncing || state.items.length === 0) {
          return;
        }

        try {
          set({ isSyncing: true, error: null });

          // First, sync with backend to get current cart state
          await get().syncWithBackend({ force: true });

          // Get updated state
          const currentState = get();
          const backendItems = currentState.cart?.items || [];

          // For each local item, check if it exists in backend
          for (const localItem of state.items) {
            const productId = String(localItem.id);
            const backendItem = backendItems.find((bi) => bi.product_id === productId);

            if (backendItem) {
              // Update quantity if different
              if (backendItem.quantity !== localItem.quantity) {
                await get().updateItemInBackend(backendItem.id, { quantity: localItem.quantity });
              }
            } else {
              // Add new item to backend
              await get().addItemToBackend(productId, localItem.quantity);
            }
          }

          // Final sync to get updated cart
          await get().syncWithBackend({ force: true });
        } catch (error) {
          console.error('Failed to sync local items to backend:', error);
          set({
            isSyncing: false,
            error: error instanceof Error ? error.message : 'Failed to sync items to backend',
          });
          throw error;
        }
      },

      addItemToBackend: async (
        productId: string,
        quantity = 1,
        notes?: string
      ) => {
        const state = get();

        try {
          set({ isLoading: true, error: null });

          const cart = await cartService.addItem(
            {
              product_id: productId,
              quantity,
              notes,
              substitution_allowed: false,
            },
            state.cartToken || undefined
          );

          // Save cart token for future requests
          if (cart?.cart_token && cart.cart_token !== state.cartToken) {
            get().setCartToken(cart.cart_token);
          }

          // Update cart state (isLoading will be set to false in finally block)
          if (cart) {
            set({ cart });
          }

          return cart;
        } catch (error) {
          console.error('Failed to add item to backend:', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to add item',
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateItemInBackend: async (
        itemId: string,
        update: { quantity?: number; notes?: string }
      ) => {
        try {
          set({ isLoading: true, error: null });
 
          await cartService.updateItem(itemId, update, get().cartToken || undefined);
 
          // Sync local cart to get updated state
          await get().syncWithBackend({ force: true });
        } catch (error) {
          console.error('Failed to update item in backend:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to update item',
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
 
      removeItemFromBackend: async (itemId: string) => {
        try {
          set({ isLoading: true, error: null });
 
          await cartService.removeItem(itemId, get().cartToken || undefined);
 
          // Sync local cart to get updated state
          await get().syncWithBackend({ force: true });
        } catch (error) {
          console.error('Failed to remove item from backend:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to remove item',
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearBackendCart: async () => {
        try {
          set({ isLoading: true, error: null });

          await cartService.clearCart(get().cartToken || undefined);

          // Clear local cart
          set({ items: [], cart: null });
          get().clearSnapshot();
        } catch (error) {
          console.error('Failed to clear backend cart:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to clear cart',
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      applyCoupon: async (code: string) => {
        const state = get();

        if (!state.cart) {
          toast.error('Cart not found');
          return;
        }

        try {
          set({ isLoading: true, error: null });

          await cartService.applyCoupon(state.cart.id, code);

          await get().syncWithBackend({ force: true });
        } catch (error) {
          console.error('Failed to apply coupon:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to apply coupon',
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      removeCoupon: async (discountId: string) => {
        const state = get();

        if (!state.cart) {
          toast.error('Cart not found');
          return;
        }

        try {
          set({ isLoading: true, error: null });

          await cartService.removeCoupon(state.cart.id, discountId);

          await get().syncWithBackend({ force: true });
        } catch (error) {
          console.error('Failed to remove coupon:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to remove coupon',
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // ============================================================================
      // Cart Token Management
      // ============================================================================

      setCartToken: (token: string) => {
        set({ cartToken: token });
      },

      clearCartToken: () => {
        set({ cartToken: null });
      },

      mergeCart: async (method: 'merge' | 'replace' = 'merge') => {
        const state = get();
        if (!state.cartToken) return;

        try {
          set({ isLoading: true, error: null });
          await cartService.mergeGuestCart(state.cartToken, method);

          // Clear guest token after successful merge
          set({ cartToken: null });

          // Sync with the now authenticated backend cart
          await get().syncWithBackend({ force: true });
        } catch (error) {
          console.error('Failed to merge cart:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to merge cart',
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // ============================================================================
      // Rollback Actions
      // ============================================================================

      createSnapshot: () => {
        const state = get();
        set({
          rollbackSnapshot: JSON.parse(JSON.stringify(state.items)),
        });
      },

      rollback: () => {
        const state = get();
        if (state.rollbackSnapshot) {
          console.log('🔄 [Cart] Rolling back to snapshot');
          set({
            items: state.rollbackSnapshot,
            rollbackSnapshot: null,
          });
        }
      },

      clearSnapshot: () => {
        set({ rollbackSnapshot: null });
      },
    }),
    {
      name: CART_STORAGE_KEY,
      partialize: (state) => ({
        items: state.items,
        cartToken: state.cartToken,
        // Exclude rollbackSnapshot, pendingOps, syncRequested from persistence
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;

          // Reset non-persisted state
          state.pendingOps = new Set();
          state.syncRequested = false;
          syncInProgress = false;

          // Auto-sync with backend if cart token exists
          if (state.cartToken) {
            // Small delay to ensure auth state is hydrated first
            setTimeout(() => {
              state.syncWithBackend({ force: true })
                .catch((error) => {
                  // If sync fails with a 500 or cart not found error, clear the invalid token
                  console.error('[Cart] Auto-sync failed on rehydrate:', error);
                  const errorMessage = error?.message || error?.toString() || '';
                  if (errorMessage.includes('500') ||
                      errorMessage.includes('not found') ||
                      errorMessage.includes('expired') ||
                      errorMessage.includes('cart')) {
                    console.log('[Cart] Clearing invalid cart token');
                    state.clearCartToken();
                    state.clear();
                  }
                });
            }, 100);
          }
        }
      },
    }
  )
);

export { useCartStore };
export default useCartStore;
