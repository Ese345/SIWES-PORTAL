import { Router, Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, validationResult } from 'express-validator';
import { authenticateJWT, requireRole, AuthRequest } from '../middleware/auth';
import catchAsync from '../utils/catchAsync';

const router = Router();
const prisma = new PrismaClient();

// Multer setup for ITF form uploads
const uploadDir = path.join(__dirname, '../../uploads/itf-forms');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  },
});

/**
 * @openapi
 * /api/itf-forms:
 *   get:
 *     tags: [ITFForms]
 *     summary: List all ITF forms
 *     responses:
 *       200:
 *         description: List of ITF forms
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 forms:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ITFForm'
 *   post:
 *     tags: [ITFForms]
 *     summary: Admin upload a new ITF form
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, file]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: ITF form uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 form:
 *                   $ref: '#/components/schemas/ITFForm'
 *       400:
 *         description: Validation error or no file uploaded
 *
 * /api/itf-forms/{id}/download:
 *   get:
 *     tags: [ITFForms]
 *     summary: Download a specific ITF form
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File download
 *       404:
 *         description: Form or file not found
 *
 * /api/itf-forms/{id}:
 *   delete:
 *     tags: [ITFForms]
 *     summary: Admin delete a form
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
 *         description: Form deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Form not found
 */

// List all ITF forms
router.get(
  '/',
  catchAsync(async (_req: Request, res: Response) => {
    const forms = await prisma.iTFForm.findMany({
      orderBy: { uploadedAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        fileUrl: true,
        uploadedAt: true,
      },
    });
    res.json({ forms });
  }),
);

// Download a specific ITF form
router.get(
  '/:id/download',
  catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const form = await prisma.iTFForm.findUnique({ where: { id } });
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    const filePath = path.join(uploadDir, path.basename(form.fileUrl));
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    res.download(filePath, path.basename(form.fileUrl));
  }),
);

// Admin upload a new ITF form
router.post(
  '/',
  authenticateJWT,
  requireRole(Role.Admin),
  (req, res, next) => {
    upload.single('file')(req, res, function (err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  [body('title').isString().isLength({ min: 2 }), body('description').optional().isString()],
  catchAsync(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const { title, description } = req.body;
    const fileUrl = `/uploads/itf-forms/${req.file.filename}`;
    const form = await prisma.iTFForm.create({
      data: {
        title,
        description: description || null,
        fileUrl,
      },
    });
    res.status(201).json({ form });
  }),
);

// Admin delete a form
router.delete(
  '/:id',
  authenticateJWT,
  requireRole(Role.Admin),
  catchAsync(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const form = await prisma.iTFForm.findUnique({ where: { id } });
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    // Delete file from disk
    const filePath = path.join(uploadDir, path.basename(form.fileUrl));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await prisma.iTFForm.delete({ where: { id } });
    res.json({ message: 'Form deleted' });
  }),
);

export default router;
