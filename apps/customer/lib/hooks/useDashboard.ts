import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customer-service';
import { toast } from 'sonner';
import type { CustomerUpdate, AddressCreate, AddressUpdate, ReviewCreate, ReviewUpdate } from '../services/customer-service';

// ============================================================================
// Customer Profile Hooks
// ============================================================================

/**
 * Get customer profile
 */
export function useCustomerProfile() {
  return useQuery({
    queryKey: ['customer', 'profile'],
    queryFn: () => customerService.getProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Upload avatar mutation
 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => customerService.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] });
    },
  });
}

/**
 * Update customer profile mutation
 */
export function useUpdateCustomerProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CustomerUpdate) => customerService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'profile'] });
    },
  });
}

// ============================================================================
// Customer Loyalty Hooks
// ============================================================================

/**
 * Get customer loyalty status
 */
export function useCustomerLoyalty() {
  return useQuery({
    queryKey: ['customer', 'loyalty'],
    queryFn: () => customerService.getLoyaltyStatus(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// Address Hooks
// ============================================================================

/**
 * Get customer addresses
 */
export function useCustomerAddresses() {
  return useQuery({
    queryKey: ['customer', 'addresses'],
    queryFn: () => customerService.getAddresses(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get default shipping address
 */
export function useDefaultShippingAddress() {
  return useQuery({
    queryKey: ['customer', 'addresses', 'default', 'shipping'],
    queryFn: () => customerService.getDefaultShippingAddress(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get default billing address
 */
export function useDefaultBillingAddress() {
  return useQuery({
    queryKey: ['customer', 'addresses', 'default', 'billing'],
    queryFn: () => customerService.getDefaultBillingAddress(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Create address mutation
 */
export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddressCreate) => customerService.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'addresses', 'default'] });
    },
  });
}

/**
 * Update address mutation
 */
export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressUpdate }) =>
      customerService.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'addresses', 'default'] });
    },
  });
}

/**
 * Delete address mutation
 */
export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'addresses', 'default'] });
    },
  });
}

/**
 * Set default address mutation
 */
export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: 'shipping' | 'billing' }) =>
      customerService.setDefaultAddress(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'addresses'] });
      queryClient.invalidateQueries({ queryKey: ['customer', 'addresses', 'default'] });
    },
  });
}

// ============================================================================
// Wishlist Hooks
// ============================================================================

/**
 * Get customer wishlist
 */
export function useCustomerWishlist() {
  return useQuery({
    queryKey: ['customer', 'wishlist'],
    queryFn: () => customerService.getWishlist(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Add to wishlist mutation
 */
export function useAddToWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, notes }: { productId: string; notes?: string }) =>
      customerService.addToWishlist(productId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'wishlist'] });
    },
  });
}

/**
 * Update wishlist item mutation
 */
export function useUpdateWishlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      customerService.updateWishlistItem(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'wishlist'] });
    },
  });
}

/**
 * Remove from wishlist mutation
 */
export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => customerService.removeFromWishlist(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'wishlist'] });
    },
  });
}

/**
 * Clear wishlist mutation
 */
export function useClearWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => customerService.clearWishlist(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'wishlist'] });
    },
  });
}

/**
 * Move wishlist to cart mutation
 */
export function useMoveWishlistToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemIds, action }: { itemIds: string[]; action?: 'move' | 'copy' }) =>
      customerService.moveWishlistToCart(itemIds, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

// ============================================================================
// Reviews Hooks
// ============================================================================

/**
 * Get customer reviews
 */
export function useCustomerReviews() {
  return useQuery({
    queryKey: ['customer', 'reviews'],
    queryFn: () => customerService.getReviews(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Create review mutation
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReviewCreate) => customerService.createReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'reviews'] });
      // Also invalidate product queries that might show reviews
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
}

/**
 * Update review mutation
 */
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewUpdate }) =>
      customerService.updateReview(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
}

/**
 * Delete review mutation
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerService.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
}

// ============================================================================
// Combined Dashboard Data Hook
// ============================================================================

/**
 * Get all dashboard data in a single hook
 * Useful for loading multiple dashboard datasets at once
 */
export function useDashboardData() {
  const profile = useCustomerProfile();
  const addresses = useCustomerAddresses();
  const wishlist = useCustomerWishlist();
  const loyalty = useCustomerLoyalty();
  const reviews = useCustomerReviews();

  return {
    profile,
    addresses,
    wishlist,
    loyalty,
    reviews,
    isLoading:
      profile.isLoading ||
      addresses.isLoading ||
      wishlist.isLoading ||
      loyalty.isLoading ||
      reviews.isLoading,
    isError:
      profile.isError ||
      addresses.isError ||
      wishlist.isError ||
      loyalty.isError ||
      reviews.isError,
  };
}
