'use client'

import { useState, useEffect, useMemo } from 'react';
import { SEED_PRODUCTS } from '@/lib/data/seed/products';
import { Product } from '@/lib/data/types';

export const useProductSearch = (searchQuery: string) => {
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const products = useMemo(() => {
    if (debouncedQuery.length < 2) return [];
    
    const query = debouncedQuery.toLowerCase();
    return SEED_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      p.short_description.toLowerCase().includes(query) ||
      p.categories.some(c => c.name.toLowerCase().includes(query))
    ).slice(0, 10);
  }, [debouncedQuery]);

  return {
    data: products,
    isLoading: false,
    debouncedQuery,
    isSearching: searchQuery !== debouncedQuery,
  };
};
