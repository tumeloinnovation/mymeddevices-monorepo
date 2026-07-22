// ============================================================================
// Types
// ============================================================================

/**
 * Cart status states
 */
export enum CartStatus {
  /** Guest cart (unauthenticated) */
  GUEST = 'guest',
  /** Active cart (authenticated or guest) */
  ACTIVE = 'active',
  /** Cart is being merged */
  MERGING = 'merging',
  /** Cart is being validated */
  VALIDATING = 'validating',
  /** Cart is in checkout process */
  CHECKOUT = 'checkout',
  /** Cart has expired */
  EXPIRED = 'expired',
}

/**
 * Cart transition events
 */
export enum CartEvent {
  /** User adds item to cart */
  ADD_ITEM = 'add_item',
  /** User removes item from cart */
  REMOVE_ITEM = 'remove_item',
  /** User logs in (guest -> authenticated) */
  LOGIN = 'login',
  /** User logs out */
  LOGOUT = 'logout',
  /** Cart merge completes */
  MERGE_COMPLETE = 'merge_complete',
  /** Cart validation requested */
  VALIDATE = 'validate',
  /** Validation completes */
  VALIDATE_COMPLETE = 'validate_complete',
  /** Checkout started */
  START_CHECKOUT = 'start_checkout',
  /** Checkout completes */
  CHECKOUT_COMPLETE = 'checkout_complete',
  /** Checkout fails */
  CHECKOUT_FAILED = 'checkout_failed',
  /** Cart expires */
  EXPIRE = 'expire',
  /** Cart refreshes/renews */
  RENEW = 'renew',
}

// ============================================================================
// State Transition Configuration
// ============================================================================

/**
 * Valid state transitions
 * Maps each state to the states it can transition to
 */
export const VALID_CART_TRANSITIONS: Record<CartStatus, CartStatus[]> = {
  [CartStatus.GUEST]: [CartStatus.ACTIVE, CartStatus.MERGING, CartStatus.EXPIRED],
  [CartStatus.ACTIVE]: [CartStatus.VALIDATING, CartStatus.CHECKOUT, CartStatus.EXPIRED],
  [CartStatus.MERGING]: [CartStatus.ACTIVE, CartStatus.EXPIRED],
  [CartStatus.VALIDATING]: [CartStatus.ACTIVE, CartStatus.CHECKOUT, CartStatus.EXPIRED],
  [CartStatus.CHECKOUT]: [CartStatus.ACTIVE, CartStatus.EXPIRED],
  [CartStatus.EXPIRED]: [CartStatus.GUEST, CartStatus.ACTIVE], // Can renew
};

/**
 * Event to state mapping
 * Maps events to the states they can cause
 */
export const EVENT_STATE_MAPPING: Record<CartEvent, CartStatus[]> = {
  [CartEvent.ADD_ITEM]: [CartStatus.ACTIVE, CartStatus.GUEST],
  [CartEvent.REMOVE_ITEM]: [CartStatus.ACTIVE, CartStatus.GUEST],
  [CartEvent.LOGIN]: [CartStatus.MERGING, CartStatus.ACTIVE],
  [CartEvent.LOGOUT]: [CartStatus.GUEST, CartStatus.EXPIRED],
  [CartEvent.MERGE_COMPLETE]: [CartStatus.ACTIVE],
  [CartEvent.VALIDATE]: [CartStatus.VALIDATING],
  [CartEvent.VALIDATE_COMPLETE]: [CartStatus.ACTIVE, CartStatus.CHECKOUT, CartStatus.EXPIRED],
  [CartEvent.START_CHECKOUT]: [CartStatus.CHECKOUT],
  [CartEvent.CHECKOUT_COMPLETE]: [CartStatus.ACTIVE], // Empty cart after checkout
  [CartEvent.CHECKOUT_FAILED]: [CartStatus.ACTIVE],
  [CartEvent.EXPIRE]: [CartStatus.EXPIRED],
  [CartEvent.RENEW]: [CartStatus.ACTIVE, CartStatus.GUEST],
};

// ============================================================================
// CartStateMachine Class
// ============================================================================

export interface StateTransition {
  from: CartStatus;
  to: CartStatus;
  event: CartEvent;
  timestamp: number;
}

export interface StateMachineOptions {
  /** Callback when state changes */
  onStateChange?: (from: CartStatus, to: CartStatus, event: CartEvent) => void;
  /** Callback when transition is blocked */
  onTransitionBlocked?: (from: CartStatus, to: CartStatus, event: CartEvent) => void;
  /** Maximum history to keep */
  maxHistory?: number;
}

/**
 * State machine for cart status management
 *
 * Ensures cart only transitions through valid states and tracks transition history
 */
export class CartStateMachine {
  private status: CartStatus = CartStatus.GUEST;
  private history: StateTransition[] = [];
  private options: StateMachineOptions;

  constructor(
    initialStatus: CartStatus = CartStatus.GUEST,
    options: StateMachineOptions = {}
  ) {
    this.status = initialStatus;
    this.options = {
      maxHistory: 50,
      ...options,
    };
  }

  /**
   * Get current status
   */
  getStatus(): CartStatus {
    return this.status;
  }

  /**
   * Check if currently in a specific status
   */
  is(status: CartStatus): boolean {
    return this.status === status;
  }

  /**
   * Check if can transition to a specific status
   */
  canTransitionTo(to: CartStatus): boolean {
    const allowed = VALID_CART_TRANSITIONS[this.status];
    return allowed.includes(to);
  }

  /**
   * Get allowed transitions from current status
   */
  getAllowedTransitions(): CartStatus[] {
    return VALID_CART_TRANSITIONS[this.status];
  }

  /**
   * Attempt to transition based on an event
   */
  transition(event: CartEvent): boolean {
    const possibleStates = EVENT_STATE_MAPPING[event];

    // Find first valid transition
    for (const to of possibleStates) {
      if (this.canTransitionTo(to)) {
        return this.transitionTo(to, event);
      }
    }

    // No valid transition found
    console.warn(`Cannot transition from ${this.status} via event ${event}`);
    this.options.onTransitionBlocked?.(this.status, this.status, event);
    return false;
  }

  /**
   * Transition to a specific status
   */
  transitionTo(to: CartStatus, event: CartEvent = CartEvent.ADD_ITEM): boolean {
    if (!this.canTransitionTo(to)) {
      console.warn(`Invalid transition: ${this.status} → ${to}`);
      this.options.onTransitionBlocked?.(this.status, to, event);
      return false;
    }

    const from = this.status;
    this.status = to;

    // Record transition
    const transition: StateTransition = {
      from,
      to,
      event,
      timestamp: Date.now(),
    };

    this.history.push(transition);

    // Trim history if needed
    if (this.history.length > (this.options.maxHistory || 50)) {
      this.history.shift();
    }

    // Notify callback
    this.options.onStateChange?.(from, to, event);

    console.log(`🛒 [CartStateMachine] ${from} → ${to} (via ${event})`);
    return true;
  }

  /**
   * Get transition history
   */
  getHistory(): ReadonlyArray<StateTransition> {
    return [...this.history];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Reset to a specific status (use with caution, bypasses validation)
   */
  reset(status: CartStatus = CartStatus.GUEST): void {
    const from = this.status;
    this.status = status;
    console.log(`🛒 [CartStateMachine] Reset: ${from} → ${status}`);
  }

  /**
   * Get a readable description of current status
   */
  getStatusDescription(): string {
    const descriptions: Record<CartStatus, string> = {
      [CartStatus.GUEST]: 'Guest cart (unauthenticated)',
      [CartStatus.ACTIVE]: 'Active cart',
      [CartStatus.MERGING]: 'Merging cart...',
      [CartStatus.VALIDATING]: 'Validating cart...',
      [CartStatus.CHECKOUT]: 'Processing checkout...',
      [CartStatus.EXPIRED]: 'Cart expired',
    };
    return descriptions[this.status] || 'Unknown status';
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Create a state machine with default options
 */
export function createCartStateMachine(
  initialStatus?: CartStatus,
  options?: StateMachineOptions
): CartStateMachine {
  return new CartStateMachine(initialStatus, options);
}

/**
 * Check if two statuses are compatible for operations
 */
export function areStatusesCompatible(status1: CartStatus, status2: CartStatus): boolean {
  return status1 === status2 ||
    (status1 === CartStatus.ACTIVE && status2 === CartStatus.GUEST) ||
    (status1 === CartStatus.GUEST && status2 === CartStatus.ACTIVE);
}
