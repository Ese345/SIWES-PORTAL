/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  UserPlus,
  Building,
  GraduationCap,
} from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
} from "@/components/ui";
import { apiClient } from "@/lib/api-client";
import { registerSchema } from "@/lib/validations";
import { APP_ROUTES, API_ROUTES, ROLE_CONFIG } from "@/constants";
import type { RegisterFormData } from "@/lib/validations";
import { useAuth } from "@/contexts/auth-context";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  // Check if user is admin
  // useEffect(() => {
  //   if (!isLoading) {
  //     If (user)
  //     // if (!user) {
  //     //   // Not authenticated, redirect to login
  //     //   router.push(APP_ROUTES.AUTH.LOGIN);
  //     //   return;
  //     // }

  //     // if (user.role !== Role.Admin) {
  //     //   // Not an admin, redirect to dashboard
  //     //   toast.error("Access denied. Only administrators can create new users.");
  //     //   router.push(APP_ROUTES.DASHBOARD);
  //     //   return;
  //     // }
  //   }
  // }, [user, isLoading, router]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);
      // Use the users endpoint for admin user creation
      await apiClient.post(API_ROUTES.AUTH.REGISTER, data);
      toast.success("User created successfully!");
      router.push(APP_ROUTES.AUTH.LOGIN);
    } catch (error: any) {
      const errorMessage = error
        ? error?.response.data.error
        : "User creation failed";

      if (
        error?.response.data.error.startsWith(
          "Signup is disabled after the first admin "
        )
      ) {
        // Special case for the first admin user creation
        // redirect to login
        toast.error("First admin user already created. Please login.");
        router.push(APP_ROUTES.AUTH.LOGIN);
        return;
      }
      setError(errorMessage);
    }
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {" "}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Admin Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Register as the first user and admin in the SIWES Portal
          </p>
        </div>
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-center">
              Create New User
              <span className="block text-sm text-gray-500">
                Fill in the details below to create a new user account
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert
                variant="error"
                className="mb-6"
                dismissible
                onDismiss={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Input
                label="Full Name"
                type="text"
                placeholder="Enter your full name"
                leftIcon={<User className="h-4 w-4" />}
                error={errors.name?.message}
                {...register("name")}
                required
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register("email")}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="Create a password"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.password?.message}
                helperText="Password must be at least 8 characters"
                {...register("password")}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
                required
              />{" "}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Register Now
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2025 SIWES Portal. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
