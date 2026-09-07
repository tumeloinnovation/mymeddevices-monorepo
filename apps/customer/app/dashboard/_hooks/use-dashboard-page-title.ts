'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Maps dashboard routes to their display titles
 */
const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/profile': 'Profile',
  '/dashboard/addresses': 'Addresses',
  '/dashboard/communication': 'Communication',
  '/dashboard/orders': 'Orders',
  '/dashboard/returns': 'Returns',
  '/dashboard/tracking': 'Order Tracking',
  '/dashboard/wishlist': 'Wishlist',
  '/dashboard/preferences': 'Preferences',
  '/dashboard/security': 'Security',
  '/dashboard/privacy': 'Privacy',
  '/dashboard/coupons': 'Coupons',
  '/dashboard/loyalty': 'Loyalty Program',
  '/dashboard/insurance': 'Insurance',
  '/dashboard/prescriptions': 'Prescriptions',
  '/dashboard/tickets': 'Support Tickets',
  '/dashboard/saved-searches': 'Saved Searches',
  '/dashboard/recently-viewed': 'Recently Viewed',
};

/**
 * Hook that returns the current page title based on the route
 * Handles nested routes by finding the closest parent match
 */
export function useDashboardPageTitle(): string {
  const pathname = usePathname();

  return useMemo(() => {
    // First try exact match
    if (ROUTE_TITLES[pathname]) {
      return ROUTE_TITLES[pathname];
    }

    // For nested routes, find the closest parent match
    // e.g., /dashboard/orders/123 -> Orders
    const segments = pathname.split('/').filter(Boolean);
    for (let i = segments.length; i >= 2; i--) {
      const parentPath = '/' + segments.slice(0, i).join('/');
      if (ROUTE_TITLES[parentPath]) {
        return ROUTE_TITLES[parentPath];
      }
    }

    // Fallback to Dashboard
    return 'Dashboard';
  }, [pathname]);
}
