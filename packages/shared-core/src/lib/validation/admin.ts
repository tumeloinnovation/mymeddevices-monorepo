import { z } from 'zod';
import { emailSchema, passwordSchema, phoneSchema } from './auth';

const nameSchema = z.string().min(1).max(100);

export const adminUserInviteSchema = z.object({
  email: emailSchema,
  first_name: nameSchema,
  last_name: z.string().max(100).optional().default(''),
  role: z.enum(['admin', 'worker']),
});

export const adminUserUpdateSchema = z.object({
  first_name: nameSchema.optional(),
  last_name: z.string().max(100).optional(),
  is_active: z.boolean().optional(),
});

export const adminCustomerCreateSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  first_name: nameSchema,
  last_name: z.string().max(100),
  loyalty_points: z.number().int().min(0).optional().default(0),
  notes: z.string().max(1000).optional(),
});

export const adminCustomerUpdateSchema = z.object({
  email: emailSchema.optional(),
  first_name: nameSchema.optional(),
  last_name: z.string().max(100).optional(),
  phone: phoneSchema.optional(),
  is_active: z.boolean().optional(),
  is_locked: z.boolean().optional(),
  lock_reason: z.string().max(255).optional(),
  loyalty_points: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

export const adminCustomerListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  sort_by: z.enum([
    'created_at', 'updated_at', 'customer_code',
    'loyalty_points', 'total_orders', 'total_spent', 'last_order_date',
  ]).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
  is_active: z.string().optional(),
});

export const adminVendorCreateSchema = z.object({
  company_name: z.string().min(1).max(255),
  company_email: emailSchema,
  company_phone: phoneSchema,
  contact_name: nameSchema,
  contact_email: emailSchema,
  contact_phone: phoneSchema.optional(),
  business_type: z.string().max(100).optional(),
  tax_id: z.string().max(50).optional(),
  registration_number: z.string().max(100).optional(),
  website_url: z.string().url().max(500).optional().or(z.literal('')),
  address_line1: z.string().min(1).max(255),
  address_line2: z.string().max(255).optional(),
  city: z.string().min(1).max(100),
  state: z.string().max(100).optional(),
  postal_code: z.string().min(1).max(20),
  country_code: z.string().length(2),
  notes: z.string().max(1000).optional(),
});

export const adminVendorActionSchema = z.object({
  reason: z.string().min(1).max(500),
});

export const adminUserListParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  role: z.enum(['admin', 'worker']).optional(),
  is_active: z.string().optional(),
});

export type AdminUserInviteInput = z.infer<typeof adminUserInviteSchema>;
export type AdminUserUpdateInput = z.infer<typeof adminUserUpdateSchema>;
export type AdminCustomerCreateInput = z.infer<typeof adminCustomerCreateSchema>;
export type AdminCustomerUpdateInput = z.infer<typeof adminCustomerUpdateSchema>;
export type AdminCustomerListParamsInput = z.infer<typeof adminCustomerListParamsSchema>;
export type AdminVendorCreateInput = z.infer<typeof adminVendorCreateSchema>;
export type AdminVendorActionInput = z.infer<typeof adminVendorActionSchema>;
export type AdminUserListParamsInput = z.infer<typeof adminUserListParamsSchema>;
