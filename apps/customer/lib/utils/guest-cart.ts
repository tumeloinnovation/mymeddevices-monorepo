import { cartService } from '../services/cart-service';
import useCartStore from '@mymeddevices/core/lib/store/useCartStore';

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

// ============================================================================
// Types
// ============================================================================

export type MergeMethod = 'merge' | 'replace';

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
export function getGuestCartToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const token = localStorage.getItem(GUEST_CART_TOKEN_KEY);
    if (!token) {
      return null;
    }

    // Check if token has expired
    const expiry = localStorage.getItem(GUEST_CART_EXPIRY_KEY);
    if (expiry) {
      const expiryDate = parseInt(expiry, 10);
      if (Date.now() > expiryDate) {
        // Token expired, clear it
        clearGuestCartToken();
        return null;
      }
    }

    return token;
  } catch (error) {
    console.error('Failed to get guest cart token:', error);
    return null;
  }
}

/**
 * Set a guest cart token in localStorage
 */
export function setGuestCartToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const expiry = Date.now() + CART_TOKEN_DURATION;
    localStorage.setItem(GUEST_CART_TOKEN_KEY, token);
    localStorage.setItem(GUEST_CART_EXPIRY_KEY, String(expiry));
  } catch (error) {
    console.error('Failed to set guest cart token:', error);
  }
}

/**
 * Clear the guest cart token from localStorage
 */
export function clearGuestCartToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
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
 * Initialize guest cart on app load
 * Should be called on app initialization
 */
export function initializeGuestCart(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Ensure we have a guest cart token
  ensureGuestCartToken();

  // Update cart store with the token
  const token = getGuestCartToken();
  if (token) {
    const cartStore = useCartStore.getState();
    cartStore.setCartToken(token);
  }
}

/**
 * Clean up guest cart on logout
 */
export function cleanupGuestCartOnLogout(): void {
  clearGuestCartToken();

  const cartStore = useCartStore.getState();
  cartStore.clearCartToken();
  cartStore.clear();
}

/**
 * Merge guest cart into customer cart on login
 *
 * @param mergeMethod - 'merge' to combine carts, 'replace' to use customer cart only
 */
export async function mergeGuestCartOnLogin(
  mergeMethod: MergeMethod = 'merge'
): Promise<void> {
  const guestToken = getGuestCartToken();

  if (!guestToken) {
    // No guest cart to merge
    return;
  }

  try {
    const cartStore = useCartStore.getState();

    // Call the merge API
    const result = await cartService.mergeGuestCart(guestToken, mergeMethod);

    // Clear guest token after successful merge
    clearGuestCartToken();
    cartStore.clearCartToken();

    // Sync the merged cart
    await cartStore.syncWithBackend();

    console.log('Cart merged successfully:', result);
  } catch (error) {
    console.error('Failed to merge guest cart:', error);

    // Even if merge fails, clear the guest token to avoid issues
    clearGuestCartToken();
  }
}

/**
 * Check if guest cart needs merging
 */
export function needsGuestCartMerge(): boolean {
  const guestToken = getGuestCartToken();
  return guestToken !== null;
}

// ============================================================================
// Cart Migration Utilities
// ============================================================================

/**
 * Transfer local cart items to guest cart
 * Useful when migrating from local-only cart to guest cart
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

  const cartStore = useCartStore.getState();
  cartStore.clearCartToken();
}
