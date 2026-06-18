'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// Map of routes to breadcrumb labels
const routeLabels: Record<string, string> = {
  vendor: 'Vendor',
  dashboard: 'Dashboard',
  analytics: 'Analytics',
  products: 'Products',
  media: 'Media Library',
  orders: 'Orders',
  fulfillment: 'Fulfillment',
  inventory: 'Inventory',
  earnings: 'Earnings',
  payouts: 'Payouts',
  settings: 'Settings',
  profile: 'Store Profile',
  notifications: 'Notifications',
  support: 'Support',
  new: 'New',
  edit: 'Edit',
};

// Dynamic route handlers
export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();

  return useMemo(() => {
    if (!pathname || pathname === '/') return [];

    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    // Build breadcrumbs progressively
    let href = '';
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      href += `/${segment}`;

      // Handle dynamic routes (like [id])
      if (segment.startsWith('[') && segment.endsWith(']')) {
        const paramName = segment.slice(1, -1);
        // For dynamic segments, we'll show a generic label
        breadcrumbs.push({
          label: paramName.charAt(0).toUpperCase() + paramName.slice(1),
          href: i < segments.length - 1 ? href : undefined,
        });
        continue;
      }

      // Special handling for "new" and "edit" actions
      if (segment === 'new' || segment === 'edit') {
        const label = segment.charAt(0).toUpperCase() + segment.slice(1);
        breadcrumbs.push({
          label,
          href: undefined, // Action pages are terminal
        });
        continue;
      }

      // Look up the label for this segment
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      // The last breadcrumb is the current page (no href)
      breadcrumbs.push({
        label,
        href: i < segments.length - 1 ? href : undefined,
      });
    }

    return breadcrumbs;
  }, [pathname]);
}
