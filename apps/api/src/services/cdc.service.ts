/**
 * Change Data Capture (CDC) Service
 * AdminGriffe - Sistema de Auditoría Integral
 */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConnectorFactory, CDCEvent, DatabaseEngine } from '../infrastructure/connectors/connector.factory';
import { KafkaService } from '../infrastructure/kafka/kafka.service';
import { MetricsService } from '../infrastructure/observability/metrics.service';
import { CircuitBreakerManager } from '../infrastructure/common/circuit-breaker';
import { logger } from './logger';

export interface CDCConfig {
  postgres?: {
    enabled: boolean;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    replicationSlot?: string;
    publication?: string;
  };
  mysql?: {
    enabled: boolean;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    serverId?: number;
  };
  mongodb?: {
    enabled: boolean;
    uri: string;
    database: string;
    collections?: string[];
  };
}

@Injectable()
export class CDCService implements OnModuleInit, OnModuleDestroy {
  private connectorFactory: ConnectorFactory;
  private isRunning = false;
  private cdcHandlers = new Map<string, (event: CDCEvent) => Promise<void>>();

  constructor(
    private readonly kafkaService: KafkaService,
    private readonly metricsService: MetricsService,
    private readonly config: CDCConfig
  ) {
    this.connectorFactory = new ConnectorFactory();
  }

  async onModuleInit() {
    await this.initialize();
  }

  async onModuleDestroy() {
    await this.shutdown();
  }

  /**
   * Initialize CDC service and connectors
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing CDC Service...');

      // Initialize PostgreSQL connector if enabled
      if (this.config.postgres?.enabled) {
        await this.initializePostgresConnector();
      }

      // Initialize MySQL connector if enabled
      if (this.config.mysql?.enabled) {
        await this.initializeMySQLConnector();
      }

      // Initialize MongoDB connector if enabled
      if (this.config.mongodb?.enabled) {
        await this.initializeMongoConnector();
      }

      // Setup default CDC event handler
      this.setupDefaultCDCHandler();

      logger.info('CDC Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize CDC Service', { error });
      throw error;
    }
  }

  /**
   * Initialize PostgreSQL connector
   */
  private async initializePostgresConnector(): Promise<void> {
    const config = this.config.postgres!;
    
    const connector = await this.connectorFactory.createConnector('postgres', {
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password,
      ssl: false,
      options: {
        replicationSlot: config.replicationSlot || 'audit_slot',
        publication: config.publication || 'audit_publication'
      }
    });

    await connector.connect();
    
    // Start CDC with event handler
    await connector.startCDC((event: CDCEvent) => this.handleCDCEvent('postgres', event));
    
    logger.info('PostgreSQL CDC connector initialized', {
      host: config.host,
      database: config.database
    });
  }

  /**
   * Initialize MySQL connector
   */
  private async initializeMySQLConnector(): Promise<void> {
    const config = this.config.mysql!;
    
    const connector = await this.connectorFactory.createConnector('mysql', {
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password,
      ssl: false,
      options: {
        serverId: config.serverId || 1
      }
    });

    await connector.connect();
    
    // Start CDC with event handler
    await connector.startCDC((event: CDCEvent) => this.handleCDCEvent('mysql', event));
    
    logger.info('MySQL CDC connector initialized', {
      host: config.host,
      database: config.database
    });
  }

  /**
   * Initialize MongoDB connector
   */
  private async initializeMongoConnector(): Promise<void> {
    const config = this.config.mongodb!;
    
    const connector = await this.connectorFactory.createConnector('mongodb', {
      host: '', // Not used for MongoDB
      port: 0,  // Not used for MongoDB
      database: config.database,
      username: '',
      password: '',
      ssl: false,
      options: {
        uri: config.uri,
        collections: config.collections
      }
    });

    await connector.connect();
    
    // Start CDC with event handler
    await connector.startCDC((event: CDCEvent) => this.handleCDCEvent('mongodb', event));
    
    logger.info('MongoDB CDC connector initialized', {
      database: config.database,
      collections: config.collections
    });
  }

  /**
   * Handle CDC events from any connector
   */
  private async handleCDCEvent(source: string, event: CDCEvent): Promise<void> {
    const circuitBreaker = CircuitBreakerManager.getBreaker(`cdc-${source}`, {
      failureThreshold: 5,
      recoveryTimeout: 30000
    });

    try {
      await circuitBreaker.execute(async () => {
        // Record metrics
        this.metricsService.recordCdcEvent(source, event.operation);
        
        // Send to Kafka topic
        const topic = `audit.${source}.changes`;
        await this.kafkaService.sendMessage({
          topic,
          key: `${event.table}_${event.primaryKey}`,
          value: JSON.stringify(event),
          headers: {
            source,
            operation: event.operation,
            timestamp: event.timestamp.toISOString()
          }
        });

        // Execute custom handlers if any
        const handlerKey = `${source}.${event.table}`;
        const handler = this.cdcHandlers.get(handlerKey);
        if (handler) {
          await handler(event);
        }

        logger.info('CDC event processed', {
          source,
          table: event.table,
          operation: event.operation,
          primaryKey: event.primaryKey
        });
      });
    } catch (error) {
      this.metricsService.recordError('cdc', source, error.constructor.name);
      logger.error('Failed to process CDC event', {
        source,
        event,
        error
      });
      
      // Send to dead letter queue
      await this.sendToDeadLetterQueue(source, event, error);
    }
  }

  /**
   * Setup default CDC handler for audit logging
   */
  private setupDefaultCDCHandler(): void {
    // This will be handled by Kafka consumers in the audit service
    logger.info('Default CDC handler configured for audit logging');
  }

  /**
   * Register custom CDC event handler
   */
  registerHandler(
    source: DatabaseEngine, 
    table: string, 
    handler: (event: CDCEvent) => Promise<void>
  ): void {
    const key = `${source}.${table}`;
    this.cdcHandlers.set(key, handler);
    logger.info('CDC handler registered', { source, table });
  }

  /**
   * Unregister CDC event handler
   */
  unregisterHandler(source: DatabaseEngine, table: string): void {
    const key = `${source}.${table}`;
    this.cdcHandlers.delete(key);
    logger.info('CDC handler unregistered', { source, table });
  }

  /**
   * Start CDC for all configured connectors
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('CDC Service is already running');
      return;
    }

    try {
      await this.connectorFactory.startCDCForAll();
      this.isRunning = true;
      logger.info('CDC Service started successfully');
    } catch (error) {
      logger.error('Failed to start CDC Service', { error });
      throw error;
    }
  }

  /**
   * Stop CDC for all connectors
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('CDC Service is not running');
      return;
    }

    try {
      await this.connectorFactory.stopCDCForAll();
      this.isRunning = false;
      logger.info('CDC Service stopped successfully');
    } catch (error) {
      logger.error('Failed to stop CDC Service', { error });
      throw error;
    }
  }

  /**
   * Get CDC status for all connectors
   */
  getStatus(): Record<string, any> {
    const connectorStats = this.connectorFactory.getConnectionStats();
    
    return {
      isRunning: this.isRunning,
      connectors: connectorStats,
      handlers: Array.from(this.cdcHandlers.keys()),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get CDC metrics
   */
  getMetrics(): Record<string, any> {
    return {
      postgres: this.metricsService.getCdcMetrics('postgres'),
      mysql: this.metricsService.getCdcMetrics('mysql'),
      mongodb: this.metricsService.getCdcMetrics('mongodb')
    };
  }

  /**
   * Send failed events to dead letter queue
   */
  private async sendToDeadLetterQueue(
    source: string, 
    event: CDCEvent, 
    error: Error
  ): Promise<void> {
    try {
      await this.kafkaService.sendMessage({
        topic: 'sync.deadletter',
        key: `${source}_${event.table}_${event.primaryKey}`,
        value: JSON.stringify({
          originalEvent: event,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.constructor.name
          },
          source,
          failedAt: new Date().toISOString(),
          retryCount: 0
        }),
        headers: {
          source,
          error_type: error.constructor.name,
          failed_at: new Date().toISOString()
        }
      });

      logger.info('Event sent to dead letter queue', {
        source,
        table: event.table,
        primaryKey: event.primaryKey
      });
    } catch (dlqError) {
      logger.error('Failed to send event to dead letter queue', {
        source,
        event,
        originalError: error,
        dlqError
      });
    }
  }

  /**
   * Shutdown CDC service
   */
  async shutdown(): Promise<void> {
    try {
      await this.stop();
      await this.connectorFactory.disconnectAll();
      this.cdcHandlers.clear();
      logger.info('CDC Service shutdown completed');
    } catch (error) {
      logger.error('Error during CDC Service shutdown', { error });
      throw error;
    }
  }

  /**
   * Health check for CDC service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const connectorStats = this.connectorFactory.getConnectionStats();
      const allConnected = Object.values(connectorStats).every(
        (stats: any) => stats.connected
      );
      
      return this.isRunning && allConnected;
    } catch (error) {
      logger.error('CDC health check failed', { error });
      return false;
    }
  }
}