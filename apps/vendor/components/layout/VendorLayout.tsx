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
  Clock,
  CreditCard,
  Filter,
  Truck,
  PackageCheck,
  Ban,
  RefreshCw,
  Eye,
  Undo,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Image,
  ShieldCheck,
  TrendingUp,
  Users,
  DollarSign,
  FileText,
  Settings,
  Star,
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
      ],
    },
    {
      label: 'Catalog & Operations',
      icon: Store,
      items: [
        { label: 'Products & Inventory', href: '/vendor/products', icon: Package },
        { label: 'Product Performance', href: '/vendor/analytics/products', icon: BarChart3 },
        { label: 'Product Reviews', href: '/vendor/reviews', icon: Star },
      ],
    },
    {
      label: 'Orders',
      icon: ShoppingCart,
      items: [
        {
          label: 'All Orders',
          href: '/vendor/orders',
          icon: Eye,
          isCollapsible: true,
          children: [
            { label: 'All Orders', href: '/vendor/orders', icon: Eye },
            { label: 'Pending', href: '/vendor/orders/pending', icon: Clock },
            { label: 'Paid', href: '/vendor/orders/paid', icon: CreditCard },
            { label: 'Processing', href: '/vendor/orders/processing', icon: Filter },
            { label: 'Shipped', href: '/vendor/orders/shipped', icon: Truck },
            { label: 'Delivered', href: '/vendor/orders/delivered', icon: PackageCheck },
            { label: 'Cancelled', href: '/vendor/orders/cancelled', icon: Ban },
            { label: 'Refunded', href: '/vendor/orders/refunded', icon: RefreshCw },
          ],
        },
        {
          label: 'Returns',
          href: '/vendor/returns',
          icon: Undo,
          isCollapsible: true,
          children: [
            { label: 'All Returns', href: '/vendor/returns', icon: Eye },
            { label: 'Pending', href: '/vendor/returns/pending', icon: Clock },
            { label: 'Approved', href: '/vendor/returns/approved', icon: CheckCircle2 },
            { label: 'Rejected', href: '/vendor/returns/rejected', icon: Ban },
            { label: 'Completed', href: '/vendor/returns/completed', icon: PackageCheck },
          ],
        },
        {
          label: 'Refunds',
          href: '/vendor/refunds',
          icon: RotateCcw,
          isCollapsible: true,
          children: [
            { label: 'All Refunds', href: '/vendor/refunds', icon: Eye },
            { label: 'Pending', href: '/vendor/refunds/pending', icon: Clock },
            { label: 'Processing', href: '/vendor/refunds/processing', icon: Filter },
            { label: 'Completed', href: '/vendor/refunds/completed', icon: CheckCircle2 },
            { label: 'Rejected', href: '/vendor/refunds/rejected', icon: Ban },
          ],
        },
        { label: 'Order Issues', href: '/vendor/order-issues', icon: AlertTriangle },
        { label: 'Disputes', href: '/vendor/disputes', icon: ClipboardList },
      ],
    },
    {
      label: 'Analytics',
      icon: BarChart3,
      items: [
        { label: 'Sales Analytics', href: '/vendor/analytics/sales', icon: TrendingUp },
        { label: 'Performance Metrics', href: '/vendor/analytics/performance', icon: BarChart3 },
        { label: 'Customer Insights', href: '/vendor/analytics/customers', icon: Users },
        { label: 'Revenue Reports', href: '/vendor/analytics/revenue', icon: DollarSign },
      ],
    },
    {
      label: 'Financials',
      icon: Wallet,
      items: [
        { label: 'Earnings', href: '/vendor/earnings', icon: Wallet },
        { label: 'Payouts', href: '/vendor/payouts', icon: DollarSign },
        { label: 'Transaction History', href: '/vendor/transactions', icon: FileText },
        { label: 'Financial Reports', href: '/vendor/reports/financial', icon: ClipboardList },
      ],
    },
    {
      label: 'Marketing',
      icon: Tag,
      items: [
        { label: 'Coupons & Promotions', href: '/vendor/coupons', icon: Tag },
        { label: 'Campaign Analytics', href: '/vendor/analytics/campaigns', icon: TrendingUp },
      ],
    },
    {
      label: 'Settings',
      icon: Settings,
      items: [
        { label: 'Store Profile', href: '/vendor/settings/profile', icon: Store },
        { label: 'Security & Password', href: '/vendor/settings/security', icon: ShieldCheck },
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
