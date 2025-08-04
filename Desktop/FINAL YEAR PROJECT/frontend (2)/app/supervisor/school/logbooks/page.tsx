/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import SchoolSupervisorLayout from "../layouxt";
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Calendar,
  User,
  ChevronDown,
  Download,
  RefreshCw,
  FileText,
  X,
  Check,
} from "lucide-react";
import { API_BASE_URL } from "@/constants";
import tokenManager from "@/lib/token-manager";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

// Types
interface LogbookEntry {
  content: any;
  title: any;
  status: string;
  id: string;
  description: string;
  date: string;
  submitted: boolean;
  imageUrl?: string;
  submittedAt?: string;
  reviewedAt?: string;
  feedback?: string;
  student: {
    id: string;
    matricNumber: string;
    department: string;
    user: {
      name: string;
      email: string;
    };
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
}

interface FilterOptions {
  status: string;
  department: string;
  dateRange: string;
  student: string;
}

const SchoolSupervisorLogbooks = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuth();
  const [logbooks, setLogbooks] = useState<LogbookEntry[]>([]);
  const [filteredLogbooks, setFilteredLogbooks] = useState<LogbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<LogbookEntry | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<
    "APPROVED" | "REJECTED" | null
  >(null);
  const [feedback, setFeedback] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    department: "all",
    dateRange: "all",
    student: "all",
  });

  const [showFilters, setShowFilters] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Fetch students assigned to school supervisor
  const fetchStudents = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/supervisors/students/school`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const studentsData = data.students || [];
        setStudents(studentsData);

        // Extract unique departments
        const uniqueDepartments = [
          ...new Set(
            studentsData.map((student: Student) => student.department)
          ),
        ];
        // @ts-expect-error jhdjdhhj
        setDepartments(uniqueDepartments);

        return studentsData;
      } else {
        throw new Error("Failed to fetch students");
      }
    } catch (err) {
      console.error("Students fetch error:", err);
      throw err;
    }
  };

  // Fetch logbook entries for all assigned students
  const fetchLogbooks = async () => {
    try {
      setLoading(true);
      setError(null);

      // First fetch students
      const studentsData = await fetchStudents();

      if (studentsData.length === 0) {
        setLogbooks([]);
        setFilteredLogbooks([]);
        return;
      }

      // Fetch logbook entries for each student
      const allEntries: LogbookEntry[] = [];

      await Promise.all(
        studentsData.map(async (student: Student) => {
          try {
            const response = await fetch(
              `${API_BASE_URL}/students/${student.id}/logbook`,
              {
                headers: {
                  Authorization: `Bearer ${tokenManager.getAccessToken()}`,
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              const entries = data.entries || [];

              // Add student information to each entry and filter for submitted entries
              const entriesWithStudent = entries
                .filter((entry: any) => entry.submitted) // Only show submitted entries
                .map((entry: any) => ({
                  ...entry,
                  student: student,
                  // Map the backend fields to frontend expected format
                  title: entry.description,
                  content: entry.description,
                  status: entry.feedback
                    ? entry.feedback.includes("approved")
                      ? "APPROVED"
                      : "REJECTED"
                    : "PENDING",
                  submittedAt: entry.updatedAt || entry.createdAt,
                }));

              allEntries.push(...entriesWithStudent);
            }
          } catch (err) {
            console.error(
              `Failed to fetch logbooks for student ${student.id}:`,
              err
            );
          }
        })
      );

      // Sort entries by submission date (most recent first)
      allEntries.sort(
        (a, b) =>
          new Date(b.submittedAt || b.date).getTime() -
          new Date(a.submittedAt || a.date).getTime()
      );

      setLogbooks(allEntries);
    } catch (err) {
      setError("Failed to load logbook entries");
      console.error("Logbooks error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and search
  useEffect(() => {
    let filtered = logbooks;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (entry) =>
          entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.student.user.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          entry.student.matricNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          entry.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply filters
    if (filters.status !== "all") {
      filtered = filtered.filter((entry) => entry.status === filters.status);
    }

    if (filters.department !== "all") {
      filtered = filtered.filter(
        (entry) => entry.student.department === filters.department
      );
    }

    if (filters.student !== "all") {
      filtered = filtered.filter(
        (entry) => entry.student.id === filters.student
      );
    }

    if (filters.dateRange !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (filters.dateRange) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(
            (entry) => new Date(entry.submittedAt || entry.date) >= filterDate
          );
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(
            (entry) => new Date(entry.submittedAt || entry.date) >= filterDate
          );
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(
            (entry) => new Date(entry.submittedAt || entry.date) >= filterDate
          );
          break;
      }
    }

    setFilteredLogbooks(filtered);
  }, [logbooks, searchTerm, filters]);

  // Handle review submission (for now, just update locally - implement actual review API later)
  const handleReviewSubmit = async () => {
    if (!selectedEntry || !reviewAction) return;

    try {
      setSubmittingReview(true);

      // For now, we'll simulate the review process since the backend doesn't have review endpoints yet
      // This would be replaced with actual API call when review endpoints are implemented

      // Update the logbook entry in the list
      setLogbooks((prev) =>
        prev.map((entry) =>
          entry.id === selectedEntry.id
            ? {
                ...entry,
                status: reviewAction,
                feedback: feedback.trim() || undefined,
                reviewedAt: new Date().toISOString(),
              }
            : entry
        )
      );

      // Close modal and reset state
      setIsReviewModalOpen(false);
      setSelectedEntry(null);
      setReviewAction(null);
      setFeedback("");

      // Show success message (you can implement a toast notification here)
      console.log(`Entry ${reviewAction.toLowerCase()} successfully`);
    } catch (err) {
      setError("Failed to submit review");
      console.error("Review error:", err);
    } finally {
      setSubmittingReview(false);
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

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      status: "all",
      department: "all",
      dateRange: "all",
      student: "all",
    });
    setSearchTerm("");
  };

  useEffect(() => {
    fetchLogbooks();
  }, []);

  if (loading) {
    return (
      <SchoolSupervisorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading logbook entries...</p>
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
              Student Logbooks
            </h1>
            <p className="text-gray-600">
              Review and manage student logbook entries
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchLogbooks}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchLogbooks}
              className="ml-auto px-3 py-1 border border-red-300 rounded text-red-700 hover:bg-red-100 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by description, student name, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                {/* Department Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={filters.department}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        dateRange: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                  </select>
                </div>

                {/* Student Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student
                  </label>
                  <select
                    value={filters.student}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        student: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Students</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.user.name} ({student.matricNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            Showing {filteredLogbooks.length} of {logbooks.length} entries
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-yellow-500" />
              {
                filteredLogbooks.filter((e) => e.status === "PENDING").length
              }{" "}
              Pending
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              {
                filteredLogbooks.filter((e) => e.status === "APPROVED").length
              }{" "}
              Approved
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              {
                filteredLogbooks.filter((e) => e.status === "REJECTED").length
              }{" "}
              Rejected
            </span>
          </div>
        </div>

        {/* Logbook Entries List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredLogbooks.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredLogbooks.map((entry) => (
                <div
                  key={entry.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {getStatusIcon(entry.status || "PENDING")}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {entry.description || "Logbook Entry"}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                              entry.status || "PENDING"
                            )}`}
                          >
                            {entry.status || "PENDING"}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {entry.student.user.name} (
                            {entry.student.matricNumber})
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(entry.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Submitted:{" "}
                            {formatDate(entry.submittedAt || entry.date)}
                          </span>
                        </div>

                        <p className="text-gray-700 mb-3 line-clamp-2">
                          {entry.description}
                        </p>

                        {entry.feedback && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-3">
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              Feedback:
                            </p>
                            <p className="text-sm text-gray-700">
                              {entry.feedback}
                            </p>
                            {entry.reviewedAt && (
                              <p className="text-xs text-gray-500 mt-1">
                                Reviewed: {formatDate(entry.reviewedAt)}
                              </p>
                            )}
                          </div>
                        )}

                        {entry.imageUrl && (
                          <div className="flex items-center gap-2 mb-3">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              1 attachment
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedEntry(entry);
                          setIsReviewModalOpen(true);
                        }}
                        className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        {(entry.status || "PENDING") === "PENDING"
                          ? "Review"
                          : "View"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">
                No logbook entries found
              </p>
              <p className="text-gray-400">
                {searchTerm || Object.values(filters).some((f) => f !== "all")
                  ? "Try adjusting your search or filters"
                  : "No logbook entries have been submitted yet"}
              </p>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {isReviewModalOpen && selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Review Logbook Entry
                </h2>
                <button
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    setSelectedEntry(null);
                    setReviewAction(null);
                    setFeedback("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Entry Details */}
                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {selectedEntry.description || "Logbook Entry"}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {selectedEntry.student.user.name} (
                        {selectedEntry.student.matricNumber})
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(selectedEntry.date)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          selectedEntry.status || "PENDING"
                        )}`}
                      >
                        {selectedEntry.status || "PENDING"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Content:</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {selectedEntry.description}
                      </p>
                    </div>
                  </div>

                  {selectedEntry.imageUrl && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Attachment:
                      </h4>
                      <div className="space-y-2">
                        <a
                          href={selectedEntry.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            View Image
                          </span>
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedEntry.feedback && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Previous Feedback:
                      </h4>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-gray-700">
                          {selectedEntry.feedback}
                        </p>
                        {selectedEntry.reviewedAt && (
                          <p className="text-xs text-gray-500 mt-2">
                            Reviewed: {formatDate(selectedEntry.reviewedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Review Actions */}
                {(selectedEntry.status || "PENDING") === "PENDING" && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">
                      Review Decision:
                    </h4>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setReviewAction("APPROVED")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          reviewAction === "APPROVED"
                            ? "bg-green-50 border-green-300 text-green-700"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => setReviewAction("REJECTED")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          reviewAction === "REJECTED"
                            ? "bg-red-50 border-red-300 text-red-700"
                            : "border-gray-300 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </div>

                    {reviewAction && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Feedback{" "}
                          {reviewAction === "REJECTED"
                            ? "(Required)"
                            : "(Optional)"}
                          :
                        </label>
                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder={
                            reviewAction === "APPROVED"
                              ? "Add any comments or suggestions..."
                              : "Please explain why this entry is being rejected..."
                          }
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    setSelectedEntry(null);
                    setReviewAction(null);
                    setFeedback("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                {(selectedEntry.status || "PENDING") === "PENDING" &&
                  reviewAction && (
                    <button
                      onClick={handleReviewSubmit}
                      disabled={
                        submittingReview ||
                        (reviewAction === "REJECTED" && !feedback.trim())
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingReview ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Submit Review
                    </button>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
    </SchoolSupervisorLayout>
  );
};

export default SchoolSupervisorLogbooks;
