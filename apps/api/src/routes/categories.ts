import { Router, Response } from 'express';
import { DatabaseService } from '../services/database.js';
import { RabbitMQService } from '../services/rabbitmq.js';
import { RedisService } from '../services/redis.js';
import { responseUtils, paginationUtils } from '../utils/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { extractTenant, requireTenant } from '../middleware/tenant.js';
import { validate, categorySchemas, commonSchemas } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/error.js';
import { AuthenticatedRequest, NotFoundError, ConflictError } from '../types/index.js';

const router: Router = Router();
const db = DatabaseService.getInstance();
const rabbitmq = RabbitMQService.getInstance();
const redis = RedisService.getInstance();

// Apply middleware to all routes
router.use(authenticateToken);
router.use(extractTenant);
router.use(requireTenant);

/**
 * GET /categories
 * List categories with pagination and filters
 */
router.get('/',
  validate({ query: commonSchemas.baseQuery }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', search } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    // Check cache first
    const cacheKey = `categories:${req.tenantId}:${pageNum}:${limitNum}:${sort}:${order}:${search || ''}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(responseUtils.success(JSON.parse(cached)));
    }

    // Build where clause
    const where: any = {
      tenantId: req.tenantId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Get total count
    const total = await db.prisma.productCategory.count({ where });

    // Get categories
    const categories = await db.prisma.productCategory.findMany({
      where,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      ...paginationUtils.getPrismaParams(pageNum, limitNum),
      orderBy: { [sort]: order },
    });

    const result = {
      data: categories,
      ...paginationUtils.getMetadata(pageNum, limitNum, total),
    };

    // Cache for 10 minutes
    await redis.set(cacheKey, JSON.stringify(result), 600, req.tenantId!);

    res.json(responseUtils.success(result));
  })
);

/**
 * GET /categories/:id
 * Get category by ID
 */
router.get('/:id',
  validate({ params: categorySchemas.params }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check cache first
    const cacheKey = `category:${req.tenantId}:${id}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(responseUtils.success(JSON.parse(cached)));
    }

    const category = await db.prisma.productCategory.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            isActive: true,
          },
          where: {
            isActive: true,
          },
          take: 10, // Limit to 10 products for performance
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Cache for 15 minutes
    await redis.set(cacheKey, JSON.stringify(category), 900, req.tenantId!);

    res.json(responseUtils.success(category));
  })
);

/**
 * POST /categories
 * Create new category
 */
router.post('/',
  requireRole(['ADMIN', 'MANAGER']),
  validate({ body: categorySchemas.create }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, isActive } = req.body;

    // Check if category name already exists
    const existingCategory = await db.prisma.productCategory.findFirst({
      where: {
        name,
        tenantId: req.tenantId,
      },
    });

    if (existingCategory) {
      throw new ConflictError('Category name already exists');
    }

    // Create category
    const category = await db.prisma.productCategory.create({
      data: {
        name,
        description,
        isActive: isActive !== undefined ? isActive : true,
        tenantId: req.tenantId!,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    // Publish category creation event
    await rabbitmq.publishEvent(
      'created',
      'category',
      category.id,
      {
        id: category.id,
        name: category.name,
        description: category.description,
        isActive: category.isActive,
      },
      req.tenantId!,
      req.user?.userId,
      req.user?.email
    );

    // Invalidate cache
    await redis.del(`categories:${req.tenantId}:*`, req.tenantId!);

    res.status(201).json(responseUtils.success(category, 'Category created successfully'));
  })
);

/**
 * PUT /categories/:id
 * Update category
 */
router.put('/:id',
  requireRole(['ADMIN', 'MANAGER']),
  validate({ 
    params: categorySchemas.params,
    body: categorySchemas.update 
  }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    // Check if category exists
    const existingCategory = await db.prisma.productCategory.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }

    // Check if name already exists (if changing)
    if (name && name !== existingCategory.name) {
      const nameExists = await db.prisma.productCategory.findFirst({
        where: {
          name,
          tenantId: req.tenantId,
          id: { not: id },
        },
      });

      if (nameExists) {
        throw new ConflictError('Category name already exists');
      }
    }

    // Update category
    const category = await db.prisma.productCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    // Publish category update event
    await rabbitmq.publishEvent(
      'updated',
      'category',
      category.id,
      {
        id: category.id,
        name: category.name,
        description: category.description,
        isActive: category.isActive,
        changes: req.body,
      },
      req.tenantId!,
      req.user?.userId,
      req.user?.email
    );

    // Invalidate cache
    await redis.del(`category:${req.tenantId}:${id}`, req.tenantId!);
    await redis.del(`categories:${req.tenantId}:*`, req.tenantId!);

    res.json(responseUtils.success(category, 'Category updated successfully'));
  })
);

/**
 * DELETE /categories/:id
 * Delete category (soft delete if has products)
 */
router.delete('/:id',
  requireRole(['ADMIN']),
  validate({ params: categorySchemas.params }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check if category exists
    const existingCategory = await db.prisma.productCategory.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!existingCategory) {
      throw new NotFoundError('Category not found');
    }

    // Check if category has products
    const productCount = await db.prisma.product.count({
      where: {
        categoryId: id,
        tenantId: req.tenantId,
      },
    });

    if (productCount > 0) {
      // Soft delete - just deactivate
      const category = await db.prisma.productCategory.update({
        where: { id },
        data: { isActive: false },
      });

      await rabbitmq.publishEvent(
        'updated',
        'category',
        category.id,
        {
          id: category.id,
          isActive: false,
          reason: 'soft_delete',
          productCount,
        },
        req.tenantId!,
        req.user?.userId,
        req.user?.email
      );

      res.json(responseUtils.success(null, 'Category deactivated successfully'));
    } else {
      // Hard delete
      await db.prisma.productCategory.delete({
        where: { id },
      });

      await rabbitmq.publishEvent(
        'deleted',
        'category',
        id,
        {
          id,
          name: existingCategory.name,
        },
        req.tenantId!,
        req.user?.userId,
        req.user?.email
      );

      res.json(responseUtils.success(null, 'Category deleted successfully'));
    }

    // Invalidate cache
    await redis.del(`category:${req.tenantId}:${id}`, req.tenantId!);
    await redis.del(`categories:${req.tenantId}:*`, req.tenantId!);
  })
);

export default router;