import { z } from 'zod';

/**
 * Profile form validation schema
 * - First/Last Name: required, 2-50 chars, alphabetic with spaces
 * - Display Name: optional, 3-30 chars
 * - Phone: required, validated Kenyan format (+254...)
 */
export const profileSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
  displayName: z
    .string()
    .min(3, 'Display name must be at least 3 characters')
    .max(30, 'Display name must not exceed 30 characters')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\+254\d{9}$/, 'Phone number must be a valid Kenyan number in format +254XXXXXXXXX')
    .or(
      z.string().regex(/^0\d{9}$/, 'Phone number must start with 0 followed by 9 digits')
    )
    .transform((val) => {
      // Normalize to +254 format
      if (val.startsWith('0')) {
        return '+254' + val.substring(1);
      }
      return val;
    }),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Extended profile data including optional fields like avatar and addresses
 */
export interface ProfileCompletenessData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  avatar_url?: string | null;
  hasAddress?: boolean;
}

/**
 * Calculate profile completeness percentage
 * Includes: name fields, display name, phone, avatar, and having at least one address
 */
export function calculateProfileCompleteness(data: Partial<ProfileCompletenessData>): number {
  const requiredFields = ['firstName', 'lastName', 'phone'];
  const optionalFields = ['displayName', 'avatar_url', 'hasAddress'];

  const filledRequired = requiredFields.filter(field => {
    const value = data[field as keyof ProfileCompletenessData];
    return value && typeof value === 'string' && value.trim().length > 0;
  });

  const filledOptional = optionalFields.filter(field => {
    const value = data[field as keyof ProfileCompletenessData];
    if (field === 'avatar_url') return !!value;
    if (field === 'hasAddress') return value === true;
    return value && typeof value === 'string' && value.trim().length > 0;
  });

  // Weight: required fields are worth more
  const requiredScore = (filledRequired.length / requiredFields.length) * 60; // 60% from required
  const optionalScore = (filledOptional.length / optionalFields.length) * 40; // 40% from optional

  return Math.round(requiredScore + optionalScore);
}

/**
 * Get missing profile fields for display
 */
export function getMissingFields(data: Partial<ProfileCompletenessData>): string[] {
  const fieldLabels: Record<string, string> = {
    firstName: 'first name',
    lastName: 'last name',
    displayName: 'display name',
    phone: 'phone number',
    avatar_url: 'avatar photo',
    hasAddress: 'shipping address',
  };

  const missing: string[] = [];
  if (!data.firstName?.trim()) missing.push(fieldLabels.firstName);
  if (!data.lastName?.trim()) missing.push(fieldLabels.lastName);
  if (!data.displayName?.trim()) missing.push(fieldLabels.displayName);
  if (!data.phone?.trim()) missing.push(fieldLabels.phone);
  if (!data.avatar_url) missing.push(fieldLabels.avatar_url);
  if (!data.hasAddress) missing.push(fieldLabels.hasAddress);

  return missing;
}
