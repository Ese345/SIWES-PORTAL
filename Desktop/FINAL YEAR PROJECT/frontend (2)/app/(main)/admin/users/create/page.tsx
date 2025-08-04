"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  GraduationCap,
  Building,
} from "lucide-react";
import { useCreateUser, useDepartments } from "@/hooks/use-users";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
} from "@/components/ui";
import { createUserSchema } from "@/lib/validations";
import { APP_ROUTES, ROLE_CONFIG } from "@/constants";
import type { CreateUserData, Role } from "@/types";

export default function CreateUserPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const createUser = useCreateUser();
  const { data: departments = [] } = useDepartments();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: "Student" as Role,
    },
  });

  const selectedRole = watch("role");
  const isStudent = selectedRole === "Student";

  const onSubmit = async (data: CreateUserData) => {
    try {
      setError(null);
      await createUser.mutateAsync(data);
      router.push(APP_ROUTES.ADMIN_USERS);
    } catch (error: any) {
      setError(error.response?.data?.message || "Failed to create user");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="mb-4"
        >
          Back
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
        <p className="text-gray-600">Add a new user to the SIWES portal</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Basic Information
              </h3>

              <Input
                label="Full Name"
                type="text"
                placeholder="Enter full name"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.name?.message}
                {...register("name")}
                required
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="Enter email address"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email")}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="Create password"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                helperText="Password must be at least 6 characters"
                {...register("password")}
                required
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Role & Permissions
              </h3>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  User Role <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(ROLE_CONFIG).map(([roleKey, roleConfig]) => (
                    <label
                      key={roleKey}
                      className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        value={roleKey}
                        {...register("role")}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {roleKey === "Student" && (
                            <GraduationCap className="h-4 w-4 text-blue-600" />
                          )}
                          {roleKey === "SchoolSupervisor" && (
                            <Building className="h-4 w-4 text-green-600" />
                          )}
                          {roleKey === "IndustrySupervisor" && (
                            <Building className="h-4 w-4 text-purple-600" />
                          )}
                          {roleKey === "Admin" && (
                            <User className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium text-gray-900">
                            {roleConfig.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {roleConfig.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.role && (
                  <p className="text-sm text-red-600 mt-1">
                    {errors.role.message}
                  </p>
                )}
              </div>
            </div>

            {/* Student-specific fields */}
            {isStudent && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Student Information
                </h3>

                <Input
                  label="Matric Number"
                  type="text"
                  placeholder="Enter matriculation number"
                  leftIcon={<GraduationCap className="h-4 w-4" />}
                  error={errors.matricNumber?.message}
                  {...register("matricNumber")}
                  required={isStudent}
                />

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Department <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    {...register("department")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required={isStudent}
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.department.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting || createUser.isPending}
                leftIcon={<User className="h-4 w-4" />}
              >
                Create User
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
