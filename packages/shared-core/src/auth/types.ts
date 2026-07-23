export type UserRole = 'admin' | 'worker' | 'vendor' | 'customer';
export type LoginMode = 'admin' | 'vendor' | 'customer';
export type CheckoutStep = 'email' | 'login' | 'otp' | 'profile' | 'complete';

export interface BaseUser {
  id: number | string;
  email: string;
  role: UserRole;
  phone: string;
  is_active: boolean;
  name?: string;
  avatar_url?: string;
  created_at?: string;
  roles?: string[];
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  displayName?: string;
  isVendor?: boolean;
  isVendorVerified?: boolean;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  loyaltyPoints?: number;
}

export interface AdminUser extends BaseUser {
  role: 'admin' | 'worker';
}

export interface VendorUser extends BaseUser {
  role: 'vendor';
  store_name?: string;
  permissions?: string[];
  approval_status?: ApprovalStatus;
  company_name?: string;
  rejection_reason?: string;
}

export interface CustomerUser extends BaseUser {
  role: 'customer';
  wooCustomerId?: number;
}

export type AuthUser = AdminUser | VendorUser | CustomerUser;

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  device_id?: string;
  device_name?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  vatNumber?: string;
}

export interface CompleteRegistrationData {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company_name?: string;
  address_street?: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  code: string;
  password: string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in: number;
  user: AuthUser;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
}

export interface ChangeEmailData {
  new_email: string;
}

export interface ConfirmEmailChangeData {
  email: string;
  code: string;
}

export interface DeleteAccountData {
  password?: string;
  confirm?: boolean;
  confirmation?: string;
}

export interface VendorRegisterRequest {
  email: string;
  password: string;
  company_name: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  vat_number?: string;
}

export interface VendorRegisterResponse {
  message: string;
  user_id: string;
  approval_status: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface VendorStatus {
  id: string;
  approval_status: ApprovalStatus;
  company_name?: string;
  store_name?: string;
  email: string;
  phone?: string;
  is_verified: boolean;
  rejection_reason?: string;
  created_at: string;
}

export interface VendorListItem {
  id: string;
  approval_status: ApprovalStatus;
  company_name?: string;
  store_name?: string;
  email: string;
  phone?: string;
  is_verified: boolean;
  rejection_reason?: string;
  created_at: string;
}

export interface VendorListResponse {
  vendors: VendorListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface CreateVendorData {
  email: string;
  password: string;
  company_name: string;
  store_name: string;
  store_description?: string;
  business_email?: string;
  business_phone?: string;
  phone?: string;
  vat_number?: string;
  address_street?: string;
  address_city?: string;
  address_region?: string;
  address_country?: string;
  mpesa_phone?: string;
  mpesa_business_name?: string;
  mpesa_till_number?: string;
  mpesa_paybill_number?: string;
  approval_status?: 'pending' | 'approved' | 'suspended' | 'rejected';
  auto_approve?: boolean;
}

// Vendor Profile types (for self-service and admin viewing)
export interface StoreInfoSchema {
  store_name: string;
  store_description?: string;
  store_logo_url?: string;
  business_email?: string;
  business_phone?: string;
}

export interface AddressSchema {
  street?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
}

export interface PaymentDetailsSchema {
  mpesa_phone?: string;
  mpesa_business_name?: string;
  mpesa_till_number?: string;
  mpesa_paybill_number?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_swift_code?: string;
  bank_iban?: string;
}

export interface OperationalDetailsSchema {
  business_hours?: Record<string, { open: string; close: string }>;
}

export interface VendorProfileUpdate {
  store_info?: StoreInfoSchema;
  address?: AddressSchema;
  payment_details?: PaymentDetailsSchema;
  operational_details?: OperationalDetailsSchema;
  document_urls?: string[];
}

export interface VendorProfileResponse {
  id: string;
  user_id: string;
  store_name: string;
  store_description?: string;
  store_logo_url?: string;
  business_email?: string;
  business_phone?: string;
  address_street?: string;
  address_city?: string;
  address_region?: string;
  address_country: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
  mpesa_phone?: string;
  mpesa_business_name?: string;
  mpesa_till_number?: string;
  mpesa_paybill_number?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
  bank_branch?: string;
  bank_swift_code?: string;
  bank_iban?: string;
  business_hours?: Record<string, { open: string; close: string }>;
  approval_status: string;
  document_urls?: string[];
  company_name?: string;
  vat_number?: string;
  rejection_reason?: string;
  approved_at?: string;
  user_email: string;
  user_phone?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}
