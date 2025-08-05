import { SyncEvent } from './sync';
import { db } from './database';
import { logger } from './logger';

/**
 * Interface for sync handlers
 */
export interface ISyncHandler {
  apply(event: SyncEvent): Promise<void>;
}

/**
 * Base sync handler with common functionality
 */
abstract class BaseSyncHandler implements ISyncHandler {
  abstract apply(event: SyncEvent): Promise<void>;

  protected mapOperation(operation: string): string {
    switch (operation) {
      case 'INSERT':
        return 'create';
      case 'UPDATE':
        return 'update';
      case 'DELETE':
        return 'delete';
      default:
        return 'update';
    }
  }

  protected sanitizeData(data: Record<string, any>): Record<string, any> {
    // Remove null values and sanitize data
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}

/**
 * PostgreSQL to MongoDB sync handler
 */
export class PostgresToMongoHandler extends BaseSyncHandler {
  async apply(event: SyncEvent): Promise<void> {
    try {
      logger.info('Applying PostgreSQL to MongoDB sync', {
        eventId: event.id,
        table: event.tableName,
        operation: event.operation,
      });

      // Transform PostgreSQL data to MongoDB format
      const mongoData = this.transformToMongo(event.data || {});
      
      // Apply operation based on type
      switch (event.operation) {
        case 'INSERT':
          await this.insertToMongo(event.tableName, mongoData, event.recordId);
          break;
        case 'UPDATE':
          await this.updateInMongo(event.tableName, mongoData, event.recordId);
          break;
        case 'DELETE':
          await this.deleteFromMongo(event.tableName, event.recordId);
          break;
      }

      logger.info('PostgreSQL to MongoDB sync completed', { eventId: event.id });
    } catch (error) {
      logger.error('PostgreSQL to MongoDB sync failed', { error, event });
      throw error;
    }
  }

  private transformToMongo(data: Record<string, any>): Record<string, any> {
    const transformed = { ...data };
    
    // Convert PostgreSQL specific types
    for (const [key, value] of Object.entries(transformed)) {
      if (value instanceof Date) {
        transformed[key] = value.toISOString();
      } else if (typeof value === 'boolean') {
        transformed[key] = value;
      } else if (Array.isArray(value)) {
        transformed[key] = value;
      }
    }
    
    return this.sanitizeData(transformed);
  }

  private async insertToMongo(collection: string, data: Record<string, any>, id: string): Promise<void> {
    // Mock MongoDB insert - in production, use actual MongoDB client
    logger.info(`MongoDB INSERT: ${collection}`, { id, data });
  }

  private async updateInMongo(collection: string, data: Record<string, any>, id: string): Promise<void> {
    // Mock MongoDB update - in production, use actual MongoDB client
    logger.info(`MongoDB UPDATE: ${collection}`, { id, data });
  }

  private async deleteFromMongo(collection: string, id: string): Promise<void> {
    // Mock MongoDB delete - in production, use actual MongoDB client
    logger.info(`MongoDB DELETE: ${collection}`, { id });
  }
}

/**
 * MongoDB to PostgreSQL sync handler
 */
export class MongoToPostgresHandler extends BaseSyncHandler {
  async apply(event: SyncEvent): Promise<void> {
    try {
      logger.info('Applying MongoDB to PostgreSQL sync', {
        eventId: event.id,
        table: event.tableName,
        operation: event.operation,
      });

      // Transform MongoDB data to PostgreSQL format
      const pgData = this.transformToPostgres(event.data || {});
      
      // Apply operation based on type
      switch (event.operation) {
        case 'INSERT':
          await this.insertToPostgres(event.tableName, pgData);
          break;
        case 'UPDATE':
          await this.updateInPostgres(event.tableName, pgData, event.recordId);
          break;
        case 'DELETE':
          await this.deleteFromPostgres(event.tableName, event.recordId);
          break;
      }

      logger.info('MongoDB to PostgreSQL sync completed', { eventId: event.id });
    } catch (error) {
      logger.error('MongoDB to PostgreSQL sync failed', { error, event });
      throw error;
    }
  }

  private transformToPostgres(data: Record<string, any>): Record<string, any> {
    const transformed = { ...data };
    
    // Convert MongoDB specific types
    for (const [key, value] of Object.entries(transformed)) {
      if (typeof value === 'string' && this.isISODate(value)) {
        transformed[key] = new Date(value);
      } else if (value && typeof value === 'object' && value._id) {
        // Convert MongoDB ObjectId to string
        transformed[key] = value._id.toString();
      }
    }
    
    return this.sanitizeData(transformed);
  }

  private isISODate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
  }

  private async insertToPostgres(table: string, data: Record<string, any>): Promise<void> {
    // Use Prisma or raw SQL to insert
    logger.info(`PostgreSQL INSERT: ${table}`, { data });
    // Example: await db.raw(`INSERT INTO ${table} ...`, data);
  }

  private async updateInPostgres(table: string, data: Record<string, any>, id: string): Promise<void> {
    // Use Prisma or raw SQL to update
    logger.info(`PostgreSQL UPDATE: ${table}`, { id, data });
    // Example: await db.raw(`UPDATE ${table} SET ... WHERE id = ?`, [data, id]);
  }

  private async deleteFromPostgres(table: string, id: string): Promise<void> {
    // Use Prisma or raw SQL to delete
    logger.info(`PostgreSQL DELETE: ${table}`, { id });
    // Example: await db.raw(`DELETE FROM ${table} WHERE id = ?`, [id]);
  }
}

/**
 * PostgreSQL to MySQL sync handler
 */
export class PostgresToMySQLHandler extends BaseSyncHandler {
  async apply(event: SyncEvent): Promise<void> {
    try {
      logger.info('Applying PostgreSQL to MySQL sync', {
        eventId: event.id,
        table: event.tableName,
        operation: event.operation,
      });

      // Transform PostgreSQL data to MySQL format
      const mysqlData = this.transformToMySQL(event.data || {});
      
      // Apply operation based on type
      switch (event.operation) {
        case 'INSERT':
          await this.insertToMySQL(event.tableName, mysqlData);
          break;
        case 'UPDATE':
          await this.updateInMySQL(event.tableName, mysqlData, event.recordId);
          break;
        case 'DELETE':
          await this.deleteFromMySQL(event.tableName, event.recordId);
          break;
      }

      logger.info('PostgreSQL to MySQL sync completed', { eventId: event.id });
    } catch (error) {
      logger.error('PostgreSQL to MySQL sync failed', { error, event });
      throw error;
    }
  }

  private transformToMySQL(data: Record<string, any>): Record<string, any> {
    const transformed = { ...data };
    
    // Convert PostgreSQL specific types to MySQL compatible
    for (const [key, value] of Object.entries(transformed)) {
      if (value instanceof Date) {
        transformed[key] = value.toISOString().slice(0, 19).replace('T', ' ');
      } else if (typeof value === 'boolean') {
        transformed[key] = value ? 1 : 0;
      } else if (Array.isArray(value)) {
        transformed[key] = JSON.stringify(value);
      }
    }
    
    return this.sanitizeData(transformed);
  }

  private async insertToMySQL(table: string, data: Record<string, any>): Promise<void> {
    // Mock MySQL insert - in production, use actual MySQL client
    logger.info(`MySQL INSERT: ${table}`, { data });
  }

  private async updateInMySQL(table: string, data: Record<string, any>, id: string): Promise<void> {
    // Mock MySQL update - in production, use actual MySQL client
    logger.info(`MySQL UPDATE: ${table}`, { id, data });
  }

  private async deleteFromMySQL(table: string, id: string): Promise<void> {
    // Mock MySQL delete - in production, use actual MySQL client
    logger.info(`MySQL DELETE: ${table}`, { id });
  }
}

/**
 * Default sync handler for unsupported combinations
 */
export class DefaultSyncHandler extends BaseSyncHandler {
  async apply(event: SyncEvent): Promise<void> {
    logger.warn('Using default sync handler - no specific handler available', {
      sourceDb: event.sourceDb,
      targetDb: event.targetDb,
      eventId: event.id,
    });

    // Log the sync event for manual processing
    logger.info('Default sync operation', {
      event,
      message: 'This sync operation requires manual implementation',
    });
  }
}