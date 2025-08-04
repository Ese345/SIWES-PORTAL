/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Send,
  Search,
  MessageSquare,
  Trash2,
  Users,
  User,
  Building,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  X,
  Info,
  AlertTriangle,
  Filter,
  Calendar,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Textarea,
  Badge,
  Loading,
} from "@/components/ui";
import { API_BASE_URL } from "@/constants";
import tokenManager from "@/lib/token-manager";
import { formatDate } from "@/lib/utils";
import { Role } from "@/types";
import toast from "react-hot-toast";
import SiteHeader from "@/components/ui/site-header";

// Types based on notification routes
interface Notification {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  recipientType: "ALL" | "ROLE" | "INDIVIDUAL";
  recipientRole?: Role;
  recipientId?: string;
  actionUrl?: string;
  actionText?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    userNotifications: number;
  };
}

interface NotificationStats {
  total: number;
  active: number;
  byType: {
    INFO: number;
    SUCCESS: number;
    WARNING: number;
    ERROR: number;
  };
  byRecipientType: {
    ALL: number;
    ROLE: number;
    INDIVIDUAL: number;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

const notificationSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  message: z
    .string()
    .min(1, "Message is required")
    .max(1000, "Message too long"),
  type: z.enum(["INFO", "SUCCESS", "WARNING", "ERROR"]),
  recipientType: z.enum(["ALL", "ROLE", "INDIVIDUAL"]),
  recipientRole: z.nativeEnum(Role).optional(),
  recipientId: z.string().optional(),
  actionUrl: z.string().url().optional().or(z.literal("")),
  actionText: z.string().optional(),
});

type NotificationFormData = z.infer<typeof notificationSchema>;

export default function AdminNotificationsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Data states
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      type: "INFO",
      recipientType: "ALL",
    },
  });

  const recipientType = watch("recipientType");

  // Fetch notifications
  const fetchNotifications = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(typeFilter !== "all" && { type: typeFilter }),
        ...(statusFilter !== "all" && {
          active: statusFilter === "active" ? "true" : "false",
        }),
      });

      const response = await fetch(
        `${API_BASE_URL}/notifications/admin/notifications?${params}`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setCurrentPage(data.pagination?.currentPage || 1);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalNotifications(data.pagination?.totalNotifications || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notifications"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch notification stats
  const fetchStats = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/admin/notifications/stats`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  // Fetch users for individual targeting
  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/users?limit=100&roles=Student,SchoolSupervisor,IndustrySupervisor`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  // Create notification
  const onSubmit = async (data: NotificationFormData) => {
    try {
      const payload = {
        ...data,
        actionUrl: data.actionUrl || undefined,
        actionText: data.actionText || undefined,
        recipientRole:
          data.recipientType === "ROLE" ? data.recipientRole : undefined,
        recipientId:
          data.recipientType === "INDIVIDUAL" ? data.recipientId : undefined,
      };

      const response = await fetch(
        `${API_BASE_URL}/notifications/admin/notifications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create notification");
      }

      const result = await response.json();
      toast.success(
        `Notification created successfully! Sent to ${result.recipientCount} users.`
      );
      reset();
      setShowCreateForm(false);
      fetchNotifications();
      fetchStats();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create notification"
      );
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete notification");
      }

      toast.success("Notification deleted successfully");
      fetchNotifications();
      fetchStats();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete notification"
      );
    }
  };

  // Toggle notification status
  const toggleNotificationStatus = async (
    notificationId: string,
    currentStatus: boolean
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/admin/notifications/${notificationId}/toggle`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to update notification status"
        );
      }

      toast.success(
        `Notification ${
          currentStatus ? "deactivated" : "activated"
        } successfully`
      );
      fetchNotifications();
      fetchStats();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update notification status"
      );
    }
  };

  // Utility functions
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "ERROR":
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800";
      case "ERROR":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getRecipientIcon = (recipientType: string) => {
    switch (recipientType) {
      case "ALL":
        return <Users className="h-4 w-4" />;
      case "ROLE":
        return <Building className="h-4 w-4" />;
      case "INDIVIDUAL":
        return <User className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  // Apply filters
  const applyFilters = () => {
    setCurrentPage(1);
    fetchNotifications(1);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setTypeFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
    fetchNotifications(1);
  };

  useEffect(() => {
    fetchNotifications();
    fetchStats();
    fetchUsers();
  }, []);

  if (isLoading && notifications.length === 0) {
    return (
      <div className="p-6">
        <Loading text="Loading notifications..." />
      </div>
    );
  }

  // Stats for overview cards
  const statsCards = [
    {
      title: "Total Notifications",
      value: stats?.total || 0,
      icon: Bell,
      color: "bg-blue-500",
      trend: "All time",
    },
    {
      title: "Active Notifications",
      value: stats?.active || 0,
      icon: CheckCircle,
      color: "bg-green-500",
      trend: "Currently live",
    },
    {
      title: "Broadcast Messages",
      value: stats?.byRecipientType?.ALL || 0,
      icon: Users,
      color: "bg-purple-500",
      trend: "To all users",
    },
    {
      title: "Critical Alerts",
      value: (stats?.byType?.WARNING || 0) + (stats?.byType?.ERROR || 0),
      icon: AlertTriangle,
      color: "bg-red-500",
      trend: "Warnings & errors",
    },
  ];

  return (
    <SiteHeader
      heading="Notification Management"
      description="Create and manage system notifications"
      action={
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => fetchNotifications(currentPage)}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Notification
          </Button>
        </div>
      }
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{stat.trend}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Notification Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Create New Notification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <Input
                    {...register("title")}
                    placeholder="Notification title"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    {...register("type")}
                    className="w-full px-3 py-2 border text-gray-950 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="INFO">Info</option>
                    <option value="SUCCESS">Success</option>
                    <option value="WARNING">Warning</option>
                    <option value="ERROR">Error</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <Textarea
                  {...register("message")}
                  placeholder="Notification message"
                  rows={4}
                />
                {errors.message && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.message.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Send To *
                  </label>
                  <select
                    {...register("recipientType")}
                    className="w-full px-3 py-2 border text-gray-950 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="ALL">All Users</option>
                    <option value="ROLE">By Role</option>
                    <option value="INDIVIDUAL">Individual User</option>
                  </select>
                </div>

                {recipientType === "ROLE" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      {...register("recipientRole")}
                      className="w-full px-3 py-2 border text-gray-950 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Role</option>
                      <option value={Role.Student}>Students</option>
                      <option value={Role.SchoolSupervisor}>
                        School Supervisors
                      </option>
                      <option value={Role.IndustrySupervisor}>
                        Industry Supervisors
                      </option>
                    </select>
                    {errors.recipientRole && (
                      <p className="text-red-500 text-sm mt-1">
                        Please select a role
                      </p>
                    )}
                  </div>
                )}

                {recipientType === "INDIVIDUAL" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User *
                    </label>
                    <select
                      {...register("recipientId")}
                      className="w-full px-3 py-2 border text-gray-950 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select User</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email}) - {user.role}
                        </option>
                      ))}
                    </select>
                    {errors.recipientId && (
                      <p className="text-red-500 text-sm mt-1">
                        Please select a user
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action URL (Optional)
                  </label>
                  <Input
                    {...register("actionUrl")}
                    placeholder="https://example.com/action"
                    type="url"
                  />
                  {errors.actionUrl && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.actionUrl.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Text (Optional)
                  </label>
                  <Input
                    {...register("actionText")}
                    placeholder="View Details"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Creating..." : "Create Notification"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
              >
                <option value="all">All Types</option>
                <option value="INFO">Info</option>
                <option value="SUCCESS">Success</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
        </CardContent>
      </Card>

      {/* Notification Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats &&
                Object.entries(stats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getNotificationIcon(type)}
                      <span className="font-medium">{type}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{count}</p>
                      <p className="text-sm text-gray-500">notifications</p>
                    </div>
                  </div>
                ))}
              {!stats && (
                <p className="text-gray-500 text-center py-4">
                  No notification data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recipient Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats &&
                Object.entries(stats.byRecipientType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getRecipientIcon(type)}
                      <span className="font-medium">
                        {type === "ALL"
                          ? "All Users"
                          : type === "ROLE"
                          ? "By Role"
                          : "Individual"}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{count}</p>
                      <p className="text-sm text-gray-500">notifications</p>
                    </div>
                  </div>
                ))}
              {!stats && (
                <p className="text-gray-500 text-center py-4">
                  No recipient data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
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
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Recent Notifications ({totalNotifications})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getNotificationIcon(notification.type)}
                        <h3 className="font-medium text-gray-900">
                          {notification.title}
                        </h3>
                        <Badge className={getTypeColor(notification.type)}>
                          {notification.type}
                        </Badge>
                        <Badge
                          variant={
                            notification.isActive ? "default" : "secondary"
                          }
                        >
                          {notification.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      <p className="text-gray-600 mb-3">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          {getRecipientIcon(notification.recipientType)}
                          {notification.recipientType}
                          {notification.recipientRole &&
                            ` (${notification.recipientRole})`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {notification._count.userNotifications} recipients
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>

                      {notification.actionUrl && (
                        <div className="mt-2">
                          <a
                            href={notification.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {notification.actionText || "View Action"} →
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleNotificationStatus(
                            notification.id,
                            notification.isActive
                          )
                        }
                      >
                        {notification.isActive ? "Deactivate" : "Activate"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No notifications found</p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Notification
                </Button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * 10 + 1} to{" "}
                  {Math.min(currentPage * 10, totalNotifications)} of{" "}
                  {totalNotifications} notifications
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || isLoading}
                    onClick={() => {
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
                      fetchNotifications(newPage);
                    }}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages || isLoading}
                    onClick={() => {
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      fetchNotifications(newPage);
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </SiteHeader>
  );
}
