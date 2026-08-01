'use client';

import React from 'react';
import { DashboardLayout as SharedDashboardLayout } from '@mymeddevices/shared-admin';
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Warehouse,
  ShoppingCart,
  Tag,
  Wallet,
  Store,
  Bell,
  LifeBuoy,
  Globe,
} from 'lucide-react';

interface VendorLayoutProps {
  children: React.ReactNode;
}

export default function VendorLayout({ children }: VendorLayoutProps) {
  const vendorNavConfig = [
    {
      label: 'Overview',
      icon: LayoutDashboard,
      items: [
        { label: 'Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
        { label: 'Analytics', href: '/vendor/analytics', icon: BarChart3 },
      ],
    },
    {
      label: 'Store Management',
      icon: Store,
      items: [
        { label: 'Customer Orders', href: '/vendor/orders', icon: ShoppingCart },
        { label: 'Products Catalog', href: '/vendor/products', icon: Package },
        { label: 'Inventory', href: '/vendor/inventory', icon: Warehouse },
      ],
    },
    {
      label: 'Financials',
      icon: Wallet,
      items: [
        { label: 'Earnings', href: '/vendor/earnings', icon: Wallet },
      ],
    },
    {
      label: 'Marketing',
      icon: Tag,
      items: [
        { label: 'Coupons', href: '/vendor/coupons', icon: Tag },
      ],
    },
    {
      label: 'System & Support',
      icon: LifeBuoy,
      items: [
        { label: 'Store Profile', href: '/vendor/settings/profile', icon: Store },
        { label: 'Notifications', href: '/vendor/settings/notifications', icon: Bell },
        { label: 'Support Tickets', href: '/vendor/support/tickets', icon: LifeBuoy },
      ],
    },
    {
      label: 'Marketplace',
      icon: Globe,
      items: [
        { label: 'Open Marketplace', href: 'http://localhost:3000', icon: Globe, target: '_blank' },
      ],
    },
  ];

  return (
    <SharedDashboardLayout theme="vendor" navConfig={vendorNavConfig}>
      {children}
    </SharedDashboardLayout>
  );
}
