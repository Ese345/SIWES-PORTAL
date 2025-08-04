// Re-export all types for easy importing
export * from "./auth";
export * from "./student";
export * from "./supervisor";

// Common UI types
export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface FilterOption {
  key: string;
  label: string;
  type: "select" | "date" | "text";
  options?: SelectOption[];
}

// Dashboard card types
export interface DashboardCard {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

// Form validation types
export interface FormError {
  field: string;
  message: string;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// Upload progress
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
