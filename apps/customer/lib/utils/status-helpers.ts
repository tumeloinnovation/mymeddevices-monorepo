/**
 * Status normalization utilities for handling legacy status values.
 *
 * This file provides helper functions to handle legacy status values
 * that may still exist in the database or API responses, mapping them
 * to the canonical status values used in the current system.
 */

import type { OrderStatus, OrderItemStatus } from '@shared-core/src/lib/data/types';

/**
 * Map legacy order statuses to canonical ones.
 *
 * Handles historical statuses like 'on-hold', 'completed', 'failed', 'out_for_delivery'
 * that may still exist in some parts of the system.
 */
const LEGACY_ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  'on-hold': 'pending',
  'completed': 'delivered',
  'failed': 'cancelled',
  'out_for_delivery': 'shipped',
  'on_hold': 'pending',
  'out-for-delivery': 'shipped',
};

/**
 * Canonical order statuses (same list as in types.ts)
 */
const CANONICAL_ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

/**
 * Canonical order item statuses
 */
const CANONICAL_ORDER_ITEM_STATUSES: OrderItemStatus[] = [
  'pending',
  'processing',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

/**
 * Normalize an order status string to a canonical OrderStatus.
 *
 * If the status is already canonical, it's returned as-is.
 * If it's a legacy status, it's mapped to the canonical equivalent.
 * If it's unknown, defaults to 'pending'.
 *
 * @param status - The status string to normalize
 * @returns A canonical OrderStatus value
 */
export function normalizeOrderStatus(status: string): OrderStatus {
  if (CANONICAL_ORDER_STATUSES.includes(status as OrderStatus)) {
    return status as OrderStatus;
  }

  // Handle legacy statuses
  const normalized = LEGACY_ORDER_STATUS_MAP[status];
  if (normalized) {
    return normalized;
  }

  // Default to pending for unknown statuses
  return 'pending';
}

/**
 * Normalize an order item status string to a canonical OrderItemStatus.
 *
 * @param status - The status string to normalize
 * @returns A canonical OrderItemStatus value
 */
export function normalizeOrderItemStatus(status: string): OrderItemStatus {
  if (CANONICAL_ORDER_ITEM_STATUSES.includes(status as OrderItemStatus)) {
    return status as OrderItemStatus;
  }

  // Default to pending for unknown statuses
  return 'pending';
}

/**
 * Get the display label for an order status.
 *
 * @param status - The order status
 * @returns Human-readable label
 */
export function getOrderStatusLabel(status: OrderStatus | string): string {
  const normalized = normalizeOrderStatus(status);
  const labels: Record<OrderStatus, string> = {
    pending: 'Pending',
    paid: 'Paid',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return labels[normalized] || 'Unknown';
}

/**
 * Get the display label for an order item status.
 *
 * @param status - The order item status
 * @returns Human-readable label
 */
export function getOrderItemStatusLabel(status: OrderItemStatus | string): string {
  const normalized = normalizeOrderItemStatus(status);
  const labels: Record<OrderItemStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    packed: 'Packed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  };
  return labels[normalized] || 'Unknown';
}

/**
 * Check if an order status is a "active" state (in fulfillment).
 *
 * @param status - The order status
 * @returns True if the order is in an active fulfillment state
 */
export function isActiveOrderStatus(status: OrderStatus | string): boolean {
  const normalized = normalizeOrderStatus(status);
  return ['paid', 'processing', 'shipped'].includes(normalized);
}

/**
 * Check if an order status is a "terminal" state (completed, cancelled, refunded).
 *
 * @param status - The order status
 * @returns True if the order is in a terminal state
 */
export function isTerminalOrderStatus(status: OrderStatus | string): boolean {
  const normalized = normalizeOrderStatus(status);
  return ['delivered', 'cancelled', 'refunded'].includes(normalized);
}
