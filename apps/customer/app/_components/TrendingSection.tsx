'use client';

import { useQuery } from '@tanstack/react-query';
import ProductSection from '@/components/common/ProductSection';
import { customerRecommendationsApi } from '@/lib/api/endpoints/recommendations';
import { useFeaturedProducts } from '@/lib/hooks/useProducts';

export default function TrendingSection() {
  const { data: apiProducts, isLoading: apiLoading } = useQuery({
    queryKey: ['recommendations', 'trending'],
    queryFn: () => customerRecommendationsApi.getTrending({ limit: 10 }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: featuredProducts = [], isLoading: featuredLoading } = useFeaturedProducts(10);

  const isLoading = apiLoading || featuredLoading;
  const items = apiProducts && apiProducts.length > 0 ? apiProducts : featuredProducts;

  return (
    <section className="py-12">
      <ProductSection
        title="Trending Now"
        description="Discover what other healthcare professionals are buying right now."
        items={items as any}
        loading={isLoading}
      />
    </section>
  );
}
