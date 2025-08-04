"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Eye,
  RefreshCw,
  Filter,
  Search,
  ExternalLink,
} from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { API_BASE_URL } from "@/constants";
import tokenManager from "@/lib/token-manager";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

// Types based on notification routes
interface Notification {
  id: string;
  notificationId: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  title: string;
  message: string;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalNotifications: number;
    limit: number;
  };
}

type FilterType = "all" | "unread" | "read";
type NotificationType = "all" | "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export default function StudentNotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalNotifications: 0,
    limit: 10,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [notificationType, setNotificationType] =
    useState<NotificationType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch notifications from API
  const fetchNotifications = async (page = 1) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      const response = await fetch(
        `${API_BASE_URL}/notifications/notifications?${params}`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data: NotificationsResponse = await response.json();

      // Apply client-side filters
      let filteredNotifications = data.notifications;

      if (filterType === "read") {
        filteredNotifications = filteredNotifications.filter((n) => n.read);
      } else if (filterType === "unread") {
        filteredNotifications = filteredNotifications.filter((n) => !n.read);
      }

      if (notificationType !== "all") {
        filteredNotifications = filteredNotifications.filter(
          (n) => n.type === notificationType
        );
      }

      if (searchQuery) {
        filteredNotifications = filteredNotifications.filter(
          (n) =>
            n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.message.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setNotifications(filteredNotifications);
      setPagination(data.pagination);

      // Calculate unread count
      const unread = data.notifications.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notifications"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (userNotificationId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/notifications/${userNotificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === userNotificationId
            ? { ...notification, read: true, readAt: new Date().toISOString() }
            : notification
        )
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error("Failed to mark notification as read");
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/notifications/mark-all-read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
          readAt: new Date().toISOString(),
        }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "WARNING":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "ERROR":
        return <X className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  // Get notification color
  const getNotificationColor = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return "border-l-green-500 bg-green-50";
      case "WARNING":
        return "border-l-yellow-500 bg-yellow-50";
      case "ERROR":
        return "border-l-red-500 bg-red-50";
      default:
        return "border-l-blue-500 bg-blue-50";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  // Apply filters
  const applyFilters = () => {
    fetchNotifications(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilterType("all");
    setNotificationType("all");
    setSearchQuery("");
    fetchNotifications(1);
  };

  // Handle action URL click
  const handleActionClick = (actionUrl: string) => {
    if (actionUrl.startsWith("http")) {
      window.open(actionUrl, "_blank");
    } else {
      window.location.href = actionUrl;
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-gray-600">
            Stay updated with your logbook submissions and important
            announcements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => fetchNotifications(pagination.currentPage)}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && applyFilters()}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="px-3 py-2 border rounded-lg text-sm text-gray-900"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
            <select
              className="px-3 py-2 border rounded-lg text-sm text-gray-900"
              value={notificationType}
              onChange={(e) =>
                setNotificationType(e.target.value as NotificationType)
              }
            >
              <option value="all">All Types</option>
              <option value="INFO">Info</option>
              <option value="SUCCESS">Success</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
            </select>
            <Button variant="outline" size="sm" onClick={applyFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Apply
            </Button>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <X className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications()}
            className="ml-auto"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Notifications List */}
      <Card>
        {isLoading && notifications.length === 0 ? (
          <div className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 animate-pulse"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-gray-50 transition-colors border-l-4",
                    getNotificationColor(notification.type),
                    !notification.read && "bg-opacity-100"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3
                            className={cn(
                              "text-sm font-medium text-gray-900",
                              !notification.read && "font-semibold"
                            )}
                          >
                            {notification.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.createdAt)}
                          </span>

                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        {notification.actionUrl && notification.actionText && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleActionClick(notification.actionUrl!)
                            }
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            {notification.actionText}
                          </Button>
                        )}

                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              markAsRead(notification.notificationId)
                            }
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Mark Read
                          </Button>
                        )}

                        {notification.read && notification.readAt && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Read {formatDate(notification.readAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {searchQuery ||
                  filterType !== "all" ||
                  notificationType !== "all"
                    ? "No notifications match your filters"
                    : "No notifications found"}
                </p>
                <Button variant="outline" onClick={() => fetchNotifications()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.totalNotifications
                )}{" "}
                of {pagination.totalNotifications} notifications
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.currentPage <= 1 || isLoading}
                  onClick={() => fetchNotifications(pagination.currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    pagination.currentPage >= pagination.totalPages || isLoading
                  }
                  onClick={() => fetchNotifications(pagination.currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
