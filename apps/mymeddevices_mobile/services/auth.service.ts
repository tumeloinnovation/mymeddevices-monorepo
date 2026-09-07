import { jwtDecode } from "jwt-decode";
import {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  OTPRequest,
  OTPVerifyRequest,
  OTPResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ValidateTokenResponse,
  AuthResponse,
  UpdateUserRequest,
  VerifyResetOTPRequest,
  VerifyResetOTPResponse,
  RefreshTokenResponse,
} from "@/types/auth";
import { tokenStorage } from "@/utils/tokenStorage";
import { api, API_BASE_URL } from "@/services/api.client";
import axios from "axios";

class AuthService {
  private normalizeUserData(userData: any): AuthUser {
    const user = userData.user || userData;
    const first = user.first_name || "";
    const last = user.last_name || "";
    const display = `${first} ${last}`.trim() || user.email || "Customer";

    return {
      id: user.id || user.user_id,
      username: user.email || user.username,
      email: user.email,
      display_name: display,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      roles: user.roles || [user.role || "customer"],
    };
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const email = credentials.username || (credentials as any).email;
      const response = await api.post("/auth/login", {
        email,
        password: credentials.password,
        device_id: "mobile-app",
        device_name: "MyMedDevices Mobile App",
      });

      const payload = response.data?.data || response.data;
      const user = payload.user || payload;
      const normalizedUser = this.normalizeUserData(user);

      await this.storeTokens(
        payload.access_token,
        payload.refresh_token,
        normalizedUser
      );

      return {
        success: true,
        data: {
          access_token: payload.access_token,
          refresh_token: payload.refresh_token,
          token_type: payload.token_type || "bearer",
          expires_in: payload.expires_in || 1800,
          user_id: normalizedUser.id,
          username: normalizedUser.email,
          email: normalizedUser.email,
          display_name: normalizedUser.display_name,
          roles: normalizedUser.roles,
        },
        message: "Login successful",
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await api.post("/auth/register", {
        email: data.email,
        password: data.password,
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone: data.phone || null,
        role: "customer",
      });

      const payload = response.data?.data || response.data;
      const user = payload.user || payload;
      const normalizedUser = this.normalizeUserData(user);

      if (payload.access_token && payload.refresh_token) {
        await this.storeTokens(
          payload.access_token,
          payload.refresh_token,
          normalizedUser
        );
      }

      return {
        success: true,
        data: {
          access_token: payload.access_token || "",
          refresh_token: payload.refresh_token || "",
          token_type: payload.token_type || "bearer",
          expires_in: payload.expires_in || 1800,
          user_id: normalizedUser.id,
          username: normalizedUser.email,
          email: normalizedUser.email,
          display_name: normalizedUser.display_name,
          roles: normalizedUser.roles,
        },
        message: "Registration successful",
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async registerInitiate(data: { email: string; role?: string }): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/register/initiate", {
        email: data.email.trim().toLowerCase(),
        role: data.role || "customer",
      });
      return {
        success: true,
        message: response.data?.data?.message || response.data?.message || "Verification code sent to your email!",
        data: response.data?.data || response.data,
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async registerComplete(data: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    company_name?: string;
  }): Promise<RegisterResponse> {
    try {
      const response = await api.post("/auth/register/complete", {
        email: data.email.trim().toLowerCase(),
        password: data.password,
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        phone: data.phone || null,
        company_name: data.company_name || null,
      });

      // After registration is completed, log in automatically to get access & refresh tokens
      const loginRes = await this.login({
        username: data.email.trim().toLowerCase(),
        password: data.password,
      });

      return {
        success: true,
        data: loginRes.data,
        message: response.data?.data?.message || response.data?.message || "Account created successfully!",
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async loginWithOTP(data: { identifier?: string; email?: string; code: string }): Promise<LoginResponse> {
    try {
      const email = (data.email || data.identifier || "").trim().toLowerCase();
      const response = await api.post("/auth/login/otp", {
        email,
        code: data.code,
        device_id: "mobile-app",
        device_name: "MyMedDevices Mobile App",
      });

      const payload = response.data?.data || response.data;
      const user = payload.user || payload;
      const normalizedUser = this.normalizeUserData(user);

      await this.storeTokens(
        payload.access_token,
        payload.refresh_token,
        normalizedUser
      );

      return {
        success: true,
        data: {
          access_token: payload.access_token,
          refresh_token: payload.refresh_token,
          token_type: payload.token_type || "bearer",
          expires_in: payload.expires_in || 1800,
          user_id: normalizedUser.id,
          username: normalizedUser.email,
          email: normalizedUser.email,
          display_name: normalizedUser.display_name,
          roles: normalizedUser.roles,
        },
        message: "Login successful",
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async createGuestSession(): Promise<{ guest_token: string }> {
    try {
      const response = await api.post("/auth/guest", {
        device_id: "mobile-app",
      });
      const payload = response.data?.data || response.data;
      return {
        guest_token: payload.guest_token || payload.access_token || "",
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async sendOTP(data: OTPRequest): Promise<OTPResponse> {
    try {
      const purpose = data.purpose || "verification";
      const normalizedEmail = data.email.trim().toLowerCase();

      if (purpose === "registration" || purpose === "verification") {
        const initRes = await this.registerInitiate({
          email: normalizedEmail,
          role: "customer",
        });
        return {
          success: true,
          message: initRes.message || "Verification code sent to your email!",
          data: { email: normalizedEmail, verified: false },
        };
      }

      const response = await api.post("/otp/send", {
        email: normalizedEmail,
        purpose: purpose === "password_reset" ? "reset_password" : purpose,
      });

      return {
        success: true,
        message: response.data?.data?.message || response.data?.message || "Verification code sent to your email!",
        data: { email: normalizedEmail, verified: false },
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async verifyOTP(data: OTPVerifyRequest): Promise<OTPResponse> {
    try {
      const purpose = data.purpose === "registration" || !data.purpose ? "verification" : data.purpose;
      const normalizedEmail = data.email.trim().toLowerCase();
      const response = await api.post("/otp/verify", {
        email: normalizedEmail,
        code: data.code,
        purpose: purpose === "password_reset" ? "reset_password" : purpose,
      });
      return {
        success: true,
        message: response.data?.data?.message || response.data?.message || "Email verified successfully",
        data: { email: normalizedEmail, verified: true },
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async resendOTP(email: string, purpose: string = "verification"): Promise<OTPResponse> {
    const normalizedEmail = email.trim().toLowerCase();
    if (purpose === "registration" || purpose === "verification") {
      try {
        const response = await api.post("/otp/resend", {
          email: normalizedEmail,
          purpose: "verification",
        });
        return {
          success: true,
          message: response.data?.data?.message || response.data?.message || "New verification code generated. Please check your email inbox.",
          data: { email: normalizedEmail, verified: false },
        };
      } catch (error) {
        return this.sendOTP({ email: normalizedEmail, purpose: "verification" });
      }
    }
    return this.sendOTP({ email: normalizedEmail, purpose });
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/forgot-password", {
        email: data.email.trim().toLowerCase(),
      });
      return {
        success: true,
        message:
          response.data?.data?.message || response.data?.message || "Password reset instructions sent to email",
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async verifyResetOTP(
    data: VerifyResetOTPRequest
  ): Promise<VerifyResetOTPResponse> {
    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      await api.post("/otp/verify", {
        email: normalizedEmail,
        code: data.code,
        purpose: "reset_password",
      });
      return {
        success: true,
        message: "OTP verified",
        data: {
          user_id: 0,
          reset_token: data.code,
        },
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/reset-password", {
        email: data.email.trim().toLowerCase(),
        code: data.token,
        new_password: data.password,
      });
      return {
        success: true,
        message: response.data?.data?.message || response.data?.message || "Password reset successfully",
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async refreshToken(): Promise<RefreshTokenResponse["data"] | null> {
    try {
      const refreshToken = await this.getStoredRefreshToken();
      if (!refreshToken) return null;

      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        { refresh_token: refreshToken },
        { headers: { "Content-Type": "application/json" } }
      );

      const payload = response.data?.data || response.data;
      if (payload?.access_token) {
        const user = await this.getStoredUser();
        if (user) {
          await this.storeTokens(
            payload.access_token,
            payload.refresh_token || refreshToken,
            user
          );
        }
        return payload;
      }
      return null;
    } catch (error: any) {
      console.error("Token refresh failed:", error);
      return null;
    }
  }

  async validateToken(token?: string): Promise<ValidateTokenResponse> {
    try {
      const tokenToValidate = token || (await this.getStoredAccessToken());
      if (!tokenToValidate) {
        throw new Error("No token to validate");
      }

      const response = await api.get("/users/me", {
        headers: { Authorization: `Bearer ${tokenToValidate}` },
      });

      const user = response.data?.data || response.data;
      return {
        success: true,
        message: "Token valid",
        data: {
          user_id: user.id,
          username: user.email,
          email: user.email,
          display_name:
            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
            user.email,
          roles: [user.role || "customer"],
          valid: true,
          expires_in: 1800,
        },
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const response = await api.get("/users/me");
      const user = response.data?.data || response.data;
      if (user?.id) {
        const normalizedUser = this.normalizeUserData(user);
        await this.storeUser(normalizedUser);
        return normalizedUser;
      }
      return await this.getStoredUser();
    } catch (error: any) {
      return await this.getStoredUser();
    }
  }

  async updateUser(data: UpdateUserRequest): Promise<AuthUser> {
    try {
      const payload: Record<string, any> = {};
      if (data.first_name !== undefined) payload.first_name = data.first_name;
      if (data.last_name !== undefined) payload.last_name = data.last_name;
      if (data.phone !== undefined) payload.phone = data.phone;

      const response = await api.put("/customers/me", payload);

      const updated = response.data?.data || response.data;
      const currentUser = await this.getStoredUser();
      const normalizedUser: AuthUser = {
        ...(currentUser || ({} as AuthUser)),
        first_name: updated.first_name ?? data.first_name,
        last_name: updated.last_name ?? data.last_name,
        phone: updated.phone ?? data.phone ?? currentUser?.phone,
        display_name: `${updated.first_name || data.first_name || ""} ${updated.last_name || data.last_name || ""}`.trim(),
      };
      await this.storeUser(normalizedUser);
      return normalizedUser;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async changePassword(data: { current_password: string; new_password: string }): Promise<AuthResponse> {
    try {
      const response = await api.post("/auth/change-password", {
        old_password: data.current_password,
        new_password: data.new_password,
      });
      return {
        success: true,
        message: response.data?.message || "Password updated successfully",
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async getDevices(): Promise<any[]> {
    try {
      const response = await api.get("/auth/devices");
      return response.data?.data || (Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async revokeDevice(deviceId: string): Promise<AuthResponse> {
    try {
      const response = await api.delete(`/auth/devices/${deviceId}`);
      return {
        success: true,
        message: response.data?.message || "Device session revoked",
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = await this.getStoredRefreshToken();
      if (refreshToken) {
        await api.post("/auth/logout", { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      await this.clearAuth();
    }
  }

  async deleteAccount(
    _customerId: number | string,
    _password: string
  ): Promise<void> {
    throw new Error(
      "Automated account deletion is not available. Please contact support@mymeddevices.com to request account removal."
    );
  }

  // Storage methods
  async storeTokens(
    accessToken: string,
    refreshToken: string,
    user: AuthUser
  ): Promise<void> {
    await tokenStorage.storeAuthSession(accessToken, refreshToken, user);
  }

  async getStoredAccessToken(): Promise<string | null> {
    return await tokenStorage.getAccessToken();
  }

  async getStoredRefreshToken(): Promise<string | null> {
    return await tokenStorage.getRefreshToken();
  }

  async getStoredUser(): Promise<AuthUser | null> {
    return await tokenStorage.getUser<AuthUser>();
  }

  async storeUser(user: AuthUser): Promise<void> {
    await tokenStorage.setUser(user);
  }

  async clearAuth(): Promise<void> {
    await tokenStorage.clearAuthSession();
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded.exp) return false;
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime + 30;
    } catch (error) {
      return true;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const accessToken = await this.getStoredAccessToken();
    if (!accessToken) return false;
    if (this.isTokenExpired(accessToken)) {
      const refreshResult = await this.refreshToken();
      return refreshResult !== null;
    }
    return true;
  }

  private handleError(error: any): Error {
    if (error.response?.data?.detail) {
      return new Error(
        typeof error.response.data.detail === "string"
          ? error.response.data.detail
          : JSON.stringify(error.response.data.detail)
      );
    }
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }
    if (error.message) {
      return new Error(error.message);
    }
    return new Error("An unexpected error occurred");
  }
}

export const authService = new AuthService();
export default authService;


