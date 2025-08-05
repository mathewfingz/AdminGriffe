import { DatabaseConnector, DatabaseSource } from '../types';
import { Config } from '../config';
import { PostgresConnector } from './connectors/postgres-connector';
import { MySQLConnector } from './connectors/mysql-connector';
import { MongoDBConnector } from './connectors/mongodb-connector';
import { logger } from '../utils/logger';

export class DatabaseConnectorFactory {
  private connectors: Map<DatabaseSource, DatabaseConnector> = new Map();

  constructor(private config: Config) {}

  async initializeAll(): Promise<void> {
    try {
      // Initialize PostgreSQL connector
      const pgConnector = new PostgresConnector(this.config.DATABASE_URL);
      await pgConnector.connect();
      this.connectors.set('postgres', pgConnector);
      logger.info('✅ PostgreSQL connector initialized');

      // Initialize MySQL connector if configured
      if (this.config.MYSQL_URL) {
        const mysqlConnector = new MySQLConnector(this.config.MYSQL_URL);
        await mysqlConnector.connect();
        this.connectors.set('mysql', mysqlConnector);
        logger.info('✅ MySQL connector initialized');
      }

      // Initialize MongoDB connector if configured
      if (this.config.MONGODB_URL) {
        const mongoConnector = new MongoDBConnector(this.config.MONGODB_URL);
        await mongoConnector.connect();
        this.connectors.set('mongodb', mongoConnector);
        logger.info('✅ MongoDB connector initialized');
      }

    } catch (error) {
      logger.error('💥 Failed to initialize database connectors:', error);
      throw error;
    }
  }

  getConnector(source: DatabaseSource): DatabaseConnector | undefined {
    return this.connectors.get(source);
  }

  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connectors.values()).map(
      connector => connector.disconnect()
    );
    
    await Promise.all(disconnectPromises);
    this.connectors.clear();
    logger.info('✅ All database connectors disconnected');
  }

  async healthCheck(): Promise<Record<DatabaseSource, boolean>> {
    const health: Record<string, boolean> = {};
    
    for (const [source, connector] of this.connectors) {
      try {
        health[source] = await connector.healthCheck();
      } catch (error) {
        logger.error(`❌ Health check failed for ${source}:`, error);
        health[source] = false;
      }
    }
    
    return health as Record<DatabaseSource, boolean>;
  }
}