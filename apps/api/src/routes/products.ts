import { Router, Response } from 'express';
import { DatabaseService } from '../services/database.js';
import { RabbitMQService } from '../services/rabbitmq.js';
import { RedisService } from '../services/redis.js';
import { responseUtils, paginationUtils, stringUtils } from '../utils/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { extractTenant, requireTenant } from '../middleware/tenant.js';
import { validate, productSchemas, commonSchemas } from '../middleware/validation.js';
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
 * GET /products
 * List products with pagination and filters
 */
router.get('/',
  validate({ query: commonSchemas.baseQuery }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', search } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    // Check cache first
    const cacheKey = `products:${req.tenantId}:${pageNum}:${limitNum}:${sort}:${order}:${search || ''}`;
    const cached = await redis.get(cacheKey, req.tenantId!);
    
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
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Get total count
    const total = await db.prisma.product.count({ where });

    // Get products
    const products = await db.prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      ...paginationUtils.getPrismaParams(pageNum, limitNum),
      orderBy: { [sort]: order },
    });

    const result = {
      data: products,
      ...paginationUtils.getMetadata(pageNum, limitNum, total),
    };

    // Cache for 5 minutes
    await redis.set(cacheKey, JSON.stringify(result), 300, req.tenantId!);

    res.json(responseUtils.success(result));
  })
);

/**
 * GET /products/:id
 * Get product by ID
 */
router.get('/:id',
  validate({ params: productSchemas.params }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check cache first
    const cacheKey = `product:${req.tenantId}:${id}`;
    const cached = await redis.get(cacheKey, req.tenantId!);
    
    if (cached) {
      return res.json(responseUtils.success(JSON.parse(cached)));
    }

    const product = await db.prisma.product.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    // Cache for 10 minutes
    await redis.set(cacheKey, JSON.stringify(product), 600, req.tenantId!);

    res.json(responseUtils.success(product));
  })
);

/**
 * POST /products
 * Create new product
 */
router.post('/',
  requireRole(['ADMIN', 'MANAGER']),
  validate({ body: productSchemas.create }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, price, sku, categoryId, stock, isActive } = req.body;

    // Check if SKU already exists
    const existingSku = await db.prisma.product.findFirst({
      where: {
        sku,
        tenantId: req.tenantId,
      },
    });

    if (existingSku) {
      throw new ConflictError('SKU already exists');
    }

    // Verify category exists
    const category = await db.prisma.category.findFirst({
      where: {
        id: categoryId,
        tenantId: req.tenantId,
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Create product
    const product = await db.prisma.product.create({
      data: {
        name,
        description,
        price,
        sku,
        categoryId,
        stock: stock || 0,
        isActive: isActive !== undefined ? isActive : true,
        tenantId: req.tenantId!,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Publish product creation event
    await rabbitmq.publishEvent(
      'created',
      'product',
      product.id,
      {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        categoryId: product.categoryId,
        stock: product.stock,
      },
      req.tenantId!,
      req.user?.userId,
      req.user?.email
    );

    // Invalidate cache
    await redis.del(`products:${req.tenantId}:*`, req.tenantId!);

    res.status(201).json(responseUtils.success(product, 'Product created successfully'));
  })
);

/**
 * PUT /products/:id
 * Update product
 */
router.put('/:id',
  requireRole(['ADMIN', 'MANAGER']),
  validate({ 
    params: productSchemas.params,
    body: productSchemas.update 
  }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { name, description, price, sku, categoryId, stock, isActive } = req.body;

    // Check if product exists
    const existingProduct = await db.prisma.product.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!existingProduct) {
      throw new NotFoundError('Product not found');
    }

    // Check if SKU already exists (if changing)
    if (sku && sku !== existingProduct.sku) {
      const existingSku = await db.prisma.product.findFirst({
        where: {
          sku,
          tenantId: req.tenantId,
          id: { not: id },
        },
      });

      if (existingSku) {
        throw new ConflictError('SKU already exists');
      }
    }

    // Verify category exists (if changing)
    if (categoryId && categoryId !== existingProduct.categoryId) {
      const category = await db.prisma.category.findFirst({
        where: {
          id: categoryId,
          tenantId: req.tenantId,
        },
      });

      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    // Update product
    const product = await db.prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price && { price }),
        ...(sku && { sku }),
        ...(categoryId && { categoryId }),
        ...(stock !== undefined && { stock }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Publish product update event
    await rabbitmq.publishEvent(
      'updated',
      'product',
      product.id,
      {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        categoryId: product.categoryId,
        stock: product.stock,
        changes: req.body,
      },
      req.tenantId!,
      req.user?.userId,
      req.user?.email
    );

    // Invalidate cache
    await redis.del(`product:${req.tenantId}:${id}`, req.tenantId!);
    await redis.del(`products:${req.tenantId}:*`, req.tenantId!);

    res.json(responseUtils.success(product, 'Product updated successfully'));
  })
);

/**
 * DELETE /products/:id
 * Delete product (soft delete)
 */
router.delete('/:id',
  requireRole(['ADMIN']),
  validate({ params: productSchemas.params }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await db.prisma.product.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!existingProduct) {
      throw new NotFoundError('Product not found');
    }

    // Check if product has orders
    const orderCount = await db.prisma.orderItem.count({
      where: {
        productId: id,
      },
    });

    if (orderCount > 0) {
      // Soft delete - just deactivate
      const product = await db.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      await rabbitmq.publishEvent(
        'updated',
        'product',
        product.id,
        {
          id: product.id,
          isActive: false,
          reason: 'soft_delete',
        },
        req.tenantId!,
        req.user?.userId,
        req.user?.email
      );

      res.json(responseUtils.success(null, 'Product deactivated successfully'));
    } else {
      // Hard delete
      await db.prisma.product.delete({
        where: { id },
      });

      await rabbitmq.publishEvent(
        'deleted',
        'product',
        id,
        {
          id,
          name: existingProduct.name,
          sku: existingProduct.sku,
        },
        req.tenantId!,
        req.user?.userId,
        req.user?.email
      );

      res.json(responseUtils.success(null, 'Product deleted successfully'));
    }

    // Invalidate cache
    await redis.del(`product:${req.tenantId}:${id}`, req.tenantId!);
    await redis.del(`products:${req.tenantId}:*`, req.tenantId!);
  })
);

/**
 * POST /products/:id/stock
 * Update product stock
 */
router.post('/:id/stock',
  requireRole(['ADMIN', 'MANAGER']),
  validate({ 
    params: productSchemas.params,
    body: productSchemas.stockUpdate 
  }),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { quantity, operation, reason } = req.body;

    // Check if product exists
    const existingProduct = await db.prisma.product.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!existingProduct) {
      throw new NotFoundError('Product not found');
    }

    // Calculate new stock
    let newStock = existingProduct.stock;
    if (operation === 'add') {
      newStock += quantity;
    } else if (operation === 'subtract') {
      newStock -= quantity;
      if (newStock < 0) newStock = 0;
    } else {
      newStock = quantity;
    }

    // Update stock
    const product = await db.prisma.product.update({
      where: { id },
      data: { stock: newStock },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Publish stock update event
    await rabbitmq.publishEvent(
      'updated',
      'product',
      product.id,
      {
        id: product.id,
        name: product.name,
        sku: product.sku,
        previousStock: existingProduct.stock,
        newStock: product.stock,
        operation,
        quantity,
        reason,
      },
      req.tenantId!,
      req.user?.userId,
      req.user?.email
    );

    // Invalidate cache
    await redis.del(`product:${req.tenantId}:${id}`, req.tenantId!);
    await redis.del(`products:${req.tenantId}:*`, req.tenantId!);

    res.json(responseUtils.success(product, 'Stock updated successfully'));
  })
);

export default router;