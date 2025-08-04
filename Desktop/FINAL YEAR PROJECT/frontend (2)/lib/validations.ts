import { z } from "zod";
import { Role } from "../types";

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(6, "Password must be at least 6 characters"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const signupSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.role === Role.Student) {
        return data.matricNumber && data.matricNumber.length > 0;
      }
      return true;
    },
    {
      message: "Matric number is required for students",
      path: ["matricNumber"],
    }
  );

// User management schemas
export const createUserSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.nativeEnum(Role, {
      errorMap: () => ({ message: "Please select a valid role" }),
    }),
    department: z.string().optional(),
    matricNumber: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === Role.Student) {
        return data.department && data.matricNumber;
      }
      return true;
    },
    {
      message: "Department and matric number are required for students",
      path: ["department"],
    }
  );

// Logbook schemas
export const createLogbookEntrySchema = z.object({
  date: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return selectedDate <= today;
  }, "Date cannot be in the future"),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export const updateLogbookEntrySchema = z.object({
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .optional(),
});

// Attendance schemas
export const createAttendanceSchema = z.object({
  studentId: z.string().min(1, "Please select a student"),
  date: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return selectedDate <= today;
  }, "Date cannot be in the future"),
  present: z.boolean(),
});

export const updateAttendanceSchema = z.object({
  date: z.string().optional(),
  present: z.boolean().optional(),
});

// Notification schemas
export const createNotificationSchema = z.object({
  userId: z.string().min(1, "Please select a user"),
  message: z.string().min(1, "Message is required"),
});

// ITF Form schemas
export const createITFFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

// Supervisor assignment schemas
export const assignStudentsSchema = z.object({
  supervisorId: z.string().min(1, "Please select a supervisor"),
  studentIds: z.array(z.string()).min(1, "Please select at least one student"),
});

// File upload schemas
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File, { message: "Please select a file" })
    .refine((file) => {
      const maxSize = parseInt(
        process.env.NEXT_PUBLIC_MAX_FILE_SIZE || "5242880"
      ); // 5MB
      return file.size <= maxSize;
    }, "File size must be less than 5MB"),
});

export const imageUploadSchema = z.object({
  file: z
    .instanceof(File, { message: "Please select an image" })
    .refine((file) => {
      const allowedTypes = process.env.NEXT_PUBLIC_ALLOWED_IMAGE_TYPES?.split(
        ","
      ) || ["image/jpeg", "image/png", "image/gif"];
      return allowedTypes.includes(file.type);
    }, "Please select a valid image file (JPEG, PNG, or GIF)")
    .refine((file) => {
      const maxSize = parseInt(
        process.env.NEXT_PUBLIC_MAX_FILE_SIZE || "5242880"
      ); // 5MB
      return file.size <= maxSize;
    }, "Image size must be less than 5MB"),
});

export const csvUploadSchema = z.object({
  file: z
    .instanceof(File, { message: "Please select a CSV file" })
    .refine(
      (file) => file.type === "text/csv" || file.name.endsWith(".csv"),
      "Please select a valid CSV file"
    ),
});

// Industry supervisor CSV schema
export const industrySupervisorCsvSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().min(1, "Company is required"),
  position: z.string().min(1, "Position is required"),
  phone: z.string().optional(),
});

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export const dateRangeSchema = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    }
  );

// Export types for form validation
export type LoginFormData = z.infer<typeof loginSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type CreateLogbookEntryFormData = z.infer<
  typeof createLogbookEntrySchema
>;
export type UpdateLogbookEntryFormData = z.infer<
  typeof updateLogbookEntrySchema
>;
export type CreateAttendanceFormData = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceFormData = z.infer<typeof updateAttendanceSchema>;
export type CreateNotificationFormData = z.infer<
  typeof createNotificationSchema
>;
export type CreateITFFormFormData = z.infer<typeof createITFFormSchema>;
export type AssignStudentsFormData = z.infer<typeof assignStudentsSchema>;
export type IndustrySupervisorCsvData = z.infer<
  typeof industrySupervisorCsvSchema
>;
