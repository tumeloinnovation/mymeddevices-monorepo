'use client'

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAddressStore, type Address, type AddressTag } from '@/lib/store/useAddressStore'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock address-mapper
vi.mock('@/lib/utils/address-mapper', () => ({
  generateAddressId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  areAddressesDuplicates: (addr1: any, addr2: any) => {
    const normalize = (s: string) => s?.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[,.\-]/g, '') || '';
    return normalize(addr1.address) === normalize(addr2.address);
  },
}))

describe('useAddressStore', () => {
  const mockAddress: Omit<Address, 'id'> = {
    address: '123 Main St, Nairobi, Kenya',
    lat: '-1.2864',
    lon: '36.8172',
    tag: 'home' as AddressTag,
    label: 'Home Address',
    isDefault: false,
  }

  // Create unique addresses for tests that need multiple addresses
  const createUniqueAddress = (suffix: string, overrides: Partial<Omit<Address, 'id'>> = {}): Omit<Address, 'id'> => ({
    ...mockAddress,
    address: `${suffix} Street, Nairobi, Kenya`,
    ...overrides,
  })

  beforeEach(() => {
    // Clear localStorage and reset store
    localStorage.clear()
    act(() => {
      useAddressStore.getState().clear()
    })
  })

  describe('initial state', () => {
    it('should start with empty addresses', () => {
      const { result } = renderHook(() => useAddressStore())
      expect(result.current.addresses).toEqual([])
    })

    it('should have getAddresses return empty list initially', () => {
      const { result } = renderHook(() => useAddressStore())
      expect(result.current.getAddresses()).toHaveLength(0)
    })

    it('should have getDefaultAddress return null initially', () => {
      const { result } = renderHook(() => useAddressStore())
      expect(result.current.getDefaultAddress()).toBeNull()
    })
  })

  describe('addAddress', () => {
    it('should add new address', () => {
      const { result } = renderHook(() => useAddressStore())

      act(() => {
        result.current.addAddress(mockAddress)
      })

      expect(result.current.addresses).toHaveLength(1)
      expect(result.current.addresses[0]).toMatchObject(mockAddress)
      expect(result.current.addresses[0].id).toBeDefined()
    })

    it('should set address as default when isDefault is true', () => {
      const { result } = renderHook(() => useAddressStore())

      act(() => {
        result.current.addAddress({ ...mockAddress, isDefault: true })
      })

      expect(result.current.addresses[0].isDefault).toBe(true)
      expect(result.current.getDefaultAddress()).toEqual(result.current.addresses[0])
    })

    it('should remove default from other addresses when adding new default', () => {
      const { result } = renderHook(() => useAddressStore())

      act(() => {
        result.current.addAddress(createUniqueAddress('111 First', { isDefault: true, label: 'Address 1' }))
        result.current.addAddress(createUniqueAddress('222 Second', { isDefault: true, label: 'Address 2' }))
      })

      const defaultAddresses = result.current.addresses.filter(addr => addr.isDefault)
      expect(defaultAddresses).toHaveLength(1)
      expect(defaultAddresses[0].label).toBe('Address 2')
    })
  })

  describe('updateAddress', () => {
    let addressId: string

    beforeEach(() => {
      const { result } = renderHook(() => useAddressStore())
      act(() => {
        result.current.addAddress(mockAddress)
      })
      addressId = result.current.addresses[0].id
    })

    it('should update address fields', () => {
      const { result } = renderHook(() => useAddressStore())

      act(() => {
        result.current.updateAddress(addressId, { label: 'Updated Home', tag: 'work' as AddressTag })
      })

      const updatedAddress = result.current.addresses.find(addr => addr.id === addressId)
      expect(updatedAddress?.label).toBe('Updated Home')
      expect(updatedAddress?.tag).toBe('work')
    })

    it('should set address as default and remove from others', () => {
      const { result } = renderHook(() => useAddressStore())

      // Add another address first with a unique address string
      act(() => {
        result.current.addAddress(createUniqueAddress('456 Work', { label: 'Work Address', tag: 'work' as AddressTag }))
      })

      const workAddressId = result.current.addresses.find(addr => addr.label === 'Work Address')?.id

      act(() => {
        result.current.updateAddress(addressId, { isDefault: true })
      })

      const homeAddress = result.current.addresses.find(addr => addr.id === addressId)
      const workAddress = result.current.addresses.find(addr => addr.id === workAddressId)

      expect(homeAddress?.isDefault).toBe(true)
      expect(workAddress?.isDefault).toBe(false)
    })
  })

  describe('removeAddress', () => {
    let addressId: string

    beforeEach(() => {
      const { result } = renderHook(() => useAddressStore())
      act(() => {
        result.current.addAddress(mockAddress)
      })
      addressId = result.current.addresses[0].id
    })

    it('should remove address by id', () => {
      const { result } = renderHook(() => useAddressStore())

      act(() => {
        result.current.removeAddress(addressId)
      })

      expect(result.current.addresses).toHaveLength(0)
    })

    it('should not remove anything if id not found', () => {
      const { result } = renderHook(() => useAddressStore())

      act(() => {
        result.current.removeAddress('non-existent-id')
      })

      expect(result.current.addresses).toHaveLength(1)
    })
  })

  describe('getAddressesByTag', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useAddressStore())
      act(() => {
        result.current.addAddress(createUniqueAddress('111 Home', { tag: 'home' as AddressTag }))
        result.current.addAddress(createUniqueAddress('222 Work', { tag: 'work' as AddressTag, label: 'Work' }))
        result.current.addAddress(createUniqueAddress('333 Home2', { tag: 'home' as AddressTag, label: 'Home 2' }))
      })
    })

    it('should return addresses filtered by tag', () => {
      const { result } = renderHook(() => useAddressStore())

      const homeAddresses = result.current.getAddressesByTag('home')
      const workAddresses = result.current.getAddressesByTag('work')

      expect(homeAddresses).toHaveLength(2)
      expect(workAddresses).toHaveLength(1)
      expect(homeAddresses.every(addr => addr.tag === 'home')).toBe(true)
      expect(workAddresses.every(addr => addr.tag === 'work')).toBe(true)
    })
  })

  describe('setDefaultAddress', () => {
    let addressId1: string
    let addressId2: string

    beforeEach(() => {
      const { result } = renderHook(() => useAddressStore())
      act(() => {
        result.current.addAddress(createUniqueAddress('111 First', { label: 'Address 1' }))
        result.current.addAddress(createUniqueAddress('222 Second', { label: 'Address 2' }))
      })
      addressId1 = result.current.addresses[0].id
      addressId2 = result.current.addresses[1].id
    })

    it('should set specified address as default and remove from others', () => {
      const { result } = renderHook(() => useAddressStore())

      act(() => {
        result.current.setDefaultAddress(addressId1)
      })

      expect(result.current.addresses.find(addr => addr.id === addressId1)?.isDefault).toBe(true)
      expect(result.current.addresses.find(addr => addr.id === addressId2)?.isDefault).toBe(false)
      expect(result.current.getDefaultAddress()?.id).toBe(addressId1)
    })
  })

  describe('clear', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useAddressStore())
      act(() => {
        result.current.addAddress(createUniqueAddress('111 First'))
        result.current.addAddress(createUniqueAddress('222 Second', { tag: 'work' as AddressTag }))
      })
    })

    it('should clear all addresses', () => {
      const { result } = renderHook(() => useAddressStore())

      act(() => {
        result.current.clear()
      })

      expect(result.current.addresses).toHaveLength(0)
    })
  })

  describe('persistence', () => {
    it('should persist address state to localStorage', () => {
      const { result } = renderHook(() => useAddressStore())

      act(() => {
        result.current.addAddress(mockAddress)
      })

      const persistedId = result.current.addresses[0].id

      // Create new hook instance to test persistence
      const { result: newResult } = renderHook(() => useAddressStore())

      expect(newResult.current.addresses).toHaveLength(1)
      expect(newResult.current.addresses[0].id).toBe(persistedId)
      expect(newResult.current.addresses[0]).toMatchObject(mockAddress)
    })
  })
})