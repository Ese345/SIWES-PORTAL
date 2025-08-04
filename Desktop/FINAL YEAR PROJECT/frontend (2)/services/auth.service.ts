// filepath: e:\Projects_CU\Ese\frontend\services\auth.service.ts
import { apiClient } from "@/lib/api-client";
import {
  LoginCredentials,
  LoginResponse,
  ChangePasswordData,
  User,
} from "@/types/auth";
import { API_ROUTES } from "@/constants";

export class AuthService {
  /**
   * Login user with email and password
   */
  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      API_ROUTES.AUTH.LOGIN,
      credentials
    );
    return response;
  }

  /**
   * Register new user
   */
  static async register(userData: {
    email: string;
    password: string;
    name: string;
    role: string;
    matricNumber?: string;
    department?: string;
  }): Promise<{ user: User; message: string }> {
    const response = await apiClient.post<{
      data: { user: User; message: string };
    }>(API_ROUTES.AUTH.REGISTER, userData);
    return response.data;
  }

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<User> {
    const response = await apiClient.get<{ data: User }>(
      API_ROUTES.AUTH.PROFILE
    );
    return response.data;
  }

  /**
   * Update user profile
   */
  static async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiClient.put<{ data: User }>(
      API_ROUTES.AUTH.PROFILE,
      userData
    );
    return response.data;
  }

  /**
   * Change password
   */
  static async changePassword(
    passwordData: ChangePasswordData
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ data: { message: string } }>(
      API_ROUTES.AUTH.CHANGE_PASSWORD,
      passwordData
    );
    return response.data;
  }

  /**
   * Request password reset
   */
  static async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ data: { message: string } }>(
      API_ROUTES.AUTH.FORGOT_PASSWORD,
      { email }
    );
    return response.data;
  }

  /**
   * Reset password with token
   */
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const response = await apiClient.post<{ data: { message: string } }>(
      API_ROUTES.AUTH.RESET_PASSWORD,
      { token, newPassword }
    );
    return response.data;
  }

  /**
   * Refresh access token
   */
  static async refreshToken(
    refreshToken: string
  ): Promise<{ accessToken: string }> {
    const response = await apiClient.post<{ data: { accessToken: string } }>(
      API_ROUTES.AUTH.REFRESH,
      { refreshToken }
    );
    console.log("🚀 ~ refreshToken ~ response:", response);
    return response.data;
  }

  /**
   * Logout user
   */
  static async logout(): Promise<{ message: string }> {
    const response = await apiClient.post<{ data: { message: string } }>(
      API_ROUTES.AUTH.LOGOUT
    );
    return response.data;
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ data: { message: string } }>(
      API_ROUTES.AUTH.VERIFY_EMAIL,
      { token }
    );
    return response.data;
  }

  /**
   * Resend email verification
   */
  static async resendVerification(email: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ data: { message: string } }>(
      API_ROUTES.AUTH.RESEND_VERIFICATION,
      { email }
    );
    return response.data;
  }

  /**
   * Check if email exists
   */
  static async checkEmail(email: string): Promise<{ exists: boolean }> {
    const response = await apiClient.post<{ data: { exists: boolean } }>(
      API_ROUTES.AUTH.CHECK_EMAIL,
      { email }
    );
    return response.data;
  }
  /**
   * Validate current session
   */
  static async validateSession(): Promise<{ valid: boolean; user?: User }> {
    try {
      const user = await this.getProfile();
      return { valid: true, user };
    } catch {
      return { valid: false };
    }
  }
}
