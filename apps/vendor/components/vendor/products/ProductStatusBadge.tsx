import { Badge } from '@/components/ui/badge';
import { ProductStatus } from '@/lib/data/types';
import { getProductStatusLabel, getProductStatusColor } from '@/lib/utils/products';

interface ProductStatusBadgeProps {
    status: ProductStatus;
    className?: string;
}

export function ProductStatusBadge({ status, className }: ProductStatusBadgeProps) {
    const label = getProductStatusLabel(status);
    const variant = getProductStatusColor(status) as 'default' | 'secondary' | 'destructive' | 'outline';

    return (
        <Badge variant={variant} className={className}>
            {label}
        </Badge>
    );
}
