// Re-export generated types from Pydantic schemas
// These are the authoritative source of truth for API types
export * from './pydantic-schemas';

// Forward declarations for types referenced by Pydantic schemas but not yet modeled
// These are placeholders until the corresponding Pydantic models are added
export type OnboardingMeta = Record<string, unknown>;
export type RequestContext = Record<string, unknown>;
export type DeviceInfo = Record<string, unknown>;
export type SavedPaymentMethodResponse = Record<string, unknown>;
export type PaymentMethodType = string;
export type CouponPerformanceItem = Record<string, unknown>;
export type CartProductResponse = Record<string, unknown>;

// Type helper to extract data from APIResponse
// Backend wraps all responses in { success, data, error, error_code }
export type UnwrapResponse<T> = {
  success: boolean;
  data?: T;
  error?: string | Record<string, unknown> | null;
  error_code?: string | null;
};

// List response helper
export type PaginatedResponse<T> = {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
};
