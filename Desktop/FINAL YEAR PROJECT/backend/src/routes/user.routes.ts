/* eslint-disable @typescript-eslint/ban-types */
import { Router, Request, Response } from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { body, param, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.nativeEnum(Role),
  department: z.string().optional(),
  matricNumber: z.string().optional(),
});

// Validation middleware
const validateRequest = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users with pagination and filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [Student, SchoolSupervisor, IndustrySupervisor, Admin]
 *         description: Filter by user role
 *       - in: query
 *         name: roles
 *         schema:
 *           type: string
 *         description: Filter by multiple roles (comma-separated, e.g., "Student,SchoolSupervisor")
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status (true/false)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department (for students)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, email, createdAt, role]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of users with pagination details and filters applied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 filters:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                     roles:
 *                       type: array
 *                       items:
 *                         type: string
 *                     isActive:
 *                       type: boolean
 *                     search:
 *                       type: string
 *                     department:
 *                       type: string
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */
// Get all users with pagination and enhanced filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Extract and validate filters
    const {
      role,
      roles,
      isActive,
      search,
      department,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build where clause
    const where: any = {};

    // Role filtering - single role or multiple roles
    if (role && typeof role === 'string') {
      if (!Object.values(Role).includes(role as Role)) {
        return res.status(400).json({
          error: 'Invalid role. Must be one of: ' + Object.values(Role).join(', '),
        });
      }
      where.role = role as Role;
    } else if (roles && typeof roles === 'string') {
      const roleList = roles.split(',').map(r => r.trim());
      const invalidRoles = roleList.filter(r => !Object.values(Role).includes(r as Role));

      if (invalidRoles.length > 0) {
        return res.status(400).json({
          error: `Invalid roles: ${invalidRoles.join(', ')}. Must be one of: ${Object.values(Role).join(', ')}`,
        });
      }

      where.role = {
        in: roleList as Role[],
      };
    }

    // Active status filtering
    if (isActive !== undefined) {
      if (isActive === 'true') {
        where.isActive = true;
      } else if (isActive === 'false') {
        where.isActive = false;
      } else {
        return res.status(400).json({
          error: 'Invalid isActive value. Must be "true" or "false"',
        });
      }
    }

    // Search filtering (name or email)
    if (search && typeof search === 'string') {
      const searchTerm = search.trim();
      if (searchTerm) {
        where.OR = [
          {
            name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        ];
      }
    }

    // Department filtering (for students)
    if (department && typeof department === 'string') {
      where.student = {
        department: {
          contains: department,
          mode: 'insensitive',
        },
      };
    }

    // Validate sort parameters
    const validSortFields = ['name', 'email', 'createdAt', 'role'];
    const validSortOrders = ['asc', 'desc'];

    if (!validSortFields.includes(sortBy as string)) {
      return res.status(400).json({
        error: `Invalid sortBy field. Must be one of: ${validSortFields.join(', ')}`,
      });
    }

    if (!validSortOrders.includes(sortOrder as string)) {
      return res.status(400).json({
        error: `Invalid sortOrder. Must be one of: ${validSortOrders.join(', ')}`,
      });
    }

    // Build order by clause
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder as 'asc' | 'desc';

    // Execute queries
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          imageUrl: true,
          createdAt: true,
          student: {
            select: {
              matricNumber: true,
              department: true,
            },
          },
        },
        orderBy,
      }),
      prisma.user.count({ where }),
    ]);

    // Prepare response with applied filters
    const appliedFilters: any = {};
    if (role) appliedFilters.role = role;
    if (roles && typeof roles === 'string')
      appliedFilters.roles = roles.split(',').map((r: string) => r.trim());
    if (isActive !== undefined) appliedFilters.isActive = isActive === 'true';
    if (search) appliedFilters.search = search;
    if (department) appliedFilters.department = department;

    res.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      filters: appliedFilters,
      sort: {
        sortBy,
        sortOrder,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/users/user/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserWithStudent'
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// Get user by ID
router.get(
  '/user/:id',
  param('id').isUUID(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
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

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a new user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 description: User's full name
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: User password (min 6 characters)
 *               role:
 *                 type: string
 *                 enum: [Student, SchoolSupervisor, IndustrySupervisor, Admin]
 *                 description: User role
 *               department:
 *                 type: string
 *                 description: Department (required for Students)
 *               matricNumber:
 *                 type: string
 *                 description: Matriculation Number (required for Students)
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserWithoutPassword'
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Email already registered
 *       500:
 *         description: Server error
 */
// Create new user
router.post(
  '/',
  [
    body('email').isEmail().normalizeEmail(),
    body('name').trim().isLength({ min: 2 }),
    body('password').isLength({ min: 6 }),
    body('role').isIn(Object.values(Role)),
    validateRequest,
  ],
  async (req: Request, res: Response) => {
    try {
      const validatedData = createUserSchema.parse(req.body);
      const { email, name, password, role, department, matricNumber } = validatedData;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create user with transaction to handle student creation if needed
      const user = await prisma.$transaction(async prisma => {
        const newUser = await prisma.user.create({
          data: {
            email,
            name,
            passwordHash,
            role,
            imageUrl: null,
          },
        });

        // If role is Student, create student record
        if (role === Role.Student && department && matricNumber) {
          await prisma.student.create({
            data: {
              id: newUser.id,
              matricNumber,
              department,
            },
          });
        }

        return newUser;
      });

      // Return user without sensitive data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// get users stats
/**
 * @openapi
 * /api/users/stats:
 *   get:
 *     tags: [Users]
 *     summary: Get user statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 usersByRole:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *       500:
 *         description: Server error
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();

    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    const stats = {
      totalUsers,
      usersByRole: usersByRole.reduce(
        (acc, { role, _count }) => {
          acc[role] = _count;
          return acc;
        },
        {} as Record<Role, number>,
      ),
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *                 deletedUser:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       404:
 *         description: User not found
 *       409:
 *         description: Cannot delete user with existing dependencies
 *       500:
 *         description: Server error
 */
// Delete user
router.delete(
  '/:id',
  param('id').isUUID(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
        include: {
          student: true,
          // Add other relations if needed
        },
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check for dependencies that might prevent deletion
      // You can customize this based on your business rules
      const dependencies = <string[]>[];

      // Check if user is a student with assignments
      if (existingUser.role === Role.Student && existingUser.student) {
        const studentAssignments = await prisma.student.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                logbookEntries: true,
                attendance: true,
              },
            },
          },
        });

        if (
          studentAssignments?._count?.logbookEntries &&
          studentAssignments._count.logbookEntries > 0
        ) {
          dependencies.push('logbook entries');
        }
        if (studentAssignments?._count?.attendance && studentAssignments._count.attendance > 0) {
          dependencies.push('attendance records');
        }
      }

      // Check if user is a supervisor with assigned students
      if (existingUser.role === Role.IndustrySupervisor) {
        const assignedStudents = await prisma.student.count({
          where: { industrySupervisorId: id },
        });
        if (assignedStudents > 0) {
          dependencies.push(`${assignedStudents} assigned students (industry supervisor)`);
        }
      }

      if (existingUser.role === Role.SchoolSupervisor) {
        const assignedStudents = await prisma.student.count({
          where: { schoolSupervisorId: id },
        });
        if (assignedStudents > 0) {
          dependencies.push(`${assignedStudents} assigned students (school supervisor)`);
        }
      }

      // If there are dependencies, return error with details
      if (dependencies.length > 0) {
        return res.status(409).json({
          error: 'Cannot delete user with existing dependencies',
          dependencies,
          message: `This user cannot be deleted because they have: ${dependencies.join(', ')}. Please resolve these dependencies first.`,
        });
      }

      // Perform deletion in a transaction
      const deletedUser = await prisma.$transaction(async prisma => {
        // Delete student record if exists
        if (existingUser.student) {
          await prisma.student.delete({
            where: { id },
          });
        }

        // Delete the user
        const deleted = await prisma.user.delete({
          where: { id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

        return deleted;
      });

      res.json({
        message: 'User deleted successfully',
        deletedUser,
      });
    } catch (error) {
      console.error('Error deleting user:', error);

      // Handle specific Prisma errors
      if (error instanceof Error) {
        if (error.message.includes('Record to delete does not exist')) {
          return res.status(404).json({ error: 'User not found' });
        }

        if (error.message.includes('Foreign key constraint')) {
          return res.status(409).json({
            error: 'Cannot delete user due to existing references',
            message:
              'This user is referenced by other records in the system. Please remove those references first.',
          });
        }
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

/**
 * @openapi
 * /api/users/bulk-delete:
 *   delete:
 *     tags: [Users]
 *     summary: Delete multiple users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userIds
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of user IDs to delete
 *                 minItems: 1
 *                 maxItems: 50
 *     responses:
 *       200:
 *         description: Bulk deletion completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 *                 skippedCount:
 *                   type: integer
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                       error:
 *                         type: string
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Server error
 */
// Bulk delete users
router.delete(
  '/bulk-delete',
  [
    body('userIds')
      .isArray({ min: 1, max: 50 })
      .withMessage('userIds must be an array with 1-50 items'),
    body('userIds.*').isUUID().withMessage('Each userId must be a valid UUID'),
    validateRequest,
  ],
  async (req: Request, res: Response) => {
    try {
      const { userIds }: { userIds: string[] } = req.body;

      const results = {
        deletedCount: 0,
        skippedCount: 0,
        errors: [] as Array<{ userId: string; error: string }>,
      };

      // Process each user deletion
      for (const userId of userIds) {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            include: {
              student: true,
            },
          });

          if (!existingUser) {
            results.errors.push({
              userId,
              error: 'User not found',
            });
            results.skippedCount++;
            continue;
          }

          // Check for dependencies (simplified for bulk operation)
          let hasDependencies = false;

          if (existingUser.role === Role.IndustrySupervisor) {
            const assignedStudents = await prisma.student.count({
              where: { industrySupervisorId: userId },
            });
            if (assignedStudents > 0) {
              hasDependencies = true;
            }
          }

          if (existingUser.role === Role.SchoolSupervisor) {
            const assignedStudents = await prisma.student.count({
              where: { schoolSupervisorId: userId },
            });
            if (assignedStudents > 0) {
              hasDependencies = true;
            }
          }

          if (hasDependencies) {
            results.errors.push({
              userId,
              error: 'User has dependencies and cannot be deleted',
            });
            results.skippedCount++;
            continue;
          }

          // Perform deletion
          await prisma.$transaction(async prisma => {
            if (existingUser.student) {
              await prisma.student.delete({
                where: { id: userId },
              });
            }

            await prisma.user.delete({
              where: { id: userId },
            });
          });

          results.deletedCount++;
        } catch (error) {
          results.errors.push({
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          results.skippedCount++;
        }
      }

      res.json({
        message: `Bulk deletion completed. ${results.deletedCount} users deleted, ${results.skippedCount} skipped.`,
        ...results,
      });
    } catch (error) {
      console.error('Error in bulk delete:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
);

export default router;
