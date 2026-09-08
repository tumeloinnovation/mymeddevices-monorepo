export interface AuthUser {
  id: string | number;
  username: string;
  email: string;
  display_name: string;
  roles: string[];
  is_vendor_verified?: boolean;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
  billing?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address_1?: string;
    address_2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    email?: string;
    phone?: string;
  };
  shipping?: any;
  vendor?: {
    company_name?: string;
    company_email?: string;
    vat_number?: string;
    phone?: string;
    location?: any;
    verified: 'pending' | 'approved' | 'rejected';
    verification_date?: string;
    rejection_reason?: string;
    rejection_date?: string;
    capabilities: {
      enable_selling: boolean;
      publish_directly: boolean;
      is_featured: boolean;
    };
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
  device_id?: string;
  device_name?: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  success: boolean;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user_id: string | number;
    username: string;
    email: string;
    display_name: string;
    roles: string[];
    is_vendor_verified?: boolean;
  };
  message: string;
  code?: number;
}

export interface RegisterRequest {
  email: string;
  username?: string;
  password: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone?: string;
  role?: string;
}

export interface RegisterResponse {
  success: boolean;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user_id: string | number;
    username: string;
    email: string;
    display_name: string;
    roles: string[];
    is_vendor_verified?: boolean;
  };
  message: string;
  code?: number;
}

export interface OTPRequest {
  email: string;
  purpose?: 'verification' | 'reset_password' | 'login' | 'email_change' | 'registration' | string;
}

export interface OTPVerifyRequest {
  email: string;
  code: string;
  purpose?: 'verification' | 'reset_password' | 'login' | 'email_change' | 'registration' | string;
}

export interface OTPResponse {
  success: boolean;
  data?: {
    email: string;
    verified?: boolean;
    message?: string;
  };
  message: string;
  code?: number;
}

export interface ForgotPasswordRequest {
  email: string;
  source?: 'mobile' | 'web';
}

export interface VerifyResetOTPRequest {
  email: string;
  code: string;
}

export interface VerifyResetOTPResponse {
  success: boolean;
  data?: {
    user_id: string | number;
    reset_token: string;
  };
  message: string;
  code?: number;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  password: string;
  user_id?: string | number;
}

export interface UpdateUserRequest {
  email?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  phone?: string;
  avatar_url?: string;
}

export interface ValidateTokenResponse {
  success: boolean;
  data: {
    user_id: string | number;
    username: string;
    email: string;
    display_name: string;
    roles: string[];
    is_vendor_verified?: boolean;
    valid: boolean;
    expires_in: number;
  };
  message: string;
  code?: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data?: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user_id: string | number;
    username: string;
    email: string;
    display_name: string;
    roles: string[];
    is_vendor_verified?: boolean;
  };
  message: string;
  code?: number;
}

export interface RegisterInitiateRequest {
  email: string;
  role?: string;
}

export interface RegisterCompleteRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  company_name?: string;
}

export interface OTPLoginRequest {
  email?: string;
  phone?: string;
  identifier?: string;
  code: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface DeviceSession {
  id: string;
  device_id: string;
  device_name?: string;
  ip_address?: string;
  user_agent?: string;
  last_active: string;
  created_at: string;
  is_current?: boolean;
}

export interface AuthResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  code?: number;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
}
