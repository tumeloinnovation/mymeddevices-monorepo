import { z } from 'zod';
import { KRA_VAT_RATES } from '@/lib/data/types';

// Draft-first schema: minimal validation for draft/pending status
export const draftProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  type: z.enum(['simple', 'variable', 'grouped', 'external']),
  status: z.enum(['publish', 'draft', 'pending', 'private']).optional(),
  featured: z.boolean(),
  description: z.string().optional(),
  short_description: z.string().optional(),
  cost_price: z.string().min(1, 'Cost price is required'),
  sale_price: z.string().optional(),
  sku: z.string().optional(),
  manage_stock: z.boolean(),
  stock_quantity: z.number().nullable().optional(),
  stock_status: z.enum(['instock', 'outofstock', 'onbackorder']),
  weight: z.string().optional(),
  dimensions: z.object({
    length: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
  }).optional(),
  categories: z.array(z.object({ id: z.number() })),
  images: z.array(z.object({
    id: z.number().optional(),
    src: z.string(),
    name: z.string().optional(),
    alt: z.string().optional(),
    position: z.number().optional(),
  })),
  virtual: z.boolean(),
  downloadable: z.boolean(),
  tax_status: z.enum(['taxable', 'shipping', 'none']),
  tax_rate: z.number().min(0).max(100).optional(), // VAT percentage (0-100)
  reviews_allowed: z.boolean(),
  external_url: z.string().optional(),
});

// Publish schema: enforces all required fields for published products
export const publishProductSchema = draftProductSchema.extend({
  cost_price: z.string().min(1, 'Cost price is required for published products'),
  // For variable products, at least one attribute with variation enabled should exist
  // For grouped products, at least one grouped product should be selected
  // This is checked at form submission level for conditional validation
});

// Main schema: uses draft validation by default, but can extend to publish
export const createProductSchema = draftProductSchema;

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type PublishProductInput = z.infer<typeof publishProductSchema>;

/**
 * Validate product for publish status
 * Enforces stricter rules when changing status to 'publish'
 */
export function validateForPublish(data: CreateProductInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields for publish
  if (!data.cost_price || data.cost_price.trim() === '') {
    errors.push('Cost price is required for published products');
  }

  // Type-specific validation
  if (data.type === 'variable') {
    // Variable products should have attributes (checked at form level)
    // This is a soft check - allow publish with message to add variations
  }

  if (data.type === 'grouped') {
    // Grouped products should have grouped_products (checked at form level)
  }

  if (data.type === 'external') {
    if (!data.external_url) {
      errors.push('External URL is required for external products');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
