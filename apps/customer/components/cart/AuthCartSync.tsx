'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@mymeddevices/shared-core';
import useCartStore from '@mymeddevices/core/lib/store/useCartStore';
import { toast } from 'sonner';
import { mergeGuestCartOnLogin, cleanupGuestCartOnLogout, needsGuestCartMerge, clearGuestCartToken, getGuestCartToken } from '@/lib/utils/guest-cart';

/**
 * AuthCartSync component
 *
 * Handles cart synchronization during authentication changes:
 *
 * ON LOGIN:
 * 1. Syncs cart from backend to restore user's persistent cart
 * 2. Merges guest cart (if exists) into user's cart
 *
 * ON LOGOUT:
 * 1. Clears guest cart token
 * 2. Clears local cart state (backend cart persists)
 *
 * This component listens to auth state changes and triggers
 * the appropriate cart operations with proper timing to avoid
 * race conditions.
 */
export function AuthCartSync() {
  const { isAuthenticated, user, accessToken } = useAuthStore();
  const cartStore = useCartStore();
  const hasInitializedRef = useRef(false);
  const prevAuthenticatedRef = useRef(isAuthenticated);
  const prevAccessTokenRef = useRef(accessToken);
  const hasSyncedRef = useRef(false);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip on server-side
    if (typeof window === 'undefined') return;

    // First render - just initialize refs, don't trigger any operations
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      prevAuthenticatedRef.current = isAuthenticated;
      prevAccessTokenRef.current = accessToken;
      return;
    }

    // Detect silent token refresh (accessToken changed but user stays authenticated)
    // Reset sync flag so cart can sync with new token
    const isTokenRefresh = isAuthenticated &&
                          accessToken &&
                          prevAccessTokenRef.current &&
                          accessToken !== prevAccessTokenRef.current;

    if (isTokenRefresh) {
      console.log('🔄 [AuthCartSync] Token refreshed, resetting sync flag');
      hasSyncedRef.current = false;
      prevAccessTokenRef.current = accessToken;
      // Continue to sync logic below
    }

    // Update previous accessToken ref for next comparison
    prevAccessTokenRef.current = accessToken;

    // ========================================================================
    // LOGIN FLOW: Sync cart from backend and merge guest cart
    // ========================================================================
    if (isAuthenticated && user && accessToken && !hasSyncedRef.current) {
      console.log('🔐 [AuthCartSync] User authenticated, scheduling cart sync...');

      // Small delay to ensure auth state is fully propagated and token is available
      // This prevents race condition where API is called before token is set in headers
      hasSyncedRef.current = true;
      syncTimerRef.current = setTimeout(async () => {
        try {
          // Step 0: Clean up any orphaned guest cart token (no items)
          // This prevents "Guest cart not found" errors for empty guest carts
          if (getGuestCartToken() && cartStore.items.length === 0) {
            console.log('🧹 [AuthCartSync] Clearing empty guest cart token');
            clearGuestCartToken();
            cartStore.clearCartToken();
          }

          // Step 1: Sync cart from backend to restore user's persistent cart
          // This is critical - user may have items from a previous session
          console.log('🔄 [AuthCartSync] Step 1: Syncing cart from backend...');
          await cartStore.syncWithBackend({ force: true });
          console.log('✅ [AuthCartSync] Step 1 complete: Cart synced from backend');

          // Step 2: Check if there's a guest cart to merge
          if (needsGuestCartMerge()) {
            console.log('🔄 [AuthCartSync] Step 2: Merging guest cart...');
            await cartStore.mergeCart('merge');
            console.log('✅ [AuthCartSync] Step 2 complete: Guest cart merged');
          } else {
            console.log('ℹ️ [AuthCartSync] Step 2 skipped: No guest cart to merge');
          }

          console.log('✅ [AuthCartSync] Cart operations completed successfully');
        } catch (err: any) {
          console.error('❌ [AuthCartSync] Cart operation failed:', err);

          // Check if error is about missing guest cart - this is OK, just skip
          const errorMessage = err?.message || err?.toString() || '';
          if (errorMessage.includes('not found') || errorMessage.includes('expired')) {
            console.log('ℹ️ [AuthCartSync] Guest cart not found or expired, clearing local token');
            clearGuestCartToken();
            // Don't show error to user - this is expected if they never added items as guest
          } else {
            // Show user notification for other errors
            toast.error('Failed to sync cart. Please try refreshing.');
            // Reset sync flag on failure so we can try again
            hasSyncedRef.current = false;
          }
        }
      }, 300); // 300ms delay to ensure auth state is stable and token is available

      // Early return - don't process logout logic in same effect
      return;
    }

    // ========================================================================
    // LOGOUT FLOW: Clear guest cart token and local cart state
    // ========================================================================
    if (hasInitializedRef.current && prevAuthenticatedRef.current && !isAuthenticated) {
      console.log('🔒 [AuthCartSync] User logged out, cleaning up...');

      // Clear guest cart token and local cart state
      // Note: cleanupGuestCartOnLogout already calls cartStore.clear()
      cleanupGuestCartOnLogout();

      // Reset sync flag so next login triggers sync
      hasSyncedRef.current = false;

      console.log('✅ [AuthCartSync] Cleanup complete');
    }

    prevAuthenticatedRef.current = isAuthenticated;

    // Cleanup function
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      // Update previous refs on cleanup
      prevAccessTokenRef.current = accessToken;
    };
  }, [isAuthenticated, user, accessToken]);

  return null; // This component doesn't render anything
}
