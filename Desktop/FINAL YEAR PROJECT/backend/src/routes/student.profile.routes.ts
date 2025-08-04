import { Router, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { authenticateJWT, requireRole, AuthRequest } from '../middleware/auth';
import catchAsync from '../utils/catchAsync';
import { checkStudentAccessPermission } from '../middleware/supervisor';

const router = Router();
const prisma = new PrismaClient();

/**
 * @openapi
 * /api/students/{studentId}/profile:
 *   get:
 *     tags: [Users]
 *     summary: View student profile
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
 *         description: Student profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     name:
 *                       type: string
 *                     imageUrl:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 */

// View student profile
router.get(
  '/:studentId/profile',
  authenticateJWT,
  requireRole(Role.Student, Role.SchoolSupervisor, Role.IndustrySupervisor, Role.Admin),
  (req: AuthRequest, res: Response, next: () => void) =>
    checkStudentAccessPermission(req, res, next),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { studentId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        email: true,
        name: true,
        imageUrl: true,
        createdAt: true,
        student: {
          select: {
            matricNumber: true,
            department: true,
            profile: true,
          },
        },
      },
    });
    if (!user || !user.student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    res.json({ profile: user });
  }),
);

export default router;
