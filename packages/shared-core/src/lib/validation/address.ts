import { z } from 'zod';
import { phoneSchema } from './auth';

const nameField = z.string().min(1).max(100);
const lineField = z.string().min(1).max(255);
const optionalLineField = z.string().max(255).optional();
const cityField = z.string().min(1).max(100);
const stateField = z.string().max(100).optional();
const postalCodeField = z.string().min(1).max(20);
const countryCodeField = z.string().length(2, 'Country code must be exactly 2 characters');

export const addressSchema = z.object({
  first_name: nameField,
  last_name: nameField,
  phone: phoneSchema,
  address_line1: lineField,
  address_line2: optionalLineField,
  city: cityField,
  state: stateField,
  postal_code: postalCodeField,
  country_code: countryCodeField,
  delivery_instructions: z.string().max(500).optional(),
  is_default: z.boolean().optional(),
  label: z.string().max(50).optional(),
});

export const addressUpdateSchema = addressSchema.partial();

export type AddressInput = z.infer<typeof addressSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;
