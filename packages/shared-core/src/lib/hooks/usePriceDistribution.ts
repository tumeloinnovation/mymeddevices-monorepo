'use client'

import { useMemo } from 'react';
import { useProducts } from '@/lib/hooks/useProducts';

interface PriceDistributionData {
  price: number;
  count: number;
}

export const usePriceDistribution = (binSize: number = 250) => {
  const products = useProducts({
    per_page: 100, // Fetch up to 100 products for distribution
    status: 'publish', // Only published products
  });
  const productItems = products.products;

  const distribution = useMemo<PriceDistributionData[]>(() => {
    if (!productItems.length) {
      return [];
    }

    // Create a map to count products in each price bin
    const priceMap = new Map<number, number>();

    productItems.forEach((product) => {
      // Try to get the price, fallback to regular_price, then sale_price
      const priceStr = (product as any).price || (product as any).regular_price || (product as any).sale_price || '0';
      const price = parseFloat(priceStr);

      if (!isNaN(price) && price > 0) {
        // Round down to the nearest bin
        const bin = Math.floor(price / binSize) * binSize;
        priceMap.set(bin, (priceMap.get(bin) || 0) + 1);
      }
    });

    // Convert map to array and sort by price
    return Array.from(priceMap.entries())
      .map(([price, count]) => ({ price, count }))
      .sort((a, b) => a.price - b.price);
  }, [productItems, binSize]);

  return {
    data: distribution,
    isLoading: false,
    error: null
  };
};
