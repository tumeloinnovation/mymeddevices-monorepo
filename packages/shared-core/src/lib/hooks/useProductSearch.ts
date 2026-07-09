'use client'

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product-service';
import { Product } from '../data/types';

export const useProductSearch = (searchQuery: string) => {
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['product-search', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.length < 2) return [];
      try {
        const response = await productService.getProducts({ q: debouncedQuery, limit: 10 });
        return response.items || [];
      } catch (error) {
        console.error('Failed to search products:', error);
        return [];
      }
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 60 * 1000, // Cache search results for 1 minute
  });

  return {
    data: products,
    isLoading,
    debouncedQuery,
    isSearching: searchQuery !== debouncedQuery,
  };
};
