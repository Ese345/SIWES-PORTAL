"use client";

import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import {
  Users,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Role } from "@/types";

export default function SupervisorDashboard() {
  const { user } = useAuth();

  // Mock data - will be replaced with real API calls
  const stats = {
    assignedStudents: 8,
    pendingReviews: 5,
    todayAttendance: 7,
    approvedEntries: 23,
  };

  const pendingReviews = [
    {
      id: "1",
      studentName: "John Doe",
      title: "React Component Development",
      date: "2025-06-08",
    },
    {
      id: "2",
      studentName: "Jane Smith",
      title: "Database Query Optimization",
      date: "2025-06-07",
    },
    {
      id: "3",
      studentName: "Mike Johnson",
      title: "API Testing Session",
      date: "2025-06-07",
    },
  ];

  const recentStudentActivity = [
    {
      id: "1",
      studentName: "John Doe",
      action: "Submitted logbook entry",
      time: "2 hours ago",
    },
    {
      id: "2",
      studentName: "Jane Smith",
      action: "Updated profile",
      time: "4 hours ago",
    },
    {
      id: "3",
      studentName: "Mike Johnson",
      action: "Marked present",
      time: "1 day ago",
    },
  ];

  const supervisorType =
    user?.role === Role.SchoolSupervisor ? "School" : "Industry";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            {supervisorType} Supervisor Dashboard - Manage your assigned
            students
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Supervisor Type</p>
          <p className="font-medium">{supervisorType}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Assigned Students
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.assignedStudents}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Reviews
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingReviews}
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Today&apos;s Attendance
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.todayAttendance}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Approved Entries
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.approvedEntries}
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Pending Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingReviews.length > 0 ? (
                pendingReviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {review.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {review.studentName}
                      </p>
                      <p className="text-xs text-gray-500">{review.date}</p>
                    </div>
                    <button className="px-3 py-1 text-sm font-medium text-yellow-800 bg-yellow-200 rounded-full hover:bg-yellow-300">
                      Review
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No pending reviews</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Student Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recent Student Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentStudentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {activity.studentName}
                    </p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                  </div>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Review Logbooks</p>
                  <p className="text-sm text-gray-600">
                    Review student entries
                  </p>
                </div>
              </div>
            </button>

            <button className="p-4 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Mark Attendance</p>
                  <p className="text-sm text-gray-600">
                    Record student attendance
                  </p>
                </div>
              </div>
            </button>

            <button className="p-4 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">View Students</p>
                  <p className="text-sm text-gray-600">
                    Manage assigned students
                  </p>
                </div>
              </div>
            </button>

            <button className="p-4 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="font-medium text-gray-900">Analytics</p>
                  <p className="text-sm text-gray-600">
                    View performance metrics
                  </p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
