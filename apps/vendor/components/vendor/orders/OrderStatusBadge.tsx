import { Badge } from '@/components/ui/badge';
import type { OrderStatus } from '@/lib/api/types';

interface OrderStatusBadgeProps {
    status: OrderStatus;
}

const statusConfig: Record<OrderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: {
        label: 'Pending',
        variant: 'outline',
    },
    paid: {
        label: 'Paid',
        variant: 'secondary',
    },
    processing: {
        label: 'Processing',
        variant: 'default',
    },
    packed: {
        label: 'Packed',
        variant: 'default',
    },
    shipped: {
        label: 'Shipped',
        variant: 'default',
    },
    delivered: {
        label: 'Delivered',
        variant: 'default',
    },
    cancelled: {
        label: 'Cancelled',
        variant: 'secondary',
    },
    refunded: {
        label: 'Refunded',
        variant: 'outline',
    },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
    const config = statusConfig[status] || statusConfig.pending;

    return (
        <Badge
            variant={config.variant}
            className={`
                ${status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' : ''}
                ${status === 'processing' ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' : ''}
                ${status === 'packed' ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' : ''}
                ${status === 'shipped' ? 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' : ''}
                ${status === 'delivered' ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : ''}
                ${status === 'cancelled' ? 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800' : ''}
                ${status === 'refunded' ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800' : ''}
            `}
        >
            {config.label}
        </Badge>
    );
}

