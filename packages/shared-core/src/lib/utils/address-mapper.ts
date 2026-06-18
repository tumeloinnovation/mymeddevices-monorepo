/**
 * Address Mapper Utility
 * Centralized field mapping between local address format and WooCommerce format
 */

import type { Address } from '@/lib/store/useAddressStore';
import type { ShippingAddress, BillingAddress } from '@/lib/data/types';

/**
 * Convert local Address format to WooCommerce shipping address format
 */
export function toWooCommerceShipping(local: Address): Partial<ShippingAddress> {
  return cleanObject({
    first_name: local.firstName || '',
    last_name: local.lastName || '',
    company: '',
    address_1: local.address || '',
    address_2: local.address_2 || '',
    city: local.city || '',
    state: local.region || local.state || '',
    postcode: local.postcode || '',
    country: local.country || 'KE',
  });
}

/**
 * Convert local Address format to WooCommerce billing address format
 */
export function toWooCommerceBilling(local: Address): Partial<BillingAddress> {
  return cleanObject({
    first_name: local.firstName || '',
    last_name: local.lastName || '',
    company: '',
    address_1: local.address || '',
    address_2: local.address_2 || '',
    city: local.city || '',
    state: local.region || local.state || '',
    postcode: local.postcode || '',
    country: local.country || 'KE',
    email: local.email || '',
    phone: local.phone || '',
  });
}

/**
 * Convert WooCommerce shipping address to local Address format
 */
export function fromWooCommerceShipping(
  woo: Partial<ShippingAddress>,
  existingId?: string
): Omit<Address, 'id'> & { id?: string } {
  return {
    ...(existingId && { id: existingId }),
    address: woo.address_1 || '',
    address_2: woo.address_2 || '',
    city: woo.city || '',
    region: woo.state || '',
    state: woo.state || '',
    postcode: woo.postcode || '',
    country: woo.country || 'KE',
    firstName: woo.first_name || '',
    lastName: woo.last_name || '',
    isDefault: true, // WooCommerce shipping is always the default
    tag: 'home', // Default tag for WooCommerce addresses
  };
}

/**
 * Convert WooCommerce billing address to local Address format
 */
export function fromWooCommerceBilling(
  woo: Partial<BillingAddress>,
  existingId?: string
): Omit<Address, 'id'> & { id?: string } {
  return {
    ...(existingId && { id: existingId }),
    address: woo.address_1 || '',
    address_2: woo.address_2 || '',
    city: woo.city || '',
    region: woo.state || '',
    state: woo.state || '',
    postcode: woo.postcode || '',
    country: woo.country || 'KE',
    firstName: woo.first_name || '',
    lastName: woo.last_name || '',
    email: woo.email || '',
    phone: woo.phone || '',
    isDefault: false,
    tag: 'home',
  };
}

/**
 * Serialize addresses array for WooCommerce meta_data storage
 */
export function serializeAddressesForMeta(addresses: Address[]): string {
  return JSON.stringify(addresses);
}

/**
 * Deserialize addresses from WooCommerce meta_data
 */
export function deserializeAddressesFromMeta(metaValue: string | undefined): Address[] {
  if (!metaValue) return [];
  
  try {
    const parsed = JSON.parse(metaValue);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Normalize address string for comparison (duplicate detection)
 */
export function normalizeAddressString(address: string): string {
  return address
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[,.\-]/g, '');
}

/**
 * Check if two addresses are duplicates based on normalized string comparison
 */
export function areAddressesDuplicates(addr1: Partial<Address>, addr2: Partial<Address>): boolean {
  const normalized1 = normalizeAddressString(addr1.address || '');
  const normalized2 = normalizeAddressString(addr2.address || '');
  
  if (!normalized1 || !normalized2) return false;
  
  // Check primary address match
  if (normalized1 !== normalized2) return false;
  
  // Also check city if available
  if (addr1.city && addr2.city) {
    const city1 = normalizeAddressString(addr1.city);
    const city2 = normalizeAddressString(addr2.city);
    if (city1 !== city2) return false;
  }
  
  return true;
}

/**
 * Generate a unique address ID using crypto.randomUUID
 */
export function generateAddressId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Remove empty string values from object
 */
function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== '' && value !== undefined && value !== null) {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial<T>);
}

/**
 * Meta data key for storing additional addresses in WooCommerce
 */
export const ADDRESSES_META_KEY = '_mymed_saved_addresses';

/**
 * Meta data key for storing custom tags in WooCommerce
 */
export const CUSTOM_TAGS_META_KEY = '_mymed_custom_address_tags';
