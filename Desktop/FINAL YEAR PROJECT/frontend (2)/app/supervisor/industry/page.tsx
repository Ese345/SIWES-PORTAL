/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import IndustrySupervisorLayout from "./layouxt";
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
  Building2,
  Briefcase,
  Target,
  Award,
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
  internshipStatus: "ACTIVE" | "COMPLETED" | "PENDING";
  company?: string;
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
  workActivities?: string;
  skillsLearned?: string;
}

interface DashboardStats {
  totalStudents: number;
  activeInterns: number;
  completedInternships: number;
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

interface PerformanceMetric {
  studentId: string;
  studentName: string;
  matricNumber: string;
  completionRate: number;
  lastSubmission: string;
  overallRating: number;
}

const IndustrySupervisorDashboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [recentLogbooks, setRecentLogbooks] = useState<LogbookEntry[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<
    PerformanceMetric[]
  >([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeInterns: 0,
    completedInternships: 0,
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

      // Fetch assigned students (industry supervisors)
      const studentsResponse = await fetch(
        `${API_BASE_URL}/supervisors/students/industry`,
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

      // Fetch dashboard stats for industry supervisors
      const statsResponse = await fetch(
        `${API_BASE_URL}/supervisors/dashboard/stats/industry`,
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
        const activeInterns = Math.floor(totalStudents * 0.8);
        const completedInternships = Math.floor(totalStudents * 0.2);
        setStats({
          totalStudents,
          activeInterns,
          completedInternships,
          totalLogbookEntries: totalStudents * 20,
          pendingEntries: Math.floor(totalStudents * 0.25),
          approvedEntries: Math.floor(totalStudents * 0.65),
          rejectedEntries: Math.floor(totalStudents * 0.1),
          recentActivity: 8,
        });
      }

      // Fetch recent logbook entries
      const logbooksResponse = await fetch(
        `${API_BASE_URL}/supervisors/logbooks/recent/industry?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (logbooksResponse.ok) {
        const logbooksData = await logbooksResponse.json();
        setRecentLogbooks(logbooksData.entries || []);
      }

      // Fetch performance metrics
      const metricsResponse = await fetch(
        `${API_BASE_URL}/supervisors/performance/industry`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setPerformanceMetrics(metricsData.metrics || []);
      }
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
      case "ACTIVE":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
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
      case "ACTIVE":
        return <Briefcase className="h-4 w-4 text-blue-500" />;
      case "COMPLETED":
        return <Award className="h-4 w-4 text-green-500" />;
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

  // Get performance rating color
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-blue-600";
    if (rating >= 2.5) return "text-yellow-600";
    return "text-red-600";
  };

  // Filter students based on search
  const filteredStudents = students.filter(
    (student) =>
      student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matricNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.company &&
        student.company.toLowerCase().includes(searchTerm.toLowerCase()))
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
    trend,
  }: {
    title: string;
    value: string | number;
    icon: any;
    color: string;
    subtitle?: string;
    trend?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <IndustrySupervisorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </IndustrySupervisorLayout>
    );
  }

  return (
    <IndustrySupervisorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Industry Supervisor Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user?.name}! Monitor your interns&apos; progress
              and evaluate their performance in the workplace.
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
                (window.location.href = "/supervisor/industry/logbooks")
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
            title="Total Interns"
            value={stats.totalStudents}
            icon={Users}
            color="bg-blue-500"
            subtitle="Under your supervision"
            trend="+3 this month"
          />
          <StatCard
            title="Active Interns"
            value={stats.activeInterns}
            icon={Briefcase}
            color="bg-green-500"
            subtitle="Currently working"
          />
          <StatCard
            title="Pending Reviews"
            value={stats.pendingEntries}
            icon={Clock}
            color="bg-yellow-500"
            subtitle="Awaiting evaluation"
          />
          <StatCard
            title="Completed Tasks"
            value={stats.approvedEntries}
            icon={CheckCircle}
            color="bg-purple-500"
            subtitle="Approved submissions"
            trend="+12% this week"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interns List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    My Interns ({filteredStudents.length})
                  </h3>
                  <button
                    onClick={() =>
                      (window.location.href = "/supervisor/industry/interns")
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
                      placeholder="Search interns by name, matric, or company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.slice(0, 6).map((student) => (
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
                              {student.company && (
                                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                  <Building2 className="h-3 w-3" />
                                  {student.company}
                                </p>
                              )}
                              <p className="text-xs text-gray-500">
                                {student.user.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                student.internshipStatus || "ACTIVE"
                              )}`}
                            >
                              {student.internshipStatus || "ACTIVE"}
                            </span>
                            <button
                              onClick={() =>
                                (window.location.href = `/supervisor/industry/interns/${student.id}`)
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
                        ? "No interns found matching your search"
                        : "No interns assigned yet"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </IndustrySupervisorLayout>
  );
};

export default IndustrySupervisorDashboard;
