/**
 * Vendor Permission System
 */

export const VENDOR_PERMISSIONS = {
  // Products
  CREATE_PRODUCT: "vendor:product:create",
  EDIT_PRODUCT: "vendor:product:edit",
  DELETE_PRODUCT: "vendor:product:delete",
  VIEW_PRODUCTS: "vendor:product:view",

  // Orders
  VIEW_ORDERS: "vendor:order:view",
  UPDATE_ORDER_STATUS: "vendor:order:update",
  PROCESS_REFUNDS: "vendor:order:refund",

  // Inventory
  MANAGE_STOCK: "vendor:inventory:manage",
  VIEW_STOCK_MOVEMENTS: "vendor:inventory:view",

  // Finance
  VIEW_EARNINGS: "vendor:finance:view",
  REQUEST_PAYOUT: "vendor:finance:payout",
  VIEW_PAYOUTS: "vendor:finance:payouts:view",

  // Profile
  EDIT_STORE_PROFILE: "vendor:profile:edit",
  MANAGE_NOTIFICATIONS: "vendor:profile:notifications",
} as const;

export type VendorPermission = typeof VENDOR_PERMISSIONS[keyof typeof VENDOR_PERMISSIONS];

import { VendorUser } from './session';

/**
 * Check if a vendor has a specific permission
 */
export function hasPermission(
  vendor: VendorUser | null,
  permission: VendorPermission
): boolean {
  if (!vendor) return false;
  // If no permissions array, assume they have no permissions
  if (!vendor.permissions) return false;
  return vendor.permissions.includes(permission);
}

/**
 * Utility for components to check permissions
 */
export function requirePermission(
  permission: VendorPermission
): (vendor: VendorUser | null) => boolean {
  return (vendor) => hasPermission(vendor, permission);
}
