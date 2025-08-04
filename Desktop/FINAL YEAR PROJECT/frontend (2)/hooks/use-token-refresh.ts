// filepath: e:\Projects_CU\Ese\frontend\hooks\use-token-refresh.ts
"use client";

import { useEffect, useRef, useCallback } from "react";
import { tokenManager } from "@/lib/token-manager";
import { useAuth } from "@/contexts/auth-context";

interface UseTokenRefreshOptions {
  refreshThreshold?: number; // Minutes before expiry to refresh
  checkInterval?: number; // Check interval in milliseconds
  autoStart?: boolean;
}

export function useTokenRefresh(options: UseTokenRefreshOptions = {}) {
  const {
    refreshThreshold = 5, // 5 minutes before expiry
    checkInterval = 60000, // Check every minute
    autoStart = true,
  } = options;

  const { logout } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const checkAndRefreshToken = useCallback(async () => {
    if (isRefreshingRef.current) return;

    const timeUntilExpiry = tokenManager.getTimeUntilExpiry();

    if (!timeUntilExpiry) return;

    const thresholdMs = refreshThreshold * 60 * 1000;

    if (timeUntilExpiry <= thresholdMs) {
      try {
        isRefreshingRef.current = true;
        await tokenManager.refreshAccessToken();
      } catch (error) {
        console.error("Token refresh failed:", error);
        logout();
      } finally {
        isRefreshingRef.current = false;
      }
    }
  }, [refreshThreshold, logout]);

  const startTokenRefresh = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(checkAndRefreshToken, checkInterval);
  }, [checkAndRefreshToken, checkInterval]);

  const stopTokenRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const forceRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;

    try {
      isRefreshingRef.current = true;
      await tokenManager.refreshAccessToken();
      return true;
    } catch (error) {
      console.error("Force refresh failed:", error);
      logout();
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [logout]);

  useEffect(() => {
    if (autoStart && tokenManager.hasAccessToken()) {
      startTokenRefresh();
    }

    return () => {
      stopTokenRefresh();
    };
  }, [autoStart, startTokenRefresh, stopTokenRefresh]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTokenRefresh();
    };
  }, [stopTokenRefresh]);

  return {
    startTokenRefresh,
    stopTokenRefresh,
    forceRefresh,
    checkAndRefreshToken,
    isRefreshing: isRefreshingRef.current,
  };
}
