"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  GraduationCap,
  Building,
  FileText,
  AlertTriangle,
  BarChart3,
  UserCheck,
  Clock,
  ChevronRight,
  Activity,
  Database,
  Shield,
} from "lucide-react";
import { useUserStats } from "@/hooks/use-users";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui";
import { APP_ROUTES } from "@/constants";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data for additional dashboard metrics (to be replaced with real API calls)
const recentActivities = [
  {
    id: 1,
    type: "user_created",
    message: "New student John Doe registered",
    timestamp: "2 minutes ago",
    icon: Users,
    color: "text-blue-600",
  },
  {
    id: 2,
    type: "logbook_submitted",
    message: "Sarah Johnson submitted logbook entry",
    timestamp: "15 minutes ago",
    icon: FileText,
    color: "text-green-600",
  },
  {
    id: 3,
    type: "supervisor_assigned",
    message: "Industry supervisor assigned to 5 students",
    timestamp: "1 hour ago",
    icon: UserCheck,
    color: "text-purple-600",
  },
  {
    id: 4,
    type: "attendance_marked",
    message: "Attendance marked for Computer Science department",
    timestamp: "2 hours ago",
    icon: Clock,
    color: "text-orange-600",
  },
];

const quickActions = [
  {
    title: "Bulk Upload",
    description: "Upload multiple users via CSV/Excel",
    icon: Users,
    action: () => APP_ROUTES.ADMIN_USERS_UPLOAD,
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    title: "View Analytics",
    description: "System usage and performance metrics",
    icon: BarChart3,
    action: () => APP_ROUTES.ADMIN_ANALYTICS,
    color: "bg-purple-500 hover:bg-purple-600",
  },
  {
    title: "Manage Users",
    description: "View and manage all system users",
    icon: Users,
    action: () => APP_ROUTES.ADMIN_USERS,
    color: "bg-orange-500 hover:bg-orange-600",
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const {
    data: userStats,
    isLoading: statsLoading,
    error: statsError,
  } = useUserStats();

  return (
    <div className="w-full flex flex-col">
      {/* Header */}
      <header className="flex h-[60px] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-lg font-sans font-semibold">Admin Dashboard</h1>
        </div>
      </header>

      <section className="p-6 space-y-6">
        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsLoading ? (
            <div className="col-span-4">
              <Skeleton className="h-20 border " />
            </div>
          ) : statsError || !userStats ? (
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle className="text-red-600">
                  Error Loading Statistics
                </CardTitle>
                <CardDescription>
                  Unable to fetch dashboard data
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">
                  Please try refreshing the page or contact support if the
                  problem persists.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Retry
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        {userStats.usersByRole.Student || 0}
                      </CardTitle>
                      <CardDescription>Total Students</CardDescription>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <GraduationCap className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardFooter>
                  <span className="text-xs text-green-600">+ recent</span>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        {userStats.usersByRole.SchoolSupervisor || 0}
                      </CardTitle>
                      <CardDescription>School Supervisors</CardDescription>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <Building className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardFooter>
                  <span className="text-xs text-blue-600">Academic staff</span>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        {userStats.usersByRole.IndustrySupervisor || 0}
                      </CardTitle>
                      <CardDescription>Industry Supervisors</CardDescription>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <Building className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardFooter>
                  <span className="text-xs text-purple-600">
                    Industry partners
                  </span>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        {userStats.totalUsers}
                      </CardTitle>
                      <CardDescription>Total Users</CardDescription>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-full">
                      <Users className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardHeader>
                <CardFooter>
                  <span className="text-xs text-orange-600">
                    All system users
                  </span>
                </CardFooter>
              </Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
              <CardAction>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(action.action())}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${action.color} text-white`}
                    >
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {action.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>
                Latest system activities and updates
              </CardDescription>
              <CardAction>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-full bg-gray-100 ${activity.color}`}
                  >
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button variant="ghost" size="sm" className="w-full">
                <Activity className="h-4 w-4 mr-2" />
                View Activity Log
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* System Health Overview */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Current system status and monitoring
            </CardDescription>
            <CardAction>
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Security Center
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    System Status
                  </p>
                  <p className="text-lg font-semibold text-green-600">
                    Operational
                  </p>
                </div>
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">Database</p>
                  <p className="text-lg font-semibold text-green-600">
                    Connected
                  </p>
                </div>
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Last Backup
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    2 hours ago
                  </p>
                </div>
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm">
              <Database className="h-4 w-4 mr-2" />
              View System Logs
            </Button>
            <Button variant="outline" size="sm" className="ml-2">
              <BarChart3 className="h-4 w-4 mr-2" />
              Performance Metrics
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
}
