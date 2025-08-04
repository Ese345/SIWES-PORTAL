import { Router, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateJWT, requireRole, AuthRequest } from '../middleware/auth';
import catchAsync from '../utils/catchAsync';

const router = Router();
const prisma = new PrismaClient();

/**
 * @openapi
 * /api/supervisors/assignments/industry:
 *   post:
 *     tags: [Supervisors]
 *     summary: Assign students to an industry supervisor
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [supervisorId, studentIds]
 *             properties:
 *               supervisorId:
 *                 type: string
 *                 description: Industry supervisor user ID
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of student IDs to assign
 *     responses:
 *       200:
 *         description: Students successfully assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 assignedStudents:
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
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - only admin can assign supervisors
 *       404:
 *         description: Supervisor or student not found
 *
 * /api/supervisors/assignments/school:
 *   post:
 *     tags: [Supervisors]
 *     summary: Assign students to a school supervisor
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [supervisorId, studentIds]
 *             properties:
 *               supervisorId:
 *                 type: string
 *                 description: School supervisor user ID
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of student IDs to assign
 *     responses:
 *       200:
 *         description: Students successfully assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 assignedStudents:
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
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - only admin can assign supervisors
 *       404:
 *         description: Supervisor or student not found
 *
 * /api/supervisors/industry/{supervisorId}/students:
 *   get:
 *     tags: [Supervisors]
 *     summary: Get all students assigned to an industry supervisor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: supervisorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of assigned students
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 students:
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
 *         description: Forbidden - only admin or the supervisor themselves can view
 *       404:
 *         description: Supervisor not found
 *
 * /api/supervisors/assignments/school/random:
 *   post:
 *     tags: [Supervisors]
 *     summary: Randomly assign students to school supervisors
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               departmentFilter:
 *                 type: string
 *                 description: Optional department to filter students by
 *     responses:
 *       200:
 *         description: Students successfully assigned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 assignmentSummary:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       supervisorId:
 *                         type: string
 *                       supervisorName:
 *                         type: string
 *                       assignedStudentCount:
 *                         type: number
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden - only admin can assign supervisors
 *       404:
 *         description: No eligible supervisors or students found
 */

// Assign students to an industry supervisor
router.post(
  '/assignments/industry',
  authenticateJWT,
  requireRole(Role.Admin),
  [
    body('supervisorId').isString(),
    body('studentIds').isArray().notEmpty(),
    body('studentIds.*').isString(),
  ],
  catchAsync(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { supervisorId, studentIds } = req.body;

    // Verify supervisor exists and has correct role
    const supervisor = await prisma.user.findUnique({
      where: { id: supervisorId, role: Role.IndustrySupervisor },
    });

    if (!supervisor) {
      return res.status(404).json({ error: 'Industry supervisor not found' });
    }

    // Update each student's industry supervisor
    const updatedStudents: { id: string; name: string; matricNumber: string }[] = [];
    for (const studentId of studentIds) {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student) {
        continue; // Skip non-existent students
      }

      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: { industrySupervisorId: supervisorId },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      updatedStudents.push({
        id: updatedStudent.id,
        name: updatedStudent.user.name,
        matricNumber: updatedStudent.matricNumber,
      });
    }

    res.json({
      message: `${updatedStudents.length} students assigned to industry supervisor ${supervisor.name}`,
      assignedStudents: updatedStudents,
    });
  }),
);

// Assign students to a school supervisor
router.post(
  '/assignments/school',
  authenticateJWT,
  requireRole(Role.Admin),
  [
    body('supervisorId').isString(),
    body('studentIds').isArray().notEmpty(),
    body('studentIds.*').isString(),
  ],
  catchAsync(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { supervisorId, studentIds } = req.body;

    // Verify supervisor exists and has correct role
    const supervisor = await prisma.user.findUnique({
      where: { id: supervisorId, role: Role.SchoolSupervisor },
    });

    if (!supervisor) {
      return res.status(404).json({ error: 'School supervisor not found' });
    }

    // Update each student's school supervisor
    const updatedStudents: { id: string; name: string; matricNumber: string }[] = [];
    for (const studentId of studentIds) {
      const student = await prisma.student.findUnique({ where: { id: studentId } });
      if (!student) {
        continue; // Skip non-existent students
      }

      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: { schoolSupervisorId: supervisorId },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      updatedStudents.push({
        id: updatedStudent.id,
        name: updatedStudent.user.name,
        matricNumber: updatedStudent.matricNumber,
      });
    }

    res.json({
      message: `${updatedStudents.length} students assigned to school supervisor ${supervisor.name}`,
      assignedStudents: updatedStudents,
    });
  }),
);

// Get the students assigned to an school supervisor
router.get(
  '/assignments/school/:supervisorId/students',
  authenticateJWT,
  requireRole(Role.Admin, Role.SchoolSupervisor),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { supervisorId } = req.params;

    // Verify supervisor exists and has correct role
    const supervisor = await prisma.user.findUnique({
      where: { id: supervisorId, role: Role.SchoolSupervisor },
      select: {
        id: true,
        name: true,
      },
    });

    if (!supervisor) {
      return res.status(404).json({ error: 'School supervisor not found' });
    }

    // Get students assigned to this school supervisor
    const students = await prisma.student.findMany({
      where: { schoolSupervisorId: supervisorId },
      include: {
        user: {
          select: {
            name: true,
            student: {
              select: {
                matricNumber: true,
                department: true,
              },
            },
          },
        },
      },
    });

    res.json({
      students: students.map(student => ({
        id: student.id,
        name: student.user.name,
        matricNumber: student?.user?.student?.matricNumber,
        department: student?.user?.student?.department,
      })),
    });
  }),
);

// Randomly assign students to school supervisors
router.post(
  '/assignments/school/random',
  authenticateJWT,
  requireRole(Role.Admin),
  [body('departmentFilter').optional().isString()],
  catchAsync(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { departmentFilter } = req.body;

    // Get all school supervisors
    const schoolSupervisors = await prisma.user.findMany({
      where: { role: Role.SchoolSupervisor },
      select: {
        id: true,
        name: true,
        schoolStudents: {
          select: {
            id: true,
          },
        },
      },
    });

    if (schoolSupervisors.length === 0) {
      return res.status(404).json({ error: 'No school supervisors found' });
    }

    // Get students without school supervisors
    const studentFilter: any = { schoolSupervisorId: null };
    if (departmentFilter) {
      studentFilter.department = departmentFilter;
    }

    const studentsWithoutSupervisors = await prisma.student.findMany({
      where: studentFilter,
      select: {
        id: true,
        matricNumber: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (studentsWithoutSupervisors.length === 0) {
      return res.status(404).json({
        error: 'No students found without school supervisors',
        message: 'All eligible students already have school supervisors assigned',
      });
    }

    // Shuffle students to ensure random distribution
    const shuffledStudents = [...studentsWithoutSupervisors].sort(() => Math.random() - 0.5);

    // Calculate optimal distribution - how many students per supervisor
    const idealStudentsPerSupervisor = Math.ceil(
      shuffledStudents.length / schoolSupervisors.length,
    );

    // Track assignments for summary
    const assignmentSummary: {
      supervisorId: string;
      supervisorName: string;
      assignedStudentCount: number;
    }[] = schoolSupervisors.map(supervisor => ({
      supervisorId: supervisor.id,
      supervisorName: supervisor.name,
      assignedStudentCount: 0,
    }));

    // Assign students to supervisors in a balanced way
    let studentIndex = 0;
    let totalAssigned = 0;

    for (let i = 0; i < schoolSupervisors.length && studentIndex < shuffledStudents.length; i++) {
      const supervisor = schoolSupervisors[i];
      const currentAssignmentCount = supervisor.schoolStudents.length;
      const targetAssignmentCount = Math.min(
        idealStudentsPerSupervisor,
        shuffledStudents.length - totalAssigned,
      );

      // How many more students to assign to this supervisor
      const assignmentCount = Math.max(0, targetAssignmentCount - currentAssignmentCount);

      // Assign students to this supervisor
      for (let j = 0; j < assignmentCount && studentIndex < shuffledStudents.length; j++) {
        const student = shuffledStudents[studentIndex++];
        await prisma.student.update({
          where: { id: student.id },
          data: { schoolSupervisorId: supervisor.id },
        });
        // Update assignment summary
        const summaryIndex = assignmentSummary.findIndex(s => s.supervisorId === supervisor.id);
        if (summaryIndex !== -1) {
          assignmentSummary[summaryIndex].assignedStudentCount++;
        }

        totalAssigned++;
      }
    }

    res.json({
      message: `${totalAssigned} students randomly assigned to ${schoolSupervisors.length} school supervisors`,
      assignmentSummary: assignmentSummary,
    });
  }),
);

// Get all student assignments
router.get(
  '/assignments',
  authenticateJWT,
  requireRole(Role.Admin),
  catchAsync(async (req: AuthRequest, res: Response) => {
    // Get all students with their assigned supervisors
    const students = await prisma.student.findMany({
      include: {
        industrySupervisor: {
          select: {
            id: true,
            name: true,
          },
        },
        schoolSupervisor: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    res.json({
      students: students.map(student => ({
        id: student.id,
        name: student.user.name,
        matricNumber: student.matricNumber,
        industrySupervisorId: student.industrySupervisor?.id || null,
        industrySupervisorName: student.industrySupervisor?.name || null,
        schoolSupervisorId: student.schoolSupervisor?.id || null,
        schoolSupervisorName: student.schoolSupervisor?.name || null,
      })),
    });
  }),
);

export default router;
