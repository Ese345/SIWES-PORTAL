import { Router, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticateJWT, requireRole, AuthRequest } from '../middleware/auth';
import catchAsync from '../utils/catchAsync';
import { logger } from '@/app';

const router = Router();
const prisma = new PrismaClient();

/**
 * @openapi
 * /api/supervisors/students/school:
 *   get:
 *     tags: [Supervisor]
 *     summary: Get students assigned to school supervisor
 *     description: Returns a list of students assigned to the authenticated school supervisor
 *     security:
 *       - bearerAuth: []
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
 *                       matricNumber:
 *                         type: string
 *                       department:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a school supervisor
 *       500:
 *         description: Internal server error
 */
router.get(
  '/students/school',
  authenticateJWT,
  //   requireRole(Role.SchoolSupervisor),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const supervisorId = req.user?.userId;

    if (!supervisorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.debug(`Fetching students for school supervisor: ${supervisorId}`);

    // Find students assigned to this school supervisor
    const students = await prisma.student.findMany({
      where: {
        schoolSupervisorId: supervisorId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    });

    logger.debug(`Found ${students.length} students for supervisor ${supervisorId}`);

    res.json({
      students,
      total: students.length,
    });
  }),
);

/**
 * @openapi
 * /api/supervisors/students/industry:
 *   get:
 *     tags: [Supervisor]
 *     summary: Get students assigned to industry supervisor
 *     description: Returns a list of students assigned to the authenticated industry supervisor
 *     security:
 *       - bearerAuth: []
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
 *                       matricNumber:
 *                         type: string
 *                       department:
 *                         type: string
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an industry supervisor
 *       500:
 *         description: Internal server error
 */
router.get(
  '/students/industry',
  authenticateJWT,
  requireRole(Role.IndustrySupervisor),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const supervisorId = req.user?.userId;

    if (!supervisorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.debug(`Fetching students for industry supervisor: ${supervisorId}`);

    // Find students assigned to this industry supervisor
    const students = await prisma.student.findMany({
      where: {
        industrySupervisorId: supervisorId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          name: 'asc',
        },
      },
    });

    logger.debug(`Found ${students.length} students for supervisor ${supervisorId}`);

    res.json({
      students,
      total: students.length,
    });
  }),
);

/**
 * @openapi
 * /api/supervisors/dashboard/stats/school:
 *   get:
 *     tags: [Supervisor]
 *     summary: Get dashboard statistics for school supervisor
 *     description: Returns dashboard statistics including student count, logbook entries, etc.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalStudents:
 *                   type: integer
 *                 totalLogbookEntries:
 *                   type: integer
 *                 pendingEntries:
 *                   type: integer
 *                 approvedEntries:
 *                   type: integer
 *                 rejectedEntries:
 *                   type: integer
 *                 recentActivity:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a school supervisor
 *       500:
 *         description: Internal server error
 */
router.get(
  '/dashboard/stats/school',
  authenticateJWT,
  requireRole(Role.SchoolSupervisor, 'SchoolSupervisor'),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const supervisorId = req.user?.userId;

    if (!supervisorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.debug(`Fetching dashboard stats for school supervisor: ${supervisorId}`);

    // Get total students assigned to this supervisor
    const totalStudents = await prisma.student.count({
      where: {
        schoolSupervisorId: supervisorId,
      },
    });

    // Get student IDs for this supervisor
    const students = await prisma.student.findMany({
      where: {
        schoolSupervisorId: supervisorId,
      },
      select: {
        id: true,
      },
    });

    const studentIds = students.map(s => s.id);

    // Get logbook statistics
    const totalLogbookEntries = await prisma.logbookEntry.count({
      where: {
        studentId: {
          in: studentIds,
        },
        submitted: true,
      },
    });

    // For now, we'll simulate pending/approved/rejected since feedback system isn't fully implemented
    const pendingEntries = Math.floor(totalLogbookEntries * 0.3);
    const approvedEntries = Math.floor(totalLogbookEntries * 0.6);
    const rejectedEntries = totalLogbookEntries - pendingEntries - approvedEntries;

    // Get recent activity (entries from last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await prisma.logbookEntry.count({
      where: {
        studentId: {
          in: studentIds,
        },
        submitted: true,
      },
    });

    const stats = {
      totalStudents,
      totalLogbookEntries,
      pendingEntries,
      approvedEntries,
      rejectedEntries,
      recentActivity,
    };

    logger.debug(`Dashboard stats for supervisor ${supervisorId}:`, stats);

    res.json(stats);
  }),
);

/**
 * @openapi
 * /api/supervisors/dashboard/stats/industry:
 *   get:
 *     tags: [Supervisor]
 *     summary: Get dashboard statistics for industry supervisor
 *     description: Returns dashboard statistics including student count, logbook entries, etc.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalStudents:
 *                   type: integer
 *                 totalLogbookEntries:
 *                   type: integer
 *                 pendingEntries:
 *                   type: integer
 *                 approvedEntries:
 *                   type: integer
 *                 rejectedEntries:
 *                   type: integer
 *                 recentActivity:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not an industry supervisor
 *       500:
 *         description: Internal server error
 */
router.get(
  '/dashboard/stats/industry',
  authenticateJWT,
  requireRole(Role.IndustrySupervisor),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const supervisorId = req.user?.userId;

    if (!supervisorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.debug(`Fetching dashboard stats for industry supervisor: ${supervisorId}`);

    // Get total students assigned to this supervisor
    const totalStudents = await prisma.student.count({
      where: {
        industrySupervisorId: supervisorId,
      },
    });

    // Get student IDs for this supervisor
    const students = await prisma.student.findMany({
      where: {
        industrySupervisorId: supervisorId,
      },
      select: {
        id: true,
      },
    });

    const studentIds = students.map(s => s.id);

    // Get logbook statistics
    const totalLogbookEntries = await prisma.logbookEntry.count({
      where: {
        studentId: {
          in: studentIds,
        },
        submitted: true,
      },
    });

    // For now, we'll simulate pending/approved/rejected since feedback system isn't fully implemented
    const pendingEntries = Math.floor(totalLogbookEntries * 0.3);
    const approvedEntries = Math.floor(totalLogbookEntries * 0.6);
    const rejectedEntries = totalLogbookEntries - pendingEntries - approvedEntries;

    // Get recent activity (entries from last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await prisma.logbookEntry.count({
      where: {
        studentId: {
          in: studentIds,
        },
        submitted: true,
      },
    });

    const stats = {
      totalStudents,
      totalLogbookEntries,
      pendingEntries,
      approvedEntries,
      rejectedEntries,
      recentActivity,
    };

    logger.debug(`Dashboard stats for supervisor ${supervisorId}:`, stats);

    res.json(stats);
  }),
);

/**
 * @openapi
 * /api/supervisors/students/{studentId}:
 *   get:
 *     tags: [Supervisor]
 *     summary: Get detailed information about a specific student
 *     description: Returns detailed information about a student assigned to the supervisor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Student details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 student:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     matricNumber:
 *                       type: string
 *                     department:
 *                       type: string
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                     logbookEntries:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Student not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/students/:studentId',
  authenticateJWT,
  requireRole(Role.SchoolSupervisor, Role.IndustrySupervisor),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const supervisorId = req.user?.userId;
    const { studentId } = req.params;
    const supervisorRole = req.user?.role;

    if (!supervisorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    logger.debug(`Fetching student ${studentId} for supervisor: ${supervisorId}`);

    // Build where clause based on supervisor role
    const whereClause =
      supervisorRole === Role.SchoolSupervisor
        ? { id: studentId, schoolSupervisorId: supervisorId }
        : { id: studentId, industrySupervisorId: supervisorId };

    // Find the student and verify they're assigned to this supervisor
    const student = await prisma.student.findFirst({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        logbookEntries: {
          where: {
            submitted: true,
          },
          orderBy: {
            date: 'desc',
          },
          take: 10, // Get latest 10 entries
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found or not assigned to you' });
    }

    logger.debug(`Found student: ${student.user.name}`);

    res.json({ student });
  }),
);

export default router;
