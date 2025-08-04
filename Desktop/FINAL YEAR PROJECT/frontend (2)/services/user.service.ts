// User management service for API interactions
import { apiClient } from "@/lib/api-client";
import { API_ROUTES } from "@/constants";
import type {
  User,
  CreateUserData,
  PaginatedResponse,
  PaginationParams,
  Role,
} from "@/types";

export interface UserFilters {
  role?: Role;
  search?: string;
  department?: string;
}

export interface UserListParams extends PaginationParams {
  filters?: UserFilters;
}

export interface UserStats {
  totalUsers: number;
  usersByRole: {
    [key in Role]?: number;
  };
}

export interface UserUploadResult {
  email: string;
  status: "created" | "failed" | "updated" | "skipped";
  reason?: string;
}

export interface UserCredential {
  email: string;
  password: string;
}

export interface BulkUploadResult {
  results: UserUploadResult[];
  credentials: UserCredential[];
}

export class UserService {
  /**
   * Get paginated list of users with filtering
   */
  static async getUsers(
    params: UserListParams
  ): Promise<PaginatedResponse<User>> {
    const { page, limit, filters } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.role) {
      queryParams.append("role", filters.role);
    }
    if (filters?.search) {
      queryParams.append("search", filters.search);
    }
    if (filters?.department) {
      queryParams.append("department", filters.department);
    }

    const response = await apiClient.get<{ data: PaginatedResponse<User> }>(
      `${API_ROUTES.USERS}?${queryParams.toString()}`
    );
    return response.data;
  }

  /**
   * Get user by ID
   */
  static async getUser(userId: string): Promise<User> {
    const response = await apiClient.get<{ data: User }>(
      `${API_ROUTES.USERS}/${userId}`
    );
    return response.data;
  }

  /**
   * Create new user
   */
  static async createUser(userData: CreateUserData): Promise<User> {
    const response = await apiClient.post<{ data: User }>(
      API_ROUTES.USERS,
      userData
    );
    return response.data;
  }

  /**
   * Update user
   */
  static async updateUser(
    userId: string,
    userData: Partial<User>
  ): Promise<User> {
    const response = await apiClient.put<{ data: User }>(
      `${API_ROUTES.USERS}/${userId}`,
      userData
    );
    return response.data;
  }

  /**
   * Delete user
   */
  static async deleteUser(userId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ data: { message: string } }>(
      `${API_ROUTES.USERS}/${userId}`
    );
    return response.data;
  }

  /**
   * Get user statistics for admin dashboard
   */
  static async getUserStats(): Promise<UserStats> {
    const response = await apiClient.get<UserStats>(
      `${API_ROUTES.USERS}/stats`
    );
    return response;
  }
  /**
   * Bulk upload users from CSV
   */
  static async bulkUploadUsers(file: File): Promise<BulkUploadResult> {
    const response = await apiClient.uploadFile<BulkUploadResult>(
      `${API_ROUTES.ADMIN}/users/upload-csv`,
      file
    );
    return response;
  }
  /**
   * Download CSV template for bulk upload
   */
  static async downloadTemplate(): Promise<Blob> {
    const response = await apiClient.get<Blob>(
      `${API_ROUTES.ADMIN}/users/template`,
      { responseType: "blob" }
    );
    return response;
  }

  /**
   * Download user credentials after bulk upload
   */
  static async downloadCredentials(uploadId: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(
      `${API_ROUTES.ADMIN}/users/credentials/${uploadId}`,
      { responseType: "blob" }
    );
    return response;
  }

  /**
   * Reset user password (Admin only)
   */
  static async resetUserPassword(userId: string): Promise<{
    temporaryPassword: string;
    message: string;
  }> {
    const response = await apiClient.post<{
      data: { temporaryPassword: string; message: string };
    }>(`${API_ROUTES.USERS}/${userId}/reset-password`);
    return response.data;
  }

  /**
   * Toggle user active status
   */
  static async toggleUserStatus(userId: string): Promise<User> {
    const response = await apiClient.patch<{ data: User }>(
      `${API_ROUTES.USERS}/${userId}/toggle-status`
    );
    return response.data;
  }

  /**
   * Get departments list
   */
  static async getDepartments(): Promise<string[]> {
    const response = await apiClient.get<{ data: string[] }>(
      `${API_ROUTES.USERS}/departments`
    );
    return response.data;
  }

  /**
   * Search users by email or name
   */
  static async searchUsers(query: string): Promise<User[]> {
    const response = await apiClient.get<{ data: User[] }>(
      `${API_ROUTES.USERS}/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  }
}
