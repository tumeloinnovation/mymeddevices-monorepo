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
  product_id?: string;
  product_variant_id?: string;
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
  guestCartExpiry: number | null;
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
  isInCart: (productId: number | string, variantId?: string) => boolean;
  getItemQuantity: (productId: number | string, variantId?: string) => number;
  getTotal: () => number;

  // Local actions (backward compatibility)
  addItem: (product: Product & { product_variant_id?: string; selected_variant_id?: string; price?: number | string }, quantity?: number) => void;
  updateQuantity: (productId: number | string, quantity: number, variantId?: string) => void;
  removeItem: (productId: number | string, variantId?: string) => void;
  clear: () => void;
  clearLocalOnly: () => void;

  // Backend sync actions
  syncWithBackend: (options?: { force?: boolean }) => Promise<void>;
  syncLocalItemsToBackend: () => Promise<void>;
  addItemToBackend: (productId: string, quantity?: number, notes?: string, productVariantId?: string) => Promise<Cart>;
  updateItemInBackend: (itemId: string, update: { quantity?: number; notes?: string }) => Promise<void>;
  removeItemFromBackend: (itemId: string) => Promise<void>;
  clearBackendCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: (discountId: string) => Promise<void>;

  // Cart token management
  setCartToken: (token: string | null, expiry?: number | null) => void;
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

// Serial queue for mutating operations to eliminate race conditions
let mutationQueue: Promise<void> = Promise.resolve();

function enqueueMutation<T>(fn: () => Promise<T>): Promise<T> {
  const result = mutationQueue.then(fn, fn);
  mutationQueue = result.then(() => {}, () => {});
  return result;
}

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
      guestCartExpiry: null,
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
        // Use backend cart item count when available and no pending operations exist
        if (state.pendingOps.size === 0 && state.cart?.items) {
          return state.cart.items.reduce((acc, item) => acc + item.quantity, 0);
        }
        // Fallback to local items
        return state.items.reduce((acc, item) => acc + item.quantity, 0);
      },

      isInCart: (productId: number | string, variantId?: string) => {
        const state = get();
        const id = String(productId);
        const itemKey = variantId ? `${id}-${variantId}` : id;

        // Check local items first (for pending or current changes)
        if (state.items.some((item) =>
          String(item.id) === itemKey ||
          String(item.id) === id ||
          (String(item.product_id || item.id) === id && (!variantId ? !item.product_variant_id : item.product_variant_id === variantId))
        )) {
          return true;
        }

        // Fallback to backend cart ONLY when not hydrated or items array is not populated yet
        if (!state.hydrated && state.cart?.items) {
          return state.cart.items.some((item) =>
            item.product_id === id && (!variantId ? !item.product_variant_id : item.product_variant_id === variantId)
          );
        }

        return false;
      },

      getItemQuantity: (productId: number | string, variantId?: string) => {
        const state = get();
        const id = String(productId);
        const itemKey = variantId ? `${id}-${variantId}` : id;

        // Check local items first (source of optimistic truth)
        const localItem = state.items.find((item) =>
          String(item.id) === itemKey ||
          String(item.id) === id ||
          (String(item.product_id || item.id) === id && (!variantId ? !item.product_variant_id : item.product_variant_id === variantId))
        );
        if (localItem !== undefined) return localItem.quantity;

        // Fallback to backend cart ONLY when not hydrated
        if (!state.hydrated && state.cart?.items) {
          const item = state.cart.items.find((item) =>
            item.product_id === id && (!variantId ? !item.product_variant_id : item.product_variant_id === variantId)
          );
          if (item) return item.quantity;
        }

        return 0;
      },

      getTotal: () => {
        const state = get();

        // If local items exist, they are the optimistic source of truth
        if (state.items.length > 0) {
          return (
            state.items.reduce((acc, curr) => {
              const price = Math.round(Number(curr.price || 0) * 100); // work in cents
              return acc + price * curr.quantity;
            }, 0) / 100
          );
        }

        // Fallback to backend cart totals
        if (state.cart?.items && state.cart.items.length > 0) {
          return state.cart.items.reduce((acc, item) => {
            const price = parseFloat(item.unit_price || (item.product_variant as any)?.calculated_price || (item.product_variant as any)?.price || item.product?.price || '0');
            return acc + price * item.quantity;
          }, 0);
        }

        return 0;
      },

      // ============================================================================
      // Local Actions (backward compatibility)
      // ============================================================================

      addItem: (product: Product & { product_variant_id?: string; selected_variant_id?: string; price?: number | string }, quantity: number = 1) => {
        const validQuantity = Math.max(1, Math.floor(quantity || 1));
        const rawProductId = String((product as any).product_id || product.id);
        const variantId = product.product_variant_id || (product as any).selected_variant_id;
        const itemId = variantId ? `${rawProductId}-${variantId}` : String(product.id || rawProductId);
        const opKey = getOpKey('add', itemId);

        // Check stock if managed
        const state = get();
        const existingItem = state.items.find((item) =>
          String(item.id) === itemId ||
          String(item.product_id) === rawProductId ||
          (String(item.product_id || item.id) === rawProductId && (!variantId || item.product_variant_id === variantId))
        );
        const currentQuantity = existingItem?.quantity || 0;

        if ((product as any).manage_stock && typeof (product as any).stock_quantity === 'number' && (product as any).stock_quantity > 0) {
          const stockQuantity = Number((product as any).stock_quantity);
          const availableStock = stockQuantity - currentQuantity;
          if (availableStock < validQuantity) {
            toast.error(`Only ${Math.max(0, availableStock)} items available in stock`);
            return;
          }
        }

        const numericPrice = typeof product.price === 'number'
          ? product.price
          : parseFloat(String(product.price || 0)) || 0;

        // Optimistic update
        const updatedItems = existingItem
          ? state.items.map((item) =>
              (String(item.id) === itemId || String(item.product_id) === rawProductId || (String(item.product_id || item.id) === rawProductId && (!variantId || item.product_variant_id === variantId)))
                ? { ...item, quantity: item.quantity + validQuantity, price: numericPrice > 0 ? numericPrice : item.price }
                : item
            )
          : [
              ...state.items,
              {
                ...product,
                id: itemId,
                product_id: rawProductId,
                product_variant_id: variantId,
                price: numericPrice,
                quantity: validQuantity,
              },
            ];

        set({ items: updatedItems });

        console.log('[CART STORE] addItem called:', {
          rawProductId,
          variantId,
          itemId,
          validQuantity,
          numericPrice,
          name: product.name,
          currentTotalItems: updatedItems.length,
        });

        // Mark operation as pending and sync to backend via queued execution
        get().pendingOps.add(opKey);
        enqueueMutation(async () => {
          try {
            console.log('[CART STORE] Syncing item to backend:', { rawProductId, validQuantity, variantId });
            await get().addItemToBackend(rawProductId, validQuantity, undefined, variantId);
            console.log('[CART STORE] Backend sync successful for:', itemId);
          } catch (err) {
            console.warn('[CART STORE] Failed to add item to backend (local cart preserved):', err);
          } finally {
            get().pendingOps.delete(opKey);
          }
        });
      },

      updateQuantity: (productId: number | string, quantity: number, variantId?: string) => {
        const id = String(productId);
        if (!id || typeof quantity !== 'number' || isNaN(quantity) || !isFinite(quantity)) {
          return;
        }

        const state = get();
        const item = state.items.find((item) =>
          String(item.id) === id ||
          String(item.product_id) === id ||
          (String(item.product_id || item.id) === id && (!variantId || item.product_variant_id === variantId)) ||
          (item.product_id && id.startsWith(String(item.product_id)) && (!variantId || item.product_variant_id === variantId))
        );
        if (!item) return;

        const targetId = String(item.id || id);
        const rawProdId = String(item.product_id || (id.includes('-') ? id.split('-')[0] : id));
        const effectiveVarId = variantId || item.product_variant_id;
        const opKey = getOpKey('update', targetId);

        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          set({
            items: state.items.filter((i) => String(i.id) !== targetId && String(i.id) !== id && String(i.product_id || i.id) !== rawProdId),
          });

          // Mark operation as pending and sync to backend
          get().pendingOps.add(opKey);
          enqueueMutation(async () => {
            try {
              const currentCart = get().cart;
              const backendItem = currentCart?.items?.find(i =>
                i.id === targetId ||
                (i.product_id === rawProdId && (!effectiveVarId ? !i.product_variant_id : i.product_variant_id === effectiveVarId))
              );
              if (backendItem) {
                await get().removeItemFromBackend(backendItem.id);
              }
            } catch (err) {
              console.warn('[CART STORE] Failed to remove item from backend (local cart preserved):', err);
            } finally {
              get().pendingOps.delete(opKey);
            }
          });
          return;
        }

        const validQuantity = Math.max(1, Math.floor(quantity));

        // Check stock if managed
        if (item.manage_stock && typeof item.stock_quantity === 'number' && item.stock_quantity > 0) {
          const stockQuantity = Number(item.stock_quantity);
          if (validQuantity > stockQuantity) {
            toast.error(`Only ${stockQuantity} items available in stock`);
            return;
          }
        }

        // Optimistic update
        set({
          items: state.items.map((i) =>
            (String(i.id) === targetId || String(i.id) === id || (String(i.product_id || i.id) === rawProdId && (!effectiveVarId || i.product_variant_id === effectiveVarId)))
              ? { ...i, quantity: validQuantity }
              : i
          ),
        });

        // Mark operation as pending and sync to backend
        get().pendingOps.add(opKey);
        enqueueMutation(async () => {
          try {
            const currentCart = get().cart;
            const backendItem = currentCart?.items?.find(i =>
              i.id === targetId ||
              (i.product_id === rawProdId && (!effectiveVarId ? !i.product_variant_id : i.product_variant_id === effectiveVarId))
            );
            if (backendItem) {
              await get().updateItemInBackend(backendItem.id, { quantity: validQuantity });
            } else {
              await get().addItemToBackend(rawProdId, validQuantity, undefined, effectiveVarId);
            }
          } catch (err) {
            console.warn('[CART STORE] Failed to update item in backend (local cart preserved):', err);
          } finally {
            get().pendingOps.delete(opKey);
          }
        });
      },

      removeItem: (productId: number | string, variantId?: string) => {
        const id = String(productId);
        if (!id) return;

        const state = get();
        const item = state.items.find((item) =>
          String(item.id) === id ||
          String(item.product_id) === id ||
          (String(item.product_id || item.id) === id && (!variantId || item.product_variant_id === variantId)) ||
          (item.product_id && id.startsWith(String(item.product_id)) && (!variantId || item.product_variant_id === variantId))
        );
        const targetId = item ? String(item.id) : id;
        const rawProdId = String(item?.product_id || (id.includes('-') ? id.split('-')[0] : id));
        const effectiveVarId = variantId || item?.product_variant_id;
        const opKey = getOpKey('remove', targetId);

        // Optimistic update
        set({
          items: state.items.filter((i) => String(i.id) !== targetId && String(i.id) !== id && String(i.product_id || i.id) !== rawProdId),
        });

        // Mark operation as pending and sync to backend
        get().pendingOps.add(opKey);
        enqueueMutation(async () => {
          try {
            const currentCart = get().cart;
            const backendItem = currentCart?.items?.find(i =>
              i.id === targetId ||
              (i.product_id === rawProdId && (!effectiveVarId ? !i.product_variant_id : i.product_variant_id === effectiveVarId))
            );
            if (backendItem) {
              await get().removeItemFromBackend(backendItem.id);
            }
          } catch (err) {
            console.warn('[CART STORE] Failed to remove item from backend (local cart preserved):', err);
          } finally {
            get().pendingOps.delete(opKey);
          }
        });
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
            set({ isSyncing: false, cart: null });
            return;
          }

          // Save cart token for future requests
          if (cart?.cart_token && cart.cart_token !== state.cartToken) {
            get().setCartToken(cart.cart_token);
          }

          // Convert backend cart items to local format for backward compatibility
          const cartItems = cart.items || [];
          const localItems: LocalCartItem[] = cartItems.map((item) => {
            const itemKey = item.product_variant_id ? `${item.product_id}-${item.product_variant_id}` : item.product_id;
            return {
              ...item.product,
              id: itemKey,
              product_id: item.product_id,
              product_variant_id: item.product_variant_id,
              name: item.product_variant?.name
                ? `${item.product?.name || 'Product'} (${item.product_variant.name})`
                : (item.product?.name || 'Product'),
              sku: item.product_variant?.sku || item.product?.sku,
              quantity: item.quantity,
              price: Number(item.unit_price || (item.product_variant as any)?.calculated_price || (item.product_variant as any)?.price || item.product?.price || 0),
            };
          });

          // Only update items if there are no pending operations
          // This prevents overwriting optimistic updates
          if (get().pendingOps.size === 0) {
            if (localItems.length > 0) {
              set({
                cart,
                items: localItems,
                isSyncing: false,
              });
            } else {
              // If backend cart is empty or fresh, keep existing local items
              set({
                cart,
                isSyncing: false,
              });
            }
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

          // Only clear the cart token on genuine token-level failures (e.g. 404/401).
          // Do NOT wipe the cart on generic sync errors, which would remove items
          // the user just added optimistically.
          const status = (error as any)?.status;
          const tokenInvalid = status === 404 || status === 401 ||
            errorMessage.includes('not found') || errorMessage.includes('expired');
          if (tokenInvalid) {
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
            const rawProdId = String(localItem.product_id || localItem.id);
            const varId = localItem.product_variant_id;
            const backendItem = backendItems.find((bi) =>
              bi.product_id === rawProdId && (!varId || bi.product_variant_id === varId)
            );

            if (backendItem) {
              // Update quantity if different
              if (backendItem.quantity !== localItem.quantity) {
                await get().updateItemInBackend(backendItem.id, { quantity: localItem.quantity });
              }
            } else {
              // Add new item to backend
              await get().addItemToBackend(rawProdId, localItem.quantity, undefined, varId);
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
        notes?: string,
        productVariantId?: string
      ) => {
        const state = get();

        try {
          set({ isLoading: true, error: null });

          const cart = await cartService.addItem(
            {
              product_id: productId,
              product_variant_id: productVariantId,
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

      setCartToken: (token: string | null, expiry?: number | null) => {
        set({
          cartToken: token,
          guestCartExpiry: expiry ?? (token ? Date.now() + 30 * 24 * 60 * 60 * 1000 : null),
        });
      },

      clearCartToken: () => {
        set({ cartToken: null, guestCartExpiry: null });
      },

      mergeCart: async (method: 'merge' | 'replace' = 'merge') => {
        const state = get();
        const guestToken = state.cartToken;

        if (!guestToken) {
          console.log('[Cart] No guest cart token in store to merge, skipping');
          await get().syncWithBackend({ force: true });
          return;
        }

        return enqueueMutation(async () => {
          try {
            set({ isLoading: true, error: null });
            await cartService.mergeGuestCart(guestToken, method);

            // Clear guest token from store after successful merge
            get().clearCartToken();

            // Sync with the now authenticated backend cart
            await get().syncWithBackend({ force: true });
          } catch (error) {
            console.error('Failed to merge cart:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('not found') || errorMessage.includes('expired')) {
              console.log('[Cart] Guest cart not found or expired, clearing local token and proceeding');
              get().clearCartToken();
              set({ isLoading: false, error: null });
              await get().syncWithBackend({ force: true });
              return;
            }
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to merge cart',
            });
            throw error;
          } finally {
            set({ isLoading: false });
          }
        });
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
        guestCartExpiry: state.guestCartExpiry,
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
            if (state.guestCartExpiry && Date.now() > state.guestCartExpiry) {
              console.log('[Cart] Guest cart token expired on rehydrate, clearing token');
              state.clearCartToken();
              state.clearLocalOnly();
            } else {
              // Small delay to ensure auth state is hydrated first
              setTimeout(() => {
                state.syncWithBackend({ force: true })
                  .catch((error) => {
                    console.error('[Cart] Auto-sync failed on rehydrate:', error);
                    const errorMessage = error?.message || error?.toString() || '';
                    if (errorMessage.includes('not found') ||
                        errorMessage.includes('expired')) {
                      console.log('[Cart] Clearing invalid cart token');
                      state.clearCartToken();
                      state.clearLocalOnly();
                    }
                  });
              }, 100);
            }
          }
        }
      },
    }
  )
);

export { useCartStore };
export default useCartStore;
