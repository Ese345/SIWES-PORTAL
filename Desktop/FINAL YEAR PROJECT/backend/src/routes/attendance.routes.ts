import { Router, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { body, validationResult, query } from 'express-validator';
import { authenticateJWT, requireRole, AuthRequest } from '../middleware/auth';
import catchAsync from '../utils/catchAsync';
import { logger } from '@/app';

const router = Router();
const prisma = new PrismaClient();

/**
 * @openapi
 * /api/attendance:
 *   post:
 *     tags: [Attendance]
 *     summary: Mark attendance for a student (Industry Supervisor only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, date, present]
 *             properties:
 *               studentId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               present:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not authorized to mark attendance for this student
 *       409:
 *         description: Attendance already marked for this date
 */
router.post(
  '/',
  authenticateJWT,
  requireRole(Role.IndustrySupervisor),
  [
    body('studentId').isUUID().withMessage('Valid student ID required'),
    body('date').isISO8601().withMessage('Valid date required'),
    body('present').isBoolean().withMessage('Present status required'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
  ],
  catchAsync(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { studentId, date, present, notes } = req.body;
    const supervisorId = req.user!.userId;

    // Verify the student is assigned to this supervisor
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        industrySupervisorId: supervisorId,
      },
      include: {
        user: true,
      },
    });

    if (!student) {
      return res.status(403).json({
        error: 'Not authorized to mark attendance for this student',
      });
    }

    // Check if attendance already exists for this date
    const existingAttendance = await prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId,
          date: new Date(date),
        },
      },
    });

    if (existingAttendance) {
      return res.status(409).json({
        error: 'Attendance already marked for this date',
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        supervisorId,
        date: new Date(date),
        present,
        notes,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    logger.info(
      `Attendance marked for student ${student.user.name} on ${date}: ${present ? 'Present' : 'Absent'}`,
    );

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance,
    });
  }),
);

/**
 * @openapi
 * /api/attendance/{studentId}:
 *   get:
 *     tags: [Attendance]
 *     summary: Get attendance records for a student
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by month (YYYY-MM format)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
 */
router.get(
  '/:studentId',
  authenticateJWT,
  requireRole(Role.IndustrySupervisor, Role.SchoolSupervisor, Role.Student, Role.Admin),
  [query('month').optional().isString(), query('limit').optional().isInt({ min: 1, max: 100 })],
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { studentId } = req.params;
    const { month, limit = 50 } = req.query;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Verify access permissions
    if (userRole === Role.Student && studentId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (userRole === Role.IndustrySupervisor) {
      const student = await prisma.student.findFirst({
        where: {
          id: studentId,
          industrySupervisorId: userId,
        },
      });
      if (!student) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    if (userRole === Role.SchoolSupervisor) {
      const student = await prisma.student.findFirst({
        where: {
          id: studentId,
          schoolSupervisorId: userId,
        },
      });
      if (!student) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Build date filter
    let dateFilter = {};
    if (month) {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const attendance = await prisma.attendance.findMany({
      where: {
        studentId,
        ...dateFilter,
      },
      include: {
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: parseInt(limit as string),
    });

    // Calculate statistics
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.present).length;
    const absentDays = totalDays - presentDays;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    res.json({
      attendance,
      statistics: {
        totalDays,
        presentDays,
        absentDays,
        attendanceRate: parseFloat(attendanceRate.toFixed(2)),
      },
    });
  }),
);

/**
 * @openapi
 * /api/attendance/{attendanceId}:
 *   patch:
 *     tags: [Attendance]
 *     summary: Update attendance record
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attendanceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               present:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attendance updated successfully
 *       404:
 *         description: Attendance record not found
 *       403:
 *         description: Not authorized to update this record
 */
router.patch(
  '/:attendanceId',
  authenticateJWT,
  requireRole(Role.IndustrySupervisor),
  [body('present').optional().isBoolean(), body('notes').optional().isString()],
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { attendanceId } = req.params;
    const { present, notes } = req.body;
    const supervisorId = req.user!.id;

    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    if (attendance.supervisorId !== supervisorId) {
      return res.status(403).json({
        error: 'Not authorized to update this attendance record',
      });
    }

    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        ...(present !== undefined && { present }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    res.json({
      message: 'Attendance updated successfully',
      attendance: updatedAttendance,
    });
  }),
);

/**
 * @openapi
 * /api/attendance/supervisor/students:
 *   get:
 *     tags: [Attendance]
 *     summary: Get all students and their attendance summary for supervisor
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Students attendance summary retrieved successfully
 */
router.get(
  '/supervisor/students',
  authenticateJWT,
  requireRole(Role.IndustrySupervisor),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const supervisorId = req.user!.userId;

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
        attendance: {
          orderBy: {
            date: 'desc',
          },
          take: 30, // Last 30 attendance records
        },
      },
    });

    const studentsWithStats = students.map(student => {
      const totalDays = student.attendance.length;
      const presentDays = student.attendance.filter(a => a.present).length;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      const lastAttendance = student.attendance[0] || null;

      return {
        id: student.id,
        matricNumber: student.matricNumber,
        department: student.department,
        user: student.user,
        attendanceStats: {
          totalDays,
          presentDays,
          absentDays: totalDays - presentDays,
          attendanceRate: parseFloat(attendanceRate.toFixed(2)),
          lastAttendance,
        },
      };
    });

    res.json({
      students: studentsWithStats,
    });
  }),
);

export default router;
