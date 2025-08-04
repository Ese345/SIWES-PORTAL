"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  Download,
  FileText,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useBulkUploadUsers } from "@/hooks/use-users";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Loading,
} from "@/components/ui";
import { APP_ROUTES } from "@/constants";
import toast from "react-hot-toast";
import type { BulkUploadResult } from "@/services/user.service";

export default function BulkUploadUsersPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(
    null
  );

  const bulkUpload = useBulkUploadUsers();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (
        !file.name.endsWith(".csv") &&
        !file.name.endsWith(".xlsx") &&
        !file.name.endsWith(".xls")
      ) {
        toast.error("Please select a CSV or Excel file");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      setUploadResult(null);
    }
  };
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    try {
      const result = await bulkUpload.mutateAsync(selectedFile);
      setUploadResult(result);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadResult(null);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const headers = [
      "name",
      "email",
      "role",
      "matricNo",
      "department",
      "level",
      "phoneNumber",
      "address",
    ];

    const sampleData = [
      'John Doe,john.doe@example.com,student,CSC/2020/001,Computer Science,300,08012345678,"123 Main St"',
      "Jane Smith,jane.smith@example.com,school_supervisor,,,,,",
      'Bob Johnson,bob.johnson@company.com,industry_supervisor,,,,"456 Corporate Ave"',
    ];

    const csvContent = [headers.join(","), ...sampleData].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "users_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push(APP_ROUTES.ADMIN_USERS)}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Users
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bulk Upload Users
          </h1>
          <p className="text-gray-600">
            Upload multiple users at once using CSV or Excel files
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Selection */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {selectedFile ? (
                <div className="space-y-3">
                  <FileText className="h-12 w-12 text-blue-500 mx-auto" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetUpload}>
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-gray-600">
                      Click to select a file or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      CSV or Excel files up to 5MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select File
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || bulkUpload.isPending}
              className="w-full"
              leftIcon={
                bulkUpload.isPending ? (
                  <Loading />
                ) : (
                  <Upload className="h-4 w-4" />
                )
              }
            >
              {bulkUpload.isPending ? "Uploading..." : "Upload Users"}
            </Button>

            {/* Upload Result */}
            {uploadResult && (
              <div className="mt-4 p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  {uploadResult.results.some((r) => r.status === "failed") ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      Upload Complete
                    </h4>
                    <div className="mt-1 text-sm text-gray-600">
                      {uploadResult.results.filter(
                        (r) => r.status === "created"
                      ).length > 0 && (
                        <p>
                          ✅{" "}
                          {
                            uploadResult.results.filter(
                              (r) => r.status === "created"
                            ).length
                          }{" "}
                          Users Created
                        </p>
                      )}
                      {uploadResult.results.filter(
                        (r) => r.status === "updated"
                      ).length > 0 && (
                        <p>
                          🔄{" "}
                          {
                            uploadResult.results.filter(
                              (r) => r.status === "updated"
                            ).length
                          }{" "}
                          Users Updated
                        </p>
                      )}
                      {uploadResult.results.filter(
                        (r) => r.status === "skipped"
                      ).length > 0 && (
                        <p>
                          ⏭️{" "}
                          {
                            uploadResult.results.filter(
                              (r) => r.status === "skipped"
                            ).length
                          }{" "}
                          Users Skipped
                        </p>
                      )}
                    </div>

                    {/* Error Details */}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Download Template */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Download className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">
                    Download Template
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Use our template to ensure your data is formatted correctly.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                    className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                    leftIcon={<Download className="h-4 w-4" />}
                  >
                    Download Template
                  </Button>
                </div>
              </div>
            </div>

            {/* File Format */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">File Format</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Supported formats: CSV, Excel (.xlsx, .xls)</li>
                <li>• Maximum file size: 5MB</li>
                <li>• First row should contain column headers</li>
              </ul>
            </div>

            {/* Required Fields */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Required Fields
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex">
                  <span className="font-medium w-20">name:</span>
                  <span>Full name of the user</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-20">email:</span>
                  <span>Valid email address (must be unique)</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-20">role:</span>
                  <span>
                    student, school_supervisor, industry_supervisor, admin
                  </span>
                </div>
              </div>
            </div>

            {/* Student-Specific Fields */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Student-Specific Fields
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex">
                  <span className="font-medium w-20">matricNo:</span>
                  <span>
                    Student matriculation number (required for students)
                  </span>
                </div>
                <div className="flex">
                  <span className="font-medium w-20">department:</span>
                  <span>Student department (required for students)</span>
                </div>
                <div className="flex">
                  <span className="font-medium w-20">level:</span>
                  <span>Student level (100, 200, 300, 400, 500)</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-1">💡 Tips</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Empty cells will be ignored for optional fields</li>
                <li>• Duplicate emails will be skipped</li>
                <li>• Default password will be generated for new users</li>
                <li>
                  • Users will receive email notification with login details
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
