/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import IndustrySupervisorLayout from "../layouxt";
import {
  FileText,
  Download,
  Users,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
  Target,
  Award,
  FileSpreadsheet,
} from "lucide-react";
import { API_BASE_URL } from "@/constants";
import tokenManager from "@/lib/token-manager";
// import { formatDate } from "@/lib/utils";

// Types
interface ReportData {
  attendanceReport: {
    totalStudents: number;
    averageAttendanceRate: number;
    excellentAttendance: number;
    poorAttendance: number;
    monthlyTrends: Array<{
      month: string;
      averageRate: number;
      totalDays: number;
    }>;
  };
  logbookReport: {
    totalEntries: number;
    pendingReviews: number;
    approvedEntries: number;
    rejectedEntries: number;
    reviewProgress: number;
    averageResponseTime: number;
  };
  performanceReport: {
    topPerformers: Array<{
      studentId: string;
      studentName: string;
      matricNumber: string;
      attendanceRate: number;
      logbookCompletionRate: number;
      overallScore: number;
    }>;
    improvementNeeded: Array<{
      studentId: string;
      studentName: string;
      matricNumber: string;
      issues: string[];
      recommendations: string[];
    }>;
  };
}

interface Student {
  id: string;
  matricNumber: string;
  department: string;
  user: {
    name: string;
    email: string;
  };
  attendanceStats: {
    attendanceRate: number;
    totalDays: number;
    presentDays: number;
  };
}

const ReportsPage = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReportType, setSelectedReportType] = useState("overview");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [generateLoading, setGenerateLoading] = useState(false);

  // Fetch report data
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch students data
      const studentsResponse = await fetch(
        `${API_BASE_URL}/attendance/supervisor/students`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      let studentsData: { students: Student[] } = { students: [] };
      if (studentsResponse.ok) {
        studentsData = await studentsResponse.json();
        setStudents(studentsData.students || []);
      }

      // Fetch logbook review stats
      const logbookStatsResponse = await fetch(
        `${API_BASE_URL}/logbook/review/stats`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      let logbookStats = {
        totalEntries: 0,
        pendingReviews: 0,
        approvedEntries: 0,
        rejectedEntries: 0,
        reviewProgress: 0,
        averageResponseTime: 2.5,
      };

      if (logbookStatsResponse.ok) {
        const logbookData = await logbookStatsResponse.json();
        logbookStats = {
          totalEntries: logbookData.totalSubmitted || 0,
          pendingReviews: logbookData.pendingReviews || 0,
          approvedEntries: logbookData.approvedEntries || 0,
          rejectedEntries: logbookData.rejectedEntries || 0,
          reviewProgress: logbookData.reviewProgress || 0,
          averageResponseTime: 2.5, // This would come from backend calculation
        };
      }

      // Calculate attendance report from students data
      const totalStudents = studentsData.students.length;
      const studentsWithAttendance = studentsData.students.filter(
        (s) => s.attendanceStats
      );
      const averageAttendanceRate =
        studentsWithAttendance.length > 0
          ? studentsWithAttendance.reduce(
              (acc, s) => acc + s.attendanceStats.attendanceRate,
              0
            ) / studentsWithAttendance.length
          : 0;

      const excellentAttendance = studentsWithAttendance.filter(
        (s) => s.attendanceStats.attendanceRate >= 90
      ).length;
      const poorAttendance = studentsWithAttendance.filter(
        (s) => s.attendanceStats.attendanceRate < 75
      ).length;

      // Generate mock monthly trends (this would come from backend)
      const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          month: date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
          }),
          averageRate: Math.max(
            65,
            averageAttendanceRate + (Math.random() - 0.5) * 20
          ),
          totalDays: Math.floor(Math.random() * 10) + 15,
        };
      }).reverse();

      // Generate performance data
      const topPerformers = studentsWithAttendance
        .map((s) => ({
          studentId: s.id,
          studentName: s.user.name,
          matricNumber: s.matricNumber,
          attendanceRate: s.attendanceStats.attendanceRate,
          logbookCompletionRate: Math.random() * 30 + 70, // Mock data
          overallScore:
            (s.attendanceStats.attendanceRate + (Math.random() * 30 + 70)) / 2,
        }))
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, 5);

      const improvementNeeded = studentsWithAttendance
        .filter((s) => s.attendanceStats.attendanceRate < 80)
        .map((s) => ({
          studentId: s.id,
          studentName: s.user.name,
          matricNumber: s.matricNumber,
          issues: [
            s.attendanceStats.attendanceRate < 70 ? "Low attendance rate" : "",
            Math.random() > 0.5 ? "Irregular logbook submissions" : "",
            Math.random() > 0.7 ? "Late submissions" : "",
          ].filter(Boolean),
          recommendations: [
            "Schedule regular check-ins",
            "Provide additional support",
            "Set clearer expectations",
          ],
        }));

      setReportData({
        attendanceReport: {
          totalStudents,
          averageAttendanceRate,
          excellentAttendance,
          poorAttendance,
          monthlyTrends,
        },
        logbookReport: logbookStats,
        performanceReport: {
          topPerformers,
          improvementNeeded,
        },
      });
    } catch (err) {
      console.error("Error fetching report data:", err);
      setError("Failed to load report data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Generate and download report
  const handleGenerateReport = async (format: "pdf" | "excel" | "csv") => {
    try {
      setGenerateLoading(true);

      // This would call your backend API to generate the report
      const response = await fetch(`${API_BASE_URL}/reports/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenManager.getAccessToken()}`,
        },
        body: JSON.stringify({
          reportType: selectedReportType,
          format,
          dateRange,
          department: selectedDepartment,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedReportType}_report_${
          new Date().toISOString().split("T")[0]
        }.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error("Failed to generate report");
      }
    } catch (err) {
      console.error("Error generating report:", err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setGenerateLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Get unique departments
  const departments = [...new Set(students.map((s) => s.department))];

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    trend,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              {trend.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-500 mr-1 rotate-180" />
              )}
              <span
                className={`text-sm ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {Math.abs(trend.value)}%
              </span>
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
            <p className="mt-4 text-gray-600">Loading reports...</p>
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
              Reports & Analytics
            </h1>
            <p className="text-gray-600">
              Generate comprehensive reports on intern performance and
              attendance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchReportData}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Report Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Report Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={selectedReportType}
                onChange={(e) => setSelectedReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="overview">Overview Report</option>
                <option value="attendance">Attendance Report</option>
                <option value="logbook">Logbook Report</option>
                <option value="performance">Performance Report</option>
                <option value="individual">Individual Reports</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department Filter
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, endDate: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => handleGenerateReport("pdf")}
              disabled={generateLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Generate PDF
            </button>
            <button
              onClick={() => handleGenerateReport("excel")}
              disabled={generateLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Generate Excel
            </button>
            <button
              onClick={() => handleGenerateReport("csv")}
              disabled={generateLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div> */}
        </div>

        {/* Key Metrics Overview */}
        {reportData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Interns"
              value={reportData.attendanceReport.totalStudents}
              icon={Users}
              color="bg-blue-500"
            />
            <StatCard
              title="Avg. Attendance"
              value={`${reportData.attendanceReport.averageAttendanceRate.toFixed(
                1
              )}%`}
              icon={TrendingUp}
              color="bg-green-500"
              trend={{ value: 5.2, isPositive: true }}
            />
            <StatCard
              title="Pending Reviews"
              value={reportData.logbookReport.pendingReviews}
              icon={Clock}
              color="bg-yellow-500"
            />
            <StatCard
              title="Review Progress"
              value={`${reportData.logbookReport.reviewProgress.toFixed(1)}%`}
              icon={Target}
              color="bg-purple-500"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Analytics */}
          {reportData && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Attendance Analytics
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-green-600 text-sm font-medium">
                      Excellent (≥90%)
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {reportData.attendanceReport.excellentAttendance}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-red-600 text-sm font-medium">
                      Needs Attention (&lt;75%)
                    </p>
                    <p className="text-2xl font-bold text-red-900">
                      {reportData.attendanceReport.poorAttendance}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">
                    Monthly Trends
                  </h4>
                  <div className="space-y-2">
                    {reportData.attendanceReport.monthlyTrends.map(
                      (trend, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <span className="text-sm text-gray-600">
                            {trend.month}
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${Math.min(trend.averageRate, 100)}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {trend.averageRate.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Logbook Review Analytics */}
          {reportData && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Logbook Review Analytics
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-blue-600 text-xs font-medium">Total</p>
                    <p className="text-xl font-bold text-blue-900">
                      {reportData.logbookReport.totalEntries}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-green-600 text-xs font-medium">
                      Approved
                    </p>
                    <p className="text-xl font-bold text-green-900">
                      {reportData.logbookReport.approvedEntries}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <p className="text-red-600 text-xs font-medium">Rejected</p>
                    <p className="text-xl font-bold text-red-900">
                      {reportData.logbookReport.rejectedEntries}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Review Progress
                    </span>
                    <span className="text-sm text-gray-600">
                      {reportData.logbookReport.reviewProgress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${reportData.logbookReport.reviewProgress}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Avg. Response Time
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {reportData.logbookReport.averageResponseTime} days
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Performance Analysis */}
        {reportData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Performers
              </h3>

              <div className="space-y-3">
                {reportData.performanceReport.topPerformers.map(
                  (performer, index) => (
                    <div
                      key={performer.studentId}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                              ? "bg-gray-400"
                              : index === 2
                              ? "bg-amber-600"
                              : "bg-blue-500"
                          }`}
                        >
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {performer.studentName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {performer.matricNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {performer.overallScore.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">Overall Score</p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Students Needing Attention */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Needs Attention
              </h3>

              <div className="space-y-3">
                {reportData.performanceReport.improvementNeeded.length > 0 ? (
                  reportData.performanceReport.improvementNeeded.map(
                    (student) => (
                      <div
                        key={student.studentId}
                        className="p-3 border border-orange-200 bg-orange-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.studentName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {student.matricNumber}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              (window.location.href = `/supervisor/industry/interns/${student.studentId}`)
                            }
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-orange-800">
                            Issues:
                          </p>
                          <ul className="text-xs text-orange-700 list-disc list-inside">
                            {student.issues.map((issue, index) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )
                  )
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p>All students are performing well!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </IndustrySupervisorLayout>
  );
};

export default ReportsPage;
