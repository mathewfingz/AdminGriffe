import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../types/index.js';

/**
 * Middleware to validate request data using Zod schemas
 */
export const validate = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query) as any;
      }

      // Validate route parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params) as any;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues
          .map((err: any) => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        next(new ValidationError(`Validation failed: ${errorMessage}`));
      } else {
        next(error);
      }
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  }),

  // Sorting
  sorting: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),

  // Common filters
  filters: z.object({
    search: z.string().optional(),
    isActive: z.string().optional().transform(val => val === 'true'),
    createdFrom: z.string().optional().transform(val => val ? new Date(val) : undefined),
    createdTo: z.string().optional().transform(val => val ? new Date(val) : undefined),
  }),

  // Base query combining pagination, sorting, and filters
  baseQuery: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
    sort: z.string().optional().default('createdAt'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
    search: z.string().optional(),
    isActive: z.string().optional().transform(val => val === 'true'),
    createdFrom: z.string().optional().transform(val => val ? new Date(val) : undefined),
    createdTo: z.string().optional().transform(val => val ? new Date(val) : undefined),
  }),

  // ID parameter
  idParam: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  // Tenant ID parameter
  tenantParam: z.object({
    tenantId: z.string().uuid('Invalid tenant ID format'),
  }),
};

// User validation schemas
export const userSchemas = {
  create: z.object({
    email: z.string().email('Invalid email format'),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['ADMIN', 'MANAGER', 'USER']).default('USER'),
  }),

  update: z.object({
    email: z.string().email('Invalid email format').optional(),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
    role: z.enum(['ADMIN', 'MANAGER', 'USER']).optional(),
    isActive: z.boolean().optional(),
  }),

  login: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
};

// Product validation schemas
export const productSchemas = {
  create: z.object({
    name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    stock: z.number().int().min(0, 'Stock cannot be negative'),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
    isActive: z.boolean().default(true),
  }),

  update: z.object({
    name: z.string().min(1, 'Name is required').max(200, 'Name too long').optional(),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive').optional(),
    stock: z.number().int().min(0, 'Stock cannot be negative').optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long').optional(),
    isActive: z.boolean().optional(),
  }),

  params: z.object({
    id: z.string().uuid('Invalid product ID format'),
  }),

  stockUpdate: z.object({
    quantity: z.number().int().positive('Quantity must be positive'),
    operation: z.enum(['add', 'subtract', 'set']),
    reason: z.string().optional(),
  }),

  query: z.object({
    ...commonSchemas.pagination.shape,
    ...commonSchemas.sorting.shape,
    ...commonSchemas.filters.shape,
    categoryId: z.string().uuid().optional(),
    minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
    maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  }),
};

// Category validation schemas
export const categorySchemas = {
  create: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
  }),

  update: z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),

  params: z.object({
    id: z.string().uuid('Invalid category ID format'),
  }),

  query: z.object({
    ...commonSchemas.pagination.shape,
    ...commonSchemas.sorting.shape,
    ...commonSchemas.filters.shape,
  }),
};

// Order validation schemas
export const orderSchemas = {
  create: z.object({
    userId: z.string().uuid('Invalid user ID'),
    items: z.array(z.object({
      productId: z.string().uuid('Invalid product ID'),
      quantity: z.number().int().positive('Quantity must be positive'),
      price: z.number().positive('Price must be positive'),
    })).min(1, 'At least one item is required'),
  }),

  update: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  }),

  query: z.object({
    ...commonSchemas.pagination.shape,
    ...commonSchemas.sorting.shape,
    ...commonSchemas.filters.shape,
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
    userId: z.string().uuid().optional(),
  }),
};