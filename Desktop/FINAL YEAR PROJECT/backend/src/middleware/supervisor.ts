import { Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { AuthRequest } from './auth';

const prisma = new PrismaClient();

/**
 * Middleware to check if the user has permission to access a specific student's data.
 * Access is allowed if:
 * - The user is an Admin
 * - The user is the student themselves
 * - The user is a supervisor (industry or school) assigned to this student
 */
export async function checkStudentAccessPermission(
  req: AuthRequest,
  res: Response,
  next: () => void,
): Promise<void> {
  try {
    const { studentId } = req.params;

    // Admin can access all student data
    if (req.user?.role === Role.Admin) {
      return next();
    }

    // Students can access their own data
    if (req.user?.role === Role.Student && req.user.userId === studentId) {
      return next();
    }

    // Supervisors can only access their assigned students' data
    if (
      (req.user?.role === Role.IndustrySupervisor || req.user?.role === Role.SchoolSupervisor) &&
      studentId
    ) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { industrySupervisorId: true, schoolSupervisorId: true },
      });

      if (!student) {
        res.status(404).json({ error: 'Student not found' });
        return;
      }

      const supervisorId = req.user.userId;
      const isIndustrySupervisorForStudent = student.industrySupervisorId === supervisorId;
      const isSchoolSupervisorForStudent = student.schoolSupervisorId === supervisorId;

      if (!isIndustrySupervisorForStudent && !isSchoolSupervisorForStudent) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'You are not assigned as a supervisor for this student',
        });
        return;
      }

      return next();
    }

    // If none of the above conditions are met, deny access
    res.status(403).json({
      error: 'Forbidden',
      message: "You do not have permission to access this student's data",
    });
    return;
  } catch (err) {
    res.status(500).json({ error: 'Server error checking permissions' });
    return;
  }
}

/**
 * Middleware to check if a student has submitted industry supervisor information.
 * Only applies to POST/PUT/PATCH operations where students are creating or updating data.
 */
export async function checkIndustrySupervisorExists(
  req: AuthRequest,
  res: Response,
  next: () => void,
): Promise<void> {
  try {
    // Only apply this check when creating/updating entries and user is a student
    if (
      (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'PATCH') ||
      req.user?.role !== Role.Student
    ) {
      return next();
    }

    const studentId = req.user.userId;
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      res.status(404).json({ error: 'Student record not found' });
      return;
    }

    if (!student.industrySupervisorId) {
      res.status(403).json({
        error: 'Industry supervisor information not submitted',
        message:
          'You must submit your industry supervisor information before creating or updating entries',
        code: 'INDUSTRY_SUPERVISOR_REQUIRED',
      });
      return;
    }

    next();
  } catch (err) {
    res.status(500).json({ error: 'Server error checking industry supervisor assignment' });
    return;
  }
}
