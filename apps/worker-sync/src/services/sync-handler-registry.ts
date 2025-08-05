import { SyncHandler, DatabaseSource } from '../types';
import { PostgresToMySQLHandler } from './handlers/postgres-to-mysql-handler';
import { PostgresToMongoHandler } from './handlers/postgres-to-mongo-handler';
import { MySQLToPostgresHandler } from './handlers/mysql-to-postgres-handler';
import { MySQLToMongoHandler } from './handlers/mysql-to-mongo-handler';
import { MongoToPostgresHandler } from './handlers/mongo-to-postgres-handler';
import { MongoToMySQLHandler } from './handlers/mongo-to-mysql-handler';
import { logger } from '../utils/logger';

export class SyncHandlerRegistry {
  private handlers: Map<string, SyncHandler> = new Map();

  constructor() {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // Register all sync handlers
    this.register(new PostgresToMySQLHandler());
    this.register(new PostgresToMongoHandler());
    this.register(new MySQLToPostgresHandler());
    this.register(new MySQLToMongoHandler());
    this.register(new MongoToPostgresHandler());
    this.register(new MongoToMySQLHandler());

    logger.info(`✅ Registered ${this.handlers.size} sync handlers`);
  }

  private register(handler: SyncHandler): void {
    // Generate all possible source-target combinations for this handler
    const sources: DatabaseSource[] = ['postgres', 'mysql', 'mongodb'];
    const targets: DatabaseSource[] = ['postgres', 'mysql', 'mongodb'];

    for (const source of sources) {
      for (const target of targets) {
        if (source !== target && handler.canHandle(source, target)) {
          const key = this.getHandlerKey(source, target);
          this.handlers.set(key, handler);
          logger.debug(`📝 Registered handler: ${source} -> ${target}`);
        }
      }
    }
  }

  getHandler(source: DatabaseSource, target: DatabaseSource): SyncHandler | undefined {
    const key = this.getHandlerKey(source, target);
    return this.handlers.get(key);
  }

  private getHandlerKey(source: DatabaseSource, target: DatabaseSource): string {
    return `${source}->${target}`;
  }

  getAllHandlers(): Map<string, SyncHandler> {
    return new Map(this.handlers);
  }

  getAvailableRoutes(): string[] {
    return Array.from(this.handlers.keys());
  }
}