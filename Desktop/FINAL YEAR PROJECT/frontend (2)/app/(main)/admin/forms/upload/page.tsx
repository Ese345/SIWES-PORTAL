/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Plus,
  Search,
  Filter,
  Eye,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Loading,
  Alert,
} from "@/components/ui";
import { useForms, useUploadForm, useDeleteForm } from "@/hooks/use-forms";
import { formatDate, formatFileSize } from "@/lib/utils";
import toast from "react-hot-toast";

const uploadFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  file: z.any().optional(), // Made optional since we track it separately
});

type UploadFormData = z.infer<typeof uploadFormSchema>;

export default function AdminFormsPage() {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: formsData, isLoading, error } = useForms();
  const uploadForm = useUploadForm();
  const deleteForm = useDeleteForm();

  // Ensure forms is always an array - handle different possible data structures
  const forms = React.useMemo(() => {
    if (!formsData) return [];

    // If formsData is already an array
    if (Array.isArray(formsData)) {
      return formsData;
    }

    // If formsData has a forms property that's an array
    if (formsData && typeof formsData === "object" && "forms" in formsData) {
      const data = formsData as any;
      return Array.isArray(data.forms) ? data.forms : [];
    }

    // If formsData has a data property that's an array
    if (formsData && typeof formsData === "object" && "data" in formsData) {
      const data = formsData as any;
      return Array.isArray(data.data) ? data.data : [];
    }

    // Default fallback
    return [];
  }, [formsData]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadFormSchema),
  });

  const onSubmit = async (data: UploadFormData) => {
    try {
      // Validate that we have a file
      if (!selectedFile) {
        toast.error("Please select a file");
        return;
      }

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("category", data.category);
      formData.append("file", selectedFile);

      // @ts-expect-error hgggh
      await uploadForm.mutateAsync(formData);
      toast.success("Form uploaded successfully!");
      reset();
      setSelectedFile(null);
      setShowUploadForm(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload form");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
      setValue("file", files); // Still set for validation
    }
  };

  const handleDeleteForm = async (formId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteForm.mutateAsync(formId);
        toast.success("Form deleted successfully!");
      } catch (error) {
        toast.error("Failed to delete form");
      }
    }
  };

  const handleDownload = (formId: string, filename: string) => {
    // Create download link
    const link = document.createElement("a");
    link.href = `/api/itf-forms/${formId}/download`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safe filtering with proper fallbacks
  const filteredForms = React.useMemo(() => {
    if (!Array.isArray(forms)) return [];

    return forms.filter((form) => {
      // Ensure form is an object and has required properties
      if (!form || typeof form !== "object") return false;

      const title = form.title || "";
      const description = form.description || "";
      const category = form.category || "";

      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [forms, searchTerm, categoryFilter]);

  // Safe categories extraction
  const categories = React.useMemo(() => {
    if (!Array.isArray(forms)) return [];

    return Array.from(
      new Set(
        forms
          .map((form) => form?.category)
          .filter(
            (category): category is string =>
              typeof category === "string" && category.length > 0
          )
      )
    );
  }, [forms]);

  if (isLoading) {
    return (
      <div className="p-6">
        <Loading text="Loading forms..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="error">
          Failed to load forms. Please try again.
          {/* Debug info - remove in production */}
          {process.env.NODE_ENV === "development" && (
            <details className="mt-2">
              <summary>Debug Info</summary>
              <pre className="text-xs mt-1 bg-gray-100 p-2 rounded">
                {JSON.stringify({ formsData, error }, null, 2)}
              </pre>
            </details>
          )}
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms Management</h1>
          <p className="text-gray-600">Upload and manage ITF forms</p>
        </div>
        <Button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Upload Form
        </Button>
      </div>

      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV === "development" && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <details>
              <summary className="cursor-pointer font-medium">
                Debug Info (Development Only)
              </summary>
              <div className="mt-2 text-sm">
                <p>
                  <strong>Forms Data Type:</strong> {typeof formsData}
                </p>
                <p>
                  <strong>Is Array:</strong>{" "}
                  {Array.isArray(formsData) ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Forms Length:</strong> {forms.length}
                </p>
                <p>
                  <strong>Filtered Forms Length:</strong> {filteredForms.length}
                </p>
                <p>
                  <strong>Selected File:</strong>{" "}
                  {selectedFile ? selectedFile.name : "None"}
                </p>
                <pre className="mt-2 bg-white p-2 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(formsData, null, 2)}
                </pre>
              </div>
            </details>
          </CardContent>
        </Card>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload New Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Form Title *
                  </label>
                  <Input
                    {...register("title")}
                    placeholder="e.g., ITF-001 Application Form"
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    {...register("category")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select category</option>
                    <option value="application">Application Forms</option>
                    <option value="assessment">Assessment Forms</option>
                    <option value="report">Report Templates</option>
                    <option value="guidelines">Guidelines</option>
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.category.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Input
                  {...register("description")}
                  placeholder="Brief description of the form (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />
                  <div className="text-center">
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-blue-500" />
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          PDF, DOC, DOCX up to 5MB
                        </p>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {selectedFile ? "Change File" : "Select File"}
                    </Button>
                  </div>
                </div>
                {!selectedFile && (
                  <p className="text-red-500 text-sm mt-1">
                    Please select a file
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {isSubmitting ? "Uploading..." : "Upload Form"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowUploadForm(false);
                    setSelectedFile(null);
                    reset();
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search forms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Forms List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Forms Library ({filteredForms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredForms.length > 0 ? (
              filteredForms.map((form) => (
                <div
                  key={form.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {form.title || "Untitled Form"}
                        </h3>
                        {form.description && (
                          <p className="text-gray-600 mt-1">
                            {form.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {form.category || "Uncategorized"}
                          </span>
                          {form.size && (
                            <span>{formatFileSize(form.size)}</span>
                          )}
                          {form.uploadedAt && (
                            <span>Uploaded {formatDate(form.uploadedAt)}</span>
                          )}
                          {form.createdAt && !form.uploadedAt && (
                            <span>Created {formatDate(form.createdAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownload(
                            form.id,
                            form.filename || form.title || "download"
                          )
                        }
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownload(
                            form.id,
                            form.filename || form.title || "download"
                          )
                        }
                        className="flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDeleteForm(
                            form.id,
                            form.title || "Untitled Form"
                          )
                        }
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  {searchTerm || categoryFilter
                    ? "No forms match your filters"
                    : "No forms uploaded yet"}
                </p>
                {!searchTerm && !categoryFilter && (
                  <Button
                    onClick={() => setShowUploadForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Upload First Form
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
