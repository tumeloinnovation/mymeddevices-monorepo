import { cartService } from '../services/cart-service';
import { useCartStore, CART_STORAGE_KEY } from '@mymeddevices/shared-core';

// ============================================================================
// Simple UUID Generator (replaces uuid package)
// ============================================================================

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================================
// Constants
// ============================================================================

const GUEST_CART_TOKEN_KEY = 'guest_cart_token';
const GUEST_CART_EXPIRY_KEY = 'guest_cart_expiry';
const CART_TOKEN_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const ABANDONED_CART_KEY = 'guest_cart_last_activity';
const ABANDONED_CART_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days of inactivity

// ============================================================================
// Types
// ============================================================================

export type MergeMethod = 'merge' | 'replace';

export interface MergeOptions {
  /** Whether to skip merge if guest cart is empty */
  skipIfEmpty?: boolean;
  /** Whether to show a confirmation dialog (for future use) */
  confirm?: boolean;
  /** Callback when merge succeeds */
  onSuccess?: () => void;
  /** Callback when merge fails */
  onError?: (error: Error) => void;
}

// ============================================================================
// Guest Cart Token Management
// ============================================================================

/**
 * Generate a new guest cart token
 */
export function generateGuestCartToken(): string {
  return generateUUID();
}

/**
 * Get the current guest cart token from localStorage
 * Returns null if no token exists or if token has expired
 */
/**
 * Get the current guest cart token from the store
 * Returns null if no token exists or if token has expired
 */
export function getGuestCartToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const store = useCartStore.getState();
    const token = store.cartToken;
    if (!token) {
      return null;
    }

    // Check if token has expired
    const expiry = store.guestCartExpiry;
    if (expiry && Date.now() > expiry) {
      clearGuestCartToken();
      return null;
    }

    return token;
  } catch (error) {
    console.error('Failed to get guest cart token:', error);
    return null;
  }
}

/**
 * Set a guest cart token in the store
 */
export function setGuestCartToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const expiry = Date.now() + CART_TOKEN_DURATION;
    useCartStore.getState().setCartToken(token, expiry);

    // Clean up legacy localStorage keys if present
    localStorage.removeItem(GUEST_CART_TOKEN_KEY);
    localStorage.removeItem(GUEST_CART_EXPIRY_KEY);
  } catch (error) {
    console.error('Failed to set guest cart token:', error);
  }
}

/**
 * Clear the guest cart token from the store
 */
export function clearGuestCartToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    useCartStore.getState().clearCartToken();

    // Clean up legacy localStorage keys if present
    localStorage.removeItem(GUEST_CART_TOKEN_KEY);
    localStorage.removeItem(GUEST_CART_EXPIRY_KEY);
  } catch (error) {
    console.error('Failed to clear guest cart token:', error);
  }
}

/**
 * Ensure a guest cart token exists
 * Generates a new token if none exists
 */
export function ensureGuestCartToken(): string {
  const existingToken = getGuestCartToken();
  if (existingToken) {
    return existingToken;
  }

  const newToken = generateGuestCartToken();
  setGuestCartToken(newToken);
  return newToken;
}

/**
 * Check if current cart is a guest cart
 */
export function isGuestCart(): boolean {
  const token = getGuestCartToken();
  return token !== null;
}

// ============================================================================
// Guest Cart Lifecycle Management
// ============================================================================

/**
 * Track cart activity timestamp
 */
export function updateCartActivity(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ABANDONED_CART_KEY, String(Date.now()));
  } catch (error) {
    console.error('Failed to update cart activity:', error);
  }
}

/**
 * Check if cart should be abandoned due to inactivity
 */
export function shouldAbandonCart(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const lastActivity = localStorage.getItem(ABANDONED_CART_KEY);
    if (!lastActivity) return false;

    const inactiveTime = Date.now() - parseInt(lastActivity, 10);
    return inactiveTime > ABANDONED_CART_DURATION;
  } catch (error) {
    console.error('Failed to check cart abandonment:', error);
    return false;
  }
}

/**
 * Initialize guest cart on app load
 * Should be called on app initialization
 *
 * @param isAuthenticated - Optional flag indicating if user is authenticated.
 *                          If not provided, will check localStorage as fallback.
 */
export function initializeGuestCart(isAuthenticated?: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Don't initialize guest cart if user is authenticated
  // Authenticated users use their persistent cart from backend
  const userIsAuthenticated = isAuthenticated ?? (() => {
    try {
      // Fallback to checking localStorage for backward compatibility
      const accessToken = localStorage.getItem('access_token');
      return !!accessToken;
    } catch (e) {
      // Ignore localStorage access errors
      return false;
    }
  })();

  if (userIsAuthenticated) {
    console.log('🔐 [GuestCart] User is authenticated, skipping guest cart initialization');
    // Clean up any leftover guest cart token
    const token = getGuestCartToken();
    if (token) {
      console.log('🧹 [GuestCart] Clearing orphaned guest cart token');
      clearGuestCartToken();
    }
    return;
  }

  const cartStore = useCartStore.getState();

  // Check if cart should be abandoned due to inactivity
  if (shouldAbandonCart()) {
    console.log('Cart abandoned due to inactivity, clearing...');
    abandonGuestCart();
    // Don't create a new token - will be created lazily when items are added
    return;
  }

  // Update activity timestamp
  updateCartActivity();

  // Clean up empty guest cart tokens
  // This prevents "Guest cart not found" errors on login
  const token = getGuestCartToken();
  if (token && cartStore.items.length === 0) {
    console.log('🧹 [GuestCart] Removing empty guest cart token');
    clearGuestCartToken();
    cartStore.clearCartToken();
    return;
  }

  // Only sync with backend if we have both a token AND items
  // This avoids unnecessary API calls and errors for empty carts
  if (token && cartStore.items.length > 0) {
    cartStore.setCartToken(token);
    // Sync to get the latest cart state from backend
    // This handles cases where the cart was modified in another tab/session
    cartStore.syncWithBackend();
  }
}

/**
 * Clean up guest cart on logout
 *
 * This ensures all guest cart data is cleared from:
 * - localStorage (guest cart token)
 * - Cart store state (both in-memory and persisted)
 */
export function cleanupGuestCartOnLogout(): void {
  // Clear guest cart token from localStorage
  clearGuestCartToken();

  const cartStore = useCartStore.getState();

  // Clear cart token from store
  cartStore.clearCartToken();

  // Clear items and cart reference from store
  // This updates both in-memory state AND persisted storage
  cartStore.clear();

  // Also explicitly clear the persisted storage to ensure
  // stale items don't reappear on page reload
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear cart storage:', e);
    }
  }
}

/**
 * Clean up empty guest cart token
 *
 * Removes the guest cart token if there are no items in the cart.
 * This prevents attempting to merge empty guest carts on login.
 */
export function cleanupEmptyGuestCart(): void {
  const cartStore = useCartStore.getState();

  // If we have a token but no items, clear the token
  if (getGuestCartToken() && cartStore.items.length === 0) {
    console.log('🧹 [GuestCart] Clearing empty guest cart token');
    clearGuestCartToken();
    cartStore.clearCartToken();
  }
}

/**
 * Merge guest cart into customer cart on login
 *
 * @param mergeMethod - 'merge' to combine carts, 'replace' to use customer cart only
 * @param options - Additional options for merge behavior
 */
export async function mergeGuestCartOnLogin(
  mergeMethod: MergeMethod = 'merge',
  options?: MergeOptions
): Promise<void> {
  const cartStore = useCartStore.getState();
  const guestToken = cartStore.cartToken;

  if (!guestToken) {
    options?.onSuccess?.();
    return;
  }

  if (options?.skipIfEmpty && cartStore.items.length === 0) {
    console.log('Guest cart is empty, skipping merge');
    cartStore.clearCartToken();
    options?.onSuccess?.();
    return;
  }

  try {
    await cartStore.mergeCart(mergeMethod);
    options?.onSuccess?.();
  } catch (error: any) {
    console.error('Failed to merge guest cart:', error);
    options?.onError?.(error as Error);
    throw error;
  }
}

/**
 * Check if guest cart needs merging
 *
 * Returns true only if:
 * 1. Guest cart token exists
 * 2. AND there are items in the local cart (added as guest)
 *
 * This prevents attempting to merge empty guest carts which would fail
 * with "Guest cart not found or expired" errors.
 */
export function needsGuestCartMerge(): boolean {
  const guestToken = getGuestCartToken();
  if (!guestToken) {
    return false;
  }

  // Only merge if there are actually items in the cart
  const cartStore = useCartStore.getState();
  return cartStore.items.length > 0;
}

// ============================================================================
// Cart Migration Utilities
// ============================================================================

/**
 * Transfer local cart items to guest cart
 *
 * @deprecated This function is reserved for future migration scenarios.
 * It is not currently called in the main flow but should be kept for:
 * - Migrating from legacy local-only carts to guest carts
 * - Testing and development scenarios
 * - Future cart migration features
 *
 * Usage: Call this when transitioning from a local-only cart system
 * to a guest cart system with backend persistence.
 */
export async function transferLocalCartToGuest(): Promise<void> {
  const cartStore = useCartStore.getState();
  const guestToken = ensureGuestCartToken();

  // If we have local items, add them to the guest cart
  if (cartStore.items.length > 0) {
    try {
      const itemsToAdd = cartStore.items.map((item) => ({
        product_id: String(item.id),
        quantity: item.quantity,
      }));

      if (itemsToAdd.length > 0) {
        await cartService.addBulkItems(itemsToAdd, guestToken);

        // Sync the cart
        cartStore.setCartToken(guestToken);
        await cartStore.syncWithBackend();
      }
    } catch (error) {
      console.error('Failed to transfer local cart:', error);
    }
  } else {
    // Just set the token
    cartStore.setCartToken(guestToken);
  }
}

/**
 * Abandon guest cart (e.g., when user has been inactive)
 */
export function abandonGuestCart(): void {
  clearGuestCartToken();
  clearCartActivity();

  const cartStore = useCartStore.getState();
  cartStore.clearCartToken();
}

/**
 * Clear cart activity tracking
 */
export function clearCartActivity(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(ABANDONED_CART_KEY);
  } catch (error) {
    console.error('Failed to clear cart activity:', error);
  }
}
