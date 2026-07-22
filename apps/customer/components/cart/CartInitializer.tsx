'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@mymeddevices/shared-core';

/**
 * CartInitializer component
 *
 * Initializes the guest cart token on app load to ensure
 * cart operations work correctly from the first interaction.
 *
 * This component:
 * 1. Checks if user is authenticated (uses auth store, not localStorage)
 * 2. For guest users: ensures guest cart token exists in localStorage
 * 3. Sets the token in the cart store
 * 4. Syncs with the backend to get the current cart state
 */
export function CartInitializer() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Dynamic import to avoid SSR issues with localStorage
    import('@/lib/utils/guest-cart').then(
      ({ initializeGuestCart }) => {
        initializeGuestCart(isAuthenticated);
      }
    );
  }, [isAuthenticated]);

  return null; // This component doesn't render anything
}
