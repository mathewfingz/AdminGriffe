import { SyncHandler, CdcEvent, DatabaseSource } from '../../types';
import { logger } from '../../utils/logger';

export abstract class BaseSyncHandler implements SyncHandler {
  protected abstract sourceType: DatabaseSource;
  protected abstract targetType: DatabaseSource;

  canHandle(source: DatabaseSource, target: DatabaseSource): boolean {
    return source === this.sourceType && target === this.targetType;
  }

  async handle(event: CdcEvent, target: DatabaseSource): Promise<void> {
    try {
      logger.debug(`🔄 Handling sync: ${event.source} -> ${target} for table ${event.table}`);

      if (!this.validateMapping(event, target)) {
        throw new Error(`Invalid mapping for ${event.source} -> ${target}`);
      }

      const transformedData = this.transformData(
        event.newData || event.oldData || {},
        event.source,
        target
      );

      const transformedEvent: CdcEvent = {
        ...event,
        newData: event.newData ? transformedData : undefined,
        oldData: event.oldData ? this.transformData(event.oldData, event.source, target) : undefined
      };

      await this.applyToTarget(transformedEvent, target);

      logger.debug(`✅ Successfully synced ${event.id} to ${target}`);

    } catch (error) {
      logger.error(`❌ Failed to sync ${event.id} to ${target}:`, error);
      throw error;
    }
  }

  validateMapping(event: CdcEvent, target: DatabaseSource): boolean {
    // Basic validation - can be overridden by specific handlers
    if (!event.table) {
      logger.error('❌ Missing table name in event');
      return false;
    }

    if (!event.primaryKey || Object.keys(event.primaryKey).length === 0) {
      logger.error('❌ Missing primary key in event');
      return false;
    }

    if (event.operation === 'INSERT' && !event.newData) {
      logger.error('❌ Missing new data for INSERT operation');
      return false;
    }

    if (event.operation === 'UPDATE' && (!event.newData || !event.oldData)) {
      logger.error('❌ Missing data for UPDATE operation');
      return false;
    }

    return true;
  }

  transformData(data: Record<string, any>, source: DatabaseSource, target: DatabaseSource): Record<string, any> {
    // Base transformation - can be overridden by specific handlers
    let transformed = { ...data };

    // Handle common transformations
    transformed = this.handleTimestamps(transformed, source, target);
    transformed = this.handleBooleans(transformed, source, target);
    transformed = this.handleNulls(transformed, source, target);
    transformed = this.handlePrimaryKeys(transformed, source, target);

    return transformed;
  }

  protected handleTimestamps(data: Record<string, any>, source: DatabaseSource, target: DatabaseSource): Record<string, any> {
    const result = { ...data };

    for (const [key, value] of Object.entries(result)) {
      if (value instanceof Date || (typeof value === 'string' && this.isTimestamp(value))) {
        switch (target) {
          case 'mongodb':
            result[key] = new Date(value);
            break;
          case 'postgres':
          case 'mysql':
            result[key] = new Date(value).toISOString();
            break;
        }
      }
    }

    return result;
  }

  protected handleBooleans(data: Record<string, any>, source: DatabaseSource, target: DatabaseSource): Record<string, any> {
    const result = { ...data };

    for (const [key, value] of Object.entries(result)) {
      if (typeof value === 'boolean') {
        switch (target) {
          case 'mysql':
            result[key] = value ? 1 : 0;
            break;
          case 'postgres':
          case 'mongodb':
            result[key] = value;
            break;
        }
      }
    }

    return result;
  }

  protected handleNulls(data: Record<string, any>, source: DatabaseSource, target: DatabaseSource): Record<string, any> {
    const result = { ...data };

    // Remove undefined values
    for (const key of Object.keys(result)) {
      if (result[key] === undefined) {
        delete result[key];
      }
    }

    return result;
  }

  protected handlePrimaryKeys(data: Record<string, any>, source: DatabaseSource, target: DatabaseSource): Record<string, any> {
    const result = { ...data };

    // Handle MongoDB _id field
    if (target === 'mongodb' && result.id && !result._id) {
      result._id = result.id;
      delete result.id;
    } else if (source === 'mongodb' && result._id && !result.id) {
      result.id = result._id;
      delete result._id;
    }

    return result;
  }

  protected isTimestamp(value: string): boolean {
    const timestampRegex = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/;
    return timestampRegex.test(value);
  }

  protected abstract applyToTarget(event: CdcEvent, target: DatabaseSource): Promise<void>;
}