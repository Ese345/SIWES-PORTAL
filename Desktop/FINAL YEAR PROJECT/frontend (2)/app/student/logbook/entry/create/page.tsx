/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Upload,
  X,
  Save,
  Send,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { APP_ROUTES, API_ROUTES, API_BASE_URL } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import tokenManager from "@/lib/token-manager";
import toast from "react-hot-toast";

export default function CreateLogbookEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Get date from URL params if provided (from calendar click)
  const initialDate =
    searchParams?.get("date") || new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    date: initialDate,
    description: "",
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          image: "Please select a valid image file",
        }));
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          image: "Image must be smaller than 5MB",
        }));
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Clear any existing error
      setErrors((prev) => ({
        ...prev,
        image: "",
      }));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 5) {
      newErrors.description = "Description must be at least 5 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createEntry = async (shouldSubmit: boolean = false) => {
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    if (!validateForm()) return;

    const setLoading = shouldSubmit ? setIsSubmitting : setIsSubmittingDraft;

    setLoading(true);
    try {
      // Create FormData for multipart/form-data request
      const formDataToSend = new FormData();
      formDataToSend.append("date", formData.date);
      formDataToSend.append("description", formData.description);

      if (selectedImage) {
        formDataToSend.append("image", selectedImage);
      }

      // Create the entry first
      const response = await fetch(
        `${API_BASE_URL}${API_ROUTES.LOGBOOK.replace(":id", user.id)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 409) {
          setErrors({
            date: errorData.error || "Entry for this date already exists",
          });
          return;
        }

        if (response.status === 400 && errorData.errors) {
          // Handle validation errors from express-validator
          const validationErrors: { [key: string]: string } = {};
          errorData.errors.forEach((error: any) => {
            validationErrors[error.path || error.param] = error.msg;
          });
          setErrors(validationErrors);
          return;
        }

        throw new Error(errorData.error || "Failed to create entry");
      }

      const { entry } = await response.json();

      // If shouldSubmit is true, submit the entry immediately
      if (shouldSubmit) {
        const submitResponse = await fetch(
          `${API_BASE_URL}${API_ROUTES.LOGBOOK.replace(":id", user.id)}/${
            entry.id
          }/submit`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${tokenManager.getAccessToken()}`,
            },
          }
        );

        if (!submitResponse.ok) {
          const submitErrorData = await submitResponse.json();
          throw new Error(submitErrorData.error || "Failed to submit entry");
        }

        toast.success("Entry created and submitted successfully!");
      } else {
        toast.success("Entry saved as draft successfully!");
      }

      router.push(APP_ROUTES.STUDENT_LOGBOOK);
    } catch (error) {
      console.error("Error creating entry:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(errorMessage);
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsDraft = () => createEntry(false);
  const handleSubmitEntry = () => createEntry(true);

  const maxDate = new Date().toISOString().split("T")[0]; // Today's date

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Logbook Entry
          </h1>
          <p className="text-gray-600">
            Record your daily activities and experiences during your industrial
            training
          </p>
        </div>

        <Card className="p-8 bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <form className="space-y-8">
            {/* Date Field */}
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-semibold text-gray-700 mb-3"
              >
                Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  max={maxDate}
                  className={`pl-12 h-12 text-base ${
                    errors.date
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  }`}
                  required
                />
              </div>
              {errors.date && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.date}
                </p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-700 mb-3"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="description"
                rows={8}
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your activities, tasks completed, skills learned, challenges faced, and any other relevant experiences from this day..."
                className={`resize-none text-base ${
                  errors.description
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                }`}
                required
              />
              <div className="flex justify-between items-center mt-2">
                {errors.description && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.description}
                  </p>
                )}
                <p className="text-sm text-gray-500 ml-auto">
                  {formData.description.length} characters
                  {formData.description.length >= 5 && (
                    <CheckCircle className="h-4 w-4 text-green-500 inline ml-1" />
                  )}
                </p>
              </div>
            </div>

            {/* Enhanced Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Image (Optional)
              </label>
              <div className="space-y-4">
                {!selectedImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                  >
                    <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-base text-gray-600 font-medium">
                      Click to upload an image or drag and drop
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="border border-gray-300 rounded-xl p-6 bg-gray-50">
                      <div className="flex items-start gap-6">
                        <div className="relative">
                          <img
                            src={imagePreview!}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-xl shadow-sm"
                          />
                          <div className="absolute -top-2 -right-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeImage}
                              className="h-8 w-8 rounded-full bg-red-500 hover:bg-red-600 text-white p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <ImageIcon className="h-5 w-5 text-blue-500" />
                            <span className="text-base font-medium text-gray-900">
                              {selectedImage.name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Size:{" "}
                            {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <p className="text-sm text-gray-600">
                            Type: {selectedImage.type}
                          </p>
                          <div className="mt-3 flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Ready to upload
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {errors.image && (
                  <p className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.image}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Enhanced Action Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting || isSubmittingDraft}
                className="px-6 h-12"
              >
                Cancel
              </Button>

              <div className="flex items-center gap-4">
                {/* <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveAsDraft}
                  disabled={isSubmitting || isSubmittingDraft}
                  className="flex items-center px-6 h-12 border-gray-300 hover:bg-gray-50"
                >
                  {isSubmittingDraft ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSubmittingDraft ? "Saving..." : "Save as Draft"}
                </Button> */}

                <Button
                  type="button"
                  onClick={handleSubmitEntry}
                  disabled={isSubmitting || isSubmittingDraft}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center px-8 h-12 shadow-md"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {isSubmitting
                    ? "Creating & Submitting..."
                    : "Create & Submit"}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* Enhanced Help Section */}
        <Card className="p-8 mt-8 bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Writing Tips for Your Logbook Entry
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-600">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-base">
                What to Include:
              </h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Tasks and projects worked on
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Skills learned or applied
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Challenges faced and solutions
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Interactions with team members
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  Tools and technologies used
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 text-base">
                Best Practices:
              </h4>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  Be specific and detailed
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  Use professional language
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  Reflect on learning outcomes
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  Include relevant technical details
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  Add photos when possible
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> You can save your entry as a draft to edit
              later, or create and submit it immediately. Once submitted,
              entries can only be edited if they haven&apos;t been reviewed by
              your supervisor.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
