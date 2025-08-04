"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Calendar,
  Upload,
  X,
  Save,
  Send,
  AlertCircle,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { APP_ROUTES } from "@/constants";

export default function EditLogbookEntryPage() {
  const router = useRouter();
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const entryId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: "",
    description: "",
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Mock data - replace with actual API call
  useEffect(() => {
    const fetchEntry = async () => {
      try {
        // TODO: Replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockEntry = {
          id: entryId,
          date: "2024-01-13",
          description:
            "Worked on bug fixes for the authentication module. Debugged session timeout issues and implemented proper error handling for edge cases.",
          submitted: false,
          imageUrl: "/api/placeholder/400/300", // Mock image URL
        };

        setFormData({
          date: mockEntry.date,
          description: mockEntry.description,
        });

        if (mockEntry.imageUrl) {
          setExistingImageUrl(mockEntry.imageUrl);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching entry:", error);
        setErrors({ fetch: "Failed to load entry. Please try again." });
        setIsLoading(false);
      }
    };

    if (entryId) {
      fetchEntry();
    }
  }, [entryId]);

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

  const removeExistingImage = () => {
    setExistingImageUrl(null);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement API call to update entry
      console.log("Updating entry:", entryId, formData, selectedImage);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push(APP_ROUTES.STUDENT_LOGBOOK_ENTRIES);
    } catch (error) {
      console.error("Error updating entry:", error);
      setErrors({ submit: "Failed to save changes. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEntry = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // TODO: Implement API call to submit entry
      console.log("Submitting entry:", entryId, formData, selectedImage);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      router.push(APP_ROUTES.STUDENT_LOGBOOK_ENTRIES);
    } catch (error) {
      console.error("Error submitting entry:", error);
      setErrors({ submit: "Failed to submit entry. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading entry...</p>
        </div>
      </div>
    );
  }

  if (errors.fetch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Failed to Load Entry
            </h2>
            <p className="text-gray-600 mb-4">{errors.fetch}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Logbook Entry
          </h1>
          <p className="text-gray-600">
            Update your logbook entry for{" "}
            {new Date(formData.date).toLocaleDateString()}
          </p>
        </div>

        <Card className="p-8">
          <form className="space-y-6">
            {/* Date Field (Read-only) */}
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  className="pl-10 bg-gray-50"
                  disabled
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Entry date cannot be changed after creation
              </p>
            </div>

            {/* Description Field */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="description"
                rows={8}
                value={formData.description}
                onChange={(e: { target: { value: string } }) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your activities, tasks completed, skills learned, challenges faced, and any other relevant experiences from this day..."
                className={`resize-none ${
                  errors.description ? "border-red-500" : ""
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
                </p>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image (Optional)
              </label>
              <div className="space-y-4">
                {/* Existing Image */}
                {existingImageUrl && (
                  <div className="relative">
                    <div className="border border-gray-300 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={existingImageUrl}
                          alt="Current image"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <ImageIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">
                              Current Image
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            Existing image attached to this entry
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeExistingImage}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* New Image Upload */}
                {!selectedImage ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 cursor-pointer transition-colors"
                  >
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      {existingImageUrl
                        ? "Click to replace image"
                        : "Click to upload an image"}{" "}
                      or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF up to 5MB
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="border border-gray-300 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <img
                          src={imagePreview!}
                          alt="New image preview"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <ImageIcon className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-900">
                              {selectedImage.name}
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              New
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeImage}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
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
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveChanges}
                  disabled={isSubmitting}
                  className="flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmitEntry}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Submitting..." : "Submit Entry"}
                </Button>
              </div>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
