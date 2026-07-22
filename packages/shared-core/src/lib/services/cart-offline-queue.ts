import { cartService } from './cart-service';

// ============================================================================
// Types
// ============================================================================

export enum QueueOperationType {
  ADD = 'add',
  UPDATE = 'update',
  REMOVE = 'remove',
}

export interface QueuedOperation {
  id: string;
  type: QueueOperationType;
  data: {
    productId?: string;
    itemId?: string;
    quantity?: number;
    notes?: string;
  };
  retryCount: number;
  timestamp: number;
  maxRetries: number;
}

// ============================================================================
// Constants
// ============================================================================

const OFFLINE_QUEUE_KEY = 'cart_offline_queue';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // Start with 1 second
const MAX_RETRY_DELAY_MS = 30000; // Max 30 seconds

// ============================================================================
// CartOfflineQueue Class
// ============================================================================

/**
 * Manages offline cart operations with persistence and retry logic
 *
 * Features:
 * - Persists operations to localStorage
 * - Automatic retry with exponential backoff
 * - Deduplicates operations for same item
 * - Processes queue when back online
 */
export class CartOfflineQueue {
  private queue: QueuedOperation[] = [];
  private isProcessing = false;
  private cartToken: string | null = null;

  constructor(cartToken?: string | null) {
    this.cartToken = cartToken || null;
    this.loadFromStorage();
  }

  /**
   * Load queue from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private getRetryDelay(retryCount: number): number {
    const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
    return Math.min(delay, MAX_RETRY_DELAY_MS);
  }

  /**
   * Execute a single queued operation
   */
  private async executeOperation(operation: QueuedOperation): Promise<boolean> {
    try {
      switch (operation.type) {
        case QueueOperationType.ADD:
          if (operation.data.productId && operation.data.quantity) {
            await cartService.addItem(
              {
                product_id: operation.data.productId,
                quantity: operation.data.quantity,
                notes: operation.data.notes,
              },
              this.cartToken || undefined
            );
          }
          break;

        case QueueOperationType.UPDATE:
          if (operation.data.itemId) {
            await cartService.updateItem(operation.data.itemId, {
              quantity: operation.data.quantity,
              notes: operation.data.notes,
            });
          }
          break;

        case QueueOperationType.REMOVE:
          if (operation.data.itemId) {
            await cartService.removeItem(operation.data.itemId);
          }
          break;

        default:
          console.warn('Unknown operation type:', operation.type);
          return false;
      }

      return true; // Success
    } catch (error) {
      console.error(`Failed to execute operation ${operation.id}:`, error);
      return false; // Failure
    }
  }

  /**
   * Enqueue a new operation
   *
   * Checks for duplicate operations and replaces them if found
   */
  async enqueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const id = `${operation.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check for duplicate operation (same type and item)
    const existingIndex = this.queue.findIndex((op) => {
      if (op.type !== operation.type) return false;

      // For ADD: check by productId
      if (operation.type === QueueOperationType.ADD) {
        return op.data.productId === operation.data.productId;
      }

      // For UPDATE/REMOVE: check by itemId
      if (operation.data.itemId) {
        return op.data.itemId === operation.data.itemId;
      }

      return false;
    });

    const newOperation: QueuedOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
      retryCount: 0,
    };

    if (existingIndex >= 0) {
      // Replace existing operation
      this.queue[existingIndex] = newOperation;
    } else {
      // Add new operation
      this.queue.push(newOperation);
    }

    this.saveToStorage();
  }

  /**
   * Process all queued operations
   *
   * Executes operations in order with retry logic
   */
  async process(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 [CartOfflineQueue] Processing ${this.queue.length} queued operations...`);

    // Filter out expired operations (older than 24 hours)
    const EXPIRY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    this.queue = this.queue.filter((op) => now - op.timestamp < EXPIRY_MS);

    const successful: string[] = [];
    const failed: QueuedOperation[] = [];

    for (const operation of this.queue) {
      let success = false;

      // Retry logic
      for (let attempt = 0; attempt <= operation.maxRetries; attempt++) {
        if (attempt > 0) {
          const delay = this.getRetryDelay(attempt - 1);
          console.log(`⏳ [CartOfflineQueue] Retrying operation ${operation.id} (attempt ${attempt + 1}/${operation.maxRetries + 1}) after ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        success = await this.executeOperation(operation);

        if (success) {
          successful.push(operation.id);
          break;
        }
      }

      if (!success && operation.retryCount < operation.maxRetries) {
        // Increment retry count and keep in queue for later
        operation.retryCount++;
        failed.push(operation);
      } else if (!success) {
        console.warn(`❌ [CartOfflineQueue] Operation ${operation.id} failed permanently after ${operation.maxRetries} retries`);
      }
    }

    // Update queue with only failed operations
    this.queue = failed;
    this.saveToStorage();

    console.log(`✅ [CartOfflineQueue] Process complete. ${successful.length} succeeded, ${failed.length} failed/retrying`);
    this.isProcessing = false;
  }

  /**
   * Clear all queued operations
   */
  clear(): void {
    this.queue = [];
    this.saveToStorage();
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Get all queued operations (read-only)
   */
  getAll(): ReadonlyArray<QueuedOperation> {
    return [...this.queue];
  }

  /**
   * Update cart token for future operations
   */
  setCartToken(token: string | null): void {
    this.cartToken = token;
  }

  /**
   * Check if queue has operations for a specific item
   */
  hasOperationForItem(itemId: string): boolean {
    return this.queue.some((op) => op.data.itemId === itemId || op.data.productId === itemId);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let queueInstance: CartOfflineQueue | null = null;

/**
 * Get or create the singleton queue instance
 */
export function getCartOfflineQueue(cartToken?: string | null): CartOfflineQueue {
  if (!queueInstance) {
    queueInstance = new CartOfflineQueue(cartToken);
  } else if (cartToken !== undefined) {
    queueInstance.setCartToken(cartToken);
  }
  return queueInstance;
}

/**
 * Reset the singleton instance (useful for testing or logout)
 */
export function resetCartOfflineQueue(): void {
  queueInstance = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }
}
