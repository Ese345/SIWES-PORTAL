"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Lock, KeyRound, ArrowLeft } from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
} from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api-client";
import { changePasswordSchema } from "@/lib/validations";
import { APP_ROUTES, API_ROUTES } from "@/constants";
import type { ChangePasswordData } from "@/types";
import toast from "react-hot-toast";
import Link from "next/link";

export default function ChangePasswordPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ChangePasswordData & { confirmPassword: string }>({
    resolver: zodResolver(
      changePasswordSchema
        .extend({
          confirmPassword: changePasswordSchema.shape.newPassword,
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: "Passwords don't match",
          path: ["confirmPassword"],
        })
    ),
  });

  const onSubmit = async (
    data: ChangePasswordData & { confirmPassword: string }
  ) => {
    try {
      setError(null);
      setIsSubmitting(true);

      await apiClient.put(API_ROUTES.AUTH.CHANGE_PASSWORD, {
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });

      toast.success("Password changed successfully!");

      // If this was a forced password change, redirect to dashboard
      if (user?.mustChangePassword) {
        router.push(APP_ROUTES.DASHBOARD);
      } else {
        router.back();
      }
    } catch (error: unknown) {
      const typedError = error as {
        response?: { data?: { message?: string } };
      };
      setError(
        typedError.response?.data?.message || "Failed to change password"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Change Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {user?.mustChangePassword
              ? "You must change your password before continuing"
              : "Update your account password"}
          </p>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center gap-2">
              <KeyRound className="h-5 w-5" />
              Update Password
            </CardTitle>
          </CardHeader>

          <CardContent>
            {user?.mustChangePassword && (
              <Alert variant="warning" className="mb-6">
                <strong>Password Change Required:</strong> For security reasons,
                you must update your password before accessing the system.
              </Alert>
            )}

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
                label="Current Password"
                type="password"
                placeholder="Enter your current password"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.oldPassword?.message}
                {...register("oldPassword")}
                required
              />

              <Input
                label="New Password"
                type="password"
                placeholder="Enter your new password"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.newPassword?.message}
                helperText="Password must be at least 8 characters long"
                {...register("newPassword")}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Confirm your new password"
                leftIcon={<Lock className="h-4 w-4" />}
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
                required
              />

              <div className="flex gap-3">
                {!user?.mustChangePassword && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => router.back()}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Cancel
                  </Button>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className={user?.mustChangePassword ? "w-full" : "flex-1"}
                  isLoading={isSubmitting}
                  leftIcon={<KeyRound className="h-4 w-4" />}
                >
                  Change Password
                </Button>
              </div>
            </form>

            {!user?.mustChangePassword && (
              <div className="mt-6 text-center">
                <Link
                  href={APP_ROUTES.DASHBOARD}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Back to Dashboard
                </Link>
              </div>
            )}
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
