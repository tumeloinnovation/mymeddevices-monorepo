import { apiClient } from "./api-client";

export interface ShippingSettings {
  flat_fee: number;
  rate_per_km: number;
  max_radius_km: number;
  courier_fee: number;
}

class SystemService {
  async getShippingSettings(): Promise<ShippingSettings> {
    return apiClient.get<ShippingSettings>("/admin/system/shipping-settings");
  }

  async updateShippingSettings(settings: ShippingSettings): Promise<ShippingSettings> {
    return apiClient.put<ShippingSettings>("/admin/system/shipping-settings", settings);
  }
}

export const systemService = new SystemService();
