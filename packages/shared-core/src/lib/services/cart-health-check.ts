import { cartService, type Cart } from './cart-service';
import type { LocalCartItem } from '../store/useCartStore';

// ============================================================================
// Types
// ============================================================================

export interface CartHealthCheckResult {
  /** Overall health status */
  isHealthy: boolean;
  /** Local cart item count */
  localCount: number;
  /** Backend cart item count */
  backendCount: number;
  /** Whether counts match */
  countsMatch: boolean;
  /** Product ID mismatches */
  mismatches: CartItemMismatch[];
  /** Items only in local cart */
  onlyInLocal: string[];
  /** Items only in backend cart */
  onlyInBackend: string[];
  /** Any validation errors */
  errors: string[];
  /** Timestamp of check */
  timestamp: number;
}

export interface CartItemMismatch {
  productId: string;
  localQuantity: number;
  backendQuantity: number;
  difference: number;
}

export interface CartHealthCheckOptions {
  /** Whether to attempt auto-reconciliation */
  autoReconcile?: boolean;
  /** Callback for progress updates */
  onProgress?: (message: string) => void;
  /** Maximum allowed difference before flagging as mismatch */
  maxDifference?: number;
}

// ============================================================================
// CartHealthCheck Class
// ============================================================================

/**
 * Cart health check and validation utility
 *
 * Compares local cart state with backend cart state to detect:
 * - Count mismatches
 * - Missing items
 * - Quantity differences
 * - Validation errors
 */
export class CartHealthCheck {
  private options: CartHealthCheckOptions;

  constructor(options: CartHealthCheckOptions = {}) {
    this.options = {
      maxDifference: 0,
      ...options,
    };
  }

  /**
   * Log progress if callback provided
   */
  private log(message: string): void {
    this.options.onProgress?.(message);
    console.log(`🔍 [CartHealthCheck] ${message}`);
  }

  /**
   * Perform comprehensive health check
   */
  async check(
    localItems: LocalCartItem[],
    backendCart: Cart | null,
    cartToken?: string
  ): Promise<CartHealthCheckResult> {
    this.log('Starting cart health check...');
    const timestamp = Date.now();
    const errors: string[] = [];
    const mismatches: CartItemMismatch[] = [];
    const onlyInLocal: string[] = [];
    const onlyInBackend: string[] = [];

    // Get counts
    const localCount = localItems.reduce((acc, item) => acc + item.quantity, 0);
    const backendItems = backendCart?.items || [];
    const backendCount = backendItems.reduce((acc, item) => acc + item.quantity, 0);

    this.log(`Local count: ${localCount}, Backend count: ${backendCount}`);

    // Check for items only in local cart
    const localProductIds = new Set(
      localItems.map((item) => String(item.id)).filter(Boolean)
    );
    const backendProductIds = new Set(
      backendItems.map((item) => item.product_id)
    );

    for (const productId of localProductIds) {
      if (!backendProductIds.has(productId)) {
        onlyInLocal.push(productId);
        this.log(`Item only in local: ${productId}`);
      }
    }

    // Check for items only in backend cart
    for (const productId of backendProductIds) {
      if (!localProductIds.has(productId)) {
        onlyInBackend.push(productId);
        this.log(`Item only in backend: ${productId}`);
      }
    }

    // Check for quantity mismatches
    for (const localItem of localItems) {
      const productId = String(localItem.id);
      if (!productId) continue;

      const backendItem = backendItems.find((item) => item.product_id === productId);
      if (backendItem) {
        const localQty = localItem.quantity || 0;
        const backendQty = backendItem.quantity || 0;
        const difference = Math.abs(localQty - backendQty);

        if (difference > (this.options.maxDifference || 0)) {
          mismatches.push({
            productId,
            localQuantity: localQty,
            backendQuantity: backendQty,
            difference,
          });
          this.log(`Quantity mismatch for ${productId}: local=${localQty}, backend=${backendQty}`);
        }
      }
    }

    // Check validation status
    if (backendCart) {
      try {
        // Backend cart validation could be added here if API supports it
        // For now, just check if cart is active
        if (!backendCart.is_active) {
          errors.push('Backend cart is not active');
        }
      } catch (error) {
        errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Determine if healthy
    const countsMatch = localCount === backendCount && mismatches.length === 0;
    const isHealthy = countsMatch && onlyInLocal.length === 0 && onlyInBackend.length === 0 && errors.length === 0;

    this.log(`Health check complete. Healthy: ${isHealthy}`);

    return {
      isHealthy,
      localCount,
      backendCount,
      countsMatch,
      mismatches,
      onlyInLocal,
      onlyInBackend,
      errors,
      timestamp,
    };
  }

  /**
   * Perform health check and auto-reconcile if needed
   */
  async checkAndReconcile(
    localItems: LocalCartItem[],
    backendCart: Cart | null,
    cartToken?: string,
    reconcileFn?: (result: CartHealthCheckResult) => Promise<void>
  ): Promise<CartHealthCheckResult> {
    const result = await this.check(localItems, backendCart, cartToken);

    if (!result.isHealthy && this.options.autoReconcile) {
      this.log('Auto-reconciliation enabled, attempting to fix issues...');

      if (reconcileFn) {
        try {
          await reconcileFn(result);
          this.log('Reconciliation complete');

          // Re-check after reconciliation
          return await this.check(localItems, backendCart, cartToken);
        } catch (error) {
          this.log(`Reconciliation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.errors.push(`Reconciliation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return result;
  }

  /**
   * Validate cart before checkout
   */
  async validateForCheckout(
    backendCart: Cart | null
  ): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    if (!backendCart) {
      issues.push('No backend cart found');
      return { valid: false, issues };
    }

    if (!backendCart.is_active) {
      issues.push('Cart is not active');
    }

    if (!backendCart.items || backendCart.items.length === 0) {
      issues.push('Cart is empty');
    }

    // Check for items with 0 or negative quantity
    for (const item of backendCart.items) {
      if (item.quantity <= 0) {
        issues.push(`Item ${item.product_id} has invalid quantity: ${item.quantity}`);
      }

      // Check if product is still available (if API provides this info)
      if (item.product && !item.product.price) {
        issues.push(`Item ${item.product_id} has no price`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Get a human-readable health report
   */
  getReport(result: CartHealthCheckResult): string {
    const lines: string[] = [];

    lines.push('=== Cart Health Report ===');
    lines.push(`Status: ${result.isHealthy ? '✅ Healthy' : '❌ Unhealthy'}`);
    lines.push(`Local items: ${result.localCount}`);
    lines.push(`Backend items: ${result.backendCount}`);
    lines.push(`Counts match: ${result.countsMatch ? '✅' : '❌'}`);

    if (result.mismatches.length > 0) {
      lines.push('\nQuantity Mismatches:');
      for (const mismatch of result.mismatches) {
        lines.push(`  - ${mismatch.productId}: local=${mismatch.localQuantity}, backend=${mismatch.backendQuantity}`);
      }
    }

    if (result.onlyInLocal.length > 0) {
      lines.push(`\nOnly in local: ${result.onlyInLocal.join(', ')}`);
    }

    if (result.onlyInBackend.length > 0) {
      lines.push(`\nOnly in backend: ${result.onlyInBackend.join(', ')}`);
    }

    if (result.errors.length > 0) {
      lines.push('\nErrors:');
      for (const error of result.errors) {
        lines.push(`  - ${error}`);
      }
    }

    lines.push(`\nChecked at: ${new Date(result.timestamp).toISOString()}`);

    return lines.join('\n');
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let healthCheckInstance: CartHealthCheck | null = null;

/**
 * Get or create the singleton health check instance
 */
export function getCartHealthCheck(options?: CartHealthCheckOptions): CartHealthCheck {
  if (!healthCheckInstance) {
    healthCheckInstance = new CartHealthCheck(options);
  } else if (options) {
    healthCheckInstance = new CartHealthCheck(options);
  }
  return healthCheckInstance;
}

/**
 * Reset the singleton instance
 */
export function resetCartHealthCheck(): void {
  healthCheckInstance = null;
}
