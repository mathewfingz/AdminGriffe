import { BaseSyncHandler } from './base-sync-handler';
import { CdcEvent, DatabaseSource } from '../../types';
import { DatabaseConnectorFactory } from '../database-connector-factory';
import { logger } from '../../utils/logger';

export class PostgresToMySQLHandler extends BaseSyncHandler {
  protected sourceType: DatabaseSource = 'postgres';
  protected targetType: DatabaseSource = 'mysql';

  private static connectorFactory: DatabaseConnectorFactory;

  static setConnectorFactory(factory: DatabaseConnectorFactory) {
    PostgresToMySQLHandler.connectorFactory = factory;
  }

  protected async applyToTarget(event: CdcEvent, target: DatabaseSource): Promise<void> {
    const connector = PostgresToMySQLHandler.connectorFactory?.getConnector(target);
    
    if (!connector) {
      throw new Error(`No connector available for ${target}`);
    }

    await connector.applyChange(event);
  }

  transformData(data: Record<string, any>, source: DatabaseSource, target: DatabaseSource): Record<string, any> {
    let transformed = super.transformData(data, source, target);

    // PostgreSQL to MySQL specific transformations
    transformed = this.handlePostgresToMySQL(transformed);

    return transformed;
  }

  private handlePostgresToMySQL(data: Record<string, any>): Record<string, any> {
    const result = { ...data };

    for (const [key, value] of Object.entries(result)) {
      // Handle PostgreSQL arrays -> MySQL JSON
      if (Array.isArray(value)) {
        result[key] = JSON.stringify(value);
      }

      // Handle PostgreSQL JSON/JSONB -> MySQL JSON
      if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        result[key] = JSON.stringify(value);
      }

      // Handle PostgreSQL UUID -> MySQL VARCHAR
      if (typeof value === 'string' && this.isUUID(value)) {
        result[key] = value.toLowerCase();
      }

      // Handle PostgreSQL ENUM -> MySQL VARCHAR
      if (typeof value === 'string' && this.isEnum(key)) {
        result[key] = value;
      }

      // Handle PostgreSQL BYTEA -> MySQL BLOB
      if (value instanceof Buffer) {
        result[key] = value;
      }
    }

    return result;
  }

  private isUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private isEnum(fieldName: string): boolean {
    // Common enum field patterns
    const enumPatterns = ['status', 'type', 'role', 'state', 'category'];
    return enumPatterns.some(pattern => fieldName.toLowerCase().includes(pattern));
  }

  validateMapping(event: CdcEvent, target: DatabaseSource): boolean {
    if (!super.validateMapping(event, target)) {
      return false;
    }

    // PostgreSQL to MySQL specific validations
    if (target === 'mysql') {
      // Check for MySQL reserved words
      const reservedWords = ['order', 'group', 'select', 'from', 'where'];
      if (reservedWords.includes(event.table.toLowerCase())) {
        logger.warn(`⚠️ Table name '${event.table}' is a MySQL reserved word`);
      }

      // Validate field names for MySQL compatibility
      if (event.newData) {
        for (const fieldName of Object.keys(event.newData)) {
          if (fieldName.length > 64) {
            logger.error(`❌ Field name '${fieldName}' exceeds MySQL limit of 64 characters`);
            return false;
          }
        }
      }
    }

    return true;
  }
}