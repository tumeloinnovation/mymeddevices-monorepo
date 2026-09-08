// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import useCartStore from './useCartStore';
import { cartService } from '../services/cart-service';

const mockProductA: any = {
  id: 'prod-101',
  name: 'Digital Sphygmomanometer',
  price: 4500,
  regular_price: 5000,
  stock_quantity: 10,
  manage_stock: true,
  images: [{ src: '/images/sphyg.jpg' }],
};

const mockProductB: any = {
  id: 'prod-102',
  name: 'Infrared Forehead Thermometer',
  price: 2500,
  stock_quantity: 20,
  manage_stock: true,
  images: [],
};

describe('useCartStore (Shopping Cart State)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(cartService, 'addItem').mockResolvedValue({
      id: 'cart-1',
      cart_token: 'token-1',
      cart_type: 'guest',
      is_active: true,
      items: [],
      item_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);
    vi.spyOn(cartService, 'updateItem').mockResolvedValue({
      id: 'cart-1',
      cart_token: 'token-1',
      cart_type: 'guest',
      is_active: true,
      items: [],
      item_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);
    vi.spyOn(cartService, 'removeItem').mockResolvedValue(undefined as any);
    vi.spyOn(cartService, 'clearCart').mockResolvedValue(undefined as any);

    useCartStore.setState({ items: [], cart: null, pendingOps: new Set(), rollbackSnapshot: null });
  });

  it('1. adds a new product item to the cart with default quantity 1', () => {
    useCartStore.getState().addItem(mockProductA);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe('prod-101');
    expect(state.items[0].quantity).toBe(1);
    expect(state.getCount()).toBe(1);
    expect(state.getTotal()).toBe(4500);
  });

  it('2. merges quantities when adding the same product multiple times', () => {
    useCartStore.getState().addItem(mockProductA, 2);
    useCartStore.getState().addItem(mockProductA, 3);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(5);
    expect(state.getCount()).toBe(5);
    expect(state.getTotal()).toBe(22500); // 5 * 4500
  });

  it('3. adds multiple distinct products and calculates aggregated totals', () => {
    useCartStore.getState().addItem(mockProductA, 2); // 2 * 4500 = 9000
    useCartStore.getState().addItem(mockProductB, 3); // 3 * 2500 = 7500

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(2);
    expect(state.getCount()).toBe(5);
    expect(state.getTotal()).toBe(16500); // 9000 + 7500
    expect(state.isInCart('prod-101')).toBe(true);
    expect(state.isInCart('prod-102')).toBe(true);
    expect(state.getItemQuantity('prod-101')).toBe(2);
    expect(state.getItemQuantity('prod-102')).toBe(3);
  });

  it('4. updates item quantity correctly', () => {
    useCartStore.getState().addItem(mockProductA, 2);
    useCartStore.getState().updateQuantity('prod-101', 4);

    const state = useCartStore.getState();
    expect(state.items[0].quantity).toBe(4);
    expect(state.getTotal()).toBe(18000);
  });

  it('5. removes item when updateQuantity is set to 0 or negative', () => {
    useCartStore.getState().addItem(mockProductA, 2);
    useCartStore.getState().updateQuantity('prod-101', 0);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.getCount()).toBe(0);
    expect(state.getTotal()).toBe(0);
  });

  it('6. removes item explicitly by id', () => {
    useCartStore.getState().addItem(mockProductA, 1);
    useCartStore.getState().addItem(mockProductB, 1);
    useCartStore.getState().removeItem('prod-101');

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe('prod-102');
  });

  it('7. clears all items from the cart', () => {
    useCartStore.getState().addItem(mockProductA, 2);
    useCartStore.getState().addItem(mockProductB, 3);
    useCartStore.getState().clear();

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.getCount()).toBe(0);
    expect(state.getTotal()).toBe(0);
  });
});
