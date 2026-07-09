import { useMemo } from 'react';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useWishlistStore } from '@/lib/store/useWishlistStore';
import { useAddressStore } from '@/lib/store/useAddressStore';
import type { DashboardStats } from '@/types/dashboard';
import { Order } from '@/lib/data/types';
import { orderService } from '../lib/services/order-service';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to get customer orders with pagination (Real API)
 */
export function useCustomerOrders(page = 1, perPage = 10, status?: string) {
    const user = useAuthStore((state) => state.user);
    const email = user?.email;

    return useQuery<Order[]>({
        queryKey: ['customer-orders', email, page, perPage, status],
        queryFn: async () => {
            if (!email) return [];
            
            const response = await orderService.getOrders({ page, limit: perPage });
            const items = response.items || [];
            
            // Map items to WooCommerce/frontend shape expected by the UI pages
            const mappedOrders: Order[] = items.map((order: any) => ({
                id: order.id as any,
                number: String(order.order_number || ''),
                status: order.status as any,
                currency: order.currency || 'KES',
                date_created: order.created_at,
                date_modified: order.updated_at,
                total: order.total_amount,
                subtotal: order.total_amount,
                discount_total: '0',
                shipping_total: '0',
                total_tax: '0',
                customer_id: typeof order.customer_id === 'number' ? order.customer_id : 1,
                customer_note: order.notes || '',
                billing: {
                    first_name: order.billing_address?.first_name || '',
                    last_name: order.billing_address?.last_name || '',
                    company: '',
                    address_1: order.billing_address?.address_line1 || '',
                    address_2: order.billing_address?.address_line2 || '',
                    city: order.billing_address?.city || '',
                    state: order.billing_address?.state || '',
                    postcode: order.billing_address?.postal_code || order.billing_address?.postcode || '',
                    country: order.billing_address?.country || '',
                    email: order.billing_address?.email || '',
                    phone: order.billing_address?.phone || '',
                },
                shipping: {
                    first_name: order.shipping_address?.first_name || '',
                    last_name: order.shipping_address?.last_name || '',
                    company: '',
                    address_1: order.shipping_address?.address_line1 || '',
                    address_2: order.shipping_address?.address_line2 || '',
                    city: order.shipping_address?.city || '',
                    state: order.shipping_address?.state || '',
                    postcode: order.shipping_address?.postal_code || order.shipping_address?.postcode || '',
                    country: order.shipping_address?.country || '',
                    email: order.shipping_address?.email || '',
                    phone: order.shipping_address?.phone || '',
                },
                payment_method: 'mpesa',
                payment_method_title: 'M-PESA',
                line_items: (order.items || []).map((item: any) => ({
                    id: item.id,
                    name: item.product_name,
                    product_id: item.product_id,
                    variation_id: 0,
                    quantity: item.quantity,
                    price: parseFloat(item.unit_price) || 0,
                    total: item.total_price,
                    subtotal: item.total_price,
                    subtotal_tax: '0',
                    total_tax: '0',
                    sku: item.product?.sku || '',
                })),
                shipping_lines: [],
                meta_data: [],
            }));

            if (status && status !== 'all' && status.trim() !== '') {
                return mappedOrders.filter((o: Order) => o.status === status);
            }
            return mappedOrders;
        },
        enabled: !!email,
    });
}

/**
 * Hook to calculate order statistics (Real API)
 */
export function useOrderStats() {
    const user = useAuthStore((state) => state.user);
    const email = user?.email;

    return useQuery({
        queryKey: ['customer-order-stats', email],
        queryFn: async () => {
            if (!email) return { totalOrders: 0, totalSpent: 0, completedOrders: 0, processingOrders: 0 };

            const response = await orderService.getOrders({ page: 1, limit: 100 });
            const orders = response.items || [];
            const totalOrders = response.total || orders.length;
            const totalSpent = orders
                .filter((o: any) => o.status === 'completed' || o.status === 'delivered')
                .reduce((sum: number, order: any) => sum + parseFloat(order.total_amount), 0);

            return {
                totalOrders,
                totalSpent,
                completedOrders: orders.filter((o: any) => o.status === 'completed' || o.status === 'delivered').length,
                processingOrders: orders.filter((o: any) => o.status === 'processing').length,
            };
        },
        enabled: !!email,
    });
}

/**
 * Hook to get dashboard statistics
 */
export function useDashboardStats(): {
    data: DashboardStats | undefined;
    isLoading: boolean;
    error: Error | null;
} {
    const user = useAuthStore((state) => state.user);
    const wishlistItems = useWishlistStore((state) => state.items);
    const { addresses } = useAddressStore();
    const { data: orderStats, isLoading: statsLoading, error: statsError } = useOrderStats();

    const data = useMemo(() => {
        if (!user || !orderStats) {
            return undefined;
        }

        const stats: DashboardStats = {
            totalOrders: orderStats.totalOrders,
            totalSpent: orderStats.totalSpent,
            wishlistCount: wishlistItems.length,
            savedAddresses: addresses.length,
            memberSince: '2024',
        };

        return stats;
    }, [user, wishlistItems.length, addresses.length, orderStats]);

    return {
        data,
        isLoading: statsLoading,
        error: statsError as Error | null,
    };
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
