// filepath: e:\Projects_CU\Ese\frontend\lib\session-manager.ts
"use client";

import { tokenManager } from "./token-manager";

interface SessionEvent {
  type: "activity" | "warning" | "timeout" | "refresh";
  timestamp: number;
  data?: unknown;
}

interface SessionConfig {
  inactivityTimeout: number; // in milliseconds
  warningTime: number; // time before timeout to show warning
  refreshInterval: number; // interval to check session status
}

type SessionEventHandler = (event: SessionEvent) => void;

class SessionManager {
  private static instance: SessionManager;
  private config: SessionConfig;
  private lastActivity: number;
  private warningShown: boolean = false;
  private timeoutId: NodeJS.Timeout | null = null;
  private warningTimeoutId: NodeJS.Timeout | null = null;
  private refreshIntervalId: NodeJS.Timeout | null = null;
  private eventHandlers: Map<string, SessionEventHandler[]> = new Map();

  // Activity tracking
  private activityEvents = [
    "mousedown",
    "mousemove",
    "keypress",
    "scroll",
    "touchstart",
    "click",
  ];

  private constructor(config?: Partial<SessionConfig>) {
    this.config = {
      inactivityTimeout: 30 * 60 * 1000, // 30 minutes default
      warningTime: 5 * 60 * 1000, // 5 minutes warning
      refreshInterval: 60 * 1000, // 1 minute refresh check
      ...config,
    };

    this.lastActivity = Date.now();
    this.initializeActivityTracking();
    this.startSessionMonitoring();
  }

  static getInstance(config?: Partial<SessionConfig>): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager(config);
    }
    return SessionManager.instance;
  }

  /**
   * Initialize activity tracking listeners
   */
  private initializeActivityTracking(): void {
    if (typeof window === "undefined") return;

    this.activityEvents.forEach((event) => {
      document.addEventListener(event, this.handleActivity.bind(this), true);
    });
  }

  /**
   * Handle user activity
   */
  private handleActivity(): void {
    this.lastActivity = Date.now();
    this.warningShown = false;
    this.resetTimeouts();
    this.emit("activity", { timestamp: this.lastActivity });
  }

  /**
   * Start monitoring session status
   */
  private startSessionMonitoring(): void {
    this.refreshIntervalId = setInterval(() => {
      this.checkSessionStatus();
    }, this.config.refreshInterval);

    this.resetTimeouts();
  }

  /**
   * Reset inactivity and warning timeouts
   */
  private resetTimeouts(): void {
    // Clear existing timeouts
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
    }

    // Set warning timeout
    this.warningTimeoutId = setTimeout(() => {
      if (!this.warningShown) {
        this.warningShown = true;
        this.emit("warning", {
          timestamp: Date.now(),
          data: { timeRemaining: this.config.warningTime },
        });
      }
    }, this.config.inactivityTimeout - this.config.warningTime);

    // Set session timeout
    this.timeoutId = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.config.inactivityTimeout);
  }

  /**
   * Handle session timeout
   */
  private handleSessionTimeout(): void {
    this.emit("timeout", { timestamp: Date.now() });
    this.endSession();
  }

  /**
   * Check session status including token validity
   */
  private checkSessionStatus(): void {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;

    // Check if token is expired
    if (tokenManager.hasAccessToken() && tokenManager.isTokenExpired()) {
      this.emit("refresh", {
        timestamp: now,
        data: { reason: "token_expired" },
      });
      this.handleTokenExpiry();
      return;
    }

    // Check for inactivity
    if (timeSinceActivity >= this.config.inactivityTimeout) {
      this.handleSessionTimeout();
      return;
    }

    // Check for warning threshold
    const timeUntilTimeout = this.config.inactivityTimeout - timeSinceActivity;
    if (timeUntilTimeout <= this.config.warningTime && !this.warningShown) {
      this.warningShown = true;
      this.emit("warning", {
        timestamp: now,
        data: { timeRemaining: timeUntilTimeout },
      });
    }
  }

  /**
   * Handle token expiry
   */
  private async handleTokenExpiry(): Promise<void> {
    try {
      await tokenManager.refreshAccessToken();
      this.emit("refresh", {
        timestamp: Date.now(),
        data: { success: true },
      });
    } catch (error) {
      this.emit("refresh", {
        timestamp: Date.now(),
        data: { success: false, error },
      });
      this.endSession();
    }
  }

  /**
   * End the current session
   */
  endSession(): void {
    this.cleanup();
    tokenManager.clearTokens();

    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
  }

  /**
   * Extend the session (reset activity timer)
   */
  extendSession(): void {
    this.handleActivity();
  }

  /**
   * Get time remaining until session timeout
   */
  getTimeRemaining(): number {
    const now = Date.now();
    const timeSinceActivity = now - this.lastActivity;
    return Math.max(0, this.config.inactivityTimeout - timeSinceActivity);
  }

  /**
   * Get time until token expires
   */
  getTokenTimeRemaining(): number | null {
    return tokenManager.getTimeUntilExpiry();
  }

  /**
   * Check if session is active
   */
  isSessionActive(): boolean {
    const timeRemaining = this.getTimeRemaining();
    return timeRemaining > 0 && tokenManager.hasAccessToken();
  }

  /**
   * Update session configuration
   */
  updateConfig(newConfig: Partial<SessionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.restartMonitoring();
  }

  /**
   * Restart session monitoring with new config
   */
  private restartMonitoring(): void {
    this.cleanup();
    this.startSessionMonitoring();
  }

  /**
   * Add event listener
   */
  on(eventType: string, handler: SessionEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove event listener
   */
  off(eventType: string, handler: SessionEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(eventType: string, event: Omit<SessionEvent, "type">): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const fullEvent: SessionEvent = {
        type: eventType as SessionEvent["type"],
        ...event,
      };
      handlers.forEach((handler) => {
        try {
          handler(fullEvent);
        } catch (error) {
          console.error("Session event handler error:", error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Clear timeouts
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
    }

    // Remove activity listeners
    if (typeof window !== "undefined") {
      this.activityEvents.forEach((event) => {
        document.removeEventListener(
          event,
          this.handleActivity.bind(this),
          true
        );
      });
    }
  }
  /**
   * Destroy the session manager instance
   */
  destroy(): void {
    this.cleanup();
    this.eventHandlers.clear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (SessionManager as any).instance = undefined;
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance();
export default sessionManager;
