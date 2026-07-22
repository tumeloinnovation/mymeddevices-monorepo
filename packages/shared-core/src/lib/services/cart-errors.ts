import { AppError, ErrorCode } from '../utils/error-handler';

// ============================================================================
// Cart Error Codes
// ============================================================================

/**
 * Cart-specific error codes extending the base ErrorCode
 */
export enum CartErrorCode {
  // Item availability errors
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  ITEM_UNAVAILABLE = 'ITEM_UNAVAILABLE',
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',

  // Cart state errors
  CART_EXPIRED = 'CART_EXPIRED',
  CART_NOT_FOUND = 'CART_NOT_FOUND',
  CART_INVALID = 'CART_INVALID',

  // Sync/Merge errors
  MERGE_FAILED = 'MERGE_FAILED',
  SYNC_FAILED = 'SYNC_FAILED',

  // Validation errors
  INVALID_QUANTITY = 'INVALID_QUANTITY',
  INVALID_ITEM = 'INVALID_ITEM',
  CART_VALIDATION_FAILED = 'CART_VALIDATION_FAILED',

  // Operation errors
  ADD_ITEM_FAILED = 'ADD_ITEM_FAILED',
  UPDATE_ITEM_FAILED = 'UPDATE_ITEM_FAILED',
  REMOVE_ITEM_FAILED = 'REMOVE_ITEM_FAILED',
  CLEAR_CART_FAILED = 'CLEAR_CART_FAILED',

  // Coupon errors
  COUPON_INVALID = 'COUPON_INVALID',
  COUPON_EXPIRED = 'COUPON_EXPIRED',
  COUPON_NOT_APPLICABLE = 'COUPON_NOT_APPLICABLE',

  // Rate limiting
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
}

// ============================================================================
// Cart Error Class
// ============================================================================

/**
 * Cart-specific error class with user-friendly messages
 */
export class CartError extends AppError {
  constructor(
    code: CartErrorCode,
    message: string,
    statusCode: number = 400,
    context?: Record<string, unknown>,
    userMessage?: string // Safe to show to end users
  ) {
    super(code as ErrorCode, message, statusCode, context, userMessage);
    this.name = 'CartError';
  }

  /**
   * Create an out of stock error
   */
  static outOfStock(productId: string, requested: number, available: number): CartError {
    return new CartError(
      CartErrorCode.OUT_OF_STOCK,
      `Product ${productId} out of stock. Requested: ${requested}, Available: ${available}`,
      400,
      { productId, requested, available },
      `Only ${available} items available. You requested ${requested}.`
    );
  }

  /**
   * Create an item unavailable error
   */
  static itemUnavailable(productId: string, reason?: string): CartError {
    return new CartError(
      CartErrorCode.ITEM_UNAVAILABLE,
      `Product ${productId} is unavailable${reason ? `: ${reason}` : ''}`,
      400,
      { productId, reason },
      reason || 'This item is currently unavailable.'
    );
  }

  /**
   * Create a cart expired error
   */
  static cartExpired(cartId?: string): CartError {
    return new CartError(
      CartErrorCode.CART_EXPIRED,
      `Cart ${cartId || ''} has expired`,
      400,
      { cartId },
      'Your cart has expired. Please add your items again.'
    );
  }

  /**
   * Create a merge failed error
   */
  static mergeFailed(reason?: string): CartError {
    return new CartError(
      CartErrorCode.MERGE_FAILED,
      `Failed to merge cart${reason ? `: ${reason}` : ''}`,
      400,
      { reason },
      'Failed to merge your cart. Please try refreshing.'
    );
  }

  /**
   * Create a sync failed error
   */
  static syncFailed(reason?: string): CartError {
    return new CartError(
      CartErrorCode.SYNC_FAILED,
      `Failed to sync cart${reason ? `: ${reason}` : ''}`,
      500,
      { reason },
      'Failed to update your cart. Please try again.'
    );
  }

  /**
   * Create an invalid quantity error
   */
  static invalidQuantity(productId: string, quantity: number): CartError {
    return new CartError(
      CartErrorCode.INVALID_QUANTITY,
      `Invalid quantity ${quantity} for product ${productId}`,
      400,
      { productId, quantity },
      'Please enter a valid quantity.'
    );
  }

  /**
   * Create an invalid item error
   */
  static invalidItem(itemId: string, reason?: string): CartError {
    return new CartError(
      CartErrorCode.INVALID_ITEM,
      `Invalid item ${itemId}${reason ? `: ${reason}` : ''}`,
      400,
      { itemId, reason },
      'This item is no longer available.'
    );
  }

  /**
   * Create a coupon invalid error
   */
  static couponInvalid(code: string, reason?: string): CartError {
    return new CartError(
      CartErrorCode.COUPON_INVALID,
      `Invalid coupon code ${code}${reason ? `: ${reason}` : ''}`,
      400,
      { code, reason },
      reason || 'This coupon code is invalid.'
    );
  }

  /**
   * Create a coupon expired error
   */
  static couponExpired(code: string): CartError {
    return new CartError(
      CartErrorCode.COUPON_EXPIRED,
      `Coupon ${code} has expired`,
      400,
      { code },
      'This coupon has expired.'
    );
  }

  /**
   * Create a rate limit error
   */
  static rateLimited(limit: number, windowSeconds: number): CartError {
    return new CartError(
      CartErrorCode.TOO_MANY_REQUESTS,
      `Too many requests. Limit: ${limit} per ${windowSeconds}s`,
      429,
      { limit, windowSeconds },
      `You're making too many requests. Please try again in ${windowSeconds} seconds.`
    );
  }
}

// ============================================================================
// Error Handler Utilities
// ============================================================================

/**
 * Convert any error to a CartError if possible
 */
export function toCartError(error: unknown): CartError {
  if (error instanceof CartError) {
    return error;
  }

  if (error instanceof AppError) {
    // Convert AppError to CartError
    return new CartError(
      error.code as CartErrorCode,
      error.message,
      error.statusCode,
      error.context,
      error.userMessage
    );
  }

  if (error instanceof Error) {
    return new CartError(
      CartErrorCode.INTERNAL_ERROR,
      error.message,
      500,
      { originalError: error.name }
    );
  }

  return new CartError(
    CartErrorCode.INTERNAL_ERROR,
    String(error),
    500
  );
}

/**
 * Check if an error is a specific cart error type
 */
export function isCartError(error: unknown, code?: CartErrorCode): boolean {
  if (error instanceof CartError) {
    if (code) {
      return error.code === code;
    }
    return true;
  }
  return false;
}

/**
 * Get user-friendly message for any cart-related error
 */
export function getUserMessage(error: unknown): string {
  const cartError = toCartError(error);
  return cartError.userMessage || cartError.message || 'An error occurred with your cart.';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const cartError = toCartError(error);

  // These errors might be retryable
  return [
    CartErrorCode.SYNC_FAILED,
    CartErrorCode.MERGE_FAILED,
    CartErrorCode.TOO_MANY_REQUESTS,
  ].includes(cartError.code as CartErrorCode);
}
