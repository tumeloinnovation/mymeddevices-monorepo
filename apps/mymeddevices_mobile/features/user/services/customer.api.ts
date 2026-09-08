/**
 * Customer/User API endpoints connecting to FastAPI backend
 */
import { api } from "@/services/api.client";
import {
  BackendAddress,
  Customer,
  UpdateCustomerParams,
} from "@/types/user";
import { mapBackendCustomer } from "./customer.mapper";

export { mapBackendCustomer } from "./customer.mapper";

export interface UpdateCustomerData {
  customerId?: number | string;
  params: UpdateCustomerParams;
}

export const customerApi = {
  /**
   * Get customer details from FastAPI /customers/me and addresses
   */
  getCustomer: async (_customerId?: number | string): Promise<Customer> => {
    let profileData: any = null;
    try {
      const response = await api.get<{ data: any }>("/customers/me");
      profileData = response.data?.data || response.data;
    } catch {
      const userRes = await api.get<{ data: any }>("/users/me");
      profileData = userRes.data?.data || userRes.data;
    }

    let addresses: any[] = [];
    try {
      const addrRes = await api.get<{ data: any[] }>("/customers/addresses");
      addresses =
        addrRes.data?.data || (Array.isArray(addrRes.data) ? addrRes.data : []);
    } catch {
      // Addresses might be empty or unconfigured
    }

    return mapBackendCustomer(profileData, addresses);
  },

  /**
   * Search customer by email (returns current customer if matches)
   */
  searchCustomersByEmail: async (_email: string): Promise<Customer[]> => {
    try {
      const cust = await customerApi.getCustomer();
      return cust ? [cust] : [];
    } catch {
      return [];
    }
  },

  /**
   * Update customer details and addresses
   */
  updateCustomer: async (
    arg1: UpdateCustomerData | number | string,
    arg2?: UpdateCustomerParams
  ): Promise<Customer> => {
    const params =
      typeof arg1 === "object" && "params" in arg1
        ? arg1.params
        : (arg2 as UpdateCustomerParams);

    // 1. Update customer profile on PUT /customers/me
    const profileUpdate: Record<string, any> = {};
    if (params?.first_name !== undefined) profileUpdate.first_name = params.first_name;
    if (params?.last_name !== undefined) profileUpdate.last_name = params.last_name;
    if (params?.avatar_url !== undefined) profileUpdate.avatar_url = params.avatar_url;
    const phone =
      params?.billing?.phone || params?.shipping?.phone;
    if (phone) profileUpdate.phone = phone;

    if (Object.keys(profileUpdate).length > 0) {
      try {
        await api.put<{ data: any }>("/customers/me", profileUpdate);
      } catch (e) {
        console.warn("PUT /customers/me error:", e);
      }
    }

    // 2. Handle address updates if shipping/billing provided
    let existingAddresses: any[] = [];
    try {
      const addrRes = await api.get<{ data: any[] }>("/customers/addresses");
      existingAddresses =
        addrRes.data?.data || (Array.isArray(addrRes.data) ? addrRes.data : []);
    } catch {
      // Continue even if fetching addresses fails
    }

    const saveAddress = async (type: "shipping" | "billing", addr: any) => {
      if (!addr || !addr.address_1) return;
      const existing = existingAddresses.find((a: any) => a.type === type);
      const payload = {
        type,
        first_name: addr.first_name || params?.first_name || "",
        last_name: addr.last_name || params?.last_name || "",
        address_line1: addr.address_1,
        address_line2: addr.address_2 || "",
        city: addr.city || "Nairobi",
        state: addr.state || "Nairobi",
        postal_code: addr.postcode || "00100",
        country: addr.country || "Kenya",
        phone: addr.phone || phone || "",
        is_default: true,
      };

      if (existing?.id) {
        await api.put(`/customers/addresses/${existing.id}`, payload);
      } else {
        await api.post("/customers/addresses", payload);
      }
    };

    if (params?.shipping) {
      await saveAddress("shipping", params.shipping);
    }
    if (params?.billing) {
      await saveAddress("billing", params.billing);
    }

    return customerApi.getCustomer();
  },

  /**
   * Get raw customer profile details
   */
  getProfile: async (): Promise<any> => {
    const response = await api.get("/customers/me");
    return response.data?.data || response.data;
  },

  /**
   * Update customer profile info and notification preferences
   */
  updateProfile: async (data: Record<string, any>): Promise<any> => {
    try {
      const response = await api.put("/customers/me", data);
      return response.data?.data || response.data;
    } catch {
      const fallback = await api.patch("/customers/me", data);
      return fallback.data?.data || fallback.data;
    }
  },

  /**
   * Upload customer avatar image
   */
  uploadAvatar: async (formData: FormData): Promise<{ avatar_url: string }> => {
    const response = await api.post("/customers/me/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data?.data || response.data;
  },

  /**
   * List customer saved addresses
   */
  getAddresses: async (): Promise<BackendAddress[]> => {
    try {
      const response = await api.get<{ data: BackendAddress[] }>("/customers/addresses");
      return response.data?.data || (Array.isArray(response.data) ? response.data : []);
    } catch {
      try {
        const fallback = await api.get<{ data: BackendAddress[] }>("/customers/me/addresses");
        return fallback.data?.data || (Array.isArray(fallback.data) ? fallback.data : []);
      } catch {
        return [];
      }
    }
  },

  /**
   * Create new delivery/billing address
   */
  createAddress: async (address: Partial<BackendAddress>): Promise<BackendAddress> => {
    try {
      const response = await api.post<{ data: BackendAddress }>("/customers/addresses", address);
      return response.data?.data || response.data;
    } catch {
      const fallback = await api.post<{ data: BackendAddress }>("/customers/me/addresses", address);
      return fallback.data?.data || fallback.data;
    }
  },

  /**
   * Edit delivery/billing address
   */
  updateAddress: async (
    id: string,
    address: Partial<BackendAddress>
  ): Promise<BackendAddress> => {
    try {
      const response = await api.put<{ data: BackendAddress }>(`/customers/addresses/${id}`, address);
      return response.data?.data || response.data;
    } catch {
      const fallback = await api.patch<{ data: BackendAddress }>(`/customers/me/addresses/${id}`, address);
      return fallback.data?.data || fallback.data;
    }
  },

  /**
   * Delete saved address
   */
  deleteAddress: async (id: string): Promise<void> => {
    try {
      await api.delete(`/customers/addresses/${id}`);
    } catch {
      await api.delete(`/customers/me/addresses/${id}`);
    }
  },

  /**
   * View customer loyalty points and tier ledger
   */
  getLoyaltyStatus: async (): Promise<any> => {
    try {
      const response = await api.get("/customers/me/loyalty");
      return response.data?.data || response.data;
    } catch {
      return { loyalty_points: 0, loyalty_tier: "Bronze" };
    }
  },

  /**
   * List customer wishlist
   */
  getWishlist: async (): Promise<any[]> => {
    try {
      const response = await api.get("/customers/wishlist");
      return response.data?.data || (Array.isArray(response.data) ? response.data : []);
    } catch {
      try {
        const fallback = await api.get("/customers/me/wishlist");
        return fallback.data?.data || (Array.isArray(fallback.data) ? fallback.data : []);
      } catch {
        return [];
      }
    }
  },

  /**
   * Add product to wishlist
   */
  addToWishlist: async (productId: string | number): Promise<any> => {
    try {
      const response = await api.post("/customers/wishlist", { product_id: productId });
      return response.data?.data || response.data;
    } catch {
      const fallback = await api.post("/customers/me/wishlist", { product_id: productId });
      return fallback.data?.data || fallback.data;
    }
  },

  /**
   * Remove item from wishlist
   */
  removeFromWishlist: async (itemId: string | number): Promise<void> => {
    try {
      await api.delete(`/customers/wishlist/${itemId}`);
    } catch {
      await api.delete(`/customers/me/wishlist/${itemId}`);
    }
  },
};


