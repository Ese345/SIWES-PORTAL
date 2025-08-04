"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Edit3,
  Calendar,
  Clock,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Send,
  User,
  RefreshCw,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { APP_ROUTES, API_ROUTES, API_BASE_URL } from "@/constants";
import { useAuth } from "@/contexts/auth-context";
import tokenManager from "@/lib/token-manager";
import toast from "react-hot-toast";

interface LogbookEntry {
  id: string;
  date: string;
  description: string;
  imageUrl?: string;
  submitted: boolean;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: string;
    name: string;
    email: string;
  };
}

const getStatusIcon = (submitted: boolean) => {
  if (submitted) {
    return <CheckCircle className="w-5 h-5 text-yellow-500" />;
  }
  return <FileText className="w-5 h-5 text-gray-500" />;
};

const getStatusColor = (submitted: boolean) => {
  if (submitted) {
    return "bg-yellow-100 text-yellow-800";
  }
  return "bg-gray-100 text-gray-800";
};

const getStatusText = (submitted: boolean) => {
  return submitted ? "Submitted" : "Draft";
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ViewLogbookEntry() {
  const params = useParams();
  const { user } = useAuth();
  const [entry, setEntry] = useState<LogbookEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEntry = async () => {
    if (!user || !params.id) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}${API_ROUTES.LOGBOOK.replace(":id", user.id)}/${
          params.id
        }`,
        {
          headers: {
            Authorization: `Bearer ${tokenManager.getAccessToken()}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Logbook entry not found");
        } else {
          const errorData = await response.json();
          setError(errorData.error || "Failed to load entry");
        }
        return;
      }

      const data = await response.json();
      setEntry(data.entry);
    } catch (err) {
      console.error("Error fetching entry:", err);
      setError("Failed to load entry. Please try again.");
      toast.error("Failed to load logbook entry");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEntry = async () => {
    if (!user || !entry) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(
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

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 409) {
          toast.error(errorData.error || "Entry already submitted");
          return;
        }

        throw new Error(errorData.error || "Failed to submit entry");
      }

      const { entry: updatedEntry } = await response.json();
      setEntry(updatedEntry);
      toast.success("Entry submitted successfully!");
    } catch (err) {
      console.error("Error submitting entry:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to submit entry"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchEntry();
  }, [user, params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <Card className="p-6 bg-white/80 backdrop-blur-sm">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href={APP_ROUTES.STUDENT_LOGBOOK}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Logbook
          </Link>
          <Card className="p-8 text-center bg-white/80 backdrop-blur-sm shadow-lg">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Entry Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "The requested logbook entry could not be found."}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={fetchEntry}
                className="flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Link href={APP_ROUTES.STUDENT_LOGBOOK}>
                <Button className="flex items-center">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Logbook
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href={APP_ROUTES.STUDENT_LOGBOOK}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Logbook
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={fetchEntry}
              disabled={loading}
              className="flex items-center"
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            {!entry.submitted && (
              <>
                <Link href={APP_ROUTES.STUDENT_LOGBOOK_ENTRY_EDIT(entry.id)}>
                  <Button variant="outline" className="flex items-center">
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Entry
                  </Button>
                </Link>

                <Button
                  onClick={handleSubmitEntry}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {isSubmitting ? "Submitting..." : "Submit Entry"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Enhanced Entry Card */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          {/* Entry Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Logbook Entry
              </h1>
              <div
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                  entry.submitted
                )}`}
              >
                {getStatusIcon(entry.submitted)}
                <span className="ml-2">{getStatusText(entry.submitted)}</span>
              </div>
            </div>

            {/* Enhanced Entry Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <Calendar className="w-5 h-5 mr-3 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                    Date
                  </p>
                  <p className="font-semibold text-gray-900">
                    {formatDate(entry.date)}
                  </p>
                </div>
              </div>

              <div className="flex items-center p-3 bg-green-50 rounded-lg">
                <Clock className="w-5 h-5 mr-3 text-green-600" />
                <div>
                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide">
                    Created
                  </p>
                  <p className="font-semibold text-gray-900">
                    {formatDateTime(entry.createdAt)}
                  </p>
                </div>
              </div>

              {entry.student && (
                <div className="flex items-center p-3 bg-indigo-50 rounded-lg md:col-span-2 lg:col-span-1">
                  <User className="w-5 h-5 mr-3 text-indigo-600" />
                  <div>
                    <p className="text-xs font-medium text-indigo-600 uppercase tracking-wide">
                      Student
                    </p>
                    <p className="font-semibold text-gray-900">
                      {entry.student.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Entry Content */}
          <div className="p-8">
            {/* Description Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-6 h-6 mr-3 text-blue-600" />
                Description
              </h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-base">
                    {entry.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Images Section */}
            {entry.imageUrl && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <ImageIcon className="w-6 h-6 mr-3 text-blue-600" />
                  Attached Image
                </h2>
                <div className="relative">
                  <div
                    className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-lg"
                    onClick={() => setSelectedImage(entry.imageUrl!)}
                  >
                    <Image
                      src={entry.imageUrl}
                      alt="Entry attachment"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-3 opacity-0 hover:opacity-100 transition-opacity">
                        <Eye className="w-6 h-6 text-gray-700" />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Click to view full size
                  </p>
                </div>
              </div>
            )}

            {/* Status Information */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
                Entry Status
              </h2>
              <div className="text-gray-700">
                {entry.submitted ? (
                  <div className="space-y-2">
                    <p className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      This entry has been submitted and is awaiting supervisor
                      review.
                    </p>
                    <p className="text-sm text-gray-600">
                      You will be notified once your supervisor reviews this
                      entry.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-gray-500" />
                      This entry is saved as a draft.
                    </p>
                    <p className="text-sm text-gray-600">
                      You can edit this entry or submit it for supervisor
                      review.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between gap-4">
          <Link href={APP_ROUTES.STUDENT_LOGBOOK}>
            <Button
              variant="outline"
              className="flex items-center px-6 h-12 w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Logbook
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={APP_ROUTES.STUDENT_LOGBOOK_ENTRIES}>
              <Button
                variant="outline"
                className="flex items-center px-6 h-12 w-full sm:w-auto"
              >
                <Eye className="w-4 h-4 mr-2" />
                View All Entries
              </Button>
            </Link>

            {!entry.submitted && (
              <Link href={APP_ROUTES.STUDENT_LOGBOOK_ENTRY_EDIT(entry.id)}>
                <Button className="bg-gray-600 hover:bg-gray-700 flex items-center px-6 h-12 w-full sm:w-auto">
                  <Edit3 className="w-4 w-4 mr-2" />
                  Edit Entry
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black/50 rounded-full p-2 transition-colors"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <div className="relative">
              <Image
                src={selectedImage}
                alt="Full size entry image"
                width={1200}
                height={800}
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
