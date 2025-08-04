"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/constants";
import toast from "react-hot-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  targetType: "all" | "role" | "individual";
  targetRole?: string;
  targetUserId?: string;
  createdAt: string;
  isRead: boolean;
}

interface CreateNotificationData {
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  targetType: "all" | "role" | "individual";
  targetRole?: string;
  targetUserId?: string;
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await apiClient.get<{ notifications: Notification[] }>(
        API_ROUTES.NOTIFICATIONS
      );
      return response.notifications;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateNotificationData) => {
      return apiClient.post(API_ROUTES.NOTIFICATIONS, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification created successfully!");
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to create notification";
      toast.error(message);
    },
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      return apiClient.patch(
        `${API_ROUTES.NOTIFICATIONS}/${notificationId}/read`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
