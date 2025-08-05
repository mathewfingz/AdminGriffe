import { Router } from 'express';
import { validate } from '../middleware/validation';
import { orderSchemas } from '../middleware/validation';
import { authenticateToken, requireRole } from '../middleware/auth';
import { db } from '../services/database';
import { redis } from '../services/redis';
import { rabbitmq } from '../services/rabbitmq';
import { paginationUtils } from '../utils';
import { AuthenticatedRequest } from '../types';

const router: Router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /orders
 * List orders with pagination and filtering
 */
router.get('/', validate({ query: orderSchemas.query }), async (req: AuthenticatedRequest, res) => {
  try {
    const { page = '1', limit = '10', sort = 'createdAt', order = 'desc', search, status, userId } = req.query;
    
    // Convert to numbers
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    
    // Check cache first
    const cacheKey = `orders:${req.tenantId}:${pageNum}:${limitNum}:${sort}:${order}:${search || ''}:${status || ''}:${userId || ''}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Build where clause
    const where: any = {
      tenantId: req.tenantId,
    };

    if (search) {
      where.OR = [
        { id: { contains: search as string, mode: 'insensitive' } },
        { user: { name: { contains: search as string, mode: 'insensitive' } } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    // Get pagination params
    const prismaParams = paginationUtils.getPrismaParams(pageNum, limitNum);
    
    // Build orderBy
    const orderBy: any = {};
    orderBy[sort as string] = order;

    // Get total count
    const total = await db.prisma.order.count({ where });

    // Get orders
    const orders = await db.prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      ...prismaParams,
      orderBy,
    });

    const metadata = paginationUtils.getMetadata(pageNum, limitNum, total);

    const response = {
      data: orders,
      metadata,
    };

    // Cache for 5 minutes
    await redis.set(cacheKey, JSON.stringify(response), 300);

    res.json(response);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /orders/:id
 * Get order by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check cache first
    const cacheKey = `order:${req.tenantId}:${id}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const order = await db.prisma.order.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Cache for 10 minutes
    await redis.set(cacheKey, JSON.stringify(order), 600);

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /orders
 * Create new order
 */
router.post('/', validate({ body: orderSchemas.create }), async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, items } = req.body;

    // Verify user exists
    const user = await db.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId: req.tenantId,
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Verify all products exist and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await db.prisma.product.findFirst({
        where: {
          id: item.productId,
          tenantId: req.tenantId,
          isActive: true,
        },
      });

      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found or inactive` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for product ${product.name}` });
      }

      const itemTotal = item.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal,
      });
    }

    // Create order with items in a transaction
    const order = await db.prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          tenantId: req.tenantId!,
          userId,
          status: 'PENDING',
          total: totalAmount,
        },
      });

      // Create order items and update product stock
      for (const item of validatedItems) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          },
        });

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newOrder;
    });

    // Publish order created event
    await rabbitmq.publishEvent({
      tenantId: req.tenantId!,
      eventType: 'CREATED',
      entityType: 'ORDER',
      entityId: order.id,
      timestamp: new Date(),
      userId: req.user?.id,
      userEmail: req.user?.email,
      data: {
        orderId: order.id,
        userId,
        totalAmount,
        itemCount: items.length,
      },
    });

    // Invalidate cache
    await redis.del(`orders:${req.tenantId}:*`);

    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /orders/:id
 * Update order
 */
router.put('/:id', validate({ body: orderSchemas.update }), async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if order exists
    const existingOrder = await db.prisma.order.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (status && !validTransitions[existingOrder.status].includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status transition from ${existingOrder.status} to ${status}` 
      });
    }

    // Update order
    const order = await db.prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    // Publish order updated event
    await rabbitmq.publishEvent({
      tenantId: req.tenantId!,
      eventType: 'UPDATED',
      entityType: 'ORDER',
      entityId: order.id,
      timestamp: new Date(),
      userId: req.user?.id,
      userEmail: req.user?.email,
      data: {
        orderId: order.id,
        previousStatus: existingOrder.status,
        newStatus: status || existingOrder.status,
        changes: { status },
      },
    });

    // Invalidate cache
    await redis.del(`order:${req.tenantId}:${id}`);
    await redis.del(`orders:${req.tenantId}:*`);

    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /orders/:id
 * Cancel order (only if PENDING or CONFIRMED)
 */
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;

    // Check if order exists
    const existingOrder = await db.prisma.order.findFirst({
      where: {
        id,
        tenantId: req.tenantId,
      },
      include: {
        items: true,
      },
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only allow cancellation of PENDING or CONFIRMED orders
    if (!['PENDING', 'CONFIRMED'].includes(existingOrder.status)) {
      return res.status(400).json({ 
        error: `Cannot cancel order with status ${existingOrder.status}` 
      });
    }

    // Cancel order and restore stock in a transaction
    await db.prisma.$transaction(async (tx) => {
      // Update order status to CANCELLED
      await tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
      });

      // Restore product stock
      for (const item of existingOrder.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    });

    // Publish order cancelled event
    await rabbitmq.publishEvent({
      tenantId: req.tenantId!,
      eventType: 'CANCELLED',
      entityType: 'ORDER',
      entityId: existingOrder.id,
      timestamp: new Date(),
      userId: req.user?.id,
      userEmail: req.user?.email,
      data: {
        orderId: existingOrder.id,
        previousStatus: existingOrder.status,
        restoredItems: existingOrder.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
    });

    // Invalidate cache
    await redis.del(`order:${req.tenantId}:${id}`);
    await redis.del(`orders:${req.tenantId}:*`);

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;