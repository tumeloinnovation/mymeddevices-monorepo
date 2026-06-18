import { Badge } from '@/components/ui/badge';
import { StockStatus, getStockStatusLabel, getStockStatusColor } from '@/lib/utils/products';

interface StockStatusBadgeProps {
    status?: StockStatus | string;
    quantity?: number | null;
    className?: string;
}

export function StockStatusBadge({ status = 'instock', quantity, className }: StockStatusBadgeProps) {
    const validStatus = (status as StockStatus) || 'instock';
    const label = getStockStatusLabel(validStatus as StockStatus);
    const variant = getStockStatusColor(validStatus as StockStatus) as 'default' | 'secondary' | 'destructive' | 'outline';

    // Display quantity if available
    const displayText = quantity !== null && quantity !== undefined && quantity >= 0
        ? `${label} (${quantity})`
        : label;

    return (
        <Badge variant={variant} className={className}>
            {displayText}
        </Badge>
    );
}
