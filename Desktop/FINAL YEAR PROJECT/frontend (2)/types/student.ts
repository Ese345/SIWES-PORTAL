// Logbook related types
export interface LogbookEntry {
  id: string;
  studentId: string;
  date: string;
  description: string;
  imageUrl?: string;
  submitted: boolean;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  comments?: LogbookComment[];
}

export interface LogbookComment {
  id: string;
  entryId: string;
  supervisorId: string;
  comment: string;
  createdAt: string;
  supervisor: {
    name: string;
    role: string;
  };
}

export interface CreateLogbookEntryData {
  date: string;
  description: string;
  image?: File;
}

export interface UpdateLogbookEntryData {
  description?: string;
  image?: File;
}

// Attendance related types
export interface AttendanceRecord {
  id: string;
  studentId: string;
  supervisorId: string;
  date: string;
  present: boolean;
  createdAt: string;
  updatedAt: string;
  student: {
    name: string;
    matricNumber: string;
  };
  supervisor: {
    name: string;
    role: string;
  };
}

export interface CreateAttendanceData {
  studentId: string;
  date: string;
  present: boolean;
}

export interface UpdateAttendanceData {
  date?: string;
  present?: boolean;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationData {
  userId: string;
  message: string;
}

// ITF Forms types
export interface ITFForm {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  fileUrl: string;
  createdAt: string;
  uploadedBy: string;
}

export interface CreateITFFormData {
  title: string;
  description?: string;
  file: File;
}
