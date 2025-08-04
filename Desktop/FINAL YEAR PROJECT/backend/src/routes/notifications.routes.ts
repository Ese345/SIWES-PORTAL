import { Router, Response } from 'express';
import { PrismaClient, Role, NotificationType, RecipientType } from '@prisma/client';
import { body, query, validationResult } from 'express-validator';
import { authenticateJWT, requireRole, AuthRequest } from '../middleware/auth';
import catchAsync from '../utils/catchAsync';

const router = Router();
const prisma = new PrismaClient();

/**
 * @openapi
 * /api/admin/notifications:
 *   post:
 *     tags: [Admin Notifications]
 *     summary: Create a new notification (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, message, type, recipientType]
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *               type:
 *                 type: string
 *                 enum: [INFO, SUCCESS, WARNING, ERROR]
 *               recipientType:
 *                 type: string
 *                 enum: [ALL, ROLE, INDIVIDUAL]
 *               recipientRole:
 *                 type: string
 *                 enum: [Student, SchoolSupervisor, IndustrySupervisor, Admin]
 *               recipientId:
 *                 type: string
 *               actionUrl:
 *                 type: string
 *               actionText:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - Admin access required
 */

// Admin: Create notification
router.post(
  '/admin/notifications',
  authenticateJWT,
  requireRole(Role.Admin),
  [
    body('title')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('Title is required (max 200 chars)'),
    body('message')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message is required (max 1000 chars)'),
    body('type')
      .isIn(['INFO', 'SUCCESS', 'WARNING', 'ERROR'])
      .withMessage('Invalid notification type'),
    body('recipientType').isIn(['ALL', 'ROLE', 'INDIVIDUAL']).withMessage('Invalid recipient type'),
    body('recipientRole')
      .optional()
      .isIn(['Student', 'SchoolSupervisor', 'IndustrySupervisor', 'Admin']),
    body('recipientId').optional().isString(),
    body('actionUrl').optional().isURL().withMessage('Invalid URL format'),
    body('actionText')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Action text too long (max 50 chars)'),
  ],
  catchAsync(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      message,
      type,
      recipientType,
      recipientRole,
      recipientId,
      actionUrl,
      actionText,
    } = req.body;

    // Validate recipient parameters
    if (recipientType === 'ROLE' && !recipientRole) {
      return res
        .status(400)
        .json({ error: 'recipientRole is required when recipientType is ROLE' });
    }
    if (recipientType === 'INDIVIDUAL' && !recipientId) {
      return res
        .status(400)
        .json({ error: 'recipientId is required when recipientType is INDIVIDUAL' });
    }

    // Validate individual recipient exists
    if (recipientType === 'INDIVIDUAL') {
      const user = await prisma.user.findUnique({
        where: { id: recipientId },
        select: { id: true, isActive: true },
      });
      if (!user) {
        return res.status(400).json({ error: 'Recipient user not found' });
      }
      if (!user.isActive) {
        return res.status(400).json({ error: 'Cannot send notification to inactive user' });
      }
    }

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: type as NotificationType,
        recipientType: recipientType as RecipientType,
        recipientRole: recipientRole as Role,
        actionUrl,
        actionText,
        createdBy: req.user!.userId,
        isSystemGenerated: false,
      },
    });

    // Create UserNotification records based on recipient type
    let targetUsers: string[] = [];

    switch (recipientType) {
      case 'ALL':
        const allUsers = await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true },
        });
        targetUsers = allUsers.map(user => user.id);
        break;

      case 'ROLE':
        const roleUsers = await prisma.user.findMany({
          where: {
            role: recipientRole as Role,
            isActive: true,
          },
          select: { id: true },
        });
        targetUsers = roleUsers.map(user => user.id);
        break;

      case 'INDIVIDUAL':
        targetUsers = [recipientId];
        break;
    }

    // Create UserNotification records in batches for better performance
    if (targetUsers.length > 0) {
      await prisma.userNotification.createMany({
        data: targetUsers.map(userId => ({
          userId,
          notificationId: notification.id,
        })),
      });
    }

    // Include count in response
    const notificationWithCount = await prisma.notification.findUnique({
      where: { id: notification.id },
      include: {
        _count: {
          select: { userNotifications: true },
        },
      },
    });

    res.status(201).json({
      notification: notificationWithCount,
      recipientCount: targetUsers.length,
    });
  }),
);

/**
 * @openapi
 * /api/admin/notifications:
 *   get:
 *     tags: [Admin Notifications]
 *     summary: List all notifications with filtering (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INFO, SUCCESS, WARNING, ERROR]
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of notifications with pagination
 */

// Admin: List all notifications
router.get(
  '/admin/notifications',
  authenticateJWT,
  requireRole(Role.Admin),
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('type').optional().isIn(['INFO', 'SUCCESS', 'WARNING', 'ERROR']),
    query('active').optional().isBoolean().toBoolean(),
    query('search').optional().trim(),
  ],
  catchAsync(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const skip = (page - 1) * limit;

    const { type, active, search } = req.query;

    // Build where clause
    const where: any = {
      isSystemGenerated: false, // Only admin-created notifications
    };

    if (type) where.type = type;
    if (active !== undefined) where.isActive = active;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { message: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { userNotifications: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        limit,
      },
    });
  }),
);

/**
 * @openapi
 * /api/admin/notifications/stats:
 *   get:
 *     tags: [Admin Notifications]
 *     summary: Get notification statistics (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics
 */

// Admin: Get notification stats
router.get(
  '/admin/notifications/stats',
  authenticateJWT,
  requireRole(Role.Admin),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const [totalStats, typeStats, recipientStats] = await Promise.all([
      prisma.notification.aggregate({
        where: { isSystemGenerated: false },
        _count: { id: true },
      }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { isSystemGenerated: false },
        _count: { id: true },
      }),
      prisma.notification.groupBy({
        by: ['recipientType'],
        where: { isSystemGenerated: false },
        _count: { id: true },
      }),
    ]);

    const activeCount = await prisma.notification.count({
      where: { isSystemGenerated: false, isActive: true },
    });

    const stats = {
      total: totalStats._count.id,
      active: activeCount,
      byType: typeStats.reduce(
        (acc, item) => {
          acc[item.type] = item._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
      byRecipientType: recipientStats.reduce(
        (acc, item) => {
          acc[item.recipientType || 'UNKNOWN'] = item._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

    res.json(stats);
  }),
);

/**
 * @openapi
 * /api/admin/notifications/{id}:
 *   delete:
 *     tags: [Admin Notifications]
 *     summary: Delete a notification (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 */

// Admin: Delete notification
router.delete(
  '/admin/notifications/:id',
  authenticateJWT,
  requireRole(Role.Admin),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { id: true, isSystemGenerated: true },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.isSystemGenerated) {
      return res.status(400).json({ error: 'Cannot delete system-generated notifications' });
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({ message: 'Notification deleted successfully' });
  }),
);

/**
 * @openapi
 * /api/admin/notifications/{id}/toggle:
 *   patch:
 *     tags: [Admin Notifications]
 *     summary: Toggle notification active status (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification status toggled successfully
 *       404:
 *         description: Notification not found
 */

// Admin: Toggle notification status
router.patch(
  '/admin/notifications/:id/toggle',
  authenticateJWT,
  requireRole(Role.Admin),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { id: true, isActive: true, isSystemGenerated: true },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.isSystemGenerated) {
      return res.status(400).json({ error: 'Cannot modify system-generated notifications' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isActive: !notification.isActive },
      include: {
        _count: {
          select: { userNotifications: true },
        },
      },
    });

    res.json({ notification: updated });
  }),
);

// User: Get personal notifications
router.get(
  '/notifications',
  authenticateJWT,
  catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const skip = (page - 1) * limit;

    const [userNotifications, total] = await Promise.all([
      prisma.userNotification.findMany({
        where: {
          userId,
          notification: { isActive: true },
        },
        include: {
          notification: {
            select: {
              id: true,
              title: true,
              message: true,
              type: true,
              actionUrl: true,
              actionText: true,
              createdAt: true,
            },
          },
        },
        orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.userNotification.count({
        where: {
          userId,
          notification: { isActive: true },
        },
      }),
    ]);

    const notifications = userNotifications.map(un => ({
      notificationId: un.notificationId,
      read: un.read,
      readAt: un.readAt,
      ...un.notification,
    }));

    res.json({
      notifications,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        limit,
      },
    });
  }),
);

// User: Mark notification as read
router.patch(
  '/notifications/:id/read',
  authenticateJWT,
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.userId;

    const userNotification = await prisma.userNotification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!userNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updated = await prisma.userNotification.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
      include: {
        notification: true,
      },
    });

    res.json({ notification: updated });
  }),
);

// User: Mark all notifications as read
router.patch(
  '/notifications/mark-all-read',
  authenticateJWT,
  catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;

    await prisma.userNotification.updateMany({
      where: {
        userId,
        read: false,
        notification: { isActive: true },
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    res.json({ message: 'All notifications marked as read' });
  }),
);

// Enhanced utility functions for system notifications
export async function createSystemNotification(
  title: string,
  message: string,
  userId: string,
  type: NotificationType = 'INFO',
  actionUrl?: string,
  actionText?: string,
) {
  try {
    // Create notification
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        recipientType: 'INDIVIDUAL',
        actionUrl,
        actionText,
        isSystemGenerated: true,
      },
    });

    // Create user notification
    await prisma.userNotification.create({
      data: {
        userId,
        notificationId: notification.id,
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating system notification:', error);
  }
}

// Updated utility functions
export async function notifyLogbookSubmitted(studentId: string, logbookTitle: string) {
  await createSystemNotification(
    'Logbook Entry Submitted',
    `Your logbook entry "${logbookTitle}" has been submitted successfully.`,
    studentId,
    'SUCCESS',
  );
}

export async function notifyLogbookReviewed(
  studentId: string,
  logbookTitle: string,
  status: 'approved' | 'rejected',
  reviewComment?: string,
) {
  const message =
    status === 'approved'
      ? `Your logbook entry "${logbookTitle}" has been approved.`
      : `Your logbook entry "${logbookTitle}" has been rejected.${reviewComment ? ` Reason: ${reviewComment}` : ''}`;

  await createSystemNotification(
    'Logbook Entry Reviewed',
    message,
    studentId,
    status === 'approved' ? 'SUCCESS' : 'WARNING',
  );
}

export async function notifyAttendanceMarked(studentId: string, present: boolean, date: Date) {
  await createSystemNotification(
    'Attendance Updated',
    `Your attendance for ${date.toDateString()} has been marked as ${present ? 'present' : 'absent'}.`,
    studentId,
    present ? 'SUCCESS' : 'WARNING',
  );
}

export default router;
