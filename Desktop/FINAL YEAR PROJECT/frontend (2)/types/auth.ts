// Core user and authentication types
export enum Role {
  Student = "Student",
  SchoolSupervisor = "SchoolSupervisor",
  IndustrySupervisor = "IndustrySupervisor",
  Admin = "Admin",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  imageUrl?: string;
  createdAt: string;
  mustChangePassword: boolean;
  student?: Student;
}

export interface Student {
  id: string;
  matricNumber: string;
  department: string;
  profile?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ChangePasswordData {
  oldPassword: string;
  newPassword: string;
}

export interface CreateUserData {
  email: string;
  name: string;
  password: string;
  role: Role;
  department?: string;
  matricNumber?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  error: string;
  message?: string;
  errors?: ValidationError[];
}
