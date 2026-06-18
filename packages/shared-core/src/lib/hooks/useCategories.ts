'use client'

import { useQuery } from '@tanstack/react-query';
import { categoryService, type Category, type CategoryWithProducts } from '../services/category-service';

// ─────────────────────────────────────────────
// Category list
// ─────────────────────────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getCategories(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// ─────────────────────────────────────────────
// Category tree (nested structure)
// ─────────────────────────────────────────────
export function useCategoryTree() {
  return useQuery({
    queryKey: ['categories', 'tree'],
    queryFn: () => categoryService.getCategoryTree(),
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// ─────────────────────────────────────────────
// Single category lookup
// ─────────────────────────────────────────────
export function useCategoryBySlug(slug: string) {
  return useQuery({
    queryKey: ['category', 'slug', slug],
    queryFn: () => categoryService.getCategory(slug),
    enabled: !!slug,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// ─────────────────────────────────────────────
// Root categories (no parent)
// ─────────────────────────────────────────────
export function useRootCategories() {
  // For now, return all categories as root
  // Can be enhanced when parent-child relationships are added
  return useQuery({
    queryKey: ['categories', 'root'],
    queryFn: async () => {
      const categories = await categoryService.getCategories();
      return categories.filter((c) => !c.parent || c.parent === 0 || c.parent === '0');
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

// ─────────────────────────────────────────────
// Category products
// ─────────────────────────────────────────────
export function useCategoryProducts(slug: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['category', 'slug', slug, 'products', page, limit],
    queryFn: () => categoryService.getCategoryProducts(slug, { page, limit }),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ─────────────────────────────────────────────
// Subcategories
// ─────────────────────────────────────────────
export function useSubcategories(parentSlug: string) {
  return useQuery({
    queryKey: ['category', 'slug', parentSlug, 'subcategories'],
    queryFn: () => categoryService.getSubcategories(parentSlug),
    enabled: !!parentSlug,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}
