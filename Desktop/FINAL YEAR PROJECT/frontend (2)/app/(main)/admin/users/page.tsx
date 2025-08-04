"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
} from "@/components/ui";
import { APP_ROUTES, API_ROUTES, API_BASE_URL } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import tokenManager from "@/lib/token-manager";
import toast from "react-hot-toast";
import { formatDate } from "@/lib/utils";
import SiteHeader from "@/components/ui/site-header";

// Types based on backend schema
interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Student" | "IndustrySupervisor" | "SchoolSupervisor";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    matricNumber: string;
    department: string;
    yearOfStudy: number;
    supervisor?: {
      id: string;
      name: string;
    };
  };
  supervisor?: {
    id: string;
    department: string;
  };
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UserFilters {
  role?: string;
  search?: string;
  department?: string;
  isActive?: boolean;
}

const ROLE_CONFIG = {
  Admin: { label: "Admin", color: "bg-red-100 text-red-800" },
  IndustrySupervisor: {
    label: "Industry Supervisor",
    color: "bg-blue-100 text-blue-800",
  },
  SchoolSupervisor: {
    label: "School Supervisor",
    color: "bg-purple-100 text-purple-800",
  },
  Student: { label: "Student", color: "bg-green-100 text-green-800" },
};

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>({});
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState<Set<string>>(new Set());

  // Fetch users from API
  const fetchUsers = async (page = 1, currentFilters = filters) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(currentFilters.search && { search: currentFilters.search }),
        ...(currentFilters.role && { role: currentFilters.role }),
        ...(currentFilters.department && {
          department: currentFilters.department,
        }),
        ...(currentFilters.isActive !== undefined && {
          isActive: currentFilters.isActive.toString(),
        }),
      });

      const response = await fetch(
        `${API_BASE_URL}${API_ROUTES.USERS}?${params}`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setPagination({
        currentPage: data.pagination.page,
        totalPages: data.pagination.totalPages,
        totalUsers: data.pagination.total,
        hasNextPage: data.pagination.page < data.pagination.totalPages,
        hasPrevPage: data.pagination.page > 1,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (
      !window.confirm(`Are you sure you want to delete user "${userName}"?`)
    ) {
      return;
    }

    try {
      setIsDeleting((prev) => new Set(prev).add(userId));

      const response = await fetch(
        `${API_BASE_URL}${API_ROUTES.USERS}/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      await fetchUsers(pagination.currentPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setIsDeleting((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Handle search
  const handleSearch = (search: string) => {
    const newFilters = { ...filters, search: search || undefined };
    setFilters(newFilters);
    fetchUsers(1, newFilters);
  };

  // Handle role filter
  const handleRoleFilter = (role: string) => {
    const newFilters = { ...filters, role: role || undefined };
    setFilters(newFilters);
    fetchUsers(1, newFilters);
  };

  // Handle status filter
  const handleStatusFilter = (isActive: string) => {
    const newFilters = {
      ...filters,
      isActive: isActive === "" ? undefined : isActive === "true",
    };
    setFilters(newFilters);
    fetchUsers(1, newFilters);
  };

  // Handle user selection
  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((user) => user.id)));
    }
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage);
  };

  // Export users
  const handleExportUsers = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}${API_ROUTES.USERS}/export`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export users");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Users exported successfully");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Failed to export users");
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, []);

  if (isLoading && users.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error Loading Users
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchUsers()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SiteHeader heading="User Management">
      {/* Filters and Search */}
      <Card>
        <CardTitle className="flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Filters</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({});
                fetchUsers(1, {});
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Filters
            </Button>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push(APP_ROUTES.ADMIN_USERS_UPLOAD)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </CardTitle>
        <CardContent className="p-1px-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search users by name, email, or matric number..."
                // @ts-expect-error next line
                leftIcon={<Search className="h-4 w-4" />}
                value={filters.search || ""}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <select
                className="px-3 py-2 border rounded-lg text-sm"
                value={filters.role || ""}
                onChange={(e) => handleRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                  <option key={role} value={role}>
                    {config.label}
                  </option>
                ))}
              </select>
              <select
                className="px-3 py-2 border rounded-lg text-sm"
                value={
                  filters.isActive === undefined
                    ? ""
                    : filters.isActive.toString()
                }
                onChange={(e) => handleStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users ({pagination.totalUsers})</CardTitle>
            <div className="flex items-center gap-2">
              {selectedUsers.size > 0 && (
                <span className="text-sm text-gray-500">
                  {selectedUsers.size} selected
                </span>
              )}
              <Button variant="outline" size="sm" onClick={handleExportUsers}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.size === users.length && users.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-gray-600">
                    User
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-gray-600">
                    Role
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-gray-600">
                    Department
                  </th>

                  <th className="p-4 text-left text-sm font-medium text-gray-600">
                    Joined
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          {user.student?.matricNumber && (
                            <div className="text-xs text-blue-600">
                              {user.student.matricNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          ROLE_CONFIG[user.role]?.color
                        }`}
                      >
                        {ROLE_CONFIG[user.role]?.label}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {user.student?.department ||
                        user.supervisor?.department ||
                        "-"}
                    </td>

                    <td className="p-4 text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`${APP_ROUTES.ADMIN_USERS}/${user.id}`)
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `${APP_ROUTES.ADMIN_USERS}/${user.id}/edit`
                            )
                          }
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={
                            isDeleting.has(user.id) ||
                            user.id === currentUser?.id
                          }
                          className="text-red-600 hover:text-red-700"
                        >
                          {isDeleting.has(user.id) ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600 mr-1"></div>
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(pagination.currentPage - 1) * 10 + 1} to{" "}
                  {Math.min(pagination.currentPage * 10, pagination.totalUsers)}{" "}
                  of {pagination.totalUsers} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrevPage || isLoading}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNextPage || isLoading}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </SiteHeader>
  );
}
