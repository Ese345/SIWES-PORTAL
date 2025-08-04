"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Role, User } from "@/types";
import { apiClient } from "@/lib/api-client";
import { tokenManager } from "@/lib/token-manager";
import { AuthService } from "@/services";
import { API_ROUTES } from "@/constants";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<Role>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for localStorage operations
const getUserFromStorage = (): User | null => {
  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("Error parsing user data from localStorage:", error);
    localStorage.removeItem("user");
    return null;
  }
};

const saveUserToStorage = (user: User) => {
  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch (error) {
    console.error("Error saving user data to localStorage:", error);
  }
};

const clearUserFromStorage = () => {
  localStorage.removeItem("user");
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token and validate on mount
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log("🔄 Starting auth initialization...");
      setIsLoading(true);
      const hasToken = tokenManager.hasAccessToken();
      console.log("🔑 Has token:", hasToken);

      if (hasToken && !tokenManager.isTokenExpired()) {
        console.log("✅ Token exists and is valid");

        // Get user from localStorage first for immediate UI update
        const storedUser = getUserFromStorage();
        console.log("👤 Stored user:", storedUser);

        if (storedUser) {
          setUser(storedUser);
          console.log("🎯 Set user from localStorage");
        }

        // Validate token by fetching user profile
        try {
          console.log("🌐 Fetching user profile from API...");
          const response = await apiClient.get<{ data: User }>(
            API_ROUTES.AUTH.PROFILE,
            {
              headers: {
                Authorization: `Bearer ${tokenManager.getAccessToken()}`,
              },
            }
          );

          console.log("📥 Profile API response:", response);

          // Check if response has the expected structure
          if (response.data) {
            setUser(response.data);
            saveUserToStorage(response.data);
            console.log("✅ Updated user with fresh data from server");
          } else {
            throw new Error("Invalid response structure");
          }
        } catch (profileError) {
          console.log("❌ Profile fetch failed:", profileError);

          // If we have stored user, keep using it
          if (storedUser) {
            console.log("🔄 Keeping localStorage user due to API failure");
            // Don't throw - keep the stored user
          } else {
            throw profileError;
          }
        }
      } else if (hasToken) {
        console.log("🔄 Token expired, trying to refresh...");
        // Token exists but is expired, try to refresh
        try {
          await tokenManager.refreshAccessToken();
          console.log("✅ Token refreshed successfully");

          const response = await apiClient.get<{ data: User }>(
            API_ROUTES.AUTH.PROFILE
          );

          if (response.data) {
            setUser(response.data);
            saveUserToStorage(response.data);
            console.log("✅ User set after token refresh");
          } else {
            throw new Error("Invalid response structure after refresh");
          }
        } catch (refreshError) {
          console.error("❌ Token refresh failed:", refreshError);
          tokenManager.clearTokens();
          clearUserFromStorage();
          setUser(null);
        }
      } else {
        console.log("❌ No token found, clearing stale data");
        // No token, clear any stale user data
        clearUserFromStorage();
        setUser(null);
      }
    } catch (error) {
      console.error("❌ Auth initialization failed:", error);
      // Token is invalid, clear everything
      tokenManager.clearTokens();
      clearUserFromStorage();
      setUser(null);
    } finally {
      console.log("🏁 Auth initialization complete. User:", user);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const {
        accessToken,
        refreshToken,
        user: userData,
      } = await AuthService.login({
        email,
        password,
      });

      // Store tokens using token manager
      apiClient.setAuthTokens(accessToken, refreshToken);

      // Set user data and sync with localStorage
      setUser(userData);
      saveUserToStorage(userData);

      toast.success("Login successful!");
      return userData.role;
    } catch (error: unknown) {
      const typedError = error as {
        response?: { data?: { message?: string } };
      };
      console.log("Login error:", error);
      const message = typedError.response?.data?.message || "Login failed";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log("🚪 Logging out user");
    // Clear tokens using token manager
    apiClient.clearAuthTokens();
    clearUserFromStorage();
    setUser(null);
    toast.success("Logged out successfully");
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.get<{ data: User }>(
        API_ROUTES.AUTH.PROFILE
      );

      if (response.data) {
        setUser(response.data);
        saveUserToStorage(response.data);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
      logout();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
