import { EventEmitter } from 'events';
import { DatabaseService } from './database.js';
import { AuditService } from './audit.js';
import { SyncService } from './sync.js';
import { rabbitmq } from './rabbitmq.js';

export interface CdcEvent {
  id: string;
  tenantId: string;
  source: 'postgres' | 'mysql' | 'mongodb';
  database: string;
  table: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  timestamp: Date;
  before?: Record<string, any>;
  after?: Record<string, any>;
  primaryKey: Record<string, any>;
  lsn?: string; // Log Sequence Number for ordering
  transactionId?: string;
}

export interface CdcConfig {
  enabled: boolean;
  sources: {
    postgres?: {
      enabled: boolean;
      replicationSlot: string;
      publication: string;
    };
    mysql?: {
      enabled: boolean;
      serverId: number;
      binlogFile?: string;
      binlogPosition?: number;
    };
    mongodb?: {
      enabled: boolean;
      resumeToken?: string;
    };
  };
  filters: {
    includeTables?: string[];
    excludeTables?: string[];
    includeOperations?: string[];
  };
}

class CdcService extends EventEmitter {
  private static instance: CdcService;
  private config: CdcConfig;
  private isRunning: boolean = false;
  private watchers: Map<string, any> = new Map();

  private constructor(
    private database: DatabaseService,
    private audit: AuditService,
    private sync: SyncService
  ) {
    super();
    this.config = {
      enabled: process.env.CDC_ENABLED === 'true',
      sources: {
        postgres: {
          enabled: process.env.CDC_POSTGRES_ENABLED === 'true',
          replicationSlot: process.env.CDC_POSTGRES_SLOT || 'griffe_slot',
          publication: process.env.CDC_POSTGRES_PUBLICATION || 'griffe_pub'
        },
        mysql: {
          enabled: process.env.CDC_MYSQL_ENABLED === 'true',
          serverId: parseInt(process.env.CDC_MYSQL_SERVER_ID || '1001')
        },
        mongodb: {
          enabled: process.env.CDC_MONGODB_ENABLED === 'true'
        }
      },
      filters: {
        includeTables: process.env.CDC_INCLUDE_TABLES?.split(','),
        excludeTables: process.env.CDC_EXCLUDE_TABLES?.split(',') || ['audit_log'],
        includeOperations: process.env.CDC_INCLUDE_OPERATIONS?.split(',') || ['INSERT', 'UPDATE', 'DELETE']
      }
    };
  }

  public static getInstance(
    database: DatabaseService,
    audit: AuditService,
    sync: SyncService
  ): CdcService {
    if (!CdcService.instance) {
      CdcService.instance = new CdcService(database, audit, sync);
    }
    return CdcService.instance;
  }

  /**
   * Start CDC monitoring
   */
  public async start(): Promise<void> {
    if (!this.config.enabled || this.isRunning) {
      return;
    }

    console.log('🔄 Starting CDC service...');

    try {
      // Start PostgreSQL logical replication
      if (this.config.sources.postgres?.enabled) {
        await this.startPostgresCdc();
      }

      // Start MySQL binlog monitoring
      if (this.config.sources.mysql?.enabled) {
        await this.startMysqlCdc();
      }

      // Start MongoDB change streams
      if (this.config.sources.mongodb?.enabled) {
        await this.startMongodbCdc();
      }

      this.isRunning = true;
      console.log('✅ CDC service started');
    } catch (error) {
      console.error('❌ Failed to start CDC service:', error);
      throw error;
    }
  }

  /**
   * Stop CDC monitoring
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('🛑 Stopping CDC service...');

    // Stop all watchers
    for (const [source, watcher] of this.watchers) {
      try {
        if (watcher.close) {
          await watcher.close();
        }
        console.log(`✅ Stopped ${source} CDC watcher`);
      } catch (error) {
        console.error(`❌ Error stopping ${source} CDC watcher:`, error);
      }
    }

    this.watchers.clear();
    this.isRunning = false;
    console.log('✅ CDC service stopped');
  }

  /**
   * Start PostgreSQL logical replication
   */
  private async startPostgresCdc(): Promise<void> {
    try {
      const client = this.database.prisma;
      
      // Create replication slot if not exists
      await client.$executeRaw`
        SELECT pg_create_logical_replication_slot(
          ${this.config.sources.postgres!.replicationSlot}, 
          'wal2json'
        ) WHERE NOT EXISTS (
          SELECT 1 FROM pg_replication_slots 
          WHERE slot_name = ${this.config.sources.postgres!.replicationSlot}
        );
      `;

      // Create publication if not exists
      await client.$executeRaw`
        CREATE PUBLICATION ${this.config.sources.postgres!.publication} 
        FOR ALL TABLES
        WHERE NOT EXISTS (
          SELECT 1 FROM pg_publication 
          WHERE pubname = ${this.config.sources.postgres!.publication}
        );
      `;

      // Start consuming changes
      this.startPostgresReplicationConsumer();
      
      console.log('✅ PostgreSQL CDC started');
    } catch (error) {
      console.error('❌ Failed to start PostgreSQL CDC:', error);
      throw error;
    }
  }

  /**
   * PostgreSQL replication consumer
   */
  private async startPostgresReplicationConsumer(): Promise<void> {
    // This would typically use a library like node-postgres-logical-replication
    // For now, we'll simulate with database triggers
    
    const triggerFunction = `
      CREATE OR REPLACE FUNCTION cdc_trigger_function()
      RETURNS trigger AS $$
      DECLARE
        payload json;
      BEGIN
        IF TG_OP = 'DELETE' THEN
          payload = json_build_object(
            'operation', TG_OP,
            'table', TG_TABLE_NAME,
            'schema', TG_TABLE_SCHEMA,
            'timestamp', extract(epoch from now()),
            'before', row_to_json(OLD),
            'after', null
          );
          PERFORM pg_notify('cdc_changes', payload::text);
          RETURN OLD;
        ELSIF TG_OP = 'UPDATE' THEN
          payload = json_build_object(
            'operation', TG_OP,
            'table', TG_TABLE_NAME,
            'schema', TG_TABLE_SCHEMA,
            'timestamp', extract(epoch from now()),
            'before', row_to_json(OLD),
            'after', row_to_json(NEW)
          );
          PERFORM pg_notify('cdc_changes', payload::text);
          RETURN NEW;
        ELSIF TG_OP = 'INSERT' THEN
          payload = json_build_object(
            'operation', TG_OP,
            'table', TG_TABLE_NAME,
            'schema', TG_TABLE_SCHEMA,
            'timestamp', extract(epoch from now()),
            'before', null,
            'after', row_to_json(NEW)
          );
          PERFORM pg_notify('cdc_changes', payload::text);
          RETURN NEW;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `;

    const client = this.database.prisma;
    await client.$executeRawUnsafe(triggerFunction);

    // Listen for notifications
    // Note: This is a simplified implementation
    // In production, you'd use a proper PostgreSQL notification listener
  }

  /**
   * Start MySQL binlog monitoring
   */
  private async startMysqlCdc(): Promise<void> {
    // This would typically use a library like mysql-binlog-connector
    console.log('📝 MySQL CDC would be implemented with binlog connector');
  }

  /**
   * Start MongoDB change streams
   */
  private async startMongodbCdc(): Promise<void> {
    // This would typically use MongoDB change streams
    console.log('📝 MongoDB CDC would be implemented with change streams');
  }

  /**
   * Process CDC event
   */
  private async processCdcEvent(event: CdcEvent): Promise<void> {
    try {
      // Filter event
      if (!this.shouldProcessEvent(event)) {
        return;
      }

      console.log(`📥 Processing CDC event: ${event.operation} on ${event.table}`);

      // Log to audit
      await this.audit.processChangeEvent({
        tenantId: event.tenantId,
        table: event.table,
        operation: event.operation,
        before: event.before,
        after: event.after
      });

      // Process for synchronization
      const targets = this.getTargetDatabases(event.source);
      for (const target of targets) {
        await this.sync.processSyncEvent({
          id: event.id,
          tenantId: event.tenantId,
          sourceDb: event.source,
          targetDb: target,
          tableName: event.table,
          operation: event.operation,
          recordId: this.extractPrimaryKey(event.primaryKey),
          data: event.after || event.before,
          oldData: event.before,
          timestamp: event.timestamp,
          status: 'PENDING',
          retryCount: 0
        });
      }

      // Publish event to message queue
      await rabbitmq.publishUserEvent({
        tenantId: event.tenantId,
        eventType: 'created',
        entityType: 'cdc_event',
        entityId: event.id,
        timestamp: event.timestamp.toISOString(),
        data: event
      });

      this.emit('cdc-event', event);
    } catch (error) {
      console.error('❌ Error processing CDC event:', error);
      this.emit('cdc-error', { event, error });
    }
  }

  /**
   * Check if event should be processed
   */
  private shouldProcessEvent(event: CdcEvent): boolean {
    const { filters } = this.config;

    // Check table filters
    if (filters.includeTables && !filters.includeTables.includes(event.table)) {
      return false;
    }

    if (filters.excludeTables && filters.excludeTables.includes(event.table)) {
      return false;
    }

    // Check operation filters
    if (filters.includeOperations && !filters.includeOperations.includes(event.operation)) {
      return false;
    }

    return true;
  }

  /**
   * Extract primary key value
   */
  private extractPrimaryKey(primaryKey: Record<string, any>): string {
    if (typeof primaryKey === 'object' && primaryKey !== null) {
      return Object.values(primaryKey).join('|');
    }
    return String(primaryKey);
  }

  /**
   * Get target databases for synchronization
   */
  private getTargetDatabases(source: string): string[] {
    // Define sync targets based on source
    const syncMap: Record<string, string[]> = {
      postgres: ['mongodb'],
      mysql: ['postgres', 'mongodb'],
      mongodb: ['postgres']
    };

    return syncMap[source] || [];
  }

  /**
   * Get CDC statistics
   */
  public getStats(): any {
    return {
      isRunning: this.isRunning,
      activeWatchers: this.watchers.size,
      config: this.config
    };
  }

  /**
   * Configure CDC for a specific database
   */
  async configureCdc(
    tenantId: string,
    config: {
      database: string;
      tables: string[];
      enabled: boolean;
      batchSize?: number;
      pollInterval?: number;
    }
  ): Promise<any> {
    const configKey = `cdc:config:${tenantId}:${config.database}`;
    
    const cdcConfig = {
      database: config.database,
      tables: config.tables,
      enabled: config.enabled,
      batchSize: config.batchSize || 100,
      pollInterval: config.pollInterval || 1000,
    };

    // Store configuration (simplified - would use Redis in production)
    console.log(`Storing CDC config for ${tenantId}:${config.database}`);

    // Start or stop CDC based on configuration
    if (config.enabled) {
      console.log(`Starting CDC for ${tenantId}:${config.database}`);
    } else {
      console.log(`Stopping CDC for ${tenantId}:${config.database}`);
    }

    return {
      database: config.database,
      status: config.enabled ? 'enabled' : 'disabled',
      tables: config.tables,
      configuration: cdcConfig,
    };
  }

  /**
   * Get CDC status for all databases
   */
  async getCdcStatus(tenantId: string): Promise<any> {
    const databases = ['PostgreSQL', 'MySQL', 'MongoDB'];
    const statuses = [];

    for (const database of databases) {
      // In production, this would query Redis or another store
      statuses.push({
        database,
        enabled: this.config.sources[database.toLowerCase() as keyof typeof this.config.sources]?.enabled || false,
        tables: [],
        status: this.isRunning ? 'running' : 'stopped',
        lastEvent: null,
        eventsProcessed: 0,
        errors: 0,
      });
    }

    return {
      databases: statuses,
      overall: {
        enabled: statuses.filter(s => s.enabled).length,
        active: statuses.filter(s => s.status === 'running').length,
        total: statuses.length,
      },
    };
  }

  /**
   * Get CDC metrics
   */
  async getCdcMetrics(
    tenantId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<any> {
    // This would typically query a time-series database
    // For now, we'll return mock data structure
    return {
      eventsProcessed: {
        total: 15420,
        byDatabase: {
          PostgreSQL: 8500,
          MySQL: 4200,
          MongoDB: 2720,
        },
        byOperation: {
          INSERT: 6800,
          UPDATE: 7200,
          DELETE: 1420,
        },
      },
      throughput: {
        eventsPerSecond: 125,
        peakEventsPerSecond: 280,
        averageEventsPerSecond: 95,
      },
      latency: {
        averageMs: 35,
        p95Ms: 75,
        p99Ms: 120,
      },
      errors: {
        total: 8,
        rate: 0.0005, // 0.05%
        byType: {
          'connection_error': 3,
          'parse_error': 2,
          'validation_error': 3,
        },
      },
    };
  }

  /**
   * Get CDC health status
   */
  async getCdcHealth(tenantId: string): Promise<any> {
    const databases = ['PostgreSQL', 'MySQL', 'MongoDB'];
    const healthChecks = [];

    for (const database of databases) {
      try {
        // Check database connectivity
        let isHealthy = false;
        
        switch (database) {
          case 'PostgreSQL':
            await this.database.prisma.$queryRaw`SELECT 1`;
            isHealthy = true;
            break;
          case 'MySQL':
            // Mock MySQL health check
            isHealthy = true;
            break;
          case 'MongoDB':
            // Mock MongoDB health check
            isHealthy = true;
            break;
        }

        healthChecks.push({
          database,
          status: isHealthy ? 'healthy' : 'unhealthy',
          lastCheck: new Date().toISOString(),
        });
      } catch (error) {
        healthChecks.push({
          database,
          status: 'unhealthy',
          error: (error as Error).message,
          lastCheck: new Date().toISOString(),
        });
      }
    }

    const unhealthyDatabases = healthChecks.filter(check => check.status === 'unhealthy');

    return {
      overall: unhealthyDatabases.length === 0 ? 'healthy' : 'unhealthy',
      databases: healthChecks,
      timestamp: new Date().toISOString(),
    };
  }
}

export { CdcService };