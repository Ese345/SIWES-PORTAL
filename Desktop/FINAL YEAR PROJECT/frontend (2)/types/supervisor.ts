// Supervisor related types
export interface SupervisorAssignment {
  id: string;
  supervisorId: string;
  studentId: string;
  assignedAt: string;
  supervisor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  student: {
    id: string;
    name: string;
    matricNumber: string;
    department: string;
  };
}

export interface AssignStudentsData {
  supervisorId: string;
  studentIds: string[];
}

export interface SupervisorAnalytics {
  totalStudents: number;
  activeStudents: number;
  logbookSubmissions: number;
  attendanceRate: number;
  pendingApprovals: number;
}

export interface StudentPerformance {
  studentId: string;
  studentName: string;
  matricNumber: string;
  logbookEntries: number;
  submittedEntries: number;
  attendanceRate: number;
  lastActivity: string;
}

// Industry Supervisor CSV upload types
export interface IndustrySupervisorData {
  name: string;
  email: string;
  company: string;
  position: string;
  phone?: string;
}

// File upload types
export interface FileUploadResult {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

export interface CSVUploadResult {
  results: Array<{
    email: string;
    status: "created" | "skipped" | "failed";
    reason?: string;
  }>;
  credentials?: Array<{
    email: string;
    password: string;
  }>;
}
