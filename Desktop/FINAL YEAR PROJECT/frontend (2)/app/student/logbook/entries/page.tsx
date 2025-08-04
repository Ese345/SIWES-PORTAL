"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Search,
  Filter,
  Plus,
  BookOpen,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { APP_ROUTES } from "@/constants";

export default function LogbookEntriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Mock data - replace with actual API calls
  const entries = [
    {
      id: "1",
      date: "2024-01-15",
      description:
        "Worked on database optimization tasks and performance tuning. Implemented indexing strategies and analyzed query execution plans. Collaborated with senior developers on best practices.",
      submitted: true,
      status: "approved",
      hasImage: true,
      submittedAt: "2024-01-15T18:30:00Z",
      approvedAt: "2024-01-16T09:15:00Z",
      comments: 2,
    },
    {
      id: "2",
      date: "2024-01-14",
      description:
        "Participated in daily standup meeting and code review session. Reviewed pull requests from team members and provided constructive feedback on implementation approaches.",
      submitted: true,
      status: "pending",
      hasImage: false,
      submittedAt: "2024-01-14T17:45:00Z",
      comments: 0,
    },
    {
      id: "3",
      date: "2024-01-13",
      description:
        "Worked on bug fixes for the authentication module. Debugged session timeout issues and implemented proper error handling for edge cases.",
      submitted: false,
      status: "draft",
      hasImage: true,
      comments: 0,
    },
    {
      id: "4",
      date: "2024-01-12",
      description:
        "Attended training session on React best practices and modern development workflows. Learned about new hooks and performance optimization techniques.",
      submitted: true,
      status: "approved",
      hasImage: false,
      submittedAt: "2024-01-12T16:20:00Z",
      approvedAt: "2024-01-13T10:30:00Z",
      comments: 1,
    },
    {
      id: "5",
      date: "2024-01-11",
      description:
        "Set up development environment and familiarized myself with the project structure. Installed necessary tools and dependencies.",
      submitted: true,
      status: "pending",
      hasImage: true,
      submittedAt: "2024-01-11T19:00:00Z",
      comments: 0,
    },
  ];

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch = entry.description
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || entry.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const entryDate = new Date(entry.date);
      const now = new Date();

      switch (dateFilter) {
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = entryDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = entryDate >= monthAgo;
          break;
        case "submitted":
          matchesDate = entry.submitted;
          break;
        case "draft":
          matchesDate = !entry.submitted;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusBadge = (status: string, submitted: boolean) => {
    if (!submitted) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <FileText className="h-3 w-3" />
          Draft
        </span>
      );
    }

    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            Pending Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <FileText className="h-3 w-3" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Logbook Entries
              </h1>
              <p className="text-gray-600">
                Manage and review all your logbook entries
              </p>
            </div>
            <Link href={APP_ROUTES.STUDENT_LOGBOOK_ENTRY_CREATE}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New Entry
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="submitted">Submitted Only</option>
              <option value="draft">Drafts Only</option>
            </select>

            <div className="flex items-center text-sm text-gray-600">
              <Filter className="h-4 w-4 mr-2" />
              {filteredEntries.length} of {entries.length} entries
            </div>
          </div>
        </Card>

        {/* Entries List */}
        <div className="space-y-4">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry) => (
              <Card
                key={entry.id}
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Entry Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(entry.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      {getStatusBadge(entry.status, entry.submitted)}
                      {entry.hasImage && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <ImageIcon className="h-3 w-3" />
                          Image
                        </span>
                      )}
                      {entry.comments > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          💬 {entry.comments} comment
                          {entry.comments > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Entry Description */}
                    <p className="text-gray-700 mb-3 line-clamp-3">
                      {entry.description}
                    </p>

                    {/* Entry Metadata */}
                    <div className="text-sm text-gray-500 space-y-1">
                      {entry.submittedAt && (
                        <div>
                          Submitted:{" "}
                          {new Date(entry.submittedAt).toLocaleString()}
                        </div>
                      )}
                      {entry.approvedAt && (
                        <div>
                          Approved:{" "}
                          {new Date(entry.approvedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
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
                      <Link
                        href={APP_ROUTES.STUDENT_LOGBOOK_ENTRY_EDIT(entry.id)}
                      >
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No entries found
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "You haven't created any logbook entries yet."}
                </p>
                {!searchTerm &&
                  statusFilter === "all" &&
                  dateFilter === "all" && (
                    <Link href={APP_ROUTES.STUDENT_LOGBOOK_ENTRY_CREATE}>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Entry
                      </Button>
                    </Link>
                  )}
              </div>
            </Card>
          )}
        </div>

        {/* Statistics Summary */}
        {filteredEntries.length > 0 && (
          <Card className="p-6 mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredEntries.length}
                </div>
                <div className="text-sm text-gray-600">Total Entries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {
                    filteredEntries.filter((e) => e.status === "approved")
                      .length
                  }
                </div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredEntries.filter((e) => e.status === "pending").length}
                </div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {filteredEntries.filter((e) => !e.submitted).length}
                </div>
                <div className="text-sm text-gray-600">Drafts</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
