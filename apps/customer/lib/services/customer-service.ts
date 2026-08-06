import { apiClient } from '@mymeddevices/core/lib/services/api-client';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface Customer {
  id: string;
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  loyalty_tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  loyalty_points?: number;
  marketing_enabled?: boolean;
  email_order_updates?: boolean;
  email_promotions?: boolean;
  email_newsletter?: boolean;
  email_security?: boolean;
  sms_order_updates?: boolean;
  sms_promotions?: boolean;
  sms_security?: boolean;
  email_frequency?: string;
  language?: string;
  timezone?: string;
  items_per_page?: number;
  default_sort?: string;
  show_recently_viewed?: boolean;
  reduced_motion?: boolean;
  font_size?: string;
  high_contrast?: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerUpdate {
  first_name?: string;
  last_name?: string;
  phone?: string;
  marketing_enabled?: boolean;
  email_order_updates?: boolean;
  email_promotions?: boolean;
  email_newsletter?: boolean;
  email_security?: boolean;
  sms_order_updates?: boolean;
  sms_promotions?: boolean;
  sms_security?: boolean;
  email_frequency?: string;
  language?: string;
  timezone?: string;
  items_per_page?: number;
  default_sort?: string;
  show_recently_viewed?: boolean;
  reduced_motion?: boolean;
  font_size?: string;
  high_contrast?: boolean;
  notes?: string;
}

export interface Address {
  id: string;
  customer_id: string;
  type: 'shipping' | 'billing';
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  phone?: string;
  is_default: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface AddressCreate {
  type: 'shipping' | 'billing';
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
  phone?: string;
  is_default?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface AddressUpdate {
  first_name?: string;
  last_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  is_default?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface LoyaltyStatus {
  customer_id: string;
  current_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points_balance: number;
  points_to_next_tier: number;
  next_tier: 'bronze' | 'silver' | 'gold' | 'platinum' | null;
  total_earned: number;
  total_redeemed: number;
  tier_benefits: string[];
}

export interface WishlistItem {
  id: string;
  customer_id: string;
  product_id: string;
  notes?: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    price: string;
    image_url?: string;
    stock_quantity: number;
  };
}

export interface Review {
  id: string;
  customer_id: string;
  product_id: string;
  rating: number;
  comment?: string;
  is_verified_purchase: boolean;
  contains_profanity?: boolean;
  flagged_words?: string[];
  moderation_status?: 'visible' | 'hidden' | 'removed' | string;
  is_approved?: boolean;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    slug?: string;
    image_url?: string;
  };
}

export interface ReviewCreate {
  product_id: string;
  rating: number;
  comment?: string;
}

export interface ReviewUpdate {
  rating?: number;
  comment?: string;
}

// ============================================================================
// Customer Service
// ============================================================================

/**
 * Customer service for API integration
 *
 * Handles all customer-related operations including:
 * - Customer profile management
 * - Address management
 * - Loyalty program
 * - Wishlist management
 * - Product reviews
 * - Device Management (Security)
 */
export const customerService = {
  /**
   * Upload avatar image
   */
  async uploadAvatar(file: File): Promise<{ avatar_url: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post<{ success: boolean; data: { avatar_url: string } }>(
        '/customers/me/avatar',
        formData
      );
      if (response && response.data) {
        toast.success('Avatar uploaded successfully');
        return response.data;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      toast.error('Failed to upload avatar');
      throw error;
    }
  },

  // ============================================================================
  // Customer Profile
  // ============================================================================

  /**
   * Get customer profile
   */
  async getProfile(): Promise<Customer> {
    try {
      const response = await apiClient.get<any>('/customers/me');

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to fetch customer profile:', error);
      throw error;
    }
  },

  /**
   * Update customer profile
   */
  async updateProfile(data: CustomerUpdate): Promise<Customer> {
    try {
      const response = await apiClient.put<any>('/customers/me', data);

      if (response && response.data) {
        toast.success('Profile updated successfully');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to update customer profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  },

  /**
   * Get loyalty status
   */
  async getLoyaltyStatus(): Promise<LoyaltyStatus> {
    try {
      const response = await apiClient.get<any>('/customers/me/loyalty');

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to fetch loyalty status:', error);
      throw error;
    }
  },

  // ============================================================================
  // Address Management
  // ============================================================================

  /**
   * Get customer addresses
   */
  async getAddresses(): Promise<Address[]> {
    try {
      const response = await apiClient.get<any>('/customers/addresses');

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      throw error;
    }
  },

  /**
   * Create address
   */
  async createAddress(data: AddressCreate): Promise<Address> {
    try {
      const response = await apiClient.post<any>('/customers/addresses', data);

      if (response && response.data) {
        toast.success('Address added successfully');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to create address:', error);
      toast.error('Failed to add address');
      throw error;
    }
  },

  /**
   * Update address
   */
  async updateAddress(id: string, data: AddressUpdate): Promise<Address> {
    try {
      const response = await apiClient.put<any>(`/customers/addresses/${id}`, data);

      if (response && response.data) {
        toast.success('Address updated successfully');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to update address:', error);
      toast.error('Failed to update address');
      throw error;
    }
  },

  /**
   * Delete address
   */
  async deleteAddress(id: string): Promise<void> {
    try {
      await apiClient.delete(`/customers/addresses/${id}`);
      toast.success('Address deleted successfully');
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast.error('Failed to delete address');
      throw error;
    }
  },

  /**
   * Get default shipping address
   */
  async getDefaultShippingAddress(): Promise<Address | null> {
    try {
      const response = await apiClient.get<any>('/customers/addresses/default/shipping');

      if (response && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch default shipping address:', error);
      return null;
    }
  },

  /**
   * Get default billing address
   */
  async getDefaultBillingAddress(): Promise<Address | null> {
    try {
      const response = await apiClient.get<any>('/customers/addresses/default/billing');

      if (response && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch default billing address:', error);
      return null;
    }
  },

  /**
   * Set default address
   */
  async setDefaultAddress(id: string, type: 'shipping' | 'billing'): Promise<Address> {
    try {
      const response = await apiClient.put<any>(
        `/customers/addresses/${id}/default`,
        { type }
      );

      if (response && response.data) {
        toast.success(`Default ${type} address updated`);
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to set default address:', error);
      toast.error('Failed to set default address');
      throw error;
    }
  },

  // ============================================================================
  // Wishlist Management
  // ============================================================================

  /**
   * Get wishlist items
   */
  async getWishlist(): Promise<WishlistItem[]> {
    try {
      const response = await apiClient.get<any>('/customers/wishlist');

      if (response && response.data) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      throw error;
    }
  },

  /**
   * Add item to wishlist
   */
  async addToWishlist(productId: string, notes?: string): Promise<WishlistItem> {
    try {
      const response = await apiClient.post<any>('/customers/wishlist', {
        product_id: productId,
        notes,
      });

      if (response && response.data) {
        toast.success('Added to wishlist');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      toast.error('Failed to add to wishlist');
      throw error;
    }
  },

  /**
   * Update wishlist item
   */
  async updateWishlistItem(id: string, notes?: string): Promise<WishlistItem> {
    try {
      const response = await apiClient.put<any>(`/customers/wishlist/items/${id}`, {
        notes,
      });

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to update wishlist item:', error);
      throw error;
    }
  },

  /**
   * Remove item from wishlist
   */
  async removeFromWishlist(itemId: string): Promise<void> {
    try {
      await apiClient.delete(`/customers/wishlist/items/${itemId}`);
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      toast.error('Failed to remove from wishlist');
      throw error;
    }
  },

  /**
   * Clear entire wishlist
   */
  async clearWishlist(): Promise<void> {
    try {
      await apiClient.delete('/customers/wishlist');
      toast.success('Wishlist cleared');
    } catch (error) {
      console.error('Failed to clear wishlist:', error);
      toast.error('Failed to clear wishlist');
      throw error;
    }
  },

  /**
   * Move wishlist items to cart
   */
  async moveWishlistToCart(itemIds: string[], action: 'move' | 'copy' = 'move'): Promise<{
    added_count: number;
    skipped_count: number;
    errors: any[];
  }> {
    try {
      const response = await apiClient.post<any>('/shopping/cart/wishlist/add', {
        wishlist_item_ids: itemIds,
        action,
      });

      if (response && response.data) {
        toast.success(`${response.data.added_count} items added to cart`);
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to move wishlist to cart:', error);
      toast.error('Failed to add items to cart');
      throw error;
    }
  },

  // ============================================================================
  // Product Reviews
  // ============================================================================

  /**
   * Get customer reviews
   */
  async getReviews(): Promise<Review[]> {
    try {
      const response = await apiClient.get<any>('/customers/reviews');
      const data = response?.data ?? response;
      if (Array.isArray(data)) return data;
      if (data?.reviews && Array.isArray(data.reviews)) return data.reviews;
      return [];
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      throw error;
    }
  },

  /**
   * Create product review
   */
  async createReview(data: ReviewCreate): Promise<Review> {
    try {
      const response = await apiClient.post<any>('/customers/reviews', data);
      return response?.data ?? response;
    } catch (error: any) {
      console.error('Failed to create review:', error);
      throw error;
    }
  },

  /**
   * Update review
   */
  async updateReview(id: string, data: ReviewUpdate): Promise<Review> {
    try {
      const response = await apiClient.put<any>(`/customers/reviews/${id}`, data);
      return response?.data ?? response;
    } catch (error: any) {
      console.error('Failed to update review:', error);
      throw error;
    }
  },

  /**
   * Delete review
   */
  async deleteReview(id: string): Promise<void> {
    try {
      await apiClient.delete(`/customers/reviews/${id}`);
    } catch (error) {
      console.error('Failed to delete review:', error);
      throw error;
    }
  },

  // ============================================================================
  // Device Management (Security)
  // ============================================================================

  /**
   * Get all active devices for the current user
   */
  async getDevices(): Promise<{ id: string; name: string; last_active: string; is_current: boolean }[]> {
    try {
      const response = await apiClient.get<any>('/auth/devices');
      if (response && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      throw error;
    }
  },

  /**
   * Delete a user device
   */
  async deleteDevice(deviceId: string): Promise<void> {
    try {
      await apiClient.delete(`/auth/devices/${deviceId}`);
      toast.success('Device removed successfully');
    } catch (error) {
      console.error('Failed to delete device:', error);
      toast.error('Failed to remove device');
      throw error;
    }
  },

  /**
   * Delete all other devices
   */
  async signOutAllDevices(currentDeviceId: string): Promise<void> {
    try {
      await apiClient.post('/auth/devices/delete-all', { current_device_id: currentDeviceId });
      toast.success('All other devices removed successfully');
    } catch (error) {
      console.error('Failed to delete all devices:', error);
      toast.error('Failed to remove devices');
      throw error;
    }
  },
};

// ============================================================================
// Export
// ============================================================================
