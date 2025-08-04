/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import {
  Users,
  GraduationCap,
  Building,
  BarChart3,
  Activity,
  UserCheck,
  Clock,
} from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Loading,
} from "@/components/ui";
import SiteHeader from "@/components/ui/site-header";

export default function AdminAnalyticsPage() {
  const { data: analytics, isLoading, error } = useAnalytics();

  if (isLoading) {
    return (
      <div className="p-6">
        <Loading text="Loading analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 text-center">
          Failed to load analytics data
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Students",
      value: analytics?.totalStudents || 0,
      icon: GraduationCap,
      color: "bg-blue-500",
      trend: "+12% from last month",
    },
    {
      title: "Industry Supervisors",
      value: analytics?.industrySupervisors || 0,
      icon: Building,
      color: "bg-green-500",
      trend: "+5% from last month",
    },
    {
      title: "School Supervisors",
      value: analytics?.schoolSupervisors || 0,
      icon: UserCheck,
      color: "bg-purple-500",
      trend: "No change",
    },
    {
      title: "Active Logbooks",
      value: analytics?.activeLogbooks || 0,
      icon: Activity,
      color: "bg-orange-500",
      trend: "+8% from last month",
    },
  ];

  return (
    <SiteHeader heading="Admin Analytics">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{stat.trend}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Student Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students per Industry Supervisor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {" "}
            <div className="space-y-4">
              {analytics?.industrySupervisorStats?.map((supervisor: any) => (
                <div
                  key={supervisor.id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{supervisor.name}</p>
                    <p className="text-sm text-gray-500">{supervisor.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{supervisor.studentCount}</p>
                    <p className="text-sm text-gray-500">students</p>
                  </div>
                </div>
              ))}
              {!analytics?.industrySupervisorStats?.length && (
                <p className="text-gray-500 text-center py-4">
                  No industry supervisors found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Students per School Supervisor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.schoolSupervisorStats?.map((supervisor) => (
                <div
                  key={supervisor.id}
                  className="flex items-center justify-between"
                >
                  <div className="text-neutral-900">
                    <p className="font-medium">{supervisor.name}</p>
                    <p className="text-sm text-gray-500">{supervisor.email}</p>
                  </div>
                  <div className="text-right flex gap-2 text-neutral-800">
                    <p className="font-semibold">{supervisor.studentCount}</p>
                    <p className="text-sm text-gray-500">students</p>
                  </div>
                </div>
              ))}
              {!analytics?.schoolSupervisorStats?.length && (
                <p className="text-gray-500 text-center py-4">
                  No school supervisors found
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Department Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics?.departmentStats?.map((dept) => (
              <div key={dept.department} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">{dept.department}</h4>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {dept.studentCount}
                </p>
                <p className="text-sm text-gray-500">students</p>
              </div>
            ))}
            {!analytics?.departmentStats?.length && (
              <p className="text-gray-500 col-span-full text-center py-4">
                No department data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics?.recentActivity?.map((activity, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
            {!analytics?.recentActivity?.length && (
              <p className="text-gray-500 text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </SiteHeader>
  );
}
