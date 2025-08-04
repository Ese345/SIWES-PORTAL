/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  RotateCcw,
  Mail,
  Calendar,
  Shield,
  Building,
  GraduationCap,
  User as UserIcon,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
} from "@/components/ui";
import { APP_ROUTES, ROLE_CONFIG, API_BASE_URL } from "@/constants";
import { formatDate } from "@/lib/utils";
import tokenManager from "@/lib/token-manager";
import toast from "react-hot-toast";
import { Role } from "@/types";

// Types based on your backend response
interface StudentProfile {
  matricNumber: string;
  department: string;
  profile?: any; // Additional profile data if needed
}

interface UserDetail {
  id: string;
  email: string;
  name: string;
  role: Role;
  imageUrl?: string | null;
  createdAt: string;
  student?: StudentProfile | null;
}

interface UserStats {
  totalUsers: number;
  usersByRole: Record<Role, number>;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Fetch user details
  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/users/user/${userId}`, {
        headers: {
          Authorization: `Bearer ${tokenManager.getAccessToken()}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("User not found");
        }
        throw new Error("Failed to fetch user details");
      }

      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load user";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user deletion (placeholder - implement when DELETE endpoint is available)
  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 5000); // Reset after 5 seconds
      return;
    }

    try {
      setIsDeleting(true);

      // Implement when DELETE endpoint is available
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokenManager.getAccessToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      toast.success("User deleted successfully");
      router.push(APP_ROUTES.ADMIN_USERS);
    } catch (err) {
      toast.error("Failed to delete user");
      console.error("Delete error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle password reset (placeholder - implement when endpoint is available)
  const handleResetPassword = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset this user's password? They will receive an email with the new password."
      )
    ) {
      return;
    }

    try {
      setIsResetting(true);

      // Implement when reset password endpoint is available
      const response = await fetch(
        `${API_BASE_URL}/users/${userId}/reset-password`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      const result = await response.json();
      toast.success("Password reset successfully. New password sent to user.");
    } catch (err) {
      toast.error("Failed to reset password");
      console.error("Reset password error:", err);
    } finally {
      setIsResetting(false);
    }
  };

  // Handle edit redirect
  const handleEdit = () => {
    router.push(APP_ROUTES.ADMIN_USER_EDIT(userId));
  };

  // Fetch user on component mount
  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading user details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {error === "User not found"
              ? "User Not Found"
              : "Error Loading User"}
          </h1>
          <p className="text-gray-600 mb-4">
            {error || "The requested user could not be found."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(APP_ROUTES.ADMIN_USERS)}
            >
              Back to Users
            </Button>
            <Button onClick={fetchUser}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const roleConfig = ROLE_CONFIG[user.role];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(APP_ROUTES.ADMIN_USERS)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <div className="flex items-center gap-3">
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleResetPassword}
            disabled={isResetting}
          >
            <RotateCcw
              className={`h-4 w-4 mr-2 ${isResetting ? "animate-spin" : ""}`}
            />
            Reset Password
          </Button>
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </Button>
          <Button
            variant={showDeleteConfirm ? "danger" : "outline"}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {showDeleteConfirm ? "Confirm Delete" : "Delete User"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-neutral-800">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium text-neutral-800">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <Badge className={roleConfig.color}>
                      {roleConfig.label}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">User ID</p>
                    <p className="font-medium text-xs text-gray-600 text-neutral-800">
                      {user.id}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student-Specific Information */}
          {user.role === Role.Student && user.student && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Student Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Matriculation Number
                    </p>
                    <p className="font-medium">{user.student.matricNumber}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium">{user.student.department}</p>
                  </div>
                </div>

                {user.student.profile && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Additional Profile Information
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <pre className="text-sm text-gray-600">
                        {JSON.stringify(user.student.profile, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Supervisor Information (when available) */}
          {(user.role === Role.SchoolSupervisor ||
            user.role === Role.IndustrySupervisor) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {user.role === Role.SchoolSupervisor
                    ? "School"
                    : "Industry"}{" "}
                  Supervisor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Additional supervisor information will be displayed here when
                  profile data is available.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Status and Actions */}
        <div className="space-y-6">
          {/* Role Information */}
          <Card>
            <CardHeader>
              <CardTitle>Role & Permissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">User Role</p>
                <Badge className={roleConfig.color}>
                  <Shield className="h-3 w-3 mr-1" />
                  {roleConfig.label}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Permissions</p>
                <div className="text-sm text-gray-600">
                  {roleConfig.description || "Standard user permissions"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">User ID:</span>
                <span className="text-xs font-mono text-neutral-800">
                  {user.id.split("-")[0]}...
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Created:</span>
                <span className="text-neutral-800">
                  {formatDate(user.createdAt)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Profile Image:</span>
                <span className="text-neutral-800">
                  {user.imageUrl ? "Set" : "Not Set"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="w-full justify-start"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit User Details
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleResetPassword}
                disabled={isResetting}
                className="w-full justify-start"
              >
                <RotateCcw
                  className={`h-4 w-4 mr-2 ${
                    isResetting ? "animate-spin" : ""
                  }`}
                />
                Reset Password
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`mailto:${user.email}`, "_blank")}
                className="w-full justify-start"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
