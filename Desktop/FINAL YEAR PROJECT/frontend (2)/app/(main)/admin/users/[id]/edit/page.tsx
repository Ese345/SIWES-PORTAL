"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
import { useUser, useUpdateUser } from "@/hooks/use-users";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Loading,
} from "@/components/ui";
import { APP_ROUTES, ROLE_CONFIG } from "@/constants";
import type { User, Role } from "@/types";
import { createUserSchema } from "@/lib/validations";
import toast from "react-hot-toast";

interface EditUserForm {
  name: string;
  email: string;
  role: Role;
  phoneNumber?: string;
  address?: string;
  // Student fields
  matricNo?: string;
  department?: string;
  level?: number;
  // Supervisor fields
  company?: string;
  position?: string;
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const { data: user, isLoading, error } = useUser(userId);
  const updateUser = useUpdateUser();

  const [formData, setFormData] = useState<EditUserForm>({
    name: "",
    email: "",
    role: "student",
    phoneNumber: "",
    address: "",
    matricNo: "",
    department: "",
    level: 300,
    company: "",
    position: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Update form data when user data is loaded
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
        matricNo: user.studentProfile?.matricNo || "",
        department:
          user.studentProfile?.department ||
          user.supervisorProfile?.department ||
          "",
        level: user.studentProfile?.level || 300,
        company: user.supervisorProfile?.company || "",
        position: user.supervisorProfile?.position || "",
      });
    }
  }, [user]);

  const handleInputChange = (
    field: keyof EditUserForm,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is modified
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    try {
      createUserSchema.parse({
        ...formData,
        password: "temp", // Password not required for updates
      });
      setFormErrors({});
      return true;
    } catch (error: any) {
      const errors: Record<string, string> = {};
      error.errors?.forEach((err: any) => {
        if (err.path?.[0] && err.path[0] !== "password") {
          errors[err.path[0]] = err.message;
        }
      });
      setFormErrors(errors);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    try {
      const updateData: Partial<User> = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phoneNumber: formData.phoneNumber || null,
        address: formData.address || null,
      };

      // Add role-specific data
      if (formData.role === "student") {
        updateData.studentProfile = {
          matricNo: formData.matricNo!,
          department: formData.department!,
          level: formData.level!,
        };
      } else if (
        formData.role === "school_supervisor" ||
        formData.role === "industry_supervisor"
      ) {
        updateData.supervisorProfile = {
          department: formData.department || null,
          company: formData.company || null,
          position: formData.position || null,
        };
      }

      await updateUser.mutateAsync({ userId, userData: updateData });
      router.push(APP_ROUTES.ADMIN_USER_DETAIL(userId));
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  const handleCancel = () => {
    router.push(APP_ROUTES.ADMIN_USER_DETAIL(userId));
  };

  if (isLoading) {
    return <Loading text="Loading user details..." />;
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            User Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The requested user could not be found.
          </p>
          <Button onClick={() => router.push(APP_ROUTES.ADMIN_USERS)}>
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(APP_ROUTES.ADMIN_USER_DETAIL(userId))}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back to User Details
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
            <p className="text-gray-600">
              Update user information and settings
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter full name"
                  error={formErrors.name}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter email address"
                  error={formErrors.email}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    handleInputChange("role", e.target.value as Role)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                    <option key={role} value={role}>
                      {config.label}
                    </option>
                  ))}
                </select>
                {formErrors.role && (
                  <p className="text-sm text-red-600 mt-1">{formErrors.role}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  placeholder="Enter phone number"
                  error={formErrors.phoneNumber}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Enter address"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {formErrors.address && (
                  <p className="text-sm text-red-600 mt-1">
                    {formErrors.address}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Role-Specific Information */}
          <Card>
            <CardHeader>
              <CardTitle>
                {formData.role === "student"
                  ? "Student Information"
                  : formData.role.includes("supervisor")
                  ? "Supervisor Information"
                  : "Additional Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Student Fields */}
              {formData.role === "student" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Matriculation Number *
                    </label>
                    <Input
                      type="text"
                      value={formData.matricNo}
                      onChange={(e) =>
                        handleInputChange("matricNo", e.target.value)
                      }
                      placeholder="e.g., CSC/2020/001"
                      error={formErrors.matricNo}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <Input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        handleInputChange("department", e.target.value)
                      }
                      placeholder="e.g., Computer Science"
                      error={formErrors.department}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Level *
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) =>
                        handleInputChange("level", parseInt(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={100}>100 Level</option>
                      <option value={200}>200 Level</option>
                      <option value={300}>300 Level</option>
                      <option value={400}>400 Level</option>
                      <option value={500}>500 Level</option>
                    </select>
                    {formErrors.level && (
                      <p className="text-sm text-red-600 mt-1">
                        {formErrors.level}
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Supervisor Fields */}
              {(formData.role === "school_supervisor" ||
                formData.role === "industry_supervisor") && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.role === "school_supervisor"
                        ? "Department"
                        : "Company"}
                    </label>
                    <Input
                      type="text"
                      value={
                        formData.role === "school_supervisor"
                          ? formData.department
                          : formData.company
                      }
                      onChange={(e) =>
                        handleInputChange(
                          formData.role === "school_supervisor"
                            ? "department"
                            : "company",
                          e.target.value
                        )
                      }
                      placeholder={`Enter ${
                        formData.role === "school_supervisor"
                          ? "department"
                          : "company name"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <Input
                      type="text"
                      value={formData.position}
                      onChange={(e) =>
                        handleInputChange("position", e.target.value)
                      }
                      placeholder="Enter position/title"
                    />
                  </div>

                  {formData.role === "industry_supervisor" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <Input
                        type="text"
                        value={formData.department}
                        onChange={(e) =>
                          handleInputChange("department", e.target.value)
                        }
                        placeholder="Enter department"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Admin/Other roles */}
              {formData.role === "admin" && (
                <div className="text-center py-8 text-gray-500">
                  <p>No additional information required for admin users.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            leftIcon={<X className="h-4 w-4" />}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateUser.isPending}
            leftIcon={
              updateUser.isPending ? <Loading /> : <Save className="h-4 w-4" />
            }
          >
            {updateUser.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
