/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertTriangle,
  Building,
  User,
  Mail,
  ArrowLeft,
} from "lucide-react";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { API_BASE_URL } from "@/constants";
import tokenManager from "@/lib/token-manager";
import toast from "react-hot-toast";

interface SupervisorStatus {
  hasIndustrySupervisor: boolean;
  supervisor?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function StudentSupervisorUploadPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [supervisorStatus, setSupervisorStatus] =
    useState<SupervisorStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check current supervisor status
  const checkSupervisorStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/industry-supervisors/status`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSupervisorStatus(data);
      }
    } catch (error) {
      console.error("Failed to check supervisor status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `${API_BASE_URL}/industry-supervisors/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || "Failed to upload supervisor information"
        );
      }

      const result = await response.json();
      toast.success("Industry supervisor information uploaded successfully!");

      // Reset form and refresh status
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      checkSupervisorStatus();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload file"
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Download CSV template
  const downloadTemplate = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/industry-supervisors/export-template`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "industry-supervisor-template.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Template downloaded successfully");
      } else {
        throw new Error("Failed to download template");
      }
    } catch (error: any) {
      toast.error("Failed to download template");
    }
  };

  // Reset file selection
  const resetFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    checkSupervisorStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading supervisor status...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Industry Supervisor Information
          </h1>
          <p className="text-gray-600">
            Upload your industry supervisor details using a CSV file
          </p>
        </div>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {supervisorStatus?.hasIndustrySupervisor ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-medium text-green-900">
                  Industry Supervisor Assigned
                </h3>
                <p className="text-green-700">
                  You have been assigned to:{" "}
                  <strong>{supervisorStatus.supervisor?.name}</strong>
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Email: {supervisorStatus.supervisor?.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-900">
                  No Industry Supervisor Assigned
                </h3>
                <p className="text-yellow-700">
                  Please upload your industry supervisor information using the
                  form below.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Form - Only show if no supervisor assigned */}
      {!supervisorStatus?.hasIndustrySupervisor && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Supervisor Information
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
                    <Button variant="outline" size="sm" onClick={resetFile}>
                      Remove File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-gray-600">
                        Click to select a CSV file or drag and drop
                      </p>
                      <p className="text-sm text-gray-500">
                        CSV files up to 5MB
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
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Supervisor Information
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
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
                      Use our template to ensure your data is formatted
                      correctly.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadTemplate}
                      className="mt-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                  </div>
                </div>
              </div>

              {/* Required Fields */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Required Information
                </h4>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      <strong>Name:</strong> Full name of your industry
                      supervisor
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>
                      <strong>Email:</strong> Valid email address of your
                      supervisor
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>
                      <strong>Company:</strong> Name of the organization
                      (optional)
                    </span>
                  </div>
                </div>
              </div>

              {/* CSV Format */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">CSV Format</h4>
                <div className="bg-gray-100 p-3 rounded-lg text-sm font-mono">
                  name,email,company,position
                  <br />
                  John Doe,john@company.com,ABC Corp,Manager
                </div>
              </div>

              {/* Important Notes */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-1">
                  📋 Important Notes
                </h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Only the first row of data will be processed</li>
                  <li>
                    • If supervisor doesn&#39;t exist, they will be created
                    automatically
                  </li>
                  <li>• You can only upload supervisor information once</li>
                  <li>• Contact admin if you need to change your supervisor</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>What happens after upload?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">1. Upload</h3>
              <p className="text-sm text-gray-600">
                Upload your supervisor&apos;s information via CSV
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">2. Assignment</h3>
              <p className="text-sm text-gray-600">
                You&lsquo;ll be automatically assigned to the supervisor
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">
                3. Notification
              </h3>
              <p className="text-sm text-gray-600">
                Supervisor receives login details via email
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
