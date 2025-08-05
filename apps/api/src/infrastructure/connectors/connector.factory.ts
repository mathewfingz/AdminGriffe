/**
 * Database Connector Factory Pattern
 * AdminGriffe - Sistema de Auditoría Integral
 */

import { logger } from '../../services/logger.js';
import { PostgresConnector } from './postgres.connector.js';
import { MySQLConnector } from './mysql.connector.js';
import { MongoConnector } from './mongo.connector.js';

export type DatabaseEngine = 'postgres' | 'mysql' | 'mongodb';

export interface DatabaseConfig {
  engine: DatabaseEngine;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  options?: Record<string, any>;
}

export interface IDatabaseConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
  executeQuery(query: string, params?: any[]): Promise<any>;
  startCDC(callback: (event: CDCEvent) => void): Promise<void>;
  stopCDC(): Promise<void>;
  getEngine(): DatabaseEngine;
  getConnectionInfo(): DatabaseConfig;
}

export interface CDCEvent {
  id: string;
  timestamp: Date;
  database: string;
  schema?: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  before?: Record<string, any>;
  after?: Record<string, any>;
  primaryKey: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Factory for creating database connectors
 */
export class ConnectorFactory {
  private static connectors = new Map<string, IDatabaseConnector>();

  /**
   * Create a database connector based on engine type
   */
  static async createConnector(config: DatabaseConfig): Promise<IDatabaseConnector> {
    const connectionKey = this.generateConnectionKey(config);
    
    // Return existing connector if available
    if (this.connectors.has(connectionKey)) {
      const existingConnector = this.connectors.get(connectionKey)!;
      logger.debug('Reusing existing database connector', { 
        engine: config.engine, 
        host: config.host,
        database: config.database 
      });
      return existingConnector;
    }

    let connector: IDatabaseConnector;

    switch (config.engine) {
      case 'postgres':
        connector = new PostgresConnector(config);
        break;
      
      case 'mysql':
        connector = new MySQLConnector(config);
        break;
      
      case 'mongodb':
        connector = new MongoConnector(config);
        break;
      
      default:
        throw new Error(`Unsupported database engine: ${config.engine}`);
    }

    // Connect and store the connector
    await connector.connect();
    this.connectors.set(connectionKey, connector);

    logger.info('Database connector created successfully', {
      engine: config.engine,
      host: config.host,
      database: config.database,
      connectionKey
    });

    return connector;
  }

  /**
   * Get existing connector by configuration
   */
  static getConnector(config: DatabaseConfig): IDatabaseConnector | null {
    const connectionKey = this.generateConnectionKey(config);
    return this.connectors.get(connectionKey) || null;
  }

  /**
   * Remove and disconnect a connector
   */
  static async removeConnector(config: DatabaseConfig): Promise<void> {
    const connectionKey = this.generateConnectionKey(config);
    const connector = this.connectors.get(connectionKey);
    
    if (connector) {
      await connector.disconnect();
      this.connectors.delete(connectionKey);
      
      logger.info('Database connector removed', {
        engine: config.engine,
        host: config.host,
        database: config.database
      });
    }
  }

  /**
   * Get all active connectors
   */
  static getAllConnectors(): IDatabaseConnector[] {
    return Array.from(this.connectors.values());
  }

  /**
   * Get connectors by engine type
   */
  static getConnectorsByEngine(engine: DatabaseEngine): IDatabaseConnector[] {
    return Array.from(this.connectors.values())
      .filter(connector => connector.getEngine() === engine);
  }

  /**
   * Health check for all connectors
   */
  static async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [key, connector] of this.connectors.entries()) {
      try {
        results[key] = await connector.healthCheck();
      } catch (error) {
        logger.error('Health check failed for connector', { key, error });
        results[key] = false;
      }
    }
    
    return results;
  }

  /**
   * Disconnect all connectors
   */
  static async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connectors.values())
      .map(async (connector) => {
        try {
          await connector.disconnect();
        } catch (error) {
          logger.error('Failed to disconnect connector', { 
            engine: connector.getEngine(),
            error 
          });
        }
      });

    await Promise.all(disconnectPromises);
    this.connectors.clear();
    
    logger.info('All database connectors disconnected');
  }

  /**
   * Create multiple connectors from configuration array
   */
  static async createMultipleConnectors(configs: DatabaseConfig[]): Promise<IDatabaseConnector[]> {
    const connectors: IDatabaseConnector[] = [];
    
    for (const config of configs) {
      try {
        const connector = await this.createConnector(config);
        connectors.push(connector);
      } catch (error) {
        logger.error('Failed to create connector', { config, error });
        // Continue with other connectors even if one fails
      }
    }
    
    logger.info('Multiple connectors created', { 
      total: configs.length, 
      successful: connectors.length 
    });
    
    return connectors;
  }

  /**
   * Start CDC for all connectors
   */
  static async startCDCForAll(callback: (event: CDCEvent) => void): Promise<void> {
    const startPromises = Array.from(this.connectors.values())
      .map(async (connector) => {
        try {
          await connector.startCDC(callback);
          logger.info('CDC started for connector', { engine: connector.getEngine() });
        } catch (error) {
          logger.error('Failed to start CDC for connector', { 
            engine: connector.getEngine(),
            error 
          });
        }
      });

    await Promise.all(startPromises);
    logger.info('CDC started for all available connectors');
  }

  /**
   * Stop CDC for all connectors
   */
  static async stopCDCForAll(): Promise<void> {
    const stopPromises = Array.from(this.connectors.values())
      .map(async (connector) => {
        try {
          await connector.stopCDC();
          logger.info('CDC stopped for connector', { engine: connector.getEngine() });
        } catch (error) {
          logger.error('Failed to stop CDC for connector', { 
            engine: connector.getEngine(),
            error 
          });
        }
      });

    await Promise.all(stopPromises);
    logger.info('CDC stopped for all connectors');
  }

  /**
   * Generate unique connection key
   */
  private static generateConnectionKey(config: DatabaseConfig): string {
    return `${config.engine}://${config.username}@${config.host}:${config.port}/${config.database}`;
  }

  /**
   * Validate database configuration
   */
  static validateConfig(config: DatabaseConfig): boolean {
    const required = ['engine', 'host', 'port', 'database', 'username', 'password'];
    
    for (const field of required) {
      if (!config[field as keyof DatabaseConfig]) {
        logger.error('Missing required database configuration field', { field, config });
        return false;
      }
    }

    if (!['postgres', 'mysql', 'mongodb'].includes(config.engine)) {
      logger.error('Invalid database engine', { engine: config.engine });
      return false;
    }

    return true;
  }

  /**
   * Get connector statistics
   */
  static getStatistics(): {
    total: number;
    byEngine: Record<DatabaseEngine, number>;
    connections: Array<{
      engine: DatabaseEngine;
      host: string;
      database: string;
      connected: boolean;
    }>;
  } {
    const stats = {
      total: this.connectors.size,
      byEngine: {
        postgres: 0,
        mysql: 0,
        mongodb: 0
      } as Record<DatabaseEngine, number>,
      connections: [] as Array<{
        engine: DatabaseEngine;
        host: string;
        database: string;
        connected: boolean;
      }>
    };

    for (const connector of this.connectors.values()) {
      const config = connector.getConnectionInfo();
      stats.byEngine[config.engine]++;
      stats.connections.push({
        engine: config.engine,
        host: config.host,
        database: config.database,
        connected: true // If it's in the map, it's connected
      });
    }

    return stats;
  }
}

/**
 * Singleton instance for global access
 */
export const connectorFactory = ConnectorFactory;