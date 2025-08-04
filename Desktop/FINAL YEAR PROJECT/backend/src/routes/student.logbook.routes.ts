import { Router, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateJWT, requireRole, AuthRequest } from '../middleware/auth';
import catchAsync from '../utils/catchAsync';
import { notifyLogbookSubmitted } from './notifications.routes';
import {
  checkStudentAccessPermission,
  checkIndustrySupervisorExists,
} from '../middleware/supervisor';
import { logger } from '@/app';

const router = Router();
const prisma = new PrismaClient();

// Multer setup for image upload
const uploadDir = path.join(__dirname, '../../uploads/logbook');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Middleware for access control and validation is imported from supervisor.ts

/**
 * @openapi
 * /api/students/{studentId}/logbook:
 *   post:
 *     tags: [Logbook]
 *     summary: Create a logbook entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [date, description]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Logbook entry created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entry:
 *                   $ref: '#/components/schemas/LogbookEntry'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Entry for this date already exists
 *
 *   get:
 *     tags: [Logbook]
 *     summary: View all logbook entries for a student
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
 *         description: List of logbook entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LogbookEntry'
 *
 * /api/students/{studentId}/logbook/{entryId}:
 *   patch:
 *     tags: [Logbook]
 *     summary: Edit a logbook entry (description/image)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logbook entry updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entry:
 *                   $ref: '#/components/schemas/LogbookEntry'
 *       404:
 *         description: Logbook entry not found
 *       409:
 *         description: Cannot edit a submitted entry or after attendance is marked
 *
 * /api/students/{studentId}/logbook/{entryId}/submit:
 *   patch:
 *     tags: [Logbook]
 *     summary: Submit a logbook entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Logbook entry submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entry:
 *                   $ref: '#/components/schemas/LogbookEntry'
 *       404:
 *         description: Logbook entry not found
 *       409:
 *         description: Entry already submitted
 */

// Create a logbook entry (with optional image upload)
router.post(
  '/:studentId/logbook',
  authenticateJWT,
  requireRole(Role.Student),
  (req: AuthRequest, res: Response, next: () => void) =>
    checkStudentAccessPermission(req, res, next),
  checkIndustrySupervisorExists,
  upload.single('image'),
  [body('date').isISO8601(), body('description').isString().isLength({ min: 5 })],
  catchAsync(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { date, description } = req.body;
    const { studentId } = req.params;
    // Only allow one entry per date per student
    const existing = await prisma.logbookEntry.findFirst({
      where: { studentId, date: new Date(date) },
    });
    if (existing) {
      return res.status(409).json({ error: 'Entry for this date already exists' });
    }
    let imageUrl: string | null = null;
    if (req.file) {
      imageUrl = `/uploads/logbook/${req.file.filename}`;
    }
    const entry = await prisma.logbookEntry.create({
      data: {
        studentId,
        date: new Date(date),
        description,
        imageUrl,
      },
    });
    res.status(201).json({ entry });
  }),
);

// Edit a logbook entry (description/image) - UPDATE THIS ROUTE
router.patch(
  '/:studentId/logbook/:entryId',
  authenticateJWT,
  requireRole(Role.Student),
  (req: AuthRequest, res: Response, next: () => void) =>
    checkStudentAccessPermission(req, res, next),
  upload.single('image'),
  [body('description').optional().isString().isLength({ min: 5 })],
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { studentId, entryId } = req.params;
    const entry = await prisma.logbookEntry.findUnique({ where: { id: entryId } });
    if (!entry || entry.studentId !== studentId) {
      return res.status(404).json({ error: 'Logbook entry not found' });
    }
    if (entry.submitted) {
      return res.status(409).json({ error: 'Cannot edit a submitted entry' });
    }

    // NEW: Check if entry has been reviewed
    if (entry.reviewStatus) {
      return res.status(409).json({
        error: 'Cannot edit a logbook entry that has been reviewed',
      });
    }

    // Prevent edit if attendance exists for this student and date
    const attendance = await prisma.attendance.findUnique({
      where: {
        studentId_date: {
          studentId,
          date: entry.date,
        },
      },
    });
    if (attendance) {
      return res.status(409).json({
        error: 'Cannot edit logbook entry after attendance has been marked for this date.',
      });
    }

    // ...rest of existing code...
  }),
);

// Add a new route to get logbook entries with review status
router.get(
  '/:studentId/logbook/with-reviews',
  authenticateJWT,
  requireRole(Role.Student, Role.Admin, Role.IndustrySupervisor, Role.SchoolSupervisor),
  (req: AuthRequest, res: Response, next: () => void) =>
    checkStudentAccessPermission(req, res, next),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { studentId } = req.params;
    const entries = await prisma.logbookEntry.findMany({
      where: { studentId },
      include: {
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    entries.forEach(entry => {
      if (entry.imageUrl) {
        const serverUrl = req.protocol + '://' + req.get('host');
        entry.imageUrl = `${serverUrl}${entry.imageUrl}`;
      }
    });

    res.json({ entries });
  }),
);

// Submit a logbook entry (mark as submitted)
router.patch(
  '/:studentId/logbook/:entryId/submit',
  authenticateJWT,
  requireRole(Role.Student),
  (req: AuthRequest, res: Response, next: () => void) =>
    checkStudentAccessPermission(req, res, next),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { studentId, entryId } = req.params;
    const entry = await prisma.logbookEntry.findUnique({ where: { id: entryId } });
    if (!entry || entry.studentId !== studentId) {
      return res.status(404).json({ error: 'Logbook entry not found' });
    }
    if (entry.submitted) {
      return res.status(409).json({ error: 'Entry already submitted' });
    }
    const updated = await prisma.logbookEntry.update({
      where: { id: entryId },
      data: { submitted: true },
    });
    await notifyLogbookSubmitted(
      studentId,
      `Entry for ${new Date(entry.date).toLocaleDateString()}`,
    );
    res.json({ entry: updated });
  }),
);

// View all logbook entries for a student
router.get(
  '/:studentId/logbook',
  authenticateJWT,
  requireRole(Role.Student, Role.Admin, Role.IndustrySupervisor, Role.SchoolSupervisor),
  (req: AuthRequest, res: Response, next: () => void) =>
    checkStudentAccessPermission(req, res, next),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { studentId } = req.params;
    const entries = await prisma.logbookEntry.findMany({
      where: { studentId },
      orderBy: { date: 'asc' },
    });
    if (!entries) {
      return res.status(404).json({ error: 'No logbook entries found' });
    }

    entries.forEach(entry => {
      if (entry.imageUrl) {
        const serverUrl = req.protocol + '://' + req.get('host');
        entry.imageUrl = `${serverUrl}${entry.imageUrl}`;
      }
    });

    res.json({ entries });
  }),
);

// TO get recent logbook entries for dashboard
/**
 * @openapi
 * /api/students/{studentId}/logbook/recent:
 *  get:
 *   tags: [Logbook]
 *   summary: Get recent logbook entries for a student
 *   security:
 *     - bearerAuth: []
 *   parameters:
 *     - in: path
 *       name: studentId
 *       required: true
 *       description: The ID of the student
 *       schema:
 *         type: string
 *   responses:
 *    200:
 *     description: Recent logbook entries
 *    content:
 *      application/json:
 *        schema:
 *          type: object
 *          properties:
 *            entries:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/LogbookEntry'
 *    404:
 *     description: No logbook entries found
 * */
router.get(
  '/:studentId/logbook/recent',
  authenticateJWT,
  requireRole(Role.Student, Role.Admin, Role.IndustrySupervisor, Role.SchoolSupervisor),
  (req: AuthRequest, res: Response, next: () => void) =>
    checkStudentAccessPermission(req, res, next),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { studentId } = req.params;

    const entries = await prisma.logbookEntry.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 5,
    });
    logger.debug(`Recent logbook entries for student ${studentId}:`, entries);
    // if (!entries) {
    //   return res.status(404).json({ error: 'No logbook entries found' });
    // }

    entries.forEach(entry => {
      if (entry.imageUrl) {
        const serverUrl = req.protocol + '://' + req.get('host');
        entry.imageUrl = `${serverUrl}${entry.imageUrl}`;
      }
    });

    res.json({ entries });
  }),
);

/**
 * @openapi
 * /api/students/{studentId}/logbook/analytics:
 *   get:
 *     tags: [Logbook]
 *     summary: Get analytics data for a student's logbook
 *     description: Returns comprehensive analytics including total entries, submission status, attendance records, and calculated percentages for the student's logbook
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         description: The unique identifier of the student
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEntries:
 *                   type: integer
 *                   description: Total number of logbook entries created by the student
 *                   example: 45
 *                 totalSubmitted:
 *                   type: integer
 *                   description: Number of logbook entries that have been submitted
 *                   example: 38
 *                 totalPending:
 *                   type: integer
 *                   description: Number of logbook entries that are still in draft status
 *                   example: 7
 *                 totalAttendance:
 *                   type: integer
 *                   description: Total number of attendance records for the student
 *                   example: 42
 *                 totalDays:
 *                   type: integer
 *                   description: Total number of days with logbook entries (same as totalEntries)
 *                   example: 45
 *                 attendancePercentage:
 *                   type: number
 *                   format: float
 *                   description: Percentage of days the student was present (present days / total attendance records * 100)
 *                   minimum: 0
 *                   maximum: 100
 *                   example: 95.24
 *             example:
 *               totalEntries: 45
 *               totalSubmitted: 38
 *               totalPending: 7
 *               totalAttendance: 42
 *               totalDays: 45
 *               attendancePercentage: 95.24
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       403:
 *         description: Forbidden - User doesn't have permission to access this student's data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Access denied"
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Student not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.get(
  '/:studentId/logbook/analytics',
  authenticateJWT,
  requireRole(Role.Student, Role.Admin, Role.IndustrySupervisor, Role.SchoolSupervisor),
  (req: AuthRequest, res: Response, next: () => void) =>
    checkStudentAccessPermission(req, res, next),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { studentId } = req.params;
    // Add debugging logs
    logger.debug(`Fetching recent entries for student: ${studentId}`);
    logger.debug(`Authenticated user:`, req.user);
    console.log(`Fetching analytics for student ID: ${studentId}`);

    const totalEntries = await prisma.logbookEntry.count({
      where: { studentId },
    });
    const totalSubmitted = await prisma.logbookEntry.count({
      where: { studentId, submitted: true },
    });
    const totalPending = await prisma.logbookEntry.count({
      where: { studentId, submitted: false },
    });
    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId },
    });
    const totalAttendance = attendanceRecords.length;
    const totalDays = await prisma.logbookEntry.count({
      where: { studentId },
    });

    // Calculate attendance percentage
    const attendancePercentage =
      totalAttendance > 0
        ? (attendanceRecords.filter(a => a.present).length / totalAttendance) * 100
        : 0;

    res.json({
      totalEntries,
      totalSubmitted,
      totalPending,
      totalAttendance,
      totalDays,
      attendancePercentage,
    });
  }),
);

// Get a logbook entry by ID
router.get(
  '/:studentId/logbook/:entryId',
  authenticateJWT,
  requireRole(Role.Student, Role.Admin, Role.IndustrySupervisor, Role.SchoolSupervisor),
  (req: AuthRequest, res: Response, next: () => void) =>
    checkStudentAccessPermission(req, res, next),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { studentId, entryId } = req.params;
    const entry = await prisma.logbookEntry.findUnique({
      where: { id: entryId },
      include: { student: true },
    });
    if (!entry || entry.studentId !== studentId) {
      return res.status(404).json({ error: 'Logbook entry not found' });
    }
    if (entry.imageUrl) {
      const serverUrl = req.protocol + '://' + req.get('host');
      entry.imageUrl = `${serverUrl}${entry.imageUrl}`;
    }
    res.json({ entry });
  }),
);

export default router;
