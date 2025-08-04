import { Router, Response } from 'express';
import { PrismaClient, Role, ReviewStatus } from '@prisma/client';
import { body, validationResult, query } from 'express-validator';
import { authenticateJWT, requireRole, AuthRequest } from '../middleware/auth';
import catchAsync from '../utils/catchAsync';
import { logger } from '@/app';

const router = Router();
const prisma = new PrismaClient();

/**
 * @openapi
 * /api/logbook/review/{entryId}:
 *   post:
 *     tags: [Logbook Review]
 *     summary: Review a logbook entry (Industry Supervisor only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reviewStatus]
 *             properties:
 *               reviewStatus:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               reviewComments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logbook entry reviewed successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Not authorized to review this entry
 *       404:
 *         description: Logbook entry not found
 *       409:
 *         description: Entry already reviewed or not submitted
 */
router.post(
  '/review/:entryId',
  authenticateJWT,
  requireRole(Role.IndustrySupervisor),
  [
    body('reviewStatus')
      .isIn(['APPROVED', 'REJECTED'])
      .withMessage('Review status must be APPROVED or REJECTED'),
    body('reviewComments').optional().isString().withMessage('Review comments must be a string'),
  ],
  catchAsync(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { entryId } = req.params;
    const { reviewStatus, reviewComments } = req.body;
    const supervisorId = req.user!.id;

    // Get the logbook entry with student info
    const entry = await prisma.logbookEntry.findUnique({
      where: { id: entryId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!entry) {
      return res.status(404).json({ error: 'Logbook entry not found' });
    }

    // Verify the supervisor has access to this student
    const student = await prisma.student.findFirst({
      where: {
        id: entry.studentId,
        industrySupervisorId: supervisorId,
      },
    });

    if (!student) {
      return res.status(403).json({
        error: 'Not authorized to review this logbook entry',
      });
    }

    // Check if entry is submitted
    if (!entry.submitted) {
      return res.status(409).json({
        error: 'Cannot review an unsubmitted logbook entry',
      });
    }

    // Check if already reviewed
    if (entry.reviewStatus) {
      return res.status(409).json({
        error: 'This logbook entry has already been reviewed',
      });
    }

    // Update the logbook entry with review
    const reviewedEntry = await prisma.logbookEntry.update({
      where: { id: entryId },
      data: {
        reviewStatus: reviewStatus as ReviewStatus,
        reviewComments,
        reviewedBy: supervisorId,
        reviewedAt: new Date(),
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: entry.student.user.id,
        title: `Logbook Entry ${reviewStatus}`,
        message: `Your logbook entry for ${new Date(entry.date).toLocaleDateString()} has been ${reviewStatus.toLowerCase()}.${reviewComments ? ` Comment: ${reviewComments}` : ''}`,
        type: reviewStatus === 'APPROVED' ? 'SUCCESS' : 'WARNING',
        isSystemGenerated: true,
      },
    });

    logger.info(
      `Logbook entry ${entryId} ${reviewStatus} by supervisor ${supervisorId} for student ${entry.student.user.name}`,
    );

    res.json({
      message: 'Logbook entry reviewed successfully',
      entry: reviewedEntry,
    });
  }),
);

/**
 * @openapi
 * /api/logbook/pending-reviews:
 *   get:
 *     tags: [Logbook Review]
 *     summary: Get all pending logbook entries for review
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Pending reviews retrieved successfully
 */
router.get(
  '/pending-reviews',
  authenticateJWT,
  requireRole(Role.IndustrySupervisor),
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  catchAsync(async (req: AuthRequest, res: Response) => {
    const supervisorId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    // Get all students assigned to this supervisor
    const supervisorStudents = await prisma.student.findMany({
      where: {
        industrySupervisorId: supervisorId,
      },
      select: {
        id: true,
      },
    });

    const studentIds = supervisorStudents.map(s => s.id);

    // Get pending logbook entries
    const pendingEntries = await prisma.logbookEntry.findMany({
      where: {
        studentId: {
          in: studentIds,
        },
        submitted: true,
        reviewStatus: null, // Not yet reviewed
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // Oldest first for fairness
      },
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.logbookEntry.count({
      where: {
        studentId: {
          in: studentIds,
        },
        submitted: true,
        reviewStatus: null,
      },
    });

    // Add full image URLs
    const entriesWithImageUrls = pendingEntries.map(entry => ({
      ...entry,
      imageUrl: entry.imageUrl ? `${req.protocol}://${req.get('host')}${entry.imageUrl}` : null,
    }));

    res.json({
      entries: entriesWithImageUrls,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  }),
);

/**
 * @openapi
 * /api/logbook/reviewed:
 *   get:
 *     tags: [Logbook Review]
 *     summary: Get all reviewed logbook entries by supervisor
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [APPROVED, REJECTED]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Reviewed entries retrieved successfully
 */
router.get(
  '/reviewed',
  authenticateJWT,
  requireRole(Role.IndustrySupervisor),
  [
    query('status').optional().isIn(['APPROVED', 'REJECTED']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  catchAsync(async (req: AuthRequest, res: Response) => {
    const supervisorId = req.user!.id;
    const status = req.query.status as ReviewStatus | undefined;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const whereClause: any = {
      reviewedBy: supervisorId,
      reviewStatus: {
        not: null,
      },
    };

    if (status) {
      whereClause.reviewStatus = status;
    }

    const reviewedEntries = await prisma.logbookEntry.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        reviewedAt: 'desc',
      },
      skip: offset,
      take: limit,
    });

    const totalCount = await prisma.logbookEntry.count({
      where: whereClause,
    });

    // Add full image URLs
    const entriesWithImageUrls = reviewedEntries.map(entry => ({
      ...entry,
      imageUrl: entry.imageUrl ? `${req.protocol}://${req.get('host')}${entry.imageUrl}` : null,
    }));

    res.json({
      entries: entriesWithImageUrls,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  }),
);

/**
 * @openapi
 * /api/logbook/review/stats:
 *   get:
 *     tags: [Logbook Review]
 *     summary: Get review statistics for supervisor
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Review statistics retrieved successfully
 */
router.get(
  '/review/stats',
  authenticateJWT,
  requireRole(Role.IndustrySupervisor),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const supervisorId = req.user!.id;

    // Get all students assigned to this supervisor
    const supervisorStudents = await prisma.student.findMany({
      where: {
        industrySupervisorId: supervisorId,
      },
      select: {
        id: true,
      },
    });

    const studentIds = supervisorStudents.map(s => s.id);

    // Get counts for different statuses
    const [totalSubmitted, pendingReviews, approvedEntries, rejectedEntries] = await Promise.all([
      prisma.logbookEntry.count({
        where: {
          studentId: { in: studentIds },
          submitted: true,
        },
      }),
      prisma.logbookEntry.count({
        where: {
          studentId: { in: studentIds },
          submitted: true,
          reviewStatus: null,
        },
      }),
      prisma.logbookEntry.count({
        where: {
          reviewedBy: supervisorId,
          reviewStatus: 'APPROVED',
        },
      }),
      prisma.logbookEntry.count({
        where: {
          reviewedBy: supervisorId,
          reviewStatus: 'REJECTED',
        },
      }),
    ]);

    const totalReviewed = approvedEntries + rejectedEntries;
    const reviewProgress = totalSubmitted > 0 ? (totalReviewed / totalSubmitted) * 100 : 0;

    res.json({
      totalSubmitted,
      pendingReviews,
      approvedEntries,
      rejectedEntries,
      totalReviewed,
      reviewProgress: parseFloat(reviewProgress.toFixed(2)),
    });
  }),
);

export default router;
