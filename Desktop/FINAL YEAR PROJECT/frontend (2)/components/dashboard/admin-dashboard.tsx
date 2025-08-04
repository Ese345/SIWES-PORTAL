"use client";

import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import {
  Users,
  GraduationCap,
  UserCheck,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  Activity,
  Database,
  Shield,
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();

  // Mock data - will be replaced with real API calls
  const stats = {
    totalUsers: 156,
    totalStudents: 120,
    schoolSupervisors: 18,
    industrySupervisors: 15,
    activeLogbooks: 98,
    pendingApprovals: 23,
    systemHealth: "Good",
    storageUsed: "2.4GB",
  };

  const recentActivity = [
    {
      id: "1",
      action: "New student registered",
      user: "John Doe",
      time: "5 minutes ago",
      type: "user",
    },
    {
      id: "2",
      action: "Logbook entry submitted",
      user: "Jane Smith",
      time: "15 minutes ago",
      type: "logbook",
    },
    {
      id: "3",
      action: "Supervisor approved entry",
      user: "Dr. Wilson",
      time: "1 hour ago",
      type: "approval",
    },
    {
      id: "4",
      action: "System backup completed",
      user: "System",
      time: "2 hours ago",
      type: "system",
    },
  ];

  const systemAlerts = [
    {
      id: "1",
      message: "Server maintenance scheduled for tonight",
      type: "info",
      time: "1 hour ago",
    },
    {
      id: "2",
      message: "23 logbook entries pending approval",
      type: "warning",
      time: "2 hours ago",
    },
    {
      id: "3",
      message: "Storage usage at 80%",
      type: "warning",
      time: "1 day ago",
    },
  ];

  const userBreakdown = [
    {
      role: "Students",
      count: stats.totalStudents,
      color: "bg-blue-100 text-blue-800",
    },
    {
      role: "School Supervisors",
      count: stats.schoolSupervisors,
      color: "bg-green-100 text-green-800",
    },
    {
      role: "Industry Supervisors",
      count: stats.industrySupervisors,
      color: "bg-purple-100 text-purple-800",
    },
    { role: "Admins", count: 3, color: "bg-red-100 text-red-800" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            System Administration
          </h1>
          <p className="text-gray-600">
            Monitor and manage the SIWES portal system
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Administrator</p>
          <p className="font-medium">{user?.name}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Students
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalStudents}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Logbooks
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeLogbooks}
                </p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +15% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Approvals
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingApprovals}
                </p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs text-yellow-600">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Requires attention
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              User Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userBreakdown.map((item) => (
                <div
                  key={item.role}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {item.role}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${item.color}`}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === "user"
                        ? "bg-blue-500"
                        : activity.type === "logbook"
                        ? "bg-green-500"
                        : activity.type === "approval"
                        ? "bg-purple-500"
                        : "bg-gray-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.type === "warning"
                      ? "bg-yellow-50 border-yellow-400"
                      : alert.type === "error"
                      ? "bg-red-50 border-red-400"
                      : "bg-blue-50 border-blue-400"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  System Health
                </span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {stats.systemHealth}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Storage Used
                </span>
                <span className="text-sm text-gray-900">
                  {stats.storageUsed} / 10GB
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "24%" }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserCheck className="w-5 h-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm">User Management</div>
                <div className="text-xs text-gray-500">
                  Manage users and permissions
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm">System Settings</div>
                <div className="text-xs text-gray-500">
                  Configure system parameters
                </div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                <div className="font-medium text-sm">Generate Reports</div>
                <div className="text-xs text-gray-500">
                  View system analytics
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
