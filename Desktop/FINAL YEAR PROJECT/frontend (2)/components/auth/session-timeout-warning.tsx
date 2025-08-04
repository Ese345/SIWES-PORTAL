"use client";

import React, { useState, useEffect } from "react";
import { Button, Card, CardContent } from "@/components/ui";
import { Clock, RefreshCw, LogOut } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useAuth } from "@/contexts/auth-context";

interface SessionTimeoutWarningProps {
  onExtend?: () => void;
  onLogout?: () => void;
}

export default function SessionTimeoutWarning({
  onExtend,
  onLogout,
}: SessionTimeoutWarningProps) {
  const { logout } = useAuth();
  const { sessionState, extendSession, formatTime } = useSession();
  const [countdown, setCountdown] = useState(sessionState.timeRemaining);

  useEffect(() => {
    setCountdown(sessionState.timeRemaining);
  }, [sessionState.timeRemaining]);

  useEffect(() => {
    if (!sessionState.showWarning) return;

    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionState.showWarning]);

  const handleExtend = () => {
    extendSession();
    onExtend?.();
  };

  const handleLogout = () => {
    logout();
    onLogout?.();
  };

  if (!sessionState.showWarning) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Session Expiring Soon
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Your session will expire due to inactivity
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-900">
                {formatTime(countdown)}
              </div>
              <div className="text-sm text-gray-500">Time remaining</div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handleExtend}
                className="w-full"
                variant="primary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Extend Session
              </Button>

              <Button
                onClick={handleLogout}
                className="w-full"
                variant="outline"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout Now
              </Button>
            </div>

            <p className="text-xs text-gray-500">
              Click anywhere to extend your session automatically
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
