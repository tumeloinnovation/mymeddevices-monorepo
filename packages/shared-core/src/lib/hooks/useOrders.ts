'use client'

import { useMemo } from 'react';
import type { Order } from '@/lib/data/types';

export function useCustomerOrders(customerId: number): Order[] {
  return useMemo(() => [], [customerId]);
}

export function useOrderById(orderId: number): Order | null {
  return null;
}

export function useRecentOrders(customerId: number, limit = 3): Order[] {
  return useMemo(() => [], [customerId]);
}
