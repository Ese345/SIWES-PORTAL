/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, LogIn } from "lucide-react";
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
import { loginSchema } from "@/lib/validations";
import { APP_ROUTES } from "@/constants";
import type { LoginFormData } from "@/types";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || APP_ROUTES.DASHBOARD;
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null);
      const role = await login(data.email, data.password);
      if (role === "Admin") {
        // Redirect admin to admin dashboard
        router.push(APP_ROUTES.ADMIN_DASHBOARD);
        return;
      } else if (role === "Student") {
        // Redirect student to student dashboard
        router.push(APP_ROUTES.STUDENT_DASHBOARD);
        return;
      } else if (role === "SchoolSupervisor") {
        // Redirect supervisor to supervisor dashboard
        router.push(APP_ROUTES.SUPERVISOR_DASHBOARD);
        return;
      } else if (role === "IndustrySupervisor") {
        // Redirect industry supervisor to industry dashboard
        router.push(APP_ROUTES.INDUSTRY_SUPERVISOR_DASHBOARD);
        return;
      } else {
        router.push(redirectTo);
      }
    } catch (error: unknown) {
      const typedError = error as {
        response?: { data?: { message?: string } };
      };
      setError(typedError.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to SIWES Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
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
                type="email"
                placeholder="Enter your email"
                {...register("email")}
                required
              />

              <Input
                type="password"
                placeholder="Enter your password"
                {...register("password")}
                required
              />

              <div className="flex items-center justify-between">
                <Link
                  href={APP_ROUTES.AUTH.FORGOT_PASSWORD}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={isSubmitting || isLoading}
                leftIcon={<LogIn className="h-4 w-4" />}
              >
                Sign In
              </Button>
            </form>{" "}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link
                  href={APP_ROUTES.AUTH.REGISTER}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign up here
                </Link>
              </p>
            </div>
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
