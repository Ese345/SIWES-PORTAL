"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Plus,
  BookOpen,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Send,
  Edit,
  Eye,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { APP_ROUTES, API_ROUTES, API_BASE_URL } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import tokenManager from "@/lib/token-manager";
import toast from "react-hot-toast";

// Types based on your backend schema
interface LogbookEntry {
  id: string;
  date: string;
  description: string;
  imageUrl?: string;
  submitted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LogbookStats {
  totalEntries: number;
  submittedEntries: number;
  draftEntries: number;
  currentWeekEntries: number;
  currentMonthEntries: number;
  todayEntry: boolean;
}

export default function LogbookDashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [stats, setStats] = useState<LogbookStats>({
    totalEntries: 0,
    submittedEntries: 0,
    draftEntries: 0,
    currentWeekEntries: 0,
    currentMonthEntries: 0,
    todayEntry: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingEntries, setSubmittingEntries] = useState<Set<string>>(
    new Set()
  );

  // Fetch logbook entries from API
  const fetchEntries = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fixed: Use the correct student logbook API route
      const response = await fetch(
        `${API_BASE_URL}${API_ROUTES.LOGBOOK.replace(":id", user.id)}`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // No entries found is not an error, just empty state
          setEntries([]);
          calculateStats([]);
          return;
        }
        throw new Error("Failed to fetch logbook entries");
      }

      const data = await response.json();
      console.log("Fetched entries:", data); // Debug log to see what data we're getting
      setEntries(data.entries || []);
      calculateStats(data.entries || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load entries");
      toast.error("Failed to load logbook entries");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Calculate statistics with proper date comparison
  const calculateStats = (entriesData: LogbookEntry[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const newStats: LogbookStats = {
      totalEntries: entriesData.length,
      submittedEntries: entriesData.filter((e) => e.submitted).length,
      draftEntries: entriesData.filter((e) => !e.submitted).length,
      currentWeekEntries: entriesData.filter((e) => {
        // Convert entry date string to Date object for comparison
        const entryDate = new Date(e.date);
        return entryDate >= weekAgo;
      }).length,
      currentMonthEntries: entriesData.filter((e) => {
        // Convert entry date string to Date object for comparison
        const entryDate = new Date(e.date);
        return entryDate >= monthStart;
      }).length,
      // Fixed: Compare date strings directly - handle both formats
      todayEntry: entriesData.some((e) => {
        console.log("Checking entry date:", e.date); // Debug log
        const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
        const todayminusoneday = new Date();
        todayminusoneday.setDate(todayminusoneday.getDate() - 1);
        const todayminusonedayStr = todayminusoneday
          .toISOString()
          .split("T")[0]; // "YYYY-MM-DD"
        const entryDateStr = e.date.includes("T")
          ? e.date.split("T")[0]
          : e.date;
        return entryDateStr === todayminusonedayStr || entryDateStr === today;
      }),
    };

    setStats(newStats);
  };

  // Submit an entry
  const handleSubmitEntry = async (entryId: string) => {
    if (!user) return;

    try {
      setSubmittingEntries((prev) => new Set(prev).add(entryId));

      const response = await fetch(
        `${API_BASE_URL}${API_ROUTES.LOGBOOK.replace(
          ":id",
          user.id
        )}/${entryId}/submit`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit entry");
      }

      toast.success("Entry submitted successfully!");
      await fetchEntries(); // Refresh entries
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit entry"
      );
    } finally {
      setSubmittingEntries((prev) => {
        const newSet = new Set(prev);
        newSet.delete(entryId);
        return newSet;
      });
    }
  };

  // Generate calendar data
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  // Fixed: Improved date matching to handle different date formats
  const getEntryForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]; // "YYYY-MM-DD"
    console.log("Looking for entry on date:", dateStr); // Debug log

    const entry = entries.find((entry) => {
      const entryDateStr = entry.date.includes("T")
        ? entry.date.split("T")[0]
        : entry.date;
      console.log("Comparing with entry date:", entryDateStr); // Debug log
      return entryDateStr === dateStr;
    });

    if (entry) {
      console.log("Found entry for date:", dateStr, entry); // Debug log
    }

    return entry;
  };

  const getStatusColor = (entry: LogbookEntry) => {
    if (!entry.submitted) return "bg-gray-400";
    // Since backend doesn't have approval status, submitted entries are "pending"
    return "bg-yellow-500";
  };

  const getStatusText = (entry: LogbookEntry) => {
    if (!entry.submitted) return "Draft";
    return "Submitted";
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === selectedDate.getMonth();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading your logbook...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Logbook Dashboard
              </h1>
              <p className="text-gray-600">
                Track your daily activities and manage your logbook entries
              </p>
              {!stats.todayEntry && (
                <div className="mt-2 flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Don&apos;t forget to add today&apos;s entry!
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex rounded-lg border border-gray-300 bg-white shadow-sm">
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                    viewMode === "calendar"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <CalendarIcon className="h-4 w-4 mr-2 inline" />
                  Calendar
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <BookOpen className="h-4 w-4 mr-2 inline" />
                  List
                </button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={fetchEntries}
                  disabled={isLoading}
                  className="shadow-sm"
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
                <Link href={APP_ROUTES.STUDENT_LOGBOOK_ENTRY_CREATE}>
                  <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-800 font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchEntries}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Enhanced Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card className="p-4 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.totalEntries}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Send className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Submitted</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.submittedEntries}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">This Week</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.currentWeekEntries}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">This Month</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.currentMonthEntries}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="flex items-center">
              <div
                className={`p-2 rounded-lg ${
                  stats.todayEntry ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <CheckCircle
                  className={`h-5 w-5 ${
                    stats.todayEntry ? "text-green-600" : "text-red-600"
                  }`}
                />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Today</p>
                <p
                  className={`text-lg font-bold ${
                    stats.todayEntry ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {stats.todayEntry ? "Done" : "Missing"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        {viewMode === "calendar" ? (
          <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {monthNames[selectedDate.getMonth()]}{" "}
                {selectedDate.getFullYear()}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setSelectedDate(newDate);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedDate(newDate);
                  }}
                >
                  Next
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-6">
              {/* Day Headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-semibold text-gray-700 bg-gray-50 rounded-lg"
                >
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {calendarDays.map((date, index) => {
                const entry = getEntryForDate(date);
                const dateStr = date.toISOString().split("T")[0];

                return (
                  <div
                    key={index}
                    className={`relative p-2 h-28 border border-gray-200 rounded-lg transition-all hover:shadow-sm ${
                      isCurrentMonth(date) ? "bg-white" : "bg-gray-50"
                    } ${
                      isToday(date) ? "ring-2 ring-blue-500 bg-blue-50" : ""
                    }`}
                  >
                    <div
                      className={`text-sm font-medium ${
                        isCurrentMonth(date) ? "text-gray-900" : "text-gray-400"
                      } ${isToday(date) ? "text-blue-900" : ""}`}
                    >
                      {date.getDate()}
                    </div>

                    {entry && (
                      <div className="mt-1 space-y-1">
                        <Link
                          href={APP_ROUTES.STUDENT_LOGBOOK_ENTRY_VIEW(entry.id)}
                        >
                          <div
                            className={`w-full h-6 rounded text-xs text-white flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(
                              entry
                            )}`}
                            title={entry.description}
                          >
                            <BookOpen className="h-3 w-3 mr-1" />
                            {entry.imageUrl && (
                              <ImageIcon className="h-3 w-3" />
                            )}
                          </div>
                        </Link>
                        {!entry.submitted && (
                          <button
                            onClick={() => handleSubmitEntry(entry.id)}
                            disabled={submittingEntries.has(entry.id)}
                            className="w-full h-5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded flex items-center justify-center transition-colors disabled:opacity-50"
                            title="Submit entry"
                          >
                            {submittingEntries.has(entry.id) ? (
                              <div className="animate-spin rounded-full h-2 w-2 border-b border-white"></div>
                            ) : (
                              <Send className="h-2 w-2" />
                            )}
                          </button>
                        )}
                        {/* Add entry button - user can add another entry for the same day */}
                        {/* if the entry is submitted, do not show the add button */}
                        {/* {entry.submitted && (
                          <div className="w-full h-4 border border-dashed border-blue-300 rounded flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors">
                            <Plus className="h-2 w-2" />
                          </div>
                        )} */}
                        {!entry.submitted && (
                          <Link
                            href={`${APP_ROUTES.STUDENT_LOGBOOK_ENTRY_CREATE}?date=${dateStr}`}
                          >
                            <div className="w-full h-4 border border-dashed border-blue-300 rounded flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors">
                              <Plus className="h-2 w-2" />
                            </div>
                          </Link>
                        )}
                      </div>
                    )}

                    {isCurrentMonth(date) && !entry && (
                      <Link
                        href={`${APP_ROUTES.STUDENT_LOGBOOK_ENTRY_CREATE}?date=${dateStr}`}
                      >
                        <div className="mt-1 w-full h-6 border border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors">
                          <Plus className="h-3 w-3" />
                        </div>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Enhanced Legend */}
            <div className="flex items-center justify-center gap-8 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-600">Submitted</span>
              </div>

              <div className="flex items-center gap-2">
                <ImageIcon className="w-3 h-3 text-blue-500" />
                <span className="text-sm text-gray-600">Has Image</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-2 border border-dashed border-blue-300 rounded"></div>
                <span className="text-sm text-gray-600">Add More</span>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Entries
              </h2>
              <Link href={APP_ROUTES.STUDENT_LOGBOOK_ENTRIES}>
                <Button variant="outline">View All Entries</Button>
              </Link>
            </div>

            <div className="space-y-4">
              {entries.length > 0 ? (
                entries.slice(0, 10).map((entry) => (
                  <div
                    key={entry.id}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <CalendarIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(entry.date)}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              entry.submitted
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full mr-1 ${
                                entry.submitted
                                  ? "bg-yellow-500"
                                  : "bg-gray-500"
                              }`}
                            ></div>
                            {getStatusText(entry)}
                          </span>
                          {entry.imageUrl && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Image
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                          {entry.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created: {new Date(entry.createdAt).toLocaleString()}
                          {entry.updatedAt !== entry.createdAt && (
                            <span>
                              {" "}
                              • Updated:{" "}
                              {new Date(entry.updatedAt).toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Link
                          href={APP_ROUTES.STUDENT_LOGBOOK_ENTRY_VIEW(entry.id)}
                        >
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        {!entry.submitted && (
                          <>
                            <Link
                              href={APP_ROUTES.STUDENT_LOGBOOK_ENTRY_EDIT(
                                entry.id
                              )}
                            >
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              onClick={() => handleSubmitEntry(entry.id)}
                              disabled={submittingEntries.has(entry.id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {submittingEntries.has(entry.id) ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-1"></div>
                              ) : (
                                <Send className="h-4 w-4 mr-1" />
                              )}
                              Submit
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No entries yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Start documenting your daily activities
                  </p>
                  <Link href={APP_ROUTES.STUDENT_LOGBOOK_ENTRY_CREATE}>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Entry
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
