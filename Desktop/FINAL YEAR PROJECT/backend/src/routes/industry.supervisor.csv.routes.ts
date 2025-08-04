import { Router, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import csv from 'csv-parser';
import { authenticateJWT, requireRole, AuthRequest } from '../middleware/auth';
import catchAsync from '../utils/catchAsync';

const router = Router();
const prisma = new PrismaClient();

// Setup upload directory for CSV files
const uploadDir = path.join(__dirname, '../../uploads/industry-supervisors');
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

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    // Only accept CSV files
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.csv') {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  },
});

/**
 * @openapi
 * /api/industry-supervisors/upload:
 *   post:
 *     tags: [Industry Supervisors]
 *     summary: Upload industry supervisor information via CSV
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Industry supervisor information processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 supervisor:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Invalid CSV format or data
 *       403:
 *         description: Forbidden - only students can upload their supervisor info
 */
router.post(
  '/upload',
  authenticateJWT,
  requireRole(Role.Student),
  upload.single('file'),
  catchAsync(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file provided' });
    }

    // Get student record
    const studentId = req.user!.userId;
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student record not found' });
    }

    // Check if student already has an industry supervisor
    if (student.industrySupervisorId) {
      return res.status(400).json({
        error: 'Industry supervisor already assigned',
        message:
          'You already have an industry supervisor assigned. Please contact an administrator if you need to change your supervisor.',
      });
    }

    // Process CSV file
    const results: { name: string; email: string; company?: string; position?: string }[] = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(req.file!.path)
        .pipe(csv())
        .on('data', data => {
          // Check if CSV row has required fields
          if (data.name && data.email) {
            results.push({
              name: data.name.trim(),
              email: data.email.trim().toLowerCase(),
              company: data.company?.trim(),
              position: data.position?.trim(),
            });
          }
        })
        .on('end', () => resolve())
        .on('error', error => reject(error));
    });

    // Validate that we have at least one valid supervisor record
    if (results.length === 0) {
      return res.status(400).json({
        error: 'Invalid CSV format',
        message:
          'The CSV file must contain at least one row with "name" and "email" columns. Please check your file and try again.',
      });
    }

    // Use the first supervisor in the CSV
    const supervisorData = results[0];

    // Check if this supervisor already exists
    let supervisor = await prisma.user.findUnique({
      where: { email: supervisorData.email },
    });

    // Create supervisor if doesn't exist
    if (!supervisor) {
      // Generate a random password for the supervisor
      const randomPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      supervisor = await prisma.user.create({
        data: {
          name: supervisorData.name,
          email: supervisorData.email,
          passwordHash,
          role: Role.IndustrySupervisor,
          mustChangePassword: true,
        },
      });

      // In a real application, you would send an email to the supervisor with login details
      console.log(
        `Created new supervisor: ${supervisor.email} with temp password: ${randomPassword}`,
      );
    }

    // Assign supervisor to student
    await prisma.student.update({
      where: { id: studentId },
      data: {
        industrySupervisorId: supervisor.id,
      },
    });

    // Return success response with supervisor details
    res.json({
      message: 'Industry supervisor information processed successfully',
      supervisor: {
        id: supervisor.id,
        name: supervisor.name,
        email: supervisor.email,
      },
    });
  }),
);

/**
 * @openapi
 * /api/industry-supervisors/export-template:
 *   get:
 *     tags: [Industry Supervisors]
 *     summary: Download CSV template for industry supervisor information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV template file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Forbidden - only students can download the template
 */
router.get(
  '/export-template',
  authenticateJWT,
  requireRole(Role.Student, Role.Admin),
  (req: AuthRequest, res: Response) => {
    const csvTemplate =
      'name,email,company,position\nJohn Doe,johndoe@example.com,ABC Company,Supervisor\n';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=industry-supervisor-template.csv');
    res.send(csvTemplate);
  },
);

/**
 * @openapi
 * /api/industry-supervisors/status:
 *   get:
 *     tags: [Industry Supervisors]
 *     summary: Check if the student has submitted industry supervisor information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status of industry supervisor submission
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasIndustrySupervisor:
 *                   type: boolean
 *                 supervisor:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       403:
 *         description: Forbidden - only students can check their own status
 */
router.get(
  '/status',
  authenticateJWT,
  requireRole(Role.Student),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const studentId = req.user!.userId;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        industrySupervisor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student record not found' });
    }

    const hasIndustrySupervisor = !!student.industrySupervisorId;

    res.json({
      hasIndustrySupervisor,
      supervisor: student.industrySupervisor,
    });
  }),
);

export default router;
