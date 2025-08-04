"use client";

import React, { useState, useEffect } from "react";
import IndustrySupervisorLayout from "../layouxt";
import {
  BookOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Filter,
  Calendar,
  User,
  MessageCircle,
  RefreshCw,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { API_BASE_URL } from "@/constants";
import tokenManager from "@/lib/token-manager";
import { formatDate } from "@/lib/utils";

interface LogbookEntry {
  id: string;
  date: string;
  description: string;
  imageUrl?: string;
  submitted: boolean;
  reviewStatus?: "PENDING" | "APPROVED" | "REJECTED";
  reviewComments?: string;
  reviewedAt?: string;
  createdAt: string;
  student: {
    user: {
      id: string;
      name: string;
      email: string;
    };
    matricNumber: string;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ReviewStats {
  totalSubmitted: number;
  pendingReviews: number;
  approvedEntries: number;
  rejectedEntries: number;
  totalReviewed: number;
  reviewProgress: number;
}

const LogbookReviewsPage = () => {
  const [pendingEntries, setPendingEntries] = useState<LogbookEntry[]>([]);
  const [reviewedEntries, setReviewedEntries] = useState<LogbookEntry[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalSubmitted: 0,
    pendingReviews: 0,
    approvedEntries: 0,
    rejectedEntries: 0,
    totalReviewed: 0,
    reviewProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "reviewed">("pending");
  const [selectedEntry, setSelectedEntry] = useState<LogbookEntry | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    reviewStatus: "APPROVED" as "APPROVED" | "REJECTED",
    reviewComments: "",
  });
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Fetch review statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/logbook/review/stats`, {
        headers: {
          Authorization: `Bearer ${tokenManager.getAccessToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // Fetch pending reviews
  const fetchPendingReviews = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/logbook/pending-reviews?limit=50`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPendingEntries(data.entries || []);
      } else {
        setError("Failed to fetch pending reviews");
      }
    } catch (err) {
      setError("Failed to fetch pending reviews");
      console.error("Error:", err);
    }
  };

  // Fetch reviewed entries
  const fetchReviewedEntries = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== "all") {
        params.append("status", filterStatus.toUpperCase());
      }
      params.append("limit", "50");

      const response = await fetch(
        `${API_BASE_URL}/logbook/reviewed?${params}`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReviewedEntries(data.entries || []);
      } else {
        setError("Failed to fetch reviewed entries");
      }
    } catch (err) {
      setError("Failed to fetch reviewed entries");
      console.error("Error:", err);
    }
  };

  // Submit review
  const submitReview = async () => {
    if (!selectedEntry) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/logbook/review/${selectedEntry.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
          body: JSON.stringify(reviewForm),
        }
      );

      if (response.ok) {
        setShowReviewModal(false);
        setSelectedEntry(null);
        setReviewForm({ reviewStatus: "APPROVED", reviewComments: "" });
        // Refresh data
        fetchPendingReviews();
        fetchReviewedEntries();
        fetchStats();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to submit review");
      }
    } catch (err) {
      setError("Failed to submit review");
      console.error("Error:", err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchPendingReviews(),
        fetchReviewedEntries(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === "reviewed") {
      fetchReviewedEntries();
    }
  }, [filterStatus]);

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

  if (loading) {
    return (
      <IndustrySupervisorLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading logbook reviews...</p>
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
              Logbook Reviews
            </h1>
            <p className="text-gray-600">
              Review and approve intern logbook entries
            </p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Reviews
                </p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {stats.pendingReviews}
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.approvedEntries}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {stats.rejectedEntries}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats.reviewProgress.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("pending")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "pending"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Pending Reviews ({stats.pendingReviews})
              </button>
              <button
                onClick={() => setActiveTab("reviewed")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "reviewed"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Reviewed ({stats.totalReviewed})
              </button>
            </nav>
          </div>

          {/* Filters */}
          {activeTab === "reviewed" && (
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {activeTab === "pending" ? (
              <div className="space-y-4">
                {pendingEntries.length > 0 ? (
                  pendingEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Clock className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {entry.student.user.name}
                              </h4>
                              <span className="text-sm text-gray-500">
                                ({entry.student.matricNumber})
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {entry.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Entry Date: {formatDate(entry.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Submitted: {formatDate(entry.createdAt)}
                              </span>
                              {entry.imageUrl && (
                                <span className="flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  Has Image
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedEntry(entry);
                              setShowReviewModal(true);
                            }}
                            className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No pending reviews</p>
                    <p className="text-sm">
                      All submitted entries have been reviewed
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {reviewedEntries.length > 0 ? (
                  reviewedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(entry.reviewStatus!)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {entry.student.user.name}
                              </h4>
                              <span className="text-sm text-gray-500">
                                ({entry.student.matricNumber})
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                  entry.reviewStatus!
                                )}`}
                              >
                                {entry.reviewStatus}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {entry.description}
                            </p>
                            {entry.reviewComments && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <MessageCircle className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs font-medium text-gray-600">
                                    Review Comments:
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700">
                                  {entry.reviewComments}
                                </p>
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Entry Date: {formatDate(entry.date)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Reviewed: {formatDate(entry.reviewedAt!)}
                              </span>
                              {entry.imageUrl && (
                                <span className="flex items-center gap-1">
                                  <ImageIcon className="h-3 w-3" />
                                  Has Image
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No reviewed entries</p>
                    <p className="text-sm">
                      {filterStatus === "all"
                        ? "No entries have been reviewed yet"
                        : `No ${filterStatus} entries found`}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {showReviewModal && selectedEntry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Review Logbook Entry
                </h3>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Entry Details */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">
                    {selectedEntry.student.user.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({selectedEntry.student.matricNumber})
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Entry Date: {formatDate(selectedEntry.date)}
                  </span>
                </div>
                <div className="mb-3">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Description:
                  </h4>
                  <p className="text-gray-700">{selectedEntry.description}</p>
                </div>
                {selectedEntry.imageUrl && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Attachment:
                    </h4>
                    <img
                      src={selectedEntry.imageUrl}
                      alt="Logbook entry"
                      className="max-w-full h-auto rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>

              {/* Review Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Decision
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={reviewForm.reviewStatus === "APPROVED"}
                        onChange={() =>
                          setReviewForm({
                            ...reviewForm,
                            reviewStatus: "APPROVED",
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-green-700">Approve</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={reviewForm.reviewStatus === "REJECTED"}
                        onChange={() =>
                          setReviewForm({
                            ...reviewForm,
                            reviewStatus: "REJECTED",
                          })
                        }
                        className="mr-2"
                      />
                      <span className="text-red-700">Reject</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments
                    {reviewForm.reviewStatus === "REJECTED" && (
                      <span className="text-red-500">*</span>
                    )}
                  </label>
                  <textarea
                    value={reviewForm.reviewComments}
                    onChange={(e) =>
                      setReviewForm({
                        ...reviewForm,
                        reviewComments: e.target.value,
                      })
                    }
                    placeholder={
                      reviewForm.reviewStatus === "APPROVED"
                        ? "Add any feedback or comments (optional)..."
                        : "Please provide reason for rejection..."
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReview}
                  disabled={
                    reviewForm.reviewStatus === "REJECTED" &&
                    !reviewForm.reviewComments.trim()
                  }
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </IndustrySupervisorLayout>
  );
};

export default LogbookReviewsPage;
