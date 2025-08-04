/* eslint-disable prettier/prettier */
import { Router, Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { logger } from '@/app';

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     tags: [Auth]
 *     summary: First admin signup (bootstrapping)
 *     description: Only allowed if there are no users in the system. Creates the first admin.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Signup disabled after first admin
 *       409:
 *         description: Email already registered
 */
router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('name').trim().isLength({ min: 2 }),
    body('password').isLength({ min: 6 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, name, password } = req.body;
    try {
      const role = Role.Admin;
      // Check if any user exists
      const userCount = await prisma.user.count();
      if (userCount > 0) {
        return res
          .status(403)
          .json({ error: 'Signup is disabled after the first admin is created.' });
      }
      // Check if user already exists (shouldn't happen, but for safety)
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      // Create admin user
      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
      res.status(201).json({ user });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     description: Login with email and password. Returns JWT and user info.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 6 })],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          role: true,
          mustChangePassword: true,
        },
      });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign(
        {
          userId: user.id,
          role: user.role,
        },
        JWT_SECRET as jwt.Secret,
        { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions,
      );

      // Optionally, you can set the token in a cookie or return it in the response
      res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // 1 day

      // create the refresh token
      const rtoken = jwt.sign(
        {
          userId: user.id,
          role: user.role,
        },
        JWT_SECRET as jwt.Secret,
        { expiresIn: '7d' } as jwt.SignOptions, // Refresh token valid for 7 days
      );

      res.json({
        accessToken: token,
        refreshToken: rtoken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          mustChangePassword: user.mustChangePassword,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized or old password incorrect
 */
// Change password route (for any authenticated user)
router.post(
  '/change-password',
  authenticateJWT,
  [
    body('oldPassword').isString().isLength({ min: 6 }),
    body('newPassword').isString().isLength({ min: 6 }),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { oldPassword, newPassword } = req.body;
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const valid = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Old password is incorrect' });
      }
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash, mustChangePassword: false },
      });
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */

router.post('/logout', authenticateJWT, async (req: AuthRequest, res: Response) => {
  // For JWT, logout is handled client-side by deleting the token

  // Get the token from the request
  const token = req.token;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Blacklist the token (optional, if you want to invalidate it server-side)
  const now = new Date();
  const bToken = await prisma.blacklistedToken.create({
    data: {
      token: token,
      expiresAt: new Date(now.getTime() + parseInt(JWT_EXPIRES_IN) * 1000),
    },
  });
  logger.info('Token blacklisted successfully:', bToken);
  res.json({ message: 'Logged out successfully' });
});

router.get('/profile', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token route
router.post('/refresh', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    // Create a new access token
    const newAccessToken = jwt.sign(
      {
        userId: userId,
        role: req.user?.role,
      },
      JWT_SECRET as jwt.Secret,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions,
    );

    // Optionally, you can also create a new refresh token
    const newRefreshToken = jwt.sign(
      {
        userId: userId,
        role: req.user?.role,
      },
      JWT_SECRET as jwt.Secret,
      { expiresIn: '7d' } as jwt.SignOptions, // Refresh token valid for 7 days
    );

    // Blacklist the old refresh token if you are using one
    const oldToken = req.token;
    if (oldToken) {
      await prisma.blacklistedToken.create({
        data: {
          token: oldToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
      logger.info('Old token blacklisted successfully:', oldToken);
    }
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      userId: userId,
      role: req.user?.role,
    });
  } catch (error) {
    logger.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

