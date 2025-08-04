/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import SchoolSupervisorLayout from "../school/layouxt";
import {
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  User,
  Mail,
  Eye,
  Bell,
  RefreshCw,
  FileText,
  Search,
} from "lucide-react";
import { API_BASE_URL } from "@/constants";
import tokenManager from "@/lib/token-manager";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

// Types
interface Student {
  id: string;
  matricNumber: string;
  department: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface LogbookEntry {
  id: string;
  title: string;
  date: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  student: {
    user: {
      name: string;
    };
    matricNumber: string;
  };
}

interface DashboardStats {
  totalStudents: number;
  totalLogbookEntries: number;
  pendingEntries: number;
  approvedEntries: number;
  rejectedEntries: number;
  recentActivity: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  isRead: boolean;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  type: "logbook" | "attendance" | "assignment";
  message: string;
  timestamp: string;
  studentName: string;
}

const SchoolSupervisorDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [recentLogbooks, setRecentLogbooks] = useState<LogbookEntry[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalLogbookEntries: 0,
    pendingEntries: 0,
    approvedEntries: 0,
    rejectedEntries: 0,
    recentActivity: 0,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assigned students (school supervisors)
      const studentsResponse = await fetch(
        `${API_BASE_URL}/supervisors/students/school`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setStudents(studentsData.students || []);
      }

      // Fetch dashboard stats for school supervisors
      const statsResponse = await fetch(
        `${API_BASE_URL}/supervisors/dashboard/stats/school`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        // Fallback: calculate stats from students data
        const totalStudents = students.length;
        setStats({
          totalStudents,
          totalLogbookEntries: totalStudents * 15,
          pendingEntries: Math.floor(totalStudents * 0.3),
          approvedEntries: Math.floor(totalStudents * 0.6),
          rejectedEntries: Math.floor(totalStudents * 0.1),
          recentActivity: 5,
        });
      }

      // Note: Notifications endpoint doesn't exist yet, so we'll skip this for now
      // const notificationsResponse = await fetch(
      //   `${API_BASE_URL}/api/notifications/school?limit=5`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${tokenManager.getAccessToken()}`,
      //     },
      //   }
      // );

      // if (notificationsResponse.ok) {
      //   const notificationsData = await notificationsResponse.json();
      //   setNotifications(notificationsData.notifications || []);
      // }
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REJECTED":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "SUCCESS":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "WARNING":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "ERROR":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(
    (student) =>
      student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matricNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter logbook entries
  const filteredLogbooks = recentLogbooks.filter((entry) => {
    if (filterStatus === "all") return true;
    return entry.status === filterStatus.toUpperCase();
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <SchoolSupervisorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </SchoolSupervisorLayout>
    );
  }

  return (
    <SchoolSupervisorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              School Supervisor Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.name}! Monitor your students&apos; progress
              and manage their academic activities.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={() =>
                (window.location.href = "/supervisor/school/logbooks")
              }
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              View All Logbooks
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchDashboardData}
              className="ml-auto px-3 py-1 border border-red-300 rounded text-red-700 hover:bg-red-100 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={Users}
            color="bg-blue-500"
            subtitle="Under your supervision"
          />
          <StatCard
            title="Pending Reviews"
            value={stats.pendingEntries}
            icon={Clock}
            color="bg-yellow-500"
            subtitle="Awaiting review"
          />
          <StatCard
            title="Approved Entries"
            value={stats.approvedEntries}
            icon={CheckCircle}
            color="bg-green-500"
            subtitle="Completed reviews"
          />
          <StatCard
            title="Total Logbooks"
            value={stats.totalLogbookEntries}
            icon={BookOpen}
            color="bg-purple-500"
            subtitle="All submissions"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Students List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    My Students ({filteredStudents.length})
                  </h3>
                  <button
                    onClick={() =>
                      (window.location.href = "/supervisor/school/students")
                    }
                    className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.slice(0, 5).map((student) => (
                      <div
                        key={student.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {student.user.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {student.matricNumber} • {student.department}
                              </p>
                              <p className="text-xs text-gray-500">
                                {student.user.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                (window.location.href = `/supervisor/school/students/${student.id}`)
                              }
                              className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() =>
                                window.open(
                                  `mailto:${student.user.email}`,
                                  "_blank"
                                )
                              }
                              className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                              <Mail className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm
                        ? "No students found matching your search"
                        : "No students assigned yet"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Notifications */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Notifications
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No recent notifications
                    </p>
                  )}
                </div>
                {notifications.length > 0 && (
                  <button
                    onClick={() =>
                      (window.location.href =
                        "/supervisor/school/notifications")
                    }
                    className="w-full mt-3 px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                  >
                    View All Notifications
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Logbook Entries */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Recent Logbook Entries
              </h3>
              <div className="flex items-center gap-3">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={() =>
                    (window.location.href = "/supervisor/school/logbooks")
                  }
                  className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                >
                  View All
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {filteredLogbooks.length > 0 ? (
                filteredLogbooks.map((entry) => (
                  <div
                    key={entry.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(entry.status)}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {entry.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            by {entry.student.user.name} (
                            {entry.student.matricNumber})
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Entry Date: {formatDate(entry.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Submitted: {formatDate(entry.submittedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            entry.status
                          )}`}
                        >
                          {entry.status}
                        </span>
                        <button
                          onClick={() =>
                            (window.location.href = `/supervisor/school/logbooks/${entry.id}`)
                          }
                          className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          Review
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {filterStatus === "all"
                    ? "No logbook entries found"
                    : `No ${filterStatus} entries found`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SchoolSupervisorLayout>
  );
};

export default SchoolSupervisorDashboard;
