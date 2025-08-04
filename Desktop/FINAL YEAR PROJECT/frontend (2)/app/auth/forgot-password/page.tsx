"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Mail, ArrowLeft, Send } from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
} from "@/components/ui";
import { APP_ROUTES } from "@/constants";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      setError(null);
      setIsSubmitting(true);

      // TODO: Implement forgot password API call when backend supports it
      // await apiClient.post('/auth/forgot-password', { email: data.email });

      // For now, just simulate the process
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsSubmitted(true);
    } catch (error: unknown) {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Check Your Email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              If an account exists for {getValues("email")}, you will receive
              password reset instructions.
            </p>
          </div>

          <Card variant="elevated">
            <CardContent className="text-center py-8">
              <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6 text-green-600" />
              </div>

              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Email Sent
              </h3>

              <p className="text-sm text-gray-600 mb-6">
                Please check your email and follow the instructions to reset
                your password. The link will expire in 24 hours.
              </p>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setIsSubmitted(false);
                    setError(null);
                  }}
                >
                  Send Another Email
                </Button>

                <Link href={APP_ROUTES.AUTH.LOGIN}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Forgot Password?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we&apos;ll send you instructions to
            reset your password.
          </p>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-center">Reset Password</CardTitle>
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
                label="Email Address"
                type="email"
                placeholder="Enter your email address"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                helperText="We'll send password reset instructions to this email"
                {...register("email")}
                required
              />

              <Button
                type="submit"
                size="lg"
                className="w-full"
                isLoading={isSubmitting}
                leftIcon={<Send className="h-4 w-4" />}
              >
                {isSubmitting ? "Sending..." : "Send Reset Instructions"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href={APP_ROUTES.AUTH.LOGIN}
                className="text-sm text-blue-600 hover:text-blue-500 inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to Login
              </Link>
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
