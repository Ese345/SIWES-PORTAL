// filepath: e:\Projects_CU\Ese\frontend\lib\token-manager.ts
"use client";

import { jwtDecode } from "jwt-decode";

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

class TokenManager {
  private static instance: TokenManager;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  // Token storage keys
  private readonly ACCESS_TOKEN_KEY = "siwes_access_token";
  private readonly REFRESH_TOKEN_KEY = "siwes_refresh_token";
  private readonly EXPIRES_AT_KEY = "siwes_token_expires_at";

  private constructor() {
    this.initializeTokens();
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Initialize tokens from localStorage on client side
   */
  private initializeTokens(): void {
    if (typeof window !== "undefined") {
      this.accessToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
      this.refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    }
  }
  /**
   * Store tokens securely
   */
  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    if (typeof window !== "undefined") {
      try {
        const decoded = jwtDecode<TokenPayload>(accessToken);
        const expiresAt = decoded.exp * 1000; // Convert to milliseconds

        localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
        localStorage.setItem(this.EXPIRES_AT_KEY, expiresAt.toString());
      } catch (error) {
        console.error("Failed to decode token:", error);
        this.clearTokens();
      }
    }
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Get the current refresh token
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Check if access token exists
   */
  hasAccessToken(): boolean {
    return !!this.accessToken;
  }

  /**
   * Check if tokens are expired or about to expire (within 5 minutes)
   */
  isTokenExpired(): boolean {
    if (!this.accessToken) return true;

    try {
      const decoded = jwtDecode<TokenPayload>(this.accessToken);
      const currentTime = Date.now() / 1000;
      const bufferTime = 5 * 60; // 5 minutes buffer

      return decoded.exp < currentTime + bufferTime;
    } catch (error) {
      console.error("Failed to decode token:", error);
      return true;
    }
  }

  /**
   * Get token payload without verification
   */
  getTokenPayload(): TokenPayload | null {
    if (!this.accessToken) return null;

    try {
      return jwtDecode<TokenPayload>(this.accessToken);
    } catch (error) {
      console.error("Failed to decode token:", error);
      return null;
    }
  }

  /**
   * Get user info from token
   */
  getUserFromToken(): { userId: string; email: string; role: string } | null {
    const payload = this.getTokenPayload();
    if (!payload) return null;

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  }

  /**
   * Refresh the access token using refresh token
   */
  async refreshAccessToken(): Promise<string> {
    // If there's already a refresh in progress, return that promise
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    this.refreshPromise = this.performTokenRefresh();

    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Perform the actual token refresh API call
   */ private async performTokenRefresh(): Promise<string> {
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"
        }/auth/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refreshToken: this.refreshToken,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to refresh token");
      }

      const data = await response.json();

      if (data.success && data.data.accessToken) {
        // Update the access token
        this.accessToken = data.data.accessToken;

        if (typeof window !== "undefined") {
          localStorage.setItem(this.ACCESS_TOKEN_KEY, data.data.accessToken);

          // Update expiration time
          const decoded = jwtDecode<TokenPayload>(data.data.accessToken);
          const expiresAt = decoded.exp * 1000;
          localStorage.setItem(this.EXPIRES_AT_KEY, expiresAt.toString());
        }

        return data.data.accessToken;
      } else {
        throw new Error("Invalid refresh response");
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getValidToken(): Promise<string | null> {
    if (!this.hasAccessToken()) {
      return null;
    }

    if (!this.isTokenExpired()) {
      return this.accessToken;
    }

    try {
      return await this.refreshAccessToken();
    } catch (error) {
      console.error("Failed to get valid token:", error);
      return null;
    }
  }

  /**
   * Clear all tokens and localStorage
   */
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.refreshPromise = null;

    if (typeof window !== "undefined") {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.EXPIRES_AT_KEY);
    }
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeUntilExpiry(): number | null {
    if (!this.accessToken) return null;

    try {
      const decoded = jwtDecode<TokenPayload>(this.accessToken);
      const expiryTime = decoded.exp * 1000;
      const currentTime = Date.now();

      return Math.max(0, expiryTime - currentTime);
    } catch (error) {
      console.error("Failed to get expiry time:", error);
      return null;
    }
  }

  /**
   * Schedule automatic token refresh
   */
  scheduleTokenRefresh(): void {
    const timeUntilExpiry = this.getTimeUntilExpiry();

    if (!timeUntilExpiry) return;

    // Refresh 5 minutes before expiry
    const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000);

    setTimeout(async () => {
      try {
        await this.refreshAccessToken();
        // Schedule the next refresh
        this.scheduleTokenRefresh();
      } catch (error) {
        console.error("Scheduled token refresh failed:", error);
      }
    }, refreshTime);
  }

  /**
   * Validate token format
   */
  isValidTokenFormat(token: string): boolean {
    try {
      const parts = token.split(".");
      return parts.length === 3;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();
export default tokenManager;
