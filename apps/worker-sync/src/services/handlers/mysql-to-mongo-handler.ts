import { BaseSyncHandler } from './base-sync-handler';
import { CdcEvent, DatabaseSource } from '../../types';
import { DatabaseConnectorFactory } from '../database-connector-factory';
import { logger } from '../../utils/logger';

export class MySQLToMongoHandler extends BaseSyncHandler {
  protected sourceType: DatabaseSource = 'mysql';
  protected targetType: DatabaseSource = 'mongodb';

  private static connectorFactory: DatabaseConnectorFactory;

  static setConnectorFactory(factory: DatabaseConnectorFactory) {
    MySQLToMongoHandler.connectorFactory = factory;
  }

  protected async applyToTarget(event: CdcEvent, target: DatabaseSource): Promise<void> {
    const connector = MySQLToMongoHandler.connectorFactory?.getConnector(target);
    
    if (!connector) {
      throw new Error(`No connector available for ${target}`);
    }

    await connector.applyChange(event);
  }

  transformData(data: Record<string, any>, source: DatabaseSource, target: DatabaseSource): Record<string, any> {
    let transformed = super.transformData(data, source, target);

    // MySQL to MongoDB specific transformations
    transformed = this.handleMySQLToMongo(transformed);

    return transformed;
  }

  private handleMySQLToMongo(data: Record<string, any>): Record<string, any> {
    const result = { ...data };

    for (const [key, value] of Object.entries(result)) {
      // Handle MySQL JSON -> MongoDB objects
      if (typeof value === 'string' && this.isJsonString(value)) {
        try {
          result[key] = JSON.parse(value);
        } catch {
          result[key] = value;
        }
      }

      // Handle MySQL TINYINT(1) -> MongoDB boolean
      if (typeof value === 'number' && this.isBooleanField(key)) {
        result[key] = value === 1;
      }

      // Handle MySQL DECIMAL/NUMERIC -> MongoDB number
      if (typeof value === 'string' && this.isDecimal(value)) {
        const num = parseFloat(value);
        result[key] = isNaN(num) ? value : num;
      }

      // Handle MySQL BINARY/VARBINARY -> MongoDB Binary
      if (value instanceof Buffer) {
        result[key] = value;
      }

      // Handle MySQL ENUM -> MongoDB string
      if (typeof value === 'string' && this.isEnum(key)) {
        result[key] = value;
      }

      // Handle MySQL SET -> MongoDB array
      if (typeof value === 'string' && this.isSet(key)) {
        result[key] = value.split(',').map(v => v.trim());
      }

      // Handle MySQL GEOMETRY types
      if (this.isGeometry(value)) {
        result[key] = this.convertGeometry(value);
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

  private isBooleanField(fieldName: string): boolean {
    const booleanPatterns = ['is_', 'has_', 'can_', 'should_', 'enabled', 'active', 'deleted'];
    return booleanPatterns.some(pattern => fieldName.toLowerCase().includes(pattern));
  }

  private isDecimal(value: string): boolean {
    return /^-?\d+\.\d+$/.test(value);
  }

  private isEnum(fieldName: string): boolean {
    const enumPatterns = ['status', 'type', 'role', 'state', 'category'];
    return enumPatterns.some(pattern => fieldName.toLowerCase().includes(pattern));
  }

  private isSet(fieldName: string): boolean {
    const setPatterns = ['tags', 'permissions', 'flags', 'options'];
    return setPatterns.some(pattern => fieldName.toLowerCase().includes(pattern));
  }

  private isGeometry(value: any): boolean {
    return value && typeof value === 'object' && value.type && value.coordinates;
  }

  private convertGeometry(value: any): any {
    // Convert MySQL geometry to GeoJSON format for MongoDB
    return {
      type: value.type || 'Point',
      coordinates: value.coordinates || [0, 0]
    };
  }

  validateMapping(event: CdcEvent, target: DatabaseSource): boolean {
    if (!super.validateMapping(event, target)) {
      return false;
    }

    // MySQL to MongoDB specific validations
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