'use client'

import { useMemo } from 'react';
import { SEED_ORDERS } from '@/lib/data/seed/orders';
import type { Order } from '@/lib/data/types';

export function useCustomerOrders(customerId: number): Order[] {
  return useMemo(
    () => SEED_ORDERS.filter((o: Order) => o.customer_id === customerId),
    [customerId]
  );
}

export function useOrderById(orderId: number): Order | null {
  return useMemo(
    () => SEED_ORDERS.find((o: Order) => o.id === orderId) ?? null,
    [orderId]
  );
}

export function useRecentOrders(customerId: number, limit = 3): Order[] {
  return useMemo(
    () =>
      SEED_ORDERS.filter((o: Order) => o.customer_id === customerId)
        .sort(
          (a: Order, b: Order) =>
            new Date(b.date_created).getTime() -
            new Date(a.date_created).getTime()
        )
        .slice(0, limit),
    [customerId, limit]
  );
}
