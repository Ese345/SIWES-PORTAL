import { Router } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticateJWT, requireRole, AuthRequest } from '../middleware/auth';
import catchAsync from '../utils/catchAsync';

const router = Router();
const prisma = new PrismaClient();

/**
 * @openapi
 * /api/supervisors/analysis/student-count:
 *   get:
 *     tags: [Supervisors]
 *     summary: Get counts of students per supervisor
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student counts per supervisor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 industrySupervisors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       studentCount:
 *                         type: integer
 *                 schoolSupervisors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       studentCount:
 *                         type: integer
 *       403:
 *         description: Forbidden - only admin can access this data
 */

// Get student counts per supervisor
router.get(
  '/analysis/student-count',
  authenticateJWT,
  requireRole(Role.Admin),
  catchAsync(async (req: AuthRequest, res) => {
    // Get industry supervisors with student counts
    const industrySupervisors = await prisma.user.findMany({
      where: {
        role: Role.IndustrySupervisor,
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            industryStudents: true,
          },
        },
      },
    });

    // Get school supervisors with student counts
    const schoolSupervisors = await prisma.user.findMany({
      where: {
        role: Role.SchoolSupervisor,
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            schoolStudents: true,
          },
        },
      },
    });

    // Format the response
    const formattedIndustrySupervisors = industrySupervisors.map(supervisor => ({
      id: supervisor.id,
      name: supervisor.name,
      studentCount: supervisor._count.industryStudents,
    }));

    const formattedSchoolSupervisors = schoolSupervisors.map(supervisor => ({
      id: supervisor.id,
      name: supervisor.name,
      studentCount: supervisor._count.schoolStudents,
    }));

    res.json({
      industrySupervisors: formattedIndustrySupervisors,
      schoolSupervisors: formattedSchoolSupervisors,
    });
  }),
);

/**
 * @openapi
 * /api/supervisors/unassigned-students:
 *   get:
 *     tags: [Supervisors]
 *     summary: Get all students without industry and school supervisors
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of unassigned students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 studentsWithoutIndustrySupervisor:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       matricNumber:
 *                         type: string
 *                       department:
 *                         type: string
 *                 studentsWithoutSchoolSupervisor:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       matricNumber:
 *                         type: string
 *                       department:
 *                         type: string
 *       403:
 *         description: Forbidden - only admin can access this data
 */

// Get all students without supervisors
router.get(
  '/unassigned-students',
  authenticateJWT,
  requireRole(Role.Admin),
  catchAsync(async (req: AuthRequest, res) => {
    // Get students without industry supervisors
    const studentsWithoutIndustrySupervisor = await prisma.student.findMany({
      where: {
        industrySupervisorId: null,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get students without school supervisors
    const studentsWithoutSchoolSupervisor = await prisma.student.findMany({
      where: {
        schoolSupervisorId: null,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Format the response
    const formatStudents = students => {
      return students.map(student => ({
        id: student.id,
        name: student.user.name,
        matricNumber: student.matricNumber,
        department: student.department,
      }));
    };

    res.json({
      studentsWithoutIndustrySupervisor: formatStudents(studentsWithoutIndustrySupervisor),
      studentsWithoutSchoolSupervisor: formatStudents(studentsWithoutSchoolSupervisor),
    });
  }),
);

export { router as default };
