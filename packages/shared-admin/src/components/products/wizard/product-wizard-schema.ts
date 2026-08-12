import * as z from "zod";

export const productWizardSchema = z.object({
  vendor_id: z.string().min(1, "Vendor selection is required"),
  name: z.string().min(3, "Product name must be at least 3 characters").max(200, "Name cannot exceed 200 characters"),
  slug: z.string().min(3, "URL slug is too short").max(100, "Slug cannot exceed 100 characters"),
  category_id: z.string().min(1, "Medical category is required"),
  category_name: z.string().optional(),
  brand: z.string().optional(),
  brand_name: z.string().optional(),
  model_number: z.string().optional(),
  product_type: z.string().optional(),
  internal_reference: z.string().optional(),

  base_price: z.coerce
    .number()
    .min(1, "Vendor payout base price must be at least KES 1")
    .max(100000000, "Exceeds maximum allowable price"),
  cost_price: z.coerce.number().optional(),
  wholesale_price: z.coerce.number().optional(),
  compare_at_price: z.coerce.number().optional(),
  has_vat: z.boolean().default(true),
  vat_rate: z.coerce.number().default(16),
  sale_active: z.boolean().default(false),
  sale_end_date: z.string().optional(),

  sku: z.string().min(3, "SKU identifier is required"),
  stock_quantity: z.coerce.number().min(0, "Stock quantity cannot be negative"),
  low_stock_threshold: z.coerce.number().min(0, "Low stock threshold cannot be negative").default(5),
  stock_status: z.string().default("instock"),
  track_inventory: z.boolean().default(true),
  weight_kg: z.coerce.number().optional(),
  length_cm: z.coerce.number().optional(),
  width_cm: z.coerce.number().optional(),
  height_cm: z.coerce.number().optional(),

  description: z.string().max(2000, "Description cannot exceed 2000 characters").optional(),
  short_description: z.string().max(200, "Short overview cannot exceed 200 characters").optional(),
  specifications: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()).default([]),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
});

export type ProductWizardFormData = z.infer<typeof productWizardSchema>;
