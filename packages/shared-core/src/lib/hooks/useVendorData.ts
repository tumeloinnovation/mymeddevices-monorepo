'use client'

import { useMemo } from 'react';
import type { Product, Order, Vendor } from '@/lib/data/types';

export const DEMO_VENDOR_ID = 1;

// ─────────────────────────────────────────────
// Vendor products
// ─────────────────────────────────────────────
export function useVendorProducts(vendorId = DEMO_VENDOR_ID): Product[] {
  return useMemo(() => [], [vendorId]);
}

// ─────────────────────────────────────────────
// Vendor orders
// ─────────────────────────────────────────────
export function useVendorOrders(vendorId = DEMO_VENDOR_ID): Order[] {
  return useMemo(() => [], [vendorId]);
}

// ─────────────────────────────────────────────
// Vendor profile
// ─────────────────────────────────────────────
export function useVendorProfile(vendorId = DEMO_VENDOR_ID): Vendor | null {
  return null;
}

// ─────────────────────────────────────────────
// Dashboard stats (computed from seed data)
// ─────────────────────────────────────────────
export function useVendorDashboardStats(vendorId = DEMO_VENDOR_ID) {
  const products = useVendorProducts(vendorId);
  const orders = useVendorOrders(vendorId);

  return useMemo(() => {
    // Revenue from completed/delivered orders
    const completedOrders = orders.filter((o: Order) => o.status === 'delivered' || (o.status as string) === 'completed');
    const revenue = completedOrders.reduce(
      (acc: number, o: Order) => acc + parseFloat(o.total),
      0
    );

    // Average rating across vendor products
    const ratedProducts = products.filter((p: Product) => parseFloat(p.average_rating) > 0);
    const avgRating =
      ratedProducts.length > 0
        ? ratedProducts.reduce((acc: number, p: Product) => acc + parseFloat(p.average_rating), 0) /
          ratedProducts.length
        : 0;

    // Order status breakdown (for chart)
    const statusCounts: Record<string, number> = {};
    orders.forEach((o: Order) => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });

    const statusLabels: Record<string, string> = {
      pending: 'Pending',
      processing: 'Processing',
      'on-hold': 'On Hold',
      completed: 'Completed',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
      failed: 'Failed',
    };

    const orderStatusBreakdown = Object.entries(statusCounts).map(
      ([status, count]) => ({
        status,
        count,
        label: statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1)
      })
    );

    // Stock analytics
    const inStock = products.filter((p: Product) => p.stock_status === 'instock').length;
    const outOfStock = products.filter((p: Product) => p.stock_status === 'outofstock').length;
    const onbackorder = products.filter((p: Product) => p.stock_status === 'onbackorder').length;
    const lowStockThreshold = 5;
    const lowStock = products.filter(
      (p: Product) => p.manage_stock && p.stock_quantity !== null && p.stock_quantity <= lowStockThreshold
    ).length;

    // Top products by sales
    const topProducts = [...products]
      .sort((a: Product, b: Product) => b.total_sales - a.total_sales)
      .slice(0, 5);

    // Products summary by status
    const published = products.filter((p: Product) => p.status === 'publish').length;
    const draft = products.filter((p: Product) => p.status === 'draft').length;
    const pending = products.filter((p: Product) => p.status === 'pending').length;

    return {
      stats: {
        sales: {
          total: revenue,
          count: completedOrders.length,
          average: completedOrders.length > 0 ? revenue / completedOrders.length : 0,
        },
        orders: {
          total: orders.length,
          pending: orders.filter(o => o.status === 'pending').length,
          completed: orders.filter(o => o.status === 'delivered' || (o.status as string) === 'completed').length,
          cancelled: orders.filter(o => o.status === 'cancelled').length,
        },
        products: {
          total: products.length,
          published,
          draft,
        },
        withdrawals: {
          balance: 0,
          pending: 0,
        },
        total_revenue: revenue,
        total_orders: orders.length,
        total_products: products.length,
        average_rating: parseFloat(avgRating.toFixed(1)),
      },
      orderStatusBreakdown,
      stockAnalytics: {
        totalProducts: products.length,
        inStock,
        outOfStock,
        lowStock,
        lowStockThreshold
      },
      topProducts: topProducts.map(p => ({
        id: p.id,
        name: p.name,
        sales: p.total_sales,
        revenue: (p.total_sales * parseFloat(p.price)).toString(),
        image: p.images[0]?.src || '',
      })),
      productsSummary: {
        total: products.length,
        published,
        draft,
        pending
      },
    };
  }, [products, orders]);
}
