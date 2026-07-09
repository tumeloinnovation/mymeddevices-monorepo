'use client'

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import type { Product } from '../../types/catalog';
import { cartService, type Cart, type CartItem } from '../services/cart-service';

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

  // Backend sync actions
  syncWithBackend: () => Promise<void>;
  syncLocalItemsToBackend: () => Promise<void>;
  addItemToBackend: (productId: string, quantity?: number, notes?: string) => Promise<void>;
  updateItemInBackend: (itemId: string, update: { quantity?: number; notes?: string }) => Promise<void>;
  removeItemFromBackend: (itemId: string) => Promise<void>;
  clearBackendCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: (discountId: string) => Promise<void>;

  // Cart token management
  setCartToken: (token: string) => void;
  clearCartToken: () => void;
  mergeCart: (method?: 'merge' | 'replace') => Promise<void>;
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
 */
let syncQueue: Promise<any> = Promise.resolve();
let pendingOps = 0;

const queueSync = <T,>(operation: () => Promise<T>): Promise<T> => {
  pendingOps++;
  const nextPromise = syncQueue.then(async () => {
    try {
      return await operation();
    } catch (err) {
      console.error("Queue operation failed:", err);
      throw err;
    } finally {
      pendingOps--;
    }
  });
  syncQueue = nextPromise.catch(() => {});
  return nextPromise;
};

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

      // ============================================================================
      // Computed Helpers (backward compatibility)
      // ============================================================================

      getCount: () => {
        const state = get();
        // Prefer backend cart if available
        if (state.cart?.items) {
          return state.cart.items.reduce((acc, item) => acc + item.quantity, 0);
        }
        return state.items.reduce((acc, item) => acc + item.quantity, 0);
      },

      isInCart: (productId: number | string) => {
        const state = get();
        const id = String(productId);

        // Check backend cart first
        if (state.cart?.items) {
          return state.cart.items.some((item) => item.product_id === id);
        }

        return state.items.some((item) => String(item.id) === id);
      },

      getItemQuantity: (productId: number | string) => {
        const state = get();
        const id = String(productId);

        // Check backend cart first
        if (state.cart?.items) {
          const item = state.cart.items.find((item) => item.product_id === id);
          return item?.quantity || 0;
        }

        const item = state.items.find((item) => String(item.id) === id);
        return item?.quantity || 0;
      },

      getTotal: () => {
        const state = get();

        // Use backend cart totals if available
        if (state.cart?.items) {
          return state.cart.items.reduce((acc, item) => {
            const price = parseFloat(item.unit_price || item.product?.price || '0');
            return acc + price * item.quantity;
          }, 0);
        }

        // Fallback to local items
        return (
          state.items.reduce((acc, curr) => {
            const price = Math.round(Number(curr.price) * 100); // work in cents
            return acc + price * curr.quantity;
          }, 0) / 100
        ); // convert back to currency
      },

      // ============================================================================
      // Local Actions (backward compatibility)
      // ============================================================================

      addItem: (product: Product, quantity: number = 1) => {
        set((state) => {
          const validQuantity = Math.max(1, Math.floor(quantity || 1));
          const existingItem = state.items.find(
            (item) => String(item.id) === String(product.id)
          );
          const currentQuantity = existingItem?.quantity || 0;

          // Check stock if managed
          if ((product as any).manage_stock) {
            const stockQuantity = Number((product as any).stock_quantity) || 0;
            const availableStock = stockQuantity - currentQuantity;
            if (availableStock < validQuantity) {
              toast.error(`Only ${availableStock} items available in stock`);
              return state;
            }
          }

          const updatedItems = existingItem
            ? state.items.map((item) =>
                String(item.id) === String(product.id)
                  ? { ...item, quantity: item.quantity + validQuantity }
                  : item
              )
            : [...state.items, { ...product, quantity: validQuantity }];

          // Sync to backend asynchronously via queueSync
          queueSync(async () => {
            await get().addItemToBackend(String(product.id), validQuantity);
          }).catch((err) => {
            console.error('Failed to sync item to backend:', err);
          });

          toast.success(`${product.name} added to cart`);
          return { items: updatedItems };
        });
      },

      updateQuantity: (productId: number | string, quantity: number) => {
        set((state) => {
          if (!productId || typeof quantity !== 'number' || isNaN(quantity) || !isFinite(quantity)) {
            return state;
          }

          if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            queueSync(async () => {
              const currentState = get();
              const item = currentState.cart?.items?.find(i => i.product_id === String(productId));
              if (item) {
                await currentState.removeItemFromBackend(item.id);
              }
            }).catch((err) => {
              console.error('Failed to remove item from backend:', err);
            });
            return {
              items: state.items.filter((item) => String(item.id) !== String(productId)),
            };
          }

          const validQuantity = Math.max(1, Math.floor(quantity));
          const item = state.items.find((item) => String(item.id) === String(productId));
          if (!item) return state;

          if (item.manage_stock) {
            const stockQuantity = Number(item.stock_quantity) || 0;
            if (validQuantity > stockQuantity) {
              toast.error(`Only ${stockQuantity} items available in stock`);
              return state;
            }
          }

          // Sync to backend asynchronously via queueSync
          queueSync(async () => {
            const currentState = get();
            const backendItem = currentState.cart?.items?.find(i => i.product_id === String(productId));
            if (backendItem) {
              await currentState.updateItemInBackend(backendItem.id, { quantity: validQuantity });
            } else {
              console.warn(`Backend item not found for product ${productId} during update. Trying to add instead.`);
              await currentState.addItemToBackend(String(productId), validQuantity);
            }
          }).catch((err) => {
            console.error('Failed to update item in backend:', err);
          });

          return {
            items: state.items.map((item) =>
              String(item.id) === String(productId)
                ? { ...item, quantity: validQuantity }
                : item
            ),
          };
        });
      },

      removeItem: (productId: number | string) => {
        if (!productId) return;

        set((state) => {
          // Sync to backend asynchronously via queueSync
          queueSync(async () => {
            const currentState = get();
            const backendItem = currentState.cart?.items?.find(i => i.product_id === String(productId));
            if (backendItem) {
              await currentState.removeItemFromBackend(backendItem.id);
            }
          }).catch((err) => {
            console.error('Failed to remove item from backend:', err);
          });

          return {
            items: state.items.filter((item) => String(item.id) !== String(productId)),
          };
        });
      },

      clear: () => {
        set({ items: [], cart: null });
      },

      // ============================================================================
      // Backend Sync Actions
      // ============================================================================

      syncWithBackend: async () => {
        const state = get();

        // Skip if already syncing
        if (state.isSyncing) {
          return;
        }

        try {
          set({ isSyncing: true, error: null });

          const cart = await cartService.getCart(state.cartToken || undefined);

          // Save cart token for future requests
          if (cart?.cart_token && cart.cart_token !== state.cartToken) {
            state.setCartToken(cart.cart_token);
          }

           // Convert backend cart items to local format for backward compatibility
          const localItems: LocalCartItem[] = cart.items.map((item) => ({
            ...item.product,
            id: item.product_id,
            quantity: item.quantity,
            price: Number(item.unit_price || item.product?.price || 0),
          }));

          if (pendingOps === 0) {
            set({
              cart,
              items: localItems,
              isSyncing: false,
            });
          } else {
            set({
              cart,
              isSyncing: false,
            });
          }
        } catch (error) {
          console.error('Failed to sync cart:', error);
          set({
            isSyncing: false,
            error: error instanceof Error ? error.message : 'Failed to sync cart',
          });
        }
      },

      syncLocalItemsToBackend: async () => {
        const state = get();

        // Skip if already syncing or no local items
        if (state.isSyncing || state.items.length === 0) {
          return;
        }

        try {
          set({ isSyncing: true, error: null });

          // First, sync with backend to get current cart state
          await get().syncWithBackend();

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
          await get().syncWithBackend();
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

          const cartItem = await cartService.addItem(
            {
              product_id: productId,
              quantity,
              notes,
              substitution_allowed: false,
            },
            state.cartToken || undefined
          );

          // Update local cart with the new item
          await get().syncWithBackend();
        } catch (error) {
          console.error('Failed to add item to backend:', error);
          set({
            isLoading: false,
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

          await cartService.updateItem(itemId, update);

          // Sync local cart
          await get().syncWithBackend();
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

          await cartService.removeItem(itemId);

          // Sync local cart
          await get().syncWithBackend();
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

          // This will need the discount_id, which we'd get from the cart
          // For now, just sync the cart after applying
          await cartService.applyCoupon(state.cart.id, code);

          await get().syncWithBackend();
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

          await get().syncWithBackend();
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
          await get().syncWithBackend();
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
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        cartToken: state.cartToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;

          // Auto-sync with backend if cart token exists
          if (state.cartToken) {
            state.syncWithBackend();
          }
        }
      },
    }
  )
);

export default useCartStore;
