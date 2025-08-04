/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/constants";
import toast from "react-hot-toast";

export interface ITFForm {
  id: string;
  title: string;
  description?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadCount: number;
}

export interface UploadFormData {
  title: string;
  description?: string;
  category: string;
  file: File;
}

// Get all forms
export function useForms() {
  return useQuery({
    queryKey: ["forms"],
    queryFn: async (): Promise<ITFForm[]> => {
      const response = await apiClient.get<ITFForm[]>(API_ROUTES.FORMS.LIST);
      return response;
    },
  });
}

// Upload new form
export function useUploadForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData): Promise<ITFForm> => {
      const response = await apiClient.post<{ data: ITFForm }>(
        API_ROUTES.FORMS.UPLOAD,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form uploaded successfully!");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to upload form";
      toast.error(message);
    },
  });
}

// Delete form
export function useDeleteForm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formId: string): Promise<void> => {
      await apiClient.delete(`${API_ROUTES.FORMS.LIST}/${formId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form deleted successfully!");
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to delete form";
      toast.error(message);
    },
  });
}

// Download form
export function downloadForm(formId: string, filename: string) {
  const downloadUrl = API_ROUTES.FORMS.DOWNLOAD(formId);

  // Create a temporary link to trigger download
  const link = document.createElement("a");
  link.href = `${
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api"
  }${downloadUrl}`;
  link.download = filename;
  link.target = "_blank";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
