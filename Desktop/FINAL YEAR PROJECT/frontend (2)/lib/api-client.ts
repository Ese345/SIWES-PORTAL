import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { toast } from "react-hot-toast";
import { tokenManager } from "./token-manager";

// Types
interface ApiConfig {
  baseURL: string;
  timeout: number;
}

class ApiClient {
  private client: AxiosInstance;
  private config: ApiConfig;

  constructor() {
    this.config = {
      baseURL:
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api",
      timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000"),
    };

    this.client = axios.create(this.config);
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for auth token with automatic refresh
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await tokenManager.getValidToken();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error("Failed to get valid token:", error);
          // Continue with request without token
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await tokenManager.refreshAccessToken();
            if (newToken && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            this.handleAuthenticationFailure();
          }
        }

        this.handleResponseError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleAuthenticationFailure(): void {
    tokenManager.clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
    toast.error("Session expired. Please login again.");
  }

  private handleResponseError(error: AxiosError): void {
    const status = error.response?.status;

    if (status === 401) {
      this.handleAuthenticationFailure();
    } else if (status === 404) {
      toast.error("The requested resource was not found.");
    } else if (status === 422) {
      const message = (error.response?.data as { message?: string })?.message;
      toast.error(message || "Validation error occurred.");
    } else if (status && status >= 500) {
      toast.error("Server error. Please try again later.");
    } else if (!status) {
      toast.error("Network error. Please check your connection.");
    }
  }

  // Token management methods
  setAuthTokens(accessToken: string, refreshToken: string): void {
    tokenManager.setTokens(accessToken, refreshToken);
    // Schedule automatic token refresh
    tokenManager.scheduleTokenRefresh();
  }

  clearAuthTokens(): void {
    tokenManager.clearTokens();
  }

  getAuthToken(): string | null {
    return tokenManager.getAccessToken();
  }

  isAuthenticated(): boolean {
    return tokenManager.hasAccessToken() && !tokenManager.isTokenExpired();
  }

  // HTTP methods with proper typing
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = unknown, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // File upload with progress
  async uploadFile<T = unknown>(
    url: string,
    file: File,
    fieldName: string = "file",
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);

    const response = await this.client.post<T>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  }

  // Multiple file upload
  async uploadFiles<T = unknown>(
    url: string,
    files: File[],
    fieldName: string = "files",
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`${fieldName}[${index}]`, file);
    });

    const response = await this.client.post<T>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  }

  // Download file
  async downloadFile(url: string, filename?: string): Promise<void> {
    const response = await this.client.get(url, {
      responseType: "blob",
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get("/health");
  }

  // Get request with automatic retry
  async getWithRetry<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: AxiosError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.get<T>(url, config);
      } catch (error) {
        lastError = error as AxiosError;

        // Don't retry on authentication errors or client errors
        if (lastError.response?.status && lastError.response.status < 500) {
          throw lastError;
        }

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export the class for testing purposes
export { ApiClient };
