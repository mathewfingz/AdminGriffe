import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, TenantError, TenantContext } from '../types/index.js';
import { DatabaseService } from '../services/database.js';

/**
 * Middleware to extract and validate tenant context
 */
export const extractTenant = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let tenantId: string | undefined;

    // 1. Try to get tenant from authenticated user
    if (req.user?.tenantId) {
      tenantId = req.user.tenantId;
    }

    // 2. Try to get tenant from headers (for API keys or external integrations)
    if (!tenantId && req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'] as string;
    }

    // 3. Try to get tenant from subdomain (e.g., tenant1.api.domain.com)
    if (!tenantId && req.headers.host) {
      const subdomain = req.headers.host.split('.')[0];
      if (subdomain && subdomain !== 'api' && subdomain !== 'www') {
        tenantId = subdomain;
      }
    }

    if (!tenantId) {
      throw new TenantError('Tenant ID is required');
    }

    // Validate tenant exists and is active
    const db = DatabaseService.getInstance();
    const tenant = await db.client.tenant.findFirst({
      where: {
        id: tenantId,
        isActive: true,
      },
    });

    if (!tenant) {
      throw new TenantError(`Tenant '${tenantId}' not found or inactive`);
    }

    // Set tenant context
    const tenantContext: TenantContext = {
      tenantId: tenant.id,
      userId: req.user?.userId,
      userEmail: req.user?.email,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    // Set tenant context in database service for RLS
    await db.setTenantContext(tenantContext);

    // Add tenant info to request
    req.tenantId = tenant.id;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require tenant context (must be used after extractTenant)
 */
export const requireTenant = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.tenantId) {
    next(new TenantError('Tenant context not found'));
    return;
  }
  next();
};

/**
 * Middleware to validate tenant ownership of resource
 */
export const validateTenantOwnership = (resourceIdParam: string = 'id') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.tenantId) {
        throw new TenantError('Tenant context required');
      }

      const resourceId = req.params[resourceIdParam];
      if (!resourceId) {
        throw new Error(`Resource ID parameter '${resourceIdParam}' not found`);
      }

      // This will be implemented per resource type
      // For now, we trust the RLS policies to handle tenant isolation
      next();
    } catch (error) {
      next(error);
    }
  };
};