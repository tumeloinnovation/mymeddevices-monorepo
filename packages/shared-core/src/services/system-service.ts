import { apiClient } from "./api-client";

export interface ShippingSettings {
  flat_fee: number;
  rate_per_km: number;
  max_radius_km: number;
  courier_fee: number;
}

export interface GeneralSettings {
  site_name: string;
  site_tagline?: string;
  support_email: string;
  support_phone: string;
  currency: string;
  currency_symbol?: string;
  timezone: string;
  maintenance_mode: boolean;
  allow_guest_checkout: boolean;
  order_prefix: string;
  vat_percentage?: number;
  address?: string;
}

export interface PlatformFees {
  base_commission_percent: number;
  flat_transaction_fee: number;
  category_overrides?: Record<string, number>;
  tax_vat_percent: number;
  minimum_payout_amount: number;
  payout_schedule?: string;
  withdrawal_fee?: number;
}

export interface AuthSettings {
  refresh_token_expire_days: number;
  access_token_expire_minutes: number;
  auto_reload_on_expiry_trigger?: boolean;
}

export interface PermissionItem {
  key: string;
  label: string;
  description: string;
  risk: "low" | "medium" | "high" | "critical";
}

export interface PermissionCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  permissions: PermissionItem[];
}

export interface RoleDefinition {
  key: string;
  label: string;
  description: string;
  badge_color: string;
  is_system: boolean;
}

export interface PermissionsMatrixData {
  categories: PermissionCategory[];
  roles: RoleDefinition[];
  matrix: Record<string, string[]>;
  is_customized?: boolean;
}

export interface UpdatePermissionsMatrixPayload {
  matrix: Record<string, string[]>;
  custom_roles?: RoleDefinition[];
}

class SystemService {
  async getShippingSettings(): Promise<ShippingSettings> {
    return apiClient.get<ShippingSettings>("/admin/system/shipping-settings");
  }

  async updateShippingSettings(settings: ShippingSettings): Promise<ShippingSettings> {
    return apiClient.put<ShippingSettings>("/admin/system/shipping-settings", settings);
  }

  async getGeneralSettings(): Promise<GeneralSettings> {
    return apiClient.get<GeneralSettings>("/admin/system/general-settings");
  }

  async updateGeneralSettings(settings: Partial<GeneralSettings>): Promise<GeneralSettings> {
    return apiClient.put<GeneralSettings>("/admin/system/general-settings", settings);
  }

  async getPlatformFees(): Promise<PlatformFees> {
    return apiClient.get<PlatformFees>("/admin/system/platform-fees");
  }

  async updatePlatformFees(fees: Partial<PlatformFees>): Promise<PlatformFees> {
    return apiClient.put<PlatformFees>("/admin/system/platform-fees", fees);
  }

  async getAuthSettings(): Promise<AuthSettings> {
    return apiClient.get<AuthSettings>("/admin/system/auth-settings");
  }

  async updateAuthSettings(settings: Partial<AuthSettings>): Promise<AuthSettings> {
    return apiClient.put<AuthSettings>("/admin/system/auth-settings", settings);
  }

  async getRateLimits(): Promise<Record<string, [number, number]>> {
    return apiClient.get<Record<string, [number, number]>>("/admin/system/rate-limits");
  }

  async updateRateLimits(limits: Record<string, [number, number]>): Promise<Record<string, [number, number]>> {
    return apiClient.put<Record<string, [number, number]>>("/admin/system/rate-limits", limits);
  }

  async getPermissions(): Promise<PermissionsMatrixData> {
    return apiClient.get<PermissionsMatrixData>("/admin/system/permissions");
  }

  async updatePermissions(payload: UpdatePermissionsMatrixPayload): Promise<{
    message: string;
    matrix: Record<string, string[]>;
    custom_roles?: RoleDefinition[];
  }> {
    return apiClient.put("/admin/system/permissions", payload);
  }

  async resetPermissions(): Promise<PermissionsMatrixData> {
    return apiClient.post<PermissionsMatrixData>("/admin/system/permissions/reset", {});
  }
}

export const systemService = new SystemService();


