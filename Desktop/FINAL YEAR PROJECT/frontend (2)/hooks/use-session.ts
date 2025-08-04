"use client";

import { useEffect, useState, useCallback } from "react";
import { sessionManager } from "@/lib/session-manager";
import { useAuth } from "@/contexts/auth-context";
import toast from "react-hot-toast";

interface SessionState {
  isActive: boolean;
  timeRemaining: number;
  tokenTimeRemaining: number | null;
  showWarning: boolean;
}

interface UseSessionOptions {
  onWarning?: (timeRemaining: number) => void;
  onTimeout?: () => void;
  onRefresh?: (success: boolean) => void;
  showToasts?: boolean;
}

export function useSession(options: UseSessionOptions = {}) {
  const { onWarning, onTimeout, onRefresh, showToasts = true } = options;
  const { logout } = useAuth();

  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: sessionManager.isSessionActive(),
    timeRemaining: sessionManager.getTimeRemaining(),
    tokenTimeRemaining: sessionManager.getTokenTimeRemaining(),
    showWarning: false,
  });

  const updateSessionState = useCallback(() => {
    setSessionState({
      isActive: sessionManager.isSessionActive(),
      timeRemaining: sessionManager.getTimeRemaining(),
      tokenTimeRemaining: sessionManager.getTokenTimeRemaining(),
      showWarning: sessionState.showWarning,
    });
  }, [sessionState.showWarning]);
  const handleWarning = useCallback(
    (event: { data?: { timeRemaining?: number } }) => {
      const timeRemaining = event.data?.timeRemaining || 0;
      setSessionState((prev) => ({ ...prev, showWarning: true }));

      if (showToasts) {
        toast.error(
          `Session will expire in ${Math.ceil(timeRemaining / 60000)} minutes`,
          {
            duration: 5000,
            id: "session-warning",
          }
        );
      }

      onWarning?.(timeRemaining);
    },
    [onWarning, showToasts]
  );

  const handleTimeout = useCallback(() => {
    setSessionState((prev) => ({
      ...prev,
      isActive: false,
      showWarning: false,
    }));

    if (showToasts) {
      toast.error("Session expired due to inactivity", {
        id: "session-timeout",
      });
    }

    onTimeout?.();
  }, [onTimeout, showToasts]);

  const handleRefresh = useCallback(
    (event: { data?: { success?: boolean } }) => {
      const success = event.data?.success || false;

      if (showToasts) {
        if (success) {
          toast.success("Session refreshed automatically", {
            duration: 2000,
            id: "session-refresh",
          });
        } else {
          toast.error("Failed to refresh session", {
            id: "session-refresh-error",
          });
        }
      }

      updateSessionState();
      onRefresh?.(success);
    },
    [onRefresh, showToasts, updateSessionState]
  );

  const handleActivity = useCallback(() => {
    setSessionState((prev) => ({ ...prev, showWarning: false }));
    updateSessionState();
  }, [updateSessionState]);

  const extendSession = useCallback(() => {
    sessionManager.extendSession();
    setSessionState((prev) => ({ ...prev, showWarning: false }));
    updateSessionState();

    if (showToasts) {
      toast.success("Session extended", {
        duration: 2000,
        id: "session-extend",
      });
    }
  }, [showToasts, updateSessionState]);

  const formatTime = useCallback((milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    // Set up event listeners
    sessionManager.on("warning", handleWarning);
    sessionManager.on("timeout", handleTimeout);
    sessionManager.on("refresh", handleRefresh);
    sessionManager.on("activity", handleActivity);

    // Update state periodically
    const interval = setInterval(updateSessionState, 1000);

    return () => {
      sessionManager.off("warning", handleWarning);
      sessionManager.off("timeout", handleTimeout);
      sessionManager.off("refresh", handleRefresh);
      sessionManager.off("activity", handleActivity);
      clearInterval(interval);
    };
  }, [
    handleWarning,
    handleTimeout,
    handleRefresh,
    handleActivity,
    updateSessionState,
  ]);

  return {
    sessionState,
    extendSession,
    formatTime,
    isActive: sessionState.isActive,
    timeRemaining: sessionState.timeRemaining,
    tokenTimeRemaining: sessionState.tokenTimeRemaining,
    showWarning: sessionState.showWarning,
  };
}
