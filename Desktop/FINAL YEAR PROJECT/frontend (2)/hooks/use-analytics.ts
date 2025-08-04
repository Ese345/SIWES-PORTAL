"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface SupervisorStats {
  id: string;
  name: string;
  email: string;
  studentCount: number;
}

interface DepartmentStats {
  department: string;
  studentCount: number;
}

interface RecentActivity {
  message: string;
  timestamp: string;
}

interface AnalyticsData {
  totalStudents: number;
  industrySupervisors: number;
  schoolSupervisors: number;
  activeLogbooks: number;
  industrySupervisorStats: SupervisorStats[];
  schoolSupervisorStats: SupervisorStats[];
  departmentStats: DepartmentStats[];
  recentActivity: RecentActivity[];
}

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      // Fetch analytics data from multiple endpoints
      const [studentCountResponse, userStatsResponse] = await Promise.all([
        apiClient.get<{
          industrySupervisors: SupervisorStats[];
          schoolSupervisors: SupervisorStats[];
        }>("/supervisors/analysis/student-count"),
        apiClient.get<{
          totalUsers: number;
          usersByRole: Record<string, number>;
          byDepartment: DepartmentStats[];
        }>("/users/stats"),
      ]);

      // Process and combine the data
      const analytics: AnalyticsData = {
        totalStudents: userStatsResponse.usersByRole?.Student || 0,
        industrySupervisors:
          userStatsResponse.usersByRole?.IndustrySupervisor || 0,
        schoolSupervisors: userStatsResponse.usersByRole?.SchoolSupervisor || 0,
        activeLogbooks: 0, // This would come from logbook endpoints
        industrySupervisorStats: studentCountResponse.industrySupervisors || [],
        schoolSupervisorStats: studentCountResponse.schoolSupervisors || [],
        departmentStats: userStatsResponse.byDepartment || [],
        recentActivity: [
          // Mock data - would come from actual activity logs
          {
            message: "New student John Doe registered",
            timestamp: "2 hours ago",
          },
          {
            message: "Logbook entry approved by supervisor",
            timestamp: "4 hours ago",
          },
          {
            message: "Industry supervisor Mary Johnson assigned",
            timestamp: "1 day ago",
          },
        ],
      };

      return analytics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
