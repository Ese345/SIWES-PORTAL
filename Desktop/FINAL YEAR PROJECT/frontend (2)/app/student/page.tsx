"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  Plus,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Building,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { APP_ROUTES, API_ROUTES, API_BASE_URL } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import tokenManager from "@/lib/token-manager";
import toast from "react-hot-toast";

// Types based on backend response
interface LogbookEntry {
  id: string;
  date: string;
  description: string;
  imageUrl?: string;
  submitted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  totalEntries: number;
  totalSubmitted: number;
  totalPending: number;
  totalAttendance: number;
  totalDays: number;
  attendancePercentage: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics>({
    totalEntries: 0,
    totalSubmitted: 0,
    totalPending: 0,
    totalAttendance: 0,
    totalDays: 0,
    attendancePercentage: 0,
  });
  const [recentEntries, setRecentEntries] = useState<LogbookEntry[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supervisorStatus, setSupervisorStatus] = useState<{
    hasIndustrySupervisor: boolean;
    supervisor?: {
      id: string;
      name: string;
      email: string;
    };
  }>({
    hasIndustrySupervisor: false,
  });

  // Fetch analytics data
  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setIsLoadingAnalytics(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ROUTES.LOGBOOK.replace(
          ":id",
          user.id
        )}/analytics`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data: Analytics = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      toast.error("Failed to load analytics data");
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Fetch recent entries
  const fetchRecentEntries = async () => {
    if (!user) return;

    try {
      setIsLoadingEntries(true);
      const response = await fetch(
        `${API_BASE_URL}${API_ROUTES.LOGBOOK.replace(":id", user.id)}/recent`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (response.status === 404) {
        // No entries found is not an error
        setRecentEntries([]);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch recent entries");
      }

      const data = await response.json();
      setRecentEntries(data.entries || []);
    } catch (err) {
      console.error("Error fetching recent entries:", err);
      toast.error("Failed to load recent entries");
    } finally {
      setIsLoadingEntries(false);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    setError(null);
    await Promise.all([
      fetchAnalytics(),
      fetchRecentEntries(),
      getIndustrySupervisorStatus(),
    ]);
  };

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  const quickActions = [
    {
      title: "Add Logbook Entry",
      description: "Record today's activities",
      icon: Plus,
      href: APP_ROUTES.STUDENT_LOGBOOK_ENTRY_CREATE,
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "View All Entries",
      description: "Browse your logbook history",
      icon: BookOpen,
      href: APP_ROUTES.STUDENT_LOGBOOK,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Update Profile",
      description: "Manage your information",
      icon: User,
      href: APP_ROUTES.STUDENT_PROFILE,
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  const getStatusColor = (entry: LogbookEntry) => {
    if (!entry.submitted) {
      return "bg-gray-100 text-gray-800";
    }
    // Since backend doesn't have approval status, all submitted entries are "pending"
    return "bg-yellow-100 text-yellow-800";
  };

  const getStatusIcon = (entry: LogbookEntry) => {
    if (!entry.submitted) {
      return <FileText className="h-4 w-4" />;
    }
    return <Clock className="h-4 w-4" />;
  };

  const getStatusText = (entry: LogbookEntry) => {
    if (!entry.submitted) {
      return "Draft";
    }
    return "Submitted";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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

  // Call an api to check if the user has added their industry supervisor details
  async function getIndustrySupervisorStatus() {
    const response = await fetch(
      `${API_BASE_URL}/industry-supervisors/status`,
      {
        headers: {
          Authorization: `Bearer ${tokenManager.getAccessToken()}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch industry supervisor status");
    }

    const data = (await response.json()) as {
      hasIndustrySupervisor: boolean;
      supervisor?: {
        id: string;
        name: string;
        email: string;
      };
    };
    setSupervisorStatus(data);
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.name}!
          </h1>
          <p className="text-gray-600">
            Track your industrial training progress and manage your logbook
            entries.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refreshData}
          disabled={isLoadingAnalytics || isLoadingEntries}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${
              isLoadingAnalytics || isLoadingEntries ? "animate-spin" : ""
            }`}
          />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            className="ml-auto"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Entries</p>
              {isLoadingAnalytics ? (
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.totalEntries}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Submitted</p>
              {isLoadingAnalytics ? (
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.totalSubmitted}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              {isLoadingAnalytics ? (
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.totalPending}
                </p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attendance</p>
              {isLoadingAnalytics ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.attendancePercentage.toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="flex flex-col gap-3">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <div
                    className={`p-4 rounded-lg text-white ${action.color} transition-colors cursor-pointer`}
                  >
                    <div className="flex items-center">
                      <action.icon className="h-5 w-5 mr-3" />
                      <div>
                        <h3 className="font-medium">{action.title}</h3>
                        <p className="text-sm opacity-90">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {!supervisorStatus.hasIndustrySupervisor && (
                <Link href="/student/industry">
                  <div
                    className={`p-4 rounded-lg text-white bg-blue-600 transition-colors cursor-pointer`}
                  >
                    <div className="flex items-center">
                      <Building className="h-5 w-5 mr-3" />
                      <div>
                        <h3 className="font-medium">Add Industry Supervisor</h3>
                        <p className="text-sm opacity-90">
                          Please provide your industry supervisor details.
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Entries */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Logbook Entries
              </h2>
              <Link href={APP_ROUTES.STUDENT_LOGBOOK}>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            {isLoadingEntries ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="border border-gray-200 rounded-lg p-4 animate-pulse"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-4 w-4 bg-gray-200 rounded"></div>
                          <div className="h-4 w-24 bg-gray-200 rounded"></div>
                          <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                        </div>
                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-8 w-16 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentEntries.length > 0 ? (
                  recentEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(entry.date)}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                entry
                              )}`}
                            >
                              {getStatusIcon(entry)}
                              {getStatusText(entry)}
                            </span>
                            {entry.imageUrl && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                📷 Image
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {entry.description}
                          </p>
                        </div>
                        <Link
                          href={APP_ROUTES.STUDENT_LOGBOOK_ENTRY_VIEW(entry.id)}
                        >
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No logbook entries yet</p>
                    <Link href={APP_ROUTES.STUDENT_LOGBOOK_ENTRY_CREATE}>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Entry
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
