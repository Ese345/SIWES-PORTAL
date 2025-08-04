"use client";

import React, { useState, useEffect } from "react";
import IndustrySupervisorLayout from "../layouxt";
import {
  Users,
  Search,
  Eye,
  Mail,
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  GraduationCap,
  UserCheck,
  FileText,
  MoreVertical,
  Download,
  RefreshCw,
} from "lucide-react";
import { API_BASE_URL } from "@/constants";
import tokenManager from "@/lib/token-manager";
import { formatDate } from "@/lib/utils";

// Types
interface Student {
  id: string;
  matricNumber: string;
  department: string;
  profile?: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  attendanceStats?: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    attendanceRate: number;
    lastAttendance?: {
      date: string;
      present: boolean;
      notes?: string;
    };
  };
  createdAt: string;
}

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  attendanceRate: number;
  lastAttendance?: {
    date: string;
    present: boolean;
    notes?: string;
  };
}

const InternsManagementPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch students with attendance data
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/attendance/supervisor/students`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setFilteredStudents(data.students || []);
      } else {
        throw new Error("Failed to fetch students");
      }
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load students. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  };

  // Filter and search logic
  useEffect(() => {
    let filtered = [...students];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.matricNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          student.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply attendance filter
    if (attendanceFilter !== "all") {
      filtered = filtered.filter((student) => {
        if (!student.attendanceStats) return attendanceFilter === "no-data";

        switch (attendanceFilter) {
          case "excellent":
            return student.attendanceStats.attendanceRate >= 90;
          case "good":
            return (
              student.attendanceStats.attendanceRate >= 75 &&
              student.attendanceStats.attendanceRate < 90
            );
          case "poor":
            return student.attendanceStats.attendanceRate < 75;
          case "no-data":
            return student.attendanceStats.totalDays === 0;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.user.name.localeCompare(b.user.name);
        case "matric":
          return a.matricNumber.localeCompare(b.matricNumber);
        case "department":
          return a.department.localeCompare(b.department);
        case "attendance":
          const aRate = a.attendanceStats?.attendanceRate || 0;
          const bRate = b.attendanceStats?.attendanceRate || 0;
          return bRate - aRate;
        case "recent":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredStudents(filtered);
  }, [students, searchTerm, attendanceFilter, sortBy]);

  useEffect(() => {
    fetchStudents();
  }, []);

  // Get attendance status color and text
  const getAttendanceStatus = (stats?: AttendanceStats) => {
    if (!stats || stats.totalDays === 0) {
      return {
        color: "bg-gray-100 text-gray-800",
        text: "No Data",
        icon: <AlertTriangle className="h-4 w-4" />,
      };
    }

    const rate = stats.attendanceRate;
    if (rate >= 90) {
      return {
        color: "bg-green-100 text-green-800",
        text: "Excellent",
        icon: <CheckCircle className="h-4 w-4" />,
      };
    } else if (rate >= 75) {
      return {
        color: "bg-blue-100 text-blue-800",
        text: "Good",
        icon: <CheckCircle className="h-4 w-4" />,
      };
    } else {
      return {
        color: "bg-red-100 text-red-800",
        text: "Poor",
        icon: <AlertTriangle className="h-4 w-4" />,
      };
    }
  };

  // Student Details Modal
  const StudentDetailsModal = ({ student }: { student: Student }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Intern Details
            </h2>
            <button
              onClick={() => setShowDetailsModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{student.user.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Matric Number</p>
                  <p className="font-medium">{student.matricNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{student.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{student.user.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          {student.attendanceStats && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Attendance Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-600">Total Days</p>
                  <p className="text-xl font-bold text-blue-900">
                    {student.attendanceStats.totalDays}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-600">Present</p>
                  <p className="text-xl font-bold text-green-900">
                    {student.attendanceStats.presentDays}
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-600">Absent</p>
                  <p className="text-xl font-bold text-red-900">
                    {student.attendanceStats.absentDays}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-purple-600">Rate</p>
                  <p className="text-xl font-bold text-purple-900">
                    {student.attendanceStats.attendanceRate.toFixed(1)}%
                  </p>
                </div>
              </div>

              {student.attendanceStats.lastAttendance && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Last Attendance</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">
                      {formatDate(student.attendanceStats.lastAttendance.date)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        student.attendanceStats.lastAttendance.present
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {student.attendanceStats.lastAttendance.present
                        ? "Present"
                        : "Absent"}
                    </span>
                  </div>
                  {student.attendanceStats.lastAttendance.notes && (
                    <p className="text-sm text-gray-600 mt-1">
                      Notes: {student.attendanceStats.lastAttendance.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Profile */}
          {student.profile && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Profile
              </h3>
              <p className="text-gray-700">{student.profile}</p>
            </div>
          )}

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  window.location.href = `/supervisor/industry/attendance?student=${student.id}`;
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <UserCheck className="h-4 w-4" />
                Mark Attendance
              </button>
              <button
                onClick={() => {
                  window.location.href = `/supervisor/industry/logbooks?student=${student.id}`;
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <FileText className="h-4 w-4" />
                View Logbooks
              </button>
              <button
                onClick={() =>
                  window.open(`mailto:${student.user.email}`, "_blank")
                }
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Mail className="h-4 w-4" />
                Send Email
              </button>
            </div>
          </div>
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
            <p className="mt-4 text-gray-600">Loading interns...</p>
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
              Interns Management
            </h1>
            <p className="text-gray-600">
              Manage and monitor your assigned interns
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={() =>
                (window.location.href = "/supervisor/industry/attendance")
              }
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserCheck className="h-4 w-4" />
              Mark Attendance
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchStudents}
              className="ml-auto px-3 py-1 border border-red-300 rounded text-red-700 hover:bg-red-100 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Interns</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Excellent Attendance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    students.filter(
                      (s) =>
                        s.attendanceStats &&
                        s.attendanceStats.attendanceRate >= 90
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Needs Attention</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    students.filter(
                      (s) =>
                        s.attendanceStats &&
                        s.attendanceStats.attendanceRate < 75
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg. Attendance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {students.length > 0
                    ? Math.round(
                        students
                          .filter((s) => s.attendanceStats)
                          .reduce(
                            (acc, s) =>
                              acc + (s.attendanceStats?.attendanceRate || 0),
                            0
                          ) / students.filter((s) => s.attendanceStats).length
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search interns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Attendance Filter */}
            <select
              value={attendanceFilter}
              onChange={(e) => setAttendanceFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Attendance</option>
              <option value="excellent">Excellent (≥90%)</option>
              <option value="good">Good (75-89%)</option>
              <option value="poor">Poor (&lt;75%)</option>
              <option value="no-data">No Data</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="matric">Sort by Matric</option>
              <option value="department">Sort by Department</option>
              <option value="attendance">Sort by Attendance</option>
              <option value="recent">Sort by Recent</option>
            </select>

            {/* Export Button */}
            <button
              onClick={() => {
                // TODO: Implement export functionality
                console.log("Export interns data");
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Interns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const attendanceStatus = getAttendanceStatus(
                student.attendanceStats
              );

              return (
                <div
                  key={student.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {student.user.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {student.matricNumber}
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4" />
                      <span>{student.department}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{student.user.email}</span>
                    </div>

                    {student.attendanceStats && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Attendance:
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${attendanceStatus.color}`}
                          >
                            {attendanceStatus.icon}
                            {attendanceStatus.text}
                          </span>
                          <span className="text-sm font-medium">
                            {student.attendanceStats.attendanceRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {student.attendanceStats &&
                      student.attendanceStats.lastAttendance && (
                        <div className="text-xs text-gray-500">
                          Last:{" "}
                          {formatDate(
                            student.attendanceStats.lastAttendance.date
                          )}{" "}
                          -
                          <span
                            className={
                              student.attendanceStats.lastAttendance.present
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {" "}
                            {student.attendanceStats.lastAttendance.present
                              ? "Present"
                              : "Absent"}
                          </span>
                        </div>
                      )}
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowDetailsModal(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      Details
                    </button>
                    <button
                      onClick={() => {
                        window.location.href = `/supervisor/industry/attendance?student=${student.id}`;
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                    >
                      <UserCheck className="h-4 w-4" />
                      Attendance
                    </button>
                    <button
                      onClick={() =>
                        window.open(`mailto:${student.user.email}`, "_blank")
                      }
                      className="p-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No interns found
              </h3>
              <p className="text-gray-600">
                {searchTerm || attendanceFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "No interns have been assigned to you yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Student Details Modal */}
      {showDetailsModal && selectedStudent && (
        <StudentDetailsModal student={selectedStudent} />
      )}
    </IndustrySupervisorLayout>
  );
};

export default InternsManagementPage;
