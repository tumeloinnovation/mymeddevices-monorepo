import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Award, Zap } from 'lucide-react';

export type ProductBadgeType = 'rating' | 'discount' | 'new' | 'prescribed' | 'trending' | 'bestseller';

interface ProductBadgeProps {
  type: ProductBadgeType;
  value?: string | number;
  className?: string;
}

const BADGE_CONFIG: Record<ProductBadgeType, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon?: React.ReactNode }> = {
  rating: { variant: 'default', icon: <Star className="w-3 h-3 fill-current" /> },
  discount: { variant: 'destructive', icon: <Zap className="w-3 h-3" /> },
  new: { variant: 'default', icon: null },
  prescribed: { variant: 'secondary', icon: <Award className="w-3 h-3" /> },
  trending: { variant: 'default', icon: <TrendingUp className="w-3 h-3" /> },
  bestseller: { variant: 'secondary', icon: <Award className="w-3 h-3" /> },
};

export const ProductBadge: React.FC<ProductBadgeProps> = ({ type, value, className = '' }) => {
  const config = BADGE_CONFIG[type];

  const getBadgeText = (): string => {
    switch (type) {
      case 'rating':
        return typeof value === 'number' ? `${value.toFixed(1)} ⭐` : `${value || '4.5'} ⭐`;
      case 'discount':
        return typeof value === 'number' ? `${value}% OFF` : `${value || 'SALE'}`;
      case 'new':
        return value?.toString() || 'NEW';
      case 'prescribed':
        return 'MOST PRESCRIBED';
      case 'trending':
        return 'TRENDING';
      case 'bestseller':
        return 'BESTSELLER';
      default:
        return '';
    }
  };

  return (
    <Badge
      variant={config.variant}
      className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-sm ${className}`}
    >
      {config.icon && <span className="mr-1">{config.icon}</span>}
      {getBadgeText()}
    </Badge>
  );
};

// Helper function to determine badge type based on product data
interface ProductBadgeData {
  on_sale?: boolean;
  featured?: boolean;
  average_rating?: string | number;
  date_created?: string;
  total_sales?: number;
}

export const getProductBadges = (product: ProductBadgeData): Array<{ type: ProductBadgeType; value?: string | number }> => {
  const badges: Array<{ type: ProductBadgeType; value?: string | number }> = [];

  // Sale badge
  if (product.on_sale) {
    badges.push({ type: 'discount', value: 'SALE' });
  }

  // Featured badge
  if (product.featured) {
    badges.push({ type: 'prescribed' });
  }

  // Rating badge (4.5+)
  const rating = typeof product.average_rating === 'string'
    ? parseFloat(product.average_rating)
    : product.average_rating;

  if (rating && rating >= 4.5) {
    badges.push({ type: 'rating', value: rating });
  }

  // New badge (less than 30 days)
  if (product.date_created) {
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(product.date_created).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceCreated < 30) {
      badges.push({ type: 'new', value: daysSinceCreated < 7 ? 'JUST ARRIVED' : 'NEW' });
    }
  }

  // Bestseller badge (high sales)
  if (product.total_sales && product.total_sales > 50) {
    badges.push({ type: 'bestseller' });
  }

  return badges;
};

export default ProductBadge;
