import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database.js';
import { RabbitMQService } from '../services/rabbitmq.js';
import { passwordUtils, responseUtils } from '../utils/index.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { validate, userSchemas } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/error.js';
import { AuthenticatedRequest, ValidationError, AuthenticationError, NotFoundError } from '../types/index.js';

const router: Router = Router();
const db = DatabaseService.getInstance();
const rabbitmq = RabbitMQService.getInstance();

/**
 * POST /auth/login
 * User login
 */
router.post('/login', 
  validate({ body: userSchemas.login }),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Find user with tenant
    const user = await db.prisma.user.findFirst({
      where: { 
        email: email.toLowerCase(),
        isActive: true,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!user || !user.tenant?.isActive) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await passwordUtils.compare(password, user.password);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    });

    // Publish login event
    await rabbitmq.publishUserEvent({
      tenantId: user.tenantId,
      eventType: 'login',
      entityType: 'user',
      entityId: user.id,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      data: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role,
      },
    });

    res.json(responseUtils.success({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant: user.tenant,
      },
    }, 'Login successful'));
  })
);

/**
 * POST /auth/register
 * User registration (admin only)
 */
router.post('/register',
  authenticateToken,
  validate({ body: userSchemas.create }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { email, name, password, role } = req.body;

    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new AuthenticationError('Only admins can register new users');
    }

    // Check if user already exists
    const existingUser = await db.prisma.user.findFirst({
      where: { 
        email: email.toLowerCase(),
        tenantId: req.tenantId,
      },
    });

    if (existingUser) {
      throw new ValidationError('User already exists');
    }

    // Hash password
    const hashedPassword = await passwordUtils.hash(password);

    // Create user
    const user = await db.prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        role,
        tenantId: req.tenantId!,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Publish user creation event
    await rabbitmq.publishUserEvent({
      tenantId: req.tenantId!,
      eventType: 'created',
      entityType: 'user',
      entityId: user.id,
      timestamp: new Date().toISOString(),
      userId: req.user?.userId,
      userEmail: req.user?.email,
      data: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role,
      },
    });

    res.status(201).json(responseUtils.success(user, 'User created successfully'));
  })
);

/**
 * GET /auth/me
 * Get current user profile
 */
router.get('/me',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await db.prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.json(responseUtils.success(user));
  })
);

/**
 * PUT /auth/me
 * Update current user profile
 */
router.put('/me',
  authenticateToken,
  validate({ body: userSchemas.update }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, email } = req.body;

    const user = await db.prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(name && { name }),
        ...(email && { email: email.toLowerCase() }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Publish user update event
    await rabbitmq.publishUserEvent({
      tenantId: req.tenantId!,
      eventType: 'updated',
      entityType: 'user',
      entityId: user.id,
      timestamp: new Date().toISOString(),
      userId: req.user?.userId,
      userEmail: req.user?.email,
      data: {
        id: user.id,
        email: user.email,
        name: user.name || '',
        role: user.role,
      },
    });

    res.json(responseUtils.success(user, 'Profile updated successfully'));
  })
);

/**
 * POST /auth/change-password
 * Change user password
 */
router.post('/change-password',
  authenticateToken,
  validate({
    body: userSchemas.login.extend({
      newPassword: userSchemas.create.shape.password,
    }),
  }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { password, newPassword } = req.body;

    // Get current user
    const user = await db.prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isValidPassword = await passwordUtils.compare(password, user.password);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await passwordUtils.hash(newPassword);

    // Update password
    await db.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json(responseUtils.success(null, 'Password changed successfully'));
  })
);

export default router;