import { Role } from "../types";

// Application constants
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "SIWES Portal";
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";

// API configuration
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";
export const API_TIMEOUT = parseInt(
  process.env.NEXT_PUBLIC_API_TIMEOUT || "10000"
);

// File upload limits
export const MAX_FILE_SIZE = parseInt(
  process.env.NEXT_PUBLIC_MAX_FILE_SIZE || "5242880"
); // 5MB
export const ALLOWED_IMAGE_TYPES =
  process.env.NEXT_PUBLIC_ALLOWED_IMAGE_TYPES?.split(",") || [
    "image/jpeg",
    "image/png",
    "image/gif",
  ];
export const ALLOWED_DOCUMENT_TYPES =
  process.env.NEXT_PUBLIC_ALLOWED_DOCUMENT_TYPES?.split(",") || [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

// Role configurations
export const ROLES = {
  STUDENT: Role.Student,
  SCHOOL_SUPERVISOR: Role.SchoolSupervisor,
  INDUSTRY_SUPERVISOR: Role.IndustrySupervisor,
  ADMIN: Role.Admin,
};

export const ROLE_CONFIG = {
  [Role.Student]: {
    label: "Student",
    color: "bg-blue-100 text-blue-800",
    description: "Student undergoing industrial training",
    permissions: [
      "logbook:create",
      "logbook:read",
      "logbook:update",
      "profile:read",
      "profile:update",
    ],
  },
  [Role.SchoolSupervisor]: {
    label: "School Supervisor",
    color: "bg-green-100 text-green-800",
    description: "Academic supervisor from the institution",
    permissions: [
      "students:read",
      "logbook:read",
      "logbook:approve",
      "attendance:create",
      "attendance:read",
    ],
  },
  [Role.IndustrySupervisor]: {
    label: "Industry Supervisor",
    color: "bg-purple-100 text-purple-800",
    description: "Supervisor from the industry/company",
    permissions: [
      "students:read",
      "logbook:read",
      "logbook:approve",
      "attendance:create",
      "attendance:read",
    ],
  },
  [Role.Admin]: {
    label: "Administrator",
    color: "bg-red-100 text-red-800",
    description: "System administrator with full access",
    permissions: ["*"],
  },
};

// Navigation routes
export const APP_ROUTES = {
  HOME: "/",
  DASHBOARD: "/dashboard",
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
    CHANGE_PASSWORD: "/auth/change-password",
  },

  // Student routes
  STUDENT_DASHBOARD: "/student",
  STUDENT_PROFILE: "/student/profile",
  STUDENT_LOGBOOK: "/student/logbook",
  STUDENT_LOGBOOK_ENTRIES: "/student/logbook/entries",
  STUDENT_LOGBOOK_ENTRY_CREATE: "/student/logbook/entry/create",
  STUDENT_LOGBOOK_ENTRY_EDIT: (id: string) =>
    `/student/logbook/entry/${id}/edit`,
  STUDENT_LOGBOOK_ENTRY_VIEW: (id: string) => `/student/logbook/entry/${id}`,
  STUDENT_SUPERVISOR: "/student/supervisor",
  STUDENT_NOTIFICATIONS: "/student/notifications",

  // Supervisor routes
  SUPERVISOR_DASHBOARD: "/supervisor/school",
  INDUSTRY_SUPERVISOR_DASHBOARD: "/supervisor/industry",
  SUPERVISOR_STUDENTS: "/supervisor/students",
  SUPERVISOR_LOGBOOK: "/supervisor/logbook",
  SUPERVISOR_LOGBOOK_REVIEW: (id: string) => `/supervisor/logbook/entry/${id}`,
  SUPERVISOR_ATTENDANCE: "/supervisor/attendance",
  SUPERVISOR_ATTENDANCE_MARK: "/supervisor/attendance/mark",
  SUPERVISOR_ATTENDANCE_HISTORY: "/supervisor/attendance/history",
  SUPERVISOR_ANALYTICS: "/supervisor/analytics",
  // Admin routes
  ADMIN_DASHBOARD: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_USERS_CREATE: "/admin/users/create",
  ADMIN_USERS_UPLOAD: "/admin/users/upload",
  ADMIN_USER_DETAIL: (id: string) => `/admin/users/${id}`,
  ADMIN_USER_EDIT: (id: string) => `/admin/users/${id}/edit`,
  ADMIN_SUPERVISOR_ASSIGNMENTS: "/admin/supervisor/assignments",
  ADMIN_ANALYTICS: "/admin/analytics",
  ADMIN_NOTIFICATIONS_CREATE: "/admin/notifications/create",
  ADMIN_FORMS_UPLOAD: "/admin/forms/upload",

  // Common routes
  NOTIFICATIONS: "/notifications",
  FORMS: "/forms",
  FORMS_DOWNLOAD: (id: string) => `/forms/${id}/download`,
};

// API endpoints
export const API_ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/signup",
    PROFILE: "/auth/profile",
    CHANGE_PASSWORD: "/auth/change-password",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
    VERIFY_EMAIL: "/auth/verify-email",
    RESEND_VERIFICATION: "/auth/resend-verification",
    CHECK_EMAIL: "/auth/check-email",
  },
  USERS: "/users",
  ADMIN: "/admin",
  STUDENTS: {
    PROFILE: "/students/:studentId/profile",
    SUPERVISOR: "/student/industry-supervisor",
  },
  LOGBOOK: `/students/:id/logbook`,
  SUPERVISOR: {
    STUDENTS: "/supervisor/students",
    LOGBOOK_REVIEW: "/supervisor/logbook",
    ATTENDANCE: "/supervisor/attendance",
    ANALYTICS: "/supervisor/analytics",
    ASSIGNMENTS: "/admin/supervisor-assignments",
  },
  NOTIFICATIONS: {
    LIST: "/notifications",
    CREATE: "/admin/notifications",
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    DELETE_READ: "/notifications/read",
  },
  FORMS: {
    LIST: "/itf-forms",
    UPLOAD: "/itf-forms",
    DOWNLOAD: (id: string) => `/itf-forms/${id}`,
  },
  HEALTH: "/health",
};

// Legacy routes for backward compatibility
export const ROUTES = APP_ROUTES;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
};

// Date formats
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  INPUT: "yyyy-MM-dd",
  DATETIME: "MMM dd, yyyy HH:mm",
  TIME: "HH:mm",
};

// Status configurations
export const STATUS_CONFIG = {
  LOGBOOK_ENTRY: {
    DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-800" },
    SUBMITTED: { label: "Submitted", color: "bg-blue-100 text-blue-800" },
    APPROVED: { label: "Approved", color: "bg-green-100 text-green-800" },
    REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800" },
  },
  ATTENDANCE: {
    PRESENT: { label: "Present", color: "bg-green-100 text-green-800" },
    ABSENT: { label: "Absent", color: "bg-red-100 text-red-800" },
  },
  NOTIFICATION: {
    UNREAD: { label: "Unread", color: "bg-blue-100 text-blue-800" },
    READ: { label: "Read", color: "bg-gray-100 text-gray-800" },
  },
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: "Network error. Please check your connection and try again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "You do not have permission to access this resource.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "Server error. Please try again later.",
  FILE_TOO_LARGE: "File size exceeds the maximum limit.",
  INVALID_FILE_TYPE: "Invalid file type. Please select a valid file.",
  FORM_VALIDATION: "Please correct the errors in the form.",
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN: "Logged in successfully!",
  LOGOUT: "Logged out successfully!",
  PASSWORD_CHANGED: "Password changed successfully!",
  USER_CREATED: "User created successfully!",
  LOGBOOK_ENTRY_CREATED: "Logbook entry created successfully!",
  LOGBOOK_ENTRY_UPDATED: "Logbook entry updated successfully!",
  LOGBOOK_ENTRY_SUBMITTED: "Logbook entry submitted successfully!",
  ATTENDANCE_MARKED: "Attendance marked successfully!",
  NOTIFICATION_SENT: "Notification sent successfully!",
  FILE_UPLOADED: "File uploaded successfully!",
  DATA_EXPORTED: "Data exported successfully!",
};

// Loading states
export const LOADING_MESSAGES = {
  LOGGING_IN: "Logging in...",
  LOADING: "Loading...",
  SAVING: "Saving...",
  UPLOADING: "Uploading...",
  PROCESSING: "Processing...",
  EXPORTING: "Exporting...",
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_DATA: "userData",
  THEME: "theme",
  SIDEBAR_COLLAPSED: "sidebarCollapsed",
};

// Query keys for React Query
export const QUERY_KEYS = {
  USER: "user",
  USERS: "users",
  STUDENTS: "students",
  SUPERVISORS: "supervisors",
  LOGBOOK_ENTRIES: "logbookEntries",
  ATTENDANCE: "attendance",
  NOTIFICATIONS: "notifications",
  ITF_FORMS: "itfForms",
  ANALYTICS: "analytics",
  HEALTH: "health",
};
