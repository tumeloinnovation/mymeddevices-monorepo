import { z } from 'zod';

export const skuSchema = z.string().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/, 'SKU must be alphanumeric with hyphens and underscores only');

export const slugSchema = z.string().min(1).max(255);

const nonNegativeNumber = z.number().min(0);
const positiveNumber = z.number().positive();

export const productCreateSchema = z.object({
  sku: skuSchema,
  slug: slugSchema,
  name: z.string().min(1).max(255),
  short_description: z.string().max(500).optional(),
  description: z.string().optional(),
  global_unique_id: z.string().max(50).optional(),
  brand_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  weight: nonNegativeNumber.optional(),
  length: nonNegativeNumber.optional(),
  width: nonNegativeNumber.optional(),
  height: nonNegativeNumber.optional(),
  box_type: z.string().max(50).optional(),
  price: positiveNumber,
  cost_price: nonNegativeNumber.optional(),
  tax_class: z.string().max(50).optional(),
  stock_quantity: nonNegativeNumber.int().default(0),
  is_active: z.boolean().optional().default(true),
  requires_prescription: z.boolean().optional().default(false),
  is_featured: z.boolean().optional().default(false),
});

export const productUpdateSchema = productCreateSchema.partial();

// Helper to validate URLs or base64 data URIs
const urlOrDataUri = z.string().max(200000).optional().or(z.literal('')).refine(
  (val) => {
    if (!val || val === '') return true;
    // Check if it's a valid base64 data URI
    if (val.startsWith('data:image/')) {
      return /^data:image\/(png|jpeg|jpg|gif|webp);base64,[a-zA-Z0-9+/=]+$/.test(val);
    }
    // Check if it's a valid URL
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  },
  { message: "Must be a valid URL or base64 image data URI" }
);

export const brandSchema = z.object({
  name: z.string().min(1).max(255),
  slug: slugSchema.optional(),
  description: z.string().max(1000).optional(),
  logo_url: urlOrDataUri,
  website_url: z.string().url().max(500).optional().or(z.literal('')),
  is_active: z.boolean().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(255),
  slug: slugSchema.optional(),
  description: z.string().max(1000).optional(),
  parent_id: z.string().uuid().optional().nullable(),
  image_url: z.string().url().max(500).optional().or(z.literal('')),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

export const tagSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  color: z.string().max(20).optional(),
  icon: z.string().max(50).optional(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type BrandInput = z.infer<typeof brandSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type TagInput = z.infer<typeof tagSchema>;
