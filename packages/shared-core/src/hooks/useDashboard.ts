import { useMemo } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useAddressStore } from '@/lib/store/useAddressStore';
import { SEED_ORDERS } from '@/lib/data/seed/orders';
import type { DashboardStats } from '@/types/dashboard';
import { Order } from '@/lib/data/types';
import { orderService } from '../lib/services/order-service';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to get customer orders with pagination (Mocked)
 */
export function useCustomerOrders(page = 1, perPage = 10, status?: string) {
    const user = useAuthStore((state) => state.user);
    const email = user?.email;

    return useMemo(() => {
        if (!email) return { data: [], isLoading: false, error: null };
        
        // Filter orders by email
        let orders = SEED_ORDERS.filter((o: Order) => o.billing.email === email);
        
        if (status && status !== 'all') {
            orders = orders.filter((o: Order) => o.status === status);
        }

        const start = (page - 1) * perPage;
        const paginatedOrders = orders.slice(start, start + perPage);

        return {
            data: paginatedOrders,
            isLoading: false,
            error: null,
        };
    }, [email, page, perPage, status]);
}

/**
 * Hook to calculate order statistics (Mocked)
 */
export function useOrderStats() {
    const user = useAuthStore((state) => state.user);
    const email = user?.email;

    return useMemo(() => {
        if (!email) return { data: null, isLoading: false };

        const orders = SEED_ORDERS.filter((o: Order) => o.billing.email === email);
        const totalOrders = orders.length;
        const totalSpent = orders
            .filter((o: Order) => o.status === 'completed')
            .reduce((sum: number, order: Order) => sum + parseFloat(order.total), 0);

        return {
            data: {
                totalOrders,
                totalSpent,
                completedOrders: orders.filter((o: Order) => o.status === 'completed').length,
                processingOrders: orders.filter((o: Order) => o.status === 'processing').length,
            },
            isLoading: false,
        };
    }, [email]);
}

/**
 * Hook to get dashboard statistics (Mocked)
 */
export function useDashboardStats(): {
    data: DashboardStats | undefined;
    isLoading: boolean;
    error: Error | null;
} {
    const user = useAuthStore((state) => state.user);
    const wishlistItems = useWishlistStore((state) => state.items);
    const { addresses } = useAddressStore();
    const { data: orderStats, isLoading: statsLoading } = useOrderStats();

    return useMemo(() => {
        if (!user || statsLoading || !orderStats) {
            return {
                data: undefined,
                isLoading: statsLoading,
                error: null,
            };
        }

        const stats: DashboardStats = {
            totalOrders: orderStats.totalOrders,
            totalSpent: orderStats.totalSpent,
            wishlistCount: wishlistItems.length,
            savedAddresses: addresses.length,
            memberSince: '2024',
        };

        return {
            data: stats,
            isLoading: false,
            error: null,
        };
    }, [user, wishlistItems.length, addresses.length, orderStats, statsLoading]);
}

/**
 * Hook to get wishlist items count
 */
export function useWishlistItems() {
    const items = useWishlistStore((state) => state.items);
    return { items, count: items.length };
}

/**
 * Mutation hook to update addresses (Mocked)
 */
export function useUpdateAddresses() {
    return {
        mutateAsync: async (addresses: any) => {
            // Mock update
            await new Promise(resolve => setTimeout(resolve, 1000));
            return addresses;
        },
        isLoading: false,
    };
}

/**
 * Hook to get a single customer order
 */
export function useCustomerOrder(orderId: string) {
    return useQuery({
        queryKey: ['order', orderId],
        queryFn: () => orderService.getOrder(orderId),
        enabled: !!orderId,
    });
}

/**
 * Hook to get order tracking data
 */
export function useOrderTracking(orderId: string) {
    return useQuery({
        queryKey: ['order-tracking', orderId],
        queryFn: () => orderService.trackOrder(orderId),
        enabled: !!orderId,
    });
}
