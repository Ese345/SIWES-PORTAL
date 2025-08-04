"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Badge from "@/components/ui/badge";
import {
  User,
  Mail,
  Calendar,
  Edit3,
  Save,
  X,
  Upload,
  Building,
  GraduationCap,
  IdCard,
  Camera,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { APP_ROUTES, API_ROUTES, API_BASE_URL } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import tokenManager from "@/lib/token-manager";

// Types
interface StudentProfile {
  id: string;
  email: string;
  name: string;
  imageUrl?: string;
  createdAt: string;
  student: {
    matricNumber: string;
    department: string;
    profile?: string;
  };
}

export default function StudentProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form data for editing
  const [formData, setFormData] = useState({
    name: "",
    profile: "",
  });

  // Fetch student profile
  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}${API_ROUTES.STUDENTS.PROFILE.replace(
          ":studentId",
          user.id
        )}`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfile(data.profile);
      setFormData({
        name: data.profile.name,
        profile: data.profile.student.profile || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Update profile
  const handleSave = async () => {
    if (!user || !profile) return;

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}${API_ROUTES.STUDENTS.PROFILE.replace(
          ":studentId",
          user.id
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const data = await response.json();
      setProfile(data.profile);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB");
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // TODO: Implement actual image upload to backend
      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } catch (err) {
      setError("Failed to upload image");
      console.error("Image upload error:", err);
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove image preview
  const removeImagePreview = () => {
    setImagePreview(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-6 font-medium">{error}</p>
          <Button
            onClick={fetchProfile}
            className="bg-red-600 hover:bg-red-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                My Profile
              </h1>
              <p className="text-gray-600">
                Manage your personal information and preferences
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: profile.name,
                        profile: profile.student.profile || "",
                      });
                      setError(null);
                      setImagePreview(null);
                    }}
                    disabled={isSaving}
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 shadow-md"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 hover:bg-blue-700 shadow-md"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Profile Picture Card */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-600" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6">
              <div className="relative group">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 p-1 shadow-lg">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                    {uploadingImage ? (
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-xs text-gray-500 mt-2">
                          Uploading...
                        </p>
                      </div>
                    ) : imagePreview || profile.imageUrl ? (
                      <img
                        src={imagePreview || profile.imageUrl}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-20 w-20 text-gray-300" />
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    {imagePreview && (
                      <button
                        onClick={removeImagePreview}
                        className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors"
                        disabled={uploadingImage}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <label className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-lg transition-colors">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="text-center space-y-2">
                <h3 className="font-bold text-xl text-gray-900">
                  {profile.name}
                </h3>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800 px-3 py-1"
                >
                  Student
                </Badge>
                <p className="text-sm text-gray-500">
                  {profile.student.matricNumber}
                </p>
              </div>

              {isEditing && (
                <div className="w-full text-center p-3 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200">
                  <Upload className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-blue-600 font-medium">
                    Click camera icon to upload photo
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Max size: 5MB • JPG, PNG
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Personal Information Card */}
          <Card className="lg:col-span-2 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                <IdCard className="h-6 w-6 text-blue-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Full Name */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Full Name
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Enter your full name"
                        className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <User className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {profile.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Email Address
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {profile.email}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Contact admin to change email address
                  </p>
                </div>

                {/* Matric Number */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Matriculation Number
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                    <GraduationCap className="h-5 w-5 text-blue-500" />
                    <span className="font-mono font-bold text-blue-900">
                      {profile.student.matricNumber}
                    </span>
                  </div>
                </div>

                {/* Department */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Department
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Building className="h-5 w-5 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {profile.student.department}
                    </span>
                  </div>
                </div>

                {/* Member Since */}
                <div className="space-y-3 md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Member Since
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-green-900">
                      {formatDate(profile.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Enhanced Profile/Bio Section */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  About Me
                </label>
                {isEditing ? (
                  <Textarea
                    value={formData.profile}
                    onChange={(e) =>
                      setFormData({ ...formData, profile: e.target.value })
                    }
                    placeholder="Tell us about yourself, your goals, interests, academic achievements, career aspirations..."
                    rows={6}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 min-h-[120px] border border-gray-100">
                    {profile.student.profile ? (
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {profile.student.profile}
                      </p>
                    ) : (
                      <div className="text-center py-8">
                        <User className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 italic font-medium">
                          No profile information provided yet.
                        </p>
                        {!isEditing && (
                          <p className="text-sm text-gray-400 mt-2">
                            Click &apos;Edit Profile&apos; to add your bio and
                            tell us about yourself.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Quick Actions Card */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              Quick Actions
            </CardTitle>
            <p className="text-gray-600 text-sm">
              Navigate to your most used features
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => router.push(APP_ROUTES.STUDENT_LOGBOOK)}
                className="justify-start h-16 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">View Logbook</div>
                    <div className="text-xs text-gray-500">
                      Track your progress
                    </div>
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(APP_ROUTES.STUDENT_SUPERVISOR)}
                className="justify-start h-16 border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Building className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Supervisor Info</div>
                    <div className="text-xs text-gray-500">Contact details</div>
                  </div>
                </div>
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(APP_ROUTES.NOTIFICATIONS)}
                className="justify-start h-16 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Mail className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Notifications</div>
                    <div className="text-xs text-gray-500">Recent updates</div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
