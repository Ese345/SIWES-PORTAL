/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Building,
  GraduationCap,
  Plus,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Shuffle,
  Eye,
  X,
  Filter,
  UserCheck,
  School,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
  Input,
  Badge,
  Loading,
} from "@/components/ui";
import { CardAction } from "@/components/ui/card";
import { API_BASE_URL } from "@/constants";
import tokenManager from "@/lib/token-manager";
import toast from "react-hot-toast";
import { Role } from "@/types";
import SiteHeader from "@/components/ui/site-header";

// Types
interface Student {
  id: string;
  matricNumber: string;
  department: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  industrySupervisor?: {
    id: string;
    name: string;
    email: string;
  };
  schoolSupervisor?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Supervisor {
  id: string;
  name: string;
  email: string;
  role: Role;
  assignedStudents?: Student[];
  studentCount?: number;
}

interface AssignmentStats {
  totalStudents: number;
  studentsWithIndustrySupervisor: number;
  studentsWithSchoolSupervisor: number;
  totalIndustrySupervisors: number;
  totalSchoolSupervisors: number;
  unassignedStudents: number;
  assignmentProgress: number;
}

export default function AdminAssignmentsPage() {
  // Data states
  const [students, setStudents] = useState<Student[]>([]);
  const [industrySupervisors, setIndustrySupervisors] = useState<Supervisor[]>(
    []
  );
  const [schoolSupervisors, setSchoolSupervisors] = useState<Supervisor[]>([]);
  const [stats, setStats] = useState<AssignmentStats | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  );

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<
    "all" | "assigned" | "unassigned"
  >("all");

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>("");
  const [assignmentType, setAssignmentType] = useState<"industry" | "school">(
    "industry"
  );

  // Failsafe: Ensure arrays are always valid
  const safeStudents = Array.isArray(students) ? students : [];
  const safeIndustrySupervisors = Array.isArray(industrySupervisors)
    ? industrySupervisors
    : [];
  const safeSchoolSupervisors = Array.isArray(schoolSupervisors)
    ? schoolSupervisors
    : [];

  // Get unique departments with null checks
  const departments = Array.from(
    new Set(
      safeStudents
        .map((s) => s?.department)
        .filter(
          (dept): dept is string => typeof dept === "string" && dept.length > 0
        )
    )
  );

  // Filter students with failsafes
  const filteredStudents = safeStudents.filter((student) => {
    if (!student || !student.user) {
      return false;
    }

    // Search term matching
    const matchesSearch =
      !searchTerm ||
      (() => {
        const name = student.user?.name?.toLowerCase() || "";
        const matricNumber = student.matricNumber?.toLowerCase() || "";
        const department = student.department?.toLowerCase() || "";
        const searchLower = searchTerm.toLowerCase();

        return (
          name.includes(searchLower) ||
          matricNumber.includes(searchLower) ||
          department.includes(searchLower)
        );
      })();

    // Department filtering
    const matchesDepartment =
      !departmentFilter ||
      (() => {
        const studentDept = student.department?.toLowerCase() || "";
        const filterDept = departmentFilter.toLowerCase();
        return studentDept.includes(filterDept);
      })();

    // Assignment filtering
    const matchesAssignment = (() => {
      if (assignmentFilter === "all") {
        return true;
      }

      const hasIndustrySupervisor = !!student.industrySupervisor?.id;
      const hasSchoolSupervisor = !!student.schoolSupervisor?.id;
      const hasAnySupervisor = hasIndustrySupervisor || hasSchoolSupervisor;

      if (assignmentFilter === "assigned") {
        return hasAnySupervisor;
      }

      if (assignmentFilter === "unassigned") {
        return !hasAnySupervisor;
      }

      return true;
    })();

    return matchesSearch && matchesDepartment && matchesAssignment;
  });

  // Fetch all data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch students with their assigned supervisors
      const studentsResponse = await fetch(
        `${API_BASE_URL}/supervisors/assignments`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      let studentsData = null;
      let transformedStudents: Student[] = [];
      let industryCount = 0;
      let schoolCount = 0;

      if (studentsResponse.ok) {
        studentsData = await studentsResponse.json();

        // Transform the data to match our interface
        transformedStudents = (studentsData.students || []).map(
          (student: any) => ({
            id: student.id,
            matricNumber: student.matricNumber,
            department: student.department || "Unknown Department",
            user: {
              id: student.id,
              name: student.name,
              email: student.email || "",
            },
            industrySupervisor: student.industrySupervisorId
              ? {
                  id: student.industrySupervisorId,
                  name: student.industrySupervisorName,
                  email: "",
                }
              : undefined,
            schoolSupervisor: student.schoolSupervisorId
              ? {
                  id: student.schoolSupervisorId,
                  name: student.schoolSupervisorName,
                  email: "",
                }
              : undefined,
          })
        );

        setStudents(transformedStudents);
      }

      // Fetch supervisors
      const [industryResponse, schoolResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/users?role=IndustrySupervisor&limit=1000`, {
          headers: { Authorization: `Bearer ${tokenManager.getAccessToken()}` },
        }),
        fetch(`${API_BASE_URL}/users?role=SchoolSupervisor&limit=1000`, {
          headers: { Authorization: `Bearer ${tokenManager.getAccessToken()}` },
        }),
      ]);

      if (industryResponse.ok) {
        const data = await industryResponse.json();
        const supervisors = Array.isArray(data.users) ? data.users : [];
        setIndustrySupervisors(supervisors);
        industryCount = supervisors.length;
      }

      if (schoolResponse.ok) {
        const data = await schoolResponse.json();
        const supervisors = Array.isArray(data.users) ? data.users : [];
        setSchoolSupervisors(supervisors);
        schoolCount = supervisors.length;
      }

      // Calculate and set stats with all data available
      if (studentsData) {
        const allStudents = studentsData.students || [];
        const totalStudents = allStudents.length;
        const industryAssigned = allStudents.filter(
          (s: any) => s.industrySupervisorId
        ).length;
        const schoolAssigned = allStudents.filter(
          (s: any) => s.schoolSupervisorId
        ).length;
        const unassigned = allStudents.filter(
          (s: any) => !s.industrySupervisorId && !s.schoolSupervisorId
        ).length;

        const calculatedStats = {
          totalStudents,
          studentsWithIndustrySupervisor: industryAssigned,
          studentsWithSchoolSupervisor: schoolAssigned,
          totalIndustrySupervisors: industryCount,
          totalSchoolSupervisors: schoolCount,
          unassignedStudents: unassigned,
          assignmentProgress:
            totalStudents > 0
              ? Math.round(
                  ((industryAssigned + schoolAssigned) / (totalStudents * 2)) *
                    100
                )
              : 0,
        };

        setStats(calculatedStats);
      }
    } catch (err) {
      setError("Failed to load assignment data");
      console.error("Assignment fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Assign students to supervisor
  const assignStudents = async () => {
    if (!selectedSupervisor || selectedStudents.size === 0) {
      toast.error("Please select a supervisor and students to assign");
      return;
    }

    try {
      const endpoint =
        assignmentType === "industry"
          ? "/supervisors/assignments/industry"
          : "/supervisors/assignments/school";

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenManager.getAccessToken()}`,
        },
        body: JSON.stringify({
          supervisorId: selectedSupervisor,
          studentIds: Array.from(selectedStudents),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign students");
      }

      const result = await response.json();
      toast.success(result.message || "Students assigned successfully");

      // Reset selections and refresh data
      setSelectedStudents(new Set());
      setSelectedSupervisor("");
      setShowAssignModal(false);
      fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign students"
      );
    }
  };

  // Random assignment for school supervisors
  const randomAssignSchoolSupervisors = async () => {
    if (
      !window.confirm(
        "This will randomly assign students without school supervisors. Continue?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/supervisors/assignments/school/random`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
          body: JSON.stringify({
            departmentFilter: departmentFilter || undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign students randomly");
      }

      const result = await response.json();
      toast.success(result.message || "Students assigned randomly");
      fetchData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign students"
      );
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading && students.length === 0) {
    return (
      <div className="p-6">
        <Loading text="Loading assignment data..." />
      </div>
    );
  }

  // Stats for overview cards
  const statsCards = [
    {
      title: "Total Students",
      value: stats?.totalStudents || 0,
      icon: GraduationCap,
      color: "bg-blue-500",
      trend: "All registered",
      description: "Students in the system",
    },
    {
      title: "Assignment Progress",
      value: `${stats?.assignmentProgress || 0}%`,
      icon: TrendingUp,
      color: "bg-green-500",
      trend: "Overall completion",
      description: "Students assigned supervisors",
    },
    {
      title: "Industry Assignments",
      value: stats?.studentsWithIndustrySupervisor || 0,
      icon: Building,
      color: "bg-orange-500",
      trend: "Industry placements",
      description: "Students with industry supervisors",
    },
    {
      title: "School Assignments",
      value: stats?.studentsWithSchoolSupervisor || 0,
      icon: School,
      color: "bg-purple-500",
      trend: "Academic supervision",
      description: "Students with school supervisors",
    },
    {
      title: "Unassigned Students",
      value: stats?.unassignedStudents || 0,
      icon: AlertTriangle,
      color: "bg-red-500",
      trend: "Needs attention",
      description: "Students without supervisors",
    },
    {
      title: "Available Supervisors",
      value: safeIndustrySupervisors.length + safeSchoolSupervisors.length || 0,
      icon: UserCheck,
      color: "bg-indigo-500",
      trend: "Total capacity",
      description: "Industry + School supervisors",
    },
  ];

  return (
    <SiteHeader
      heading="Assignment Management"
      description="Manage student assignments to industry and school supervisors"
      action={
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => setShowAssignModal(true)}
            disabled={selectedStudents.size === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Assign Students ({selectedStudents.size})
          </Button>
        </div>
      }
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statsCards.map((stat, index) => (
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

      {/* Assignment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Industry Supervisors
            </CardTitle>
            <CardDescription>
              Available industry supervisors and their capacity
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">
                {safeIndustrySupervisors.length} Total
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    Active Supervisors
                  </p>
                  <p className="text-sm text-gray-600">Currently available</p>
                </div>
                <p className="text-2xl font-bold text-orange-600">
                  {safeIndustrySupervisors.length}
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Students Assigned</p>
                  <p className="text-sm text-gray-600">Industry placements</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.studentsWithIndustrySupervisor || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              School Supervisors
            </CardTitle>
            <CardDescription>
              Academic supervisors and assignment status
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">
                {safeSchoolSupervisors.length} Total
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    Active Supervisors
                  </p>
                  <p className="text-sm text-gray-600">Academic staff</p>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {safeSchoolSupervisors.length}
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Students Assigned</p>
                  <p className="text-sm text-gray-600">Academic supervision</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.studentsWithSchoolSupervisor || 0}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={randomAssignSchoolSupervisors}
              className="w-full"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Random Assignment
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Student Filters
          </CardTitle>
          <CardDescription>
            Search and filter students by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, matric number, or department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value || "")}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value || "")}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
              >
                <option value="all">All Students</option>
                <option value="assigned">Assigned</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="ml-auto"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students ({filteredStudents.length})
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedStudents.size === filteredStudents.length) {
                    setSelectedStudents(new Set());
                  } else {
                    setSelectedStudents(
                      new Set(filteredStudents.map((s) => s.id))
                    );
                  }
                }}
              >
                {selectedStudents.size === filteredStudents.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {selectedStudents.size > 0
              ? `${selectedStudents.size} students selected for assignment`
              : "Select students to assign them to supervisors"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredStudents.length > 0 ? (
              filteredStudents
                .map((student) => {
                  if (!student?.id || !student?.user?.name) {
                    return null;
                  }

                  const isSelected = selectedStudents.has(student.id);
                  const hasIndustry = !!student.industrySupervisor?.name;
                  const hasSchool = !!student.schoolSupervisor?.name;

                  return (
                    <div
                      key={student.id}
                      className={`border rounded-lg p-4 transition-all ${
                        isSelected
                          ? "bg-blue-50 border-blue-200 shadow-sm"
                          : "hover:bg-gray-50 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              const newSelected = new Set(selectedStudents);
                              if (e.target.checked) {
                                newSelected.add(student.id);
                              } else {
                                newSelected.delete(student.id);
                              }
                              setSelectedStudents(newSelected);
                            }}
                            className="rounded"
                          />
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              hasIndustry && hasSchool
                                ? "bg-green-100"
                                : hasIndustry || hasSchool
                                ? "bg-yellow-100"
                                : "bg-red-100"
                            }`}
                          >
                            <GraduationCap
                              className={`h-5 w-5 ${
                                hasIndustry && hasSchool
                                  ? "text-green-600"
                                  : hasIndustry || hasSchool
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {student.user?.name || "Unknown Student"}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {student.matricNumber || "No Matric Number"} •{" "}
                              {student.department || "No Department"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right space-y-2">
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-gray-400" />
                              {hasIndustry ? (
                                <Badge className="bg-green-100 text-green-800">
                                  {student.industrySupervisor!.name}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="text-gray-500"
                                >
                                  No Industry Supervisor
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <School className="h-4 w-4 text-gray-400" />
                              {hasSchool ? (
                                <Badge className="bg-purple-100 text-purple-800">
                                  {student.schoolSupervisor!.name}
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="text-gray-500"
                                >
                                  No School Supervisor
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              console.log("View student:", student.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
                .filter(Boolean)
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {safeStudents.length === 0
                    ? "No students available"
                    : "No students found matching your filters"}
                </p>
                {safeStudents.length === 0 && (
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Students
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
        {filteredStudents.length > 0 && (
          <CardFooter className="bg-gray-50">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-gray-600">
                Showing {filteredStudents.length} of {safeStudents.length}{" "}
                students
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="default">
                  {selectedStudents.size} selected
                </Badge>
                {selectedStudents.size > 0 && (
                  <Button size="sm" onClick={() => setShowAssignModal(true)}>
                    Assign Selected
                  </Button>
                )}
              </div>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Assign Students to Supervisor
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAssignModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Type
                </label>
                <select
                  value={assignmentType}
                  onChange={(e) => setAssignmentType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="industry">Industry Supervisor</option>
                  <option value="school">School Supervisor</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Supervisor
                </label>
                <select
                  value={selectedSupervisor}
                  onChange={(e) => setSelectedSupervisor(e.target.value || "")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Choose a supervisor</option>
                  {(assignmentType === "industry"
                    ? safeIndustrySupervisors
                    : safeSchoolSupervisors
                  ).map((supervisor) => (
                    <option key={supervisor.id} value={supervisor.id}>
                      {supervisor.name || "Unknown"} (
                      {supervisor.email || "No email"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Selected Students ({selectedStudents.size})
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {Array.from(selectedStudents).map((studentId) => {
                    const student = safeStudents.find(
                      (s) => s.id === studentId
                    );
                    return student ? (
                      <div
                        key={studentId}
                        className="text-xs text-gray-600 bg-white p-2 rounded"
                      >
                        <span className="font-medium">
                          {student.user?.name || "Unknown"}
                        </span>
                        <span className="text-gray-500 ml-2">
                          ({student.matricNumber || "No Matric"})
                        </span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  onClick={assignStudents}
                  disabled={!selectedSupervisor}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Assign Students
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAssignModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SiteHeader>
  );
}
