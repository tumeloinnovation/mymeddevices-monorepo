import type { Product } from '../../types/catalog';
import { cartService } from './cart-service';
import type { Cart, CartItem } from './cart-service';

// ============================================================================
// Types
// ============================================================================

export type CartSyncState = 'IDLE' | 'ADDING' | 'SYNCING' | 'ERROR' | 'MERGING';

export interface CartStateManagerState {
  state: CartSyncState;
  cart: Cart | null;
  localItems: LocalCartItem[];
  cartToken: string | null;
  error: string | null;
  isLoading: boolean;
}

export interface LocalCartItem extends Partial<Product> {
  id?: string;
  price?: number;
  stock_quantity?: number;
  manage_stock?: boolean;
  quantity: number;
}

export interface CartStateSnapshot {
  localItems: LocalCartItem[];
  cart: Cart | null;
  timestamp: number;
}

// ============================================================================
// CartStateManager Class
// ============================================================================

/**
 * Centralized cart state management combining guest and authenticated cart logic
 *
 * Features:
 * - Unified state management for guest and authenticated carts
 * - State machine for cart operations (IDLE → ADDING → SYNCING → IDLE)
 * - Optimistic updates with rollback support
 * - Automatic sync queue management
 * - Error handling with recovery
 */
export class CartStateManager {
  private state: CartStateManagerState;
  private syncLock: Promise<void> = Promise.resolve();
  private rollbackSnapshot: CartStateSnapshot | null = null;
  private listeners: Set<(state: CartStateManagerState) => void> = new Set();

  constructor(initialToken?: string | null) {
    this.state = {
      state: 'IDLE',
      cart: null,
      localItems: [],
      cartToken: initialToken || null,
      error: null,
      isLoading: false,
    };
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Get current state (read-only)
   */
  getState(): Readonly<CartStateManagerState> {
    return { ...this.state };
  }

  /**
   * Update internal state and notify listeners
   */
  private setState(partial: Partial<CartStateManagerState>): void {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  /**
   * Transition to a new sync state
   */
  private transitionTo(newState: CartSyncState): void {
    console.log(`🛒 [CartStateManager] State transition: ${this.state.state} → ${newState}`);
    this.setState({ state: newState });
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: CartStateManagerState) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.getState());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const currentState = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  // ============================================================================
  // Snapshot & Rollback
  // ============================================================================

  /**
   * Create a snapshot of current state for rollback
   */
  private createSnapshot(): CartStateSnapshot {
    return {
      localItems: JSON.parse(JSON.stringify(this.state.localItems)),
      cart: this.state.cart ? JSON.parse(JSON.stringify(this.state.cart)) : null,
      timestamp: Date.now(),
    };
  }

  /**
   * Restore state from snapshot
   */
  private rollback(): void {
    if (this.rollbackSnapshot) {
      console.log('🔄 [CartStateManager] Rolling back to snapshot from', new Date(this.rollbackSnapshot.timestamp).toISOString());
      this.setState({
        localItems: this.rollbackSnapshot.localItems,
        cart: this.rollbackSnapshot.cart,
        state: 'IDLE',
      });
      this.rollbackSnapshot = null;
    }
  }

  /**
   * Clear rollback snapshot
   */
  private clearSnapshot(): void {
    this.rollbackSnapshot = null;
  }

  // ============================================================================
  // Cart Operations
  // ============================================================================

  /**
   * Add item to cart with optimistic update
   */
  async addItem(product: Product, quantity: number = 1): Promise<void> {
    // Wait for any existing operation to complete
    await this.syncLock;

    // Validate inputs
    const validQuantity = Math.max(1, Math.floor(quantity));
    const existingItem = this.state.localItems.find(
      (item) => String(item.id) === String(product.id)
    );
    const currentQuantity = existingItem?.quantity || 0;

    // Check stock if managed
    if ((product as any).manage_stock) {
      const stockQuantity = Number((product as any).stock_quantity) || 0;
      const availableStock = stockQuantity - currentQuantity;
      if (availableStock < validQuantity) {
        throw new Error(`Only ${availableStock} items available in stock`);
      }
    }

    // Create snapshot for rollback
    this.rollbackSnapshot = this.createSnapshot();

    // Optimistic update
    this.transitionTo('ADDING');
    const updatedItems = existingItem
      ? this.state.localItems.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, quantity: item.quantity + validQuantity }
            : item
        )
      : [...this.state.localItems, { ...product, quantity: validQuantity, id: String(product.id) }];

    this.setState({ localItems: updatedItems });

    try {
      // Acquire lock for sync operation
      this.syncLock = this.performAddItem(String(product.id), validQuantity);
      await this.syncLock;
      this.clearSnapshot();
      this.transitionTo('IDLE');
    } catch (error) {
      console.error('Failed to add item to backend:', error);
      this.rollback();
      this.setState({ error: error instanceof Error ? error.message : 'Failed to add item' });
      this.transitionTo('ERROR');
      throw error;
    }
  }

  /**
   * Perform the actual backend add operation
   */
  private async performAddItem(productId: string, quantity: number): Promise<void> {
    this.setState({ isLoading: true });

    try {
      const cartItem = await cartService.addItem(
        {
          product_id: productId,
          quantity,
          substitution_allowed: false,
        },
        this.state.cartToken || undefined
      );

      // Sync cart state
      await this.sync();
    } finally {
      this.setState({ isLoading: false });
    }
  }

  /**
   * Update item quantity with optimistic update
   */
  async updateItemQuantity(productId: string, quantity: number): Promise<void> {
    // Wait for any existing operation to complete
    await this.syncLock;

    // Validate inputs
    if (quantity <= 0) {
      return this.removeItem(productId);
    }

    const validQuantity = Math.max(1, Math.floor(quantity));
    const item = this.state.localItems.find((item) => String(item.id) === String(productId));
    if (!item) {
      throw new Error('Item not found in cart');
    }

    // Check stock if managed
    if (item.manage_stock) {
      const stockQuantity = Number(item.stock_quantity) || 0;
      if (validQuantity > stockQuantity) {
        throw new Error(`Only ${stockQuantity} items available in stock`);
      }
    }

    // Create snapshot for rollback
    this.rollbackSnapshot = this.createSnapshot();

    // Optimistic update
    this.transitionTo('ADDING');
    this.setState({
      localItems: this.state.localItems.map((item) =>
        String(item.id) === String(productId)
          ? { ...item, quantity: validQuantity }
          : item
      ),
    });

    try {
      // Acquire lock for sync operation
      const backendItem = this.state.cart?.items?.find(i => i.product_id === String(productId));
      if (backendItem) {
        this.syncLock = this.performUpdateItem(backendItem.id, { quantity: validQuantity });
      } else {
        // Item doesn't exist in backend yet, add it
        this.syncLock = this.performAddItem(String(productId), validQuantity);
      }
      await this.syncLock;
      this.clearSnapshot();
      this.transitionTo('IDLE');
    } catch (error) {
      console.error('Failed to update item in backend:', error);
      this.rollback();
      this.setState({ error: error instanceof Error ? error.message : 'Failed to update item' });
      this.transitionTo('ERROR');
      throw error;
    }
  }

  /**
   * Perform the actual backend update operation
   */
  private async performUpdateItem(itemId: string, update: { quantity?: number }): Promise<void> {
    this.setState({ isLoading: true });

    try {
      await cartService.updateItem(itemId, update);
      await this.sync();
    } finally {
      this.setState({ isLoading: false });
    }
  }

  /**
   * Remove item from cart with optimistic update
   */
  async removeItem(productId: string): Promise<void> {
    // Wait for any existing operation to complete
    await this.syncLock;

    // Create snapshot for rollback
    this.rollbackSnapshot = this.createSnapshot();

    // Optimistic update
    this.transitionTo('ADDING');
    this.setState({
      localItems: this.state.localItems.filter((item) => String(item.id) !== String(productId)),
    });

    try {
      // Acquire lock for sync operation
      const backendItem = this.state.cart?.items?.find(i => i.product_id === String(productId));
      if (backendItem) {
        this.syncLock = this.performRemoveItem(backendItem.id);
        await this.syncLock;
      }
      this.clearSnapshot();
      this.transitionTo('IDLE');
    } catch (error) {
      console.error('Failed to remove item from backend:', error);
      this.rollback();
      this.setState({ error: error instanceof Error ? error.message : 'Failed to remove item' });
      this.transitionTo('ERROR');
      throw error;
    }
  }

  /**
   * Perform the actual backend remove operation
   */
  private async performRemoveItem(itemId: string): Promise<void> {
    this.setState({ isLoading: true });

    try {
      await cartService.removeItem(itemId);
      await this.sync();
    } finally {
      this.setState({ isLoading: false });
    }
  }

  /**
   * Clear entire cart
   */
  async clear(): Promise<void> {
    this.rollbackSnapshot = this.createSnapshot();
    this.setState({ localItems: [], cart: null });

    try {
      if (this.state.cartToken) {
        await cartService.clearCart(this.state.cartToken);
      }
      this.clearSnapshot();
    } catch (error) {
      console.error('Failed to clear cart:', error);
      this.rollback();
      throw error;
    }
  }

  // ============================================================================
  // Sync Operations
  // ============================================================================

  /**
   * Sync cart state with backend
   */
  async sync(): Promise<void> {
    // Wait for any existing sync to complete
    await this.syncLock;

    // Acquire the lock for this sync operation
    this.syncLock = (async () => {
      if (this.state.state === 'SYNCING') {
        return;
      }

      try {
        this.transitionTo('SYNCING');
        this.setState({ error: null, isLoading: true });

        const cart = await cartService.getCart(this.state.cartToken || undefined);

        if (!cart) {
          this.setState({ cart: null, localItems: [] });
          return;
        }

        // Save cart token for future requests
        if (cart?.cart_token && cart.cart_token !== this.state.cartToken) {
          this.setCartToken(cart.cart_token);
        }

        // Convert backend cart items to local format
        const cartItems = cart.items || [];
        const localItems: LocalCartItem[] = cartItems.map((item) => ({
          ...item.product,
          id: item.product_id,
          quantity: item.quantity,
          price: Number(item.unit_price || item.product?.price || 0),
        }));

        this.setState({
          cart,
          localItems,
        });
        this.transitionTo('IDLE');
      } catch (error) {
        console.error('Failed to sync cart:', error);
        this.setState({
          error: error instanceof Error ? error.message : 'Failed to sync cart',
        });
        this.transitionTo('ERROR');
        throw error;
      } finally {
        this.setState({ isLoading: false });
      }
    })();

    return this.syncLock;
  }

  /**
   * Merge guest cart into customer cart
   */
  async merge(method: 'merge' | 'replace' = 'merge'): Promise<void> {
    if (!this.state.cartToken) {
      throw new Error('No guest cart token to merge');
    }

    await this.syncLock;

    this.syncLock = (async () => {
      try {
        this.transitionTo('MERGING');
        this.setState({ isLoading: true, error: null });

        const result = await cartService.mergeGuestCart(this.state.cartToken, method);

        // Sync with the merged cart
        await this.sync();

        // Clear guest token after successful merge
        this.setCartToken(null);

        console.log('Cart merged successfully:', result);
        this.transitionTo('IDLE');
      } catch (error) {
        console.error('Failed to merge cart:', error);
        this.setState({
          error: error instanceof Error ? error.message : 'Failed to merge cart',
        });
        this.transitionTo('ERROR');
        throw error;
      } finally {
        this.setState({ isLoading: false });
      }
    })();

    return this.syncLock;
  }

  // ============================================================================
  // Token Management
  // ============================================================================

  /**
   * Set cart token
   */
  setCartToken(token: string | null): void {
    this.setState({ cartToken: token });
  }

  /**
   * Get cart token
   */
  getCartToken(): string | null {
    return this.state.cartToken;
  }

  // ============================================================================
  // Computed Helpers
  // ============================================================================

  /**
   * Get total item count
   */
  getCount(): number {
    return this.state.localItems.reduce((acc, item) => acc + item.quantity, 0);
  }

  /**
   * Check if item is in cart
   */
  isInCart(productId: string | number): boolean {
    const id = String(productId);
    return this.state.localItems.some((item) => String(item.id) === id);
  }

  /**
   * Get item quantity
   */
  getItemQuantity(productId: string | number): number {
    const id = String(productId);
    const item = this.state.localItems.find((item) => String(item.id) === id);
    return item?.quantity || 0;
  }

  /**
   * Get cart total
   */
  getTotal(): number {
    return this.state.localItems.reduce((acc, item) => {
      const price = Math.round(Number(item.price) * 100); // work in cents
      return acc + price * item.quantity;
    }, 0) / 100; // convert back to currency
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let managerInstance: CartStateManager | null = null;

/**
 * Get or create the singleton manager instance
 */
export function getCartStateManager(initialToken?: string | null): CartStateManager {
  if (!managerInstance) {
    managerInstance = new CartStateManager(initialToken);
  }
  return managerInstance;
}

/**
 * Reset the singleton instance (useful for testing or logout)
 */
export function resetCartStateManager(): void {
  managerInstance = null;
}
