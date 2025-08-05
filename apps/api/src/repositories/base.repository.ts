/**
 * Base Repository Pattern Implementation
 * AdminGriffe - Sistema de Auditoría Integral
 */

import { DatabaseService } from '../services/database.js';
import { logger } from '../services/logger.js';

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(filter?: any): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  count(filter?: any): Promise<number>;
}

export interface RepositoryOptions {
  tenantId?: string;
  userId?: string;
  auditContext?: boolean;
}

/**
 * Base repository with common CRUD operations and audit context
 */
export abstract class BaseRepository<T> implements IRepository<T> {
  protected db: DatabaseService;
  protected modelName: string;
  protected tenantId?: string;
  protected userId?: string;

  constructor(
    db: DatabaseService,
    modelName: string,
    options: RepositoryOptions = {}
  ) {
    this.db = db;
    this.modelName = modelName;
    this.tenantId = options.tenantId;
    this.userId = options.userId;

    // Set audit context if provided
    if (options.auditContext && options.userId && options.tenantId) {
      this.setAuditContext(options.userId, options.tenantId);
    }
  }

  /**
   * Set audit context for database operations
   */
  protected async setAuditContext(userId: string, tenantId: string): Promise<void> {
    try {
      await this.db.setTenantContext({ tenantId, userId });
    } catch (error) {
      logger.warn('Failed to set audit context', { error, userId, tenantId });
    }
  }

  /**
   * Get the Prisma model delegate
   */
  protected abstract getModel(): any;

  /**
   * Apply tenant filtering if tenantId is set
   */
  protected applyTenantFilter(filter: any = {}): any {
    if (this.tenantId) {
      return {
        ...filter,
        tenantId: this.tenantId,
      };
    }
    return filter;
  }

  /**
   * Find entity by ID
   */
  async findById(id: string): Promise<T | null> {
    try {
      const filter = this.applyTenantFilter({ id });
      const result = await this.getModel().findUnique({
        where: filter,
      });

      logger.debug(`${this.modelName}.findById`, { id, found: !!result });
      return result;
    } catch (error) {
      logger.error(`${this.modelName}.findById failed`, { error, id });
      throw error;
    }
  }

  /**
   * Find multiple entities
   */
  async findMany(filter: any = {}): Promise<T[]> {
    try {
      const tenantFilter = this.applyTenantFilter(filter);
      const results = await this.getModel().findMany({
        where: tenantFilter,
        orderBy: { createdAt: 'desc' },
      });

      logger.debug(`${this.modelName}.findMany`, { 
        filter: tenantFilter, 
        count: results.length 
      });
      return results;
    } catch (error) {
      logger.error(`${this.modelName}.findMany failed`, { error, filter });
      throw error;
    }
  }

  /**
   * Create new entity
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      // Add tenant context if available
      const createData = this.tenantId 
        ? { ...data, tenantId: this.tenantId }
        : data;

      const result = await this.getModel().create({
        data: createData,
      });

      logger.info(`${this.modelName}.create`, { 
        id: result.id, 
        tenantId: this.tenantId 
      });
      return result;
    } catch (error) {
      logger.error(`${this.modelName}.create failed`, { error, data });
      throw error;
    }
  }

  /**
   * Update entity
   */
  async update(id: string, data: Partial<T>): Promise<T> {
    try {
      const filter = this.applyTenantFilter({ id });
      const result = await this.getModel().update({
        where: filter,
        data,
      });

      logger.info(`${this.modelName}.update`, { 
        id, 
        tenantId: this.tenantId 
      });
      return result;
    } catch (error) {
      logger.error(`${this.modelName}.update failed`, { error, id, data });
      throw error;
    }
  }

  /**
   * Delete entity
   */
  async delete(id: string): Promise<boolean> {
    try {
      const filter = this.applyTenantFilter({ id });
      await this.getModel().delete({
        where: filter,
      });

      logger.info(`${this.modelName}.delete`, { 
        id, 
        tenantId: this.tenantId 
      });
      return true;
    } catch (error) {
      logger.error(`${this.modelName}.delete failed`, { error, id });
      throw error;
    }
  }

  /**
   * Count entities
   */
  async count(filter: any = {}): Promise<number> {
    try {
      const tenantFilter = this.applyTenantFilter(filter);
      const count = await this.getModel().count({
        where: tenantFilter,
      });

      logger.debug(`${this.modelName}.count`, { filter: tenantFilter, count });
      return count;
    } catch (error) {
      logger.error(`${this.modelName}.count failed`, { error, filter });
      throw error;
    }
  }

  /**
   * Find with pagination
   */
  async findPaginated(
    filter: any = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: T[]; total: number; page: number; limit: number }> {
    try {
      const tenantFilter = this.applyTenantFilter(filter);
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.getModel().findMany({
          where: tenantFilter,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.getModel().count({
          where: tenantFilter,
        }),
      ]);

      logger.debug(`${this.modelName}.findPaginated`, {
        filter: tenantFilter,
        page,
        limit,
        total,
        returned: data.length,
      });

      return { data, total, page, limit };
    } catch (error) {
      logger.error(`${this.modelName}.findPaginated failed`, {
        error,
        filter,
        page,
        limit,
      });
      throw error;
    }
  }

  /**
   * Bulk operations
   */
  async bulkCreate(items: Partial<T>[]): Promise<number> {
    try {
      const createData = items.map(item => 
        this.tenantId ? { ...item, tenantId: this.tenantId } : item
      );

      const result = await this.getModel().createMany({
        data: createData,
        skipDuplicates: true,
      });

      logger.info(`${this.modelName}.bulkCreate`, {
        count: result.count,
        tenantId: this.tenantId,
      });
      return result.count;
    } catch (error) {
      logger.error(`${this.modelName}.bulkCreate failed`, { error, items });
      throw error;
    }
  }

  /**
   * Execute raw query with audit context
   */
  async executeRaw(query: string, params: any[] = []): Promise<any> {
    try {
      // Set audit context before raw query
      if (this.userId && this.tenantId) {
        await this.setAuditContext(this.userId, this.tenantId);
      }

      const result = await this.db.prisma.$executeRawUnsafe(query, ...params);
      
      logger.debug(`${this.modelName}.executeRaw`, { query, params });
      return result;
    } catch (error) {
      logger.error(`${this.modelName}.executeRaw failed`, { error, query, params });
      throw error;
    }
  }

  /**
   * Transaction wrapper
   */
  async transaction<R>(
    fn: (tx: any) => Promise<R>
  ): Promise<R> {
    try {
      return await this.db.prisma.$transaction(async (tx) => {
        // Set audit context in transaction
        if (this.userId && this.tenantId) {
          await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${this.tenantId}, true)`;
          await tx.$executeRaw`SELECT set_config('app.current_user_id', ${this.userId}, true)`;
        }
        return await fn(tx);
      });
    } catch (error) {
      logger.error(`${this.modelName}.transaction failed`, { error });
      throw error;
    }
  }
}