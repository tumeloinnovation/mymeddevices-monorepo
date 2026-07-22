'use client'

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import useCartStore from '@/lib/store/useCartStore'
import { Product } from '@/lib/data/types'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useCartStore', () => {
  const mockProduct: Product = {
    id: 1,
    name: 'Test Product',
    slug: 'test-product',
    permalink: 'https://example.com/product/test-product',
    type: 'simple',
    status: 'publish',
    featured: false,
    catalog_visibility: 'visible',
    description: 'Test description',
    short_description: 'Short description',
    sku: 'TEST001',
    price: '100.00',
    regular_price: '100.00',
    sale_price: '',
    on_sale: false,
    purchasable: true,
    total_sales: 0,
    stock_quantity: 10,
    stock_status: 'instock',
    manage_stock: true,
    weight: '1.5',
    dimensions: { length: '10', width: '5', height: '2' },
    categories: [],
    tags: [],
    images: [{ id: 1, src: 'https://example.com/image.jpg', name: 'image', alt: 'alt' }],
    attributes: [],
    average_rating: '0',
    rating_count: 0,
    related_ids: [],
    meta_data: [],
    brands: [],
    date_created: new Date().toISOString(),
  }

  beforeEach(() => {
    // Clear localStorage and reset store
    localStorage.clear()
    act(() => {
      useCartStore.getState().clear()
    })
  })

  describe('initial state', () => {
    it('should start with empty items', () => {
      const { result } = renderHook(() => useCartStore())
      expect(result.current.items).toEqual([])
    })

    it('should have getCount return 0 initially', () => {
      const { result } = renderHook(() => useCartStore())
      expect(result.current.getCount()).toBe(0)
    })

    it('should have getTotal return 0 initially', () => {
      const { result } = renderHook(() => useCartStore())
      expect(result.current.getTotal()).toBe(0)
    })
  })

  describe('addItem', () => {
    it('should add new item to cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct)
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0]).toEqual({ ...mockProduct, id: '1', quantity: 1 })
      expect(result.current.getCount()).toBe(1)
      expect(result.current.getTotal()).toBe(100)
    })

    it('should increment quantity when adding existing item', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct)
        result.current.addItem(mockProduct)
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].quantity).toBe(2)
      expect(result.current.getCount()).toBe(2)
      expect(result.current.getTotal()).toBe(200)
    })

    it('should respect stock limits', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 15) // More than stock
      })

      expect(result.current.items).toHaveLength(0) // Should not add
      expect(result.current.getCount()).toBe(0)
    })

    it('should add custom quantity', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 3)
      })

      expect(result.current.items[0].quantity).toBe(3)
      expect(result.current.getCount()).toBe(3)
      expect(result.current.getTotal()).toBe(300)
    })
  })

  describe('updateQuantity', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCartStore())
      act(() => {
        result.current.addItem(mockProduct, 2)
      })
    })

    it('should update quantity by id', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.updateQuantity(1, 5)
      })

      expect(result.current.items[0].quantity).toBe(5)
      expect(result.current.getCount()).toBe(5)
    })

    it('should remove item when quantity is 0 or negative', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.updateQuantity(1, 0)
      })

      expect(result.current.items).toHaveLength(0)
      expect(result.current.getCount()).toBe(0)
    })
  })

  describe('removeItem', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useCartStore())
      act(() => {
        result.current.addItem(mockProduct)
      })
    })

    it('should remove item by id', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.removeItem(1)
      })

      expect(result.current.items).toHaveLength(0)
    })
  })

  describe('isInCart', () => {
    it('should return true when item is in cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct)
      })

      expect(result.current.isInCart(1)).toBe(true)
    })

    it('should return false when item is not in cart', () => {
      const { result } = renderHook(() => useCartStore())

      expect(result.current.isInCart(1)).toBe(false)
    })
  })

  describe('getItemQuantity', () => {
    it('should return quantity when item is in cart', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 3)
      })

      expect(result.current.getItemQuantity(1)).toBe(3)
    })

    it('should return 0 when item is not in cart', () => {
      const { result } = renderHook(() => useCartStore())

      expect(result.current.getItemQuantity(1)).toBe(0)
    })
  })

  describe('clear', () => {
    it('should clear all items', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct)
        result.current.addItem({ ...mockProduct, id: 2, name: 'Product 2' })
        result.current.clear()
      })

      expect(result.current.items).toHaveLength(0)
      expect(result.current.getCount()).toBe(0)
      expect(result.current.getTotal()).toBe(0)
    })
  })

  describe('persistence', () => {
    it('should persist cart state to localStorage', () => {
      const { result, rerender } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 2)
      })

      // Create new hook instance to test persistence
      const { result: newResult } = renderHook(() => useCartStore())

      expect(newResult.current.items).toHaveLength(1)
      expect(newResult.current.items[0].quantity).toBe(2)
    })
  })

  describe('rollback functionality', () => {
    it('should create snapshot of current state', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 2)
        result.current.createSnapshot()
        result.current.addItem(mockProduct, 3) // This would make quantity 5
        result.current.rollback()
      })

      expect(result.current.items).toHaveLength(1)
      expect(result.current.items[0].quantity).toBe(2)
    })

    it('should clear snapshot', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.addItem(mockProduct, 2)
        result.current.createSnapshot()
        result.current.clearSnapshot()
        result.current.addItem(mockProduct, 3)
        result.current.rollback()
      })

      // Rollback should do nothing since snapshot was cleared
      expect(result.current.items[0].quantity).toBe(5)
    })
  })

  describe('cart token management', () => {
    it('should set cart token', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.setCartToken('test-token-123')
      })

      expect(result.current.cartToken).toBe('test-token-123')
    })

    it('should clear cart token', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.setCartToken('test-token-123')
        result.current.clearCartToken()
      })

      expect(result.current.cartToken).toBe(null)
    })
  })

  describe('syncWithBackend', () => {
    it('should have syncWithBackend method', () => {
      const { result } = renderHook(() => useCartStore())

      expect(typeof result.current.syncWithBackend).toBe('function')
    })

    it('should set syncRequested flag when deferring due to pending ops', () => {
      const { result } = renderHook(() => useCartStore())

      act(() => {
        result.current.pendingOps.add('add:item-1')
        result.current.syncWithBackend({ force: false })
      })

      // When pending ops exist, sync should be deferred
      expect(result.current.syncRequested).toBe(true)
    })

    // Note: Full syncWithBackend integration tests are in apps/customer/e2e/
    // These tests require actual API mocking which is better suited for E2E tests
  })

  describe('concurrent operations', () => {
    it('should handle multiple addItem calls', async () => {
      const { result } = renderHook(() => useCartStore())

      // Add multiple items rapidly
      await act(async () => {
        result.current.addItem(mockProduct, 1)
        result.current.addItem(mockProduct, 1)
        result.current.addItem(mockProduct, 1)
      })

      // Should handle gracefully
      expect(result.current.items.length).toBeGreaterThan(0)
    })
  })
})