import { Router, Response } from 'express';
import multer from 'multer';
import { parse } from 'csv';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { authenticateJWT, requireRole, AuthRequest } from '../middleware/auth';
import catchAsync from '@/utils/catchAsync';

const router = Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to generate a random password
function generatePassword(length = 10): string {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

/**
 * @openapi
 * /api/admin/users/upload-csv:
 *   post:
 *     tags: [Admin]
 *     summary: Upload a CSV file to bulk create users
 *     description: Admin can upload a CSV file with user details to create multiple users at once. Returns created users and their temporary credentials.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file containing user data (columns - email, name, role, department, matricNumber)
 *     responses:
 *       200:
 *         description: CSV processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [created, skipped, failed]
 *                       reason:
 *                         type: string
 *                 credentials:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                       password:
 *                         type: string
 *       400:
 *         description: No file uploaded or invalid format
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post(
  '/users/upload-csv',
  authenticateJWT,
  requireRole(Role.Admin),
  upload.single('file'),
  catchAsync(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const results: any[] = [];
    const credentials: any[] = [];
    const parser = parse(req.file.buffer.toString('utf-8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    for await (const record of parser) {
      const { email, name, role, department, matricNumber } = record;
      if (!email || !name || !role) {
        results.push({ email, status: 'failed', reason: 'Missing required fields' });
        continue;
      }
      if (!Object.values(Role).includes(role)) {
        results.push({ email, status: 'failed', reason: 'Invalid role' });
        continue;
      }
      try {
        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          results.push({ email, status: 'skipped', reason: 'Already exists' });
          continue;
        }
        // Generate password
        const password = generatePassword();
        const passwordHash = await bcrypt.hash(password, 10);
        // Create user
        const user = await prisma.user.create({
          data: {
            email,
            name,
            passwordHash,
            role,
            imageUrl: null,
            mustChangePassword: true,
          } as any,
        });
        // If student, create student record
        if (role === Role.Student && department && matricNumber) {
          await prisma.student.create({
            data: {
              id: user.id,
              matricNumber,
              department,
              profile: '',
            },
          });
        }
        credentials.push({ email, password });
        results.push({ email, status: 'created' });
      } catch (error) {
        results.push({ email, status: 'failed', reason: 'Error creating user' });
      }
    }
    res.json({ results, credentials });
  }),
);

export default router;
