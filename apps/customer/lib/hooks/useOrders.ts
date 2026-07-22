'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, type Order, type OrderTracking, type PaginatedResponse } from '@/lib/services/order-service';

export const ordersKeys = {
  all: ['orders'] as const,
  lists: () => [...ordersKeys.all, 'list'] as const,
  list: (filters: any) => [...ordersKeys.lists(), filters] as const,
  details: () => [...ordersKeys.all, 'detail'] as const,
  detail: (id: string) => [...ordersKeys.details(), id] as const,
  tracking: (id: string) => [...ordersKeys.all, 'tracking', id] as const,
};

/**
 * Hook to fetch customer orders
 */
export function useOrders(params: { page?: number; limit?: number; status?: string } = {}) {
  return useQuery({
    queryKey: ordersKeys.list(params),
    queryFn: () => orderService.getOrders(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch single order
 */
export function useOrder(orderId: string, guestToken?: string) {
  return useQuery({
    queryKey: ordersKeys.detail(orderId),
    queryFn: () => orderService.getOrder(orderId, guestToken),
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch order tracking
 */
export function useOrderTracking(orderId: string) {
  return useQuery({
    queryKey: ordersKeys.tracking(orderId),
    queryFn: () => orderService.trackOrder(orderId),
    enabled: !!orderId,
    staleTime: 1 * 60 * 1000, // 1 minute - tracking updates frequently
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes for active orders
  });
}

/**
 * Hook to track order by number
 */
export function useTrackOrderByNumber(orderNumber: string) {
  return useQuery({
    queryKey: [...ordersKeys.all, 'trackByNumber', orderNumber],
    queryFn: () => orderService.trackOrderByNumber(orderNumber),
    enabled: !!orderNumber,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Get active orders (orders that can be tracked)
 */
export function useActiveOrders() {
  const { data: orders, ...rest } = useOrders({ limit: 20 });

  const activeOrders = orders?.items?.filter(
    (order) => ['paid', 'processing', 'shipped'].includes(order.status)
  ) || [];

  return {
    ...rest,
    activeOrders,
    data: activeOrders.length > 0 ? { items: activeOrders, total: activeOrders.length } : undefined,
  };
}
