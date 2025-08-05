import { BaseSyncHandler } from './base-sync-handler';
import { CdcEvent, DatabaseSource } from '../../types';
import { DatabaseConnectorFactory } from '../database-connector-factory';
import { logger } from '../../utils/logger';

export class PostgresToMongoHandler extends BaseSyncHandler {
  protected sourceType: DatabaseSource = 'postgres';
  protected targetType: DatabaseSource = 'mongodb';

  private static connectorFactory: DatabaseConnectorFactory;

  static setConnectorFactory(factory: DatabaseConnectorFactory) {
    PostgresToMongoHandler.connectorFactory = factory;
  }

  protected async applyToTarget(event: CdcEvent, target: DatabaseSource): Promise<void> {
    const connector = PostgresToMongoHandler.connectorFactory?.getConnector(target);
    
    if (!connector) {
      throw new Error(`No connector available for ${target}`);
    }

    await connector.applyChange(event);
  }

  transformData(data: Record<string, any>, source: DatabaseSource, target: DatabaseSource): Record<string, any> {
    let transformed = super.transformData(data, source, target);

    // PostgreSQL to MongoDB specific transformations
    transformed = this.handlePostgresToMongo(transformed);

    return transformed;
  }

  private handlePostgresToMongo(data: Record<string, any>): Record<string, any> {
    const result = { ...data };

    for (const [key, value] of Object.entries(result)) {
      // Handle PostgreSQL arrays -> MongoDB arrays (keep as-is)
      if (Array.isArray(value)) {
        result[key] = value;
      }

      // Handle PostgreSQL JSON/JSONB -> MongoDB objects
      if (typeof value === 'string' && this.isJsonString(value)) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          // Keep as string if not valid JSON
          result[key] = value;
        }
      }

      // Handle PostgreSQL UUID -> MongoDB string
      if (typeof value === 'string' && this.isUUID(value)) {
        result[key] = value.toLowerCase();
      }

      // Handle PostgreSQL BYTEA -> MongoDB Binary
      if (value instanceof Buffer) {
        result[key] = value;
      }

      // Handle PostgreSQL numeric types
      if (typeof value === 'string' && this.isNumeric(value)) {
        const num = parseFloat(value);
        result[key] = isNaN(num) ? value : num;
      }
    }

    return result;
  }

  private isJsonString(value: string): boolean {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null;
    } catch {
      return false;
    }
  }

  private isUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  private isNumeric(value: string): boolean {
    return /^-?\d+(\.\d+)?$/.test(value);
  }

  validateMapping(event: CdcEvent, target: DatabaseSource): boolean {
    if (!super.validateMapping(event, target)) {
      return false;
    }

    // PostgreSQL to MongoDB specific validations
    if (target === 'mongodb') {
      // Check for MongoDB field name restrictions
      if (event.newData) {
        for (const fieldName of Object.keys(event.newData)) {
          if (fieldName.startsWith('$')) {
            logger.error(`❌ Field name '${fieldName}' cannot start with $ in MongoDB`);
            return false;
          }
          if (fieldName.includes('.')) {
            logger.error(`❌ Field name '${fieldName}' cannot contain dots in MongoDB`);
            return false;
          }
        }
      }

      // Validate collection name
      if (event.table.length > 120) {
        logger.error(`❌ Collection name '${event.table}' exceeds MongoDB limit of 120 characters`);
        return false;
      }
    }

    return true;
  }
}