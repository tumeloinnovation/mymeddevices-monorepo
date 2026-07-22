'use client';

import { useProducts } from '@/lib/hooks/useProducts';
import ProductSection from './ProductSection';

interface FeaturedNewArrivalsSectionProps {
  type: 'featured' | 'new-arrivals';
  title?: string;
  description?: string;
}

export default function FeaturedNewArrivalsSection({
  type,
  title,
  description
}: FeaturedNewArrivalsSectionProps) {
  const products = useProducts({
    featured: type === 'featured',
    orderby: type === 'new-arrivals' ? 'date' : undefined,
    per_page: 10
  });

  const defaultTitle = type === 'featured' ? 'Featured Products' : 'New Arrivals';
  const defaultDescription = type === 'featured'
    ? 'Hand-picked medical devices and equipment curated for quality and reliability.'
    : 'Discover the latest medical devices and equipment.';

  return (
    <ProductSection
    items={products.products}
      title={title || defaultTitle}
      description={description || defaultDescription}
      loading={false}
    />
  );
}
