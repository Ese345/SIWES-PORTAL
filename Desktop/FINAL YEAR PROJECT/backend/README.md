# Supervisor Assignment System

## Overview

This system manages the assignment of students to supervisors in an educational logbook application. It includes:

1. Assignment of students to industry supervisors
2. Assignment of students to school supervisors 
3. Random assignment capability for school supervisors
4. CSV upload for industry supervisor information
5. Access control based on supervisor-student relationships
6. Analytics for supervisors and student assignments

## Key Features

### Supervisor Assignment

- **Manual Assignment**: Administrators can manually assign students to industry or school supervisors
- **Random Assignment**: Administrators can randomly assign students to school supervisors in a balanced way
- **Analytics**: View statistics on supervisor assignments and identify unassigned students

### Industry Supervisor CSV Upload

- Students can submit industry supervisor information via CSV upload
- System creates supervisor accounts if they don't exist
- Students are automatically assigned to the uploaded supervisor

### Access Control

- Supervisors can only view and edit data for students assigned to them
- Students must submit industry supervisor information before creating logbook entries
- Appropriate error messages guide users through the workflow

## API Endpoints

### Supervisor Assignment Routes (`/api/supervisors`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/assignments/industry` | Assign students to an industry supervisor |
| POST | `/assignments/school` | Assign students to a school supervisor |
| POST | `/assignments/school/random` | Randomly assign students to school supervisors |
| GET | `/industry/:supervisorId/students` | Get students assigned to an industry supervisor |
| GET | `/school/:supervisorId/students` | Get students assigned to a school supervisor |
| GET | `/student/:studentId/supervisors` | Get supervisor details for a student |
| GET | `/analysis/student-count` | Get counts of students per supervisor |
| GET | `/unassigned-students` | Get students without supervisors |

### Industry Supervisor CSV Routes (`/api/industry-supervisors`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload industry supervisor information via CSV |
| GET | `/export-template` | Download CSV template for industry supervisor information |
| GET | `/status` | Check if student has submitted industry supervisor info |

## Database Schema

The system extends the existing database schema with the following relationships:

```prisma
model Student {
  // Other fields...
  industrySupervisorId String?
  schoolSupervisorId   String?
  industrySupervisor   User?    @relation("IndustrySupervisorStudents", fields: [industrySupervisorId], references: [id])
  schoolSupervisor     User?    @relation("SchoolSupervisorStudents", fields: [schoolSupervisorId], references: [id])
}

model User {
  // Other fields...
  industryStudents   Student[] @relation("IndustrySupervisorStudents")
  schoolStudents     Student[] @relation("SchoolSupervisorStudents")
}
```

## Security

- All routes are protected with JWT authentication
- Role-based access control prevents unauthorized access
- Middleware validates supervisor-student relationships for all operations

## CSV Format for Industry Supervisor Upload

The CSV file should include the following columns:
- `name`: Supervisor's full name
- `email`: Supervisor's email address
- `company`: (Optional) Company name
- `position`: (Optional) Supervisor's position

## Testing the System

To test the supervisor assignment system:

1. **Random Assignment**:
   - Log in as an Admin
   - Navigate to `/api/supervisors/assignments/school/random`
   - Optionally specify `departmentFilter` to assign students by department

2. **CSV Upload**:
   - Log in as a Student
   - Download the template from `/api/industry-supervisors/export-template`
   - Fill in your industry supervisor's details
   - Upload using `/api/industry-supervisors/upload`
   - Verify status with `/api/industry-supervisors/status`

3. **Logbook Entry Creation**:
   - Students must have an industry supervisor assigned before they can create logbook entries
   - If attempt is made without a supervisor, they'll receive a helpful error message

4. **Supervisor Access**:
   - Log in as a Supervisor (Industry or School)
   - You will only see students assigned to you
   - You can view logbooks and attendance for assigned students only
