import { Worker, Queue, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { logger } from './utils/logger';
import { Config } from './config';
import { CdcEvent, SyncJob, DatabaseSource, SyncMetrics } from './types';
import { DatabaseConnectorFactory } from './services/database-connector-factory';
import { SyncHandlerRegistry } from './services/sync-handler-registry';
import { ConflictResolver } from './services/conflict-resolver';
import { MetricsCollector } from './services/metrics-collector';
import { KafkaConsumer } from './services/kafka-consumer';

export class SyncWorker {
  private redis: Redis;
  private syncQueue: Queue;
  private conflictQueue: Queue;
  private worker: Worker;
  private conflictWorker: Worker;
  private kafkaConsumer: KafkaConsumer;
  private connectorFactory: DatabaseConnectorFactory;
  private handlerRegistry: SyncHandlerRegistry;
  private conflictResolver: ConflictResolver;
  private metricsCollector: MetricsCollector;
  private isRunning = false;

  constructor(private config: Config) {
    this.redis = new Redis(config.REDIS_URL);
    this.initializeQueues();
    this.initializeServices();
  }

  private initializeQueues() {
    const connection = { host: this.redis.options.host, port: this.redis.options.port };
    
    this.syncQueue = new Queue('sync-queue', { connection });
    this.conflictQueue = new Queue('conflict-queue', { connection });

    // Initialize workers
    this.worker = new Worker('sync-queue', this.processSyncJob.bind(this), {
      connection,
      concurrency: this.config.QUEUE_CONCURRENCY,
      removeOnComplete: 100,
      removeOnFail: 50
    });

    this.conflictWorker = new Worker('conflict-queue', this.processConflictJob.bind(this), {
      connection,
      concurrency: 1, // Process conflicts sequentially
      removeOnComplete: 50,
      removeOnFail: 25
    });

    // Event listeners
    this.worker.on('completed', (job) => {
      logger.info(`✅ Sync job completed: ${job.id}`);
      this.metricsCollector.recordSuccess();
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`❌ Sync job failed: ${job?.id}`, err);
      this.metricsCollector.recordFailure();
    });

    this.conflictWorker.on('completed', (job) => {
      logger.info(`🔧 Conflict resolved: ${job.id}`);
    });
  }

  private initializeServices() {
    this.connectorFactory = new DatabaseConnectorFactory(this.config);
    this.handlerRegistry = new SyncHandlerRegistry();
    this.conflictResolver = new ConflictResolver(this.config);
    this.metricsCollector = new MetricsCollector(this.redis);
    this.kafkaConsumer = new KafkaConsumer(this.config, this.handleCdcEvent.bind(this));
  }

  async start(): Promise<void> {
    try {
      logger.info('🚀 Starting Sync Worker...');

      // Initialize database connectors
      await this.connectorFactory.initializeAll();
      
      // Start Kafka consumer for CDC events
      if (this.config.CDC_ENABLED) {
        await this.kafkaConsumer.start();
        logger.info('📡 Kafka CDC consumer started');
      }

      // Start metrics collection
      await this.metricsCollector.start();

      this.isRunning = true;
      logger.info('✅ Sync Worker started successfully');

    } catch (error) {
      logger.error('💥 Failed to start Sync Worker:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      logger.info('🛑 Stopping Sync Worker...');
      this.isRunning = false;

      // Stop Kafka consumer
      await this.kafkaConsumer.stop();

      // Close workers
      await this.worker.close();
      await this.conflictWorker.close();

      // Close queues
      await this.syncQueue.close();
      await this.conflictQueue.close();

      // Disconnect from databases
      await this.connectorFactory.disconnectAll();

      // Close Redis connection
      await this.redis.quit();

      logger.info('✅ Sync Worker stopped successfully');

    } catch (error) {
      logger.error('💥 Error stopping Sync Worker:', error);
      throw error;
    }
  }

  private async handleCdcEvent(event: CdcEvent): Promise<void> {
    try {
      logger.debug(`📥 Received CDC event: ${event.id} from ${event.source}`);

      // Determine target databases for sync
      const targetSources = this.getTargetSources(event.source);
      
      if (targetSources.length === 0) {
        logger.debug(`⏭️ No targets for source ${event.source}, skipping`);
        return;
      }

      // Create sync job
      const syncJob: SyncJob = {
        id: `sync-${event.id}-${Date.now()}`,
        event,
        targetSources,
        priority: this.calculatePriority(event),
        retryCount: 0,
        maxRetries: this.config.SYNC_RETRY_ATTEMPTS,
        createdAt: new Date(),
        status: 'pending'
      };

      // Add to sync queue
      await this.syncQueue.add('sync', syncJob, {
        priority: syncJob.priority,
        attempts: syncJob.maxRetries,
        backoff: {
          type: 'exponential',
          delay: this.config.SYNC_RETRY_DELAY
        },
        removeOnComplete: true,
        removeOnFail: false
      });

      this.metricsCollector.recordEvent();
      logger.info(`📤 Queued sync job: ${syncJob.id}`);

    } catch (error) {
      logger.error('💥 Error handling CDC event:', error);
      throw error;
    }
  }

  private async processSyncJob(job: Job): Promise<void> {
    const syncJob = job.data as SyncJob;
    const startTime = Date.now();

    try {
      logger.info(`🔄 Processing sync job: ${syncJob.id}`);

      for (const target of syncJob.targetSources) {
        await this.syncToTarget(syncJob.event, target);
      }

      const duration = Date.now() - startTime;
      this.metricsCollector.recordLatency(duration);
      
      logger.info(`✅ Sync job completed: ${syncJob.id} in ${duration}ms`);

    } catch (error) {
      logger.error(`❌ Sync job failed: ${syncJob.id}`, error);
      
      // Check if it's a conflict
      if (this.isConflictError(error)) {
        await this.handleConflict(syncJob, error);
      } else {
        throw error; // Let BullMQ handle retries
      }
    }
  }

  private async processConflictJob(job: Job): Promise<void> {
    const conflictData = job.data;
    
    try {
      logger.info(`🔧 Processing conflict: ${job.id}`);
      
      const resolution = await this.conflictResolver.resolve(conflictData);
      
      if (resolution.resolution === 'auto' && resolution.winner) {
        // Re-queue the winning event
        await this.handleCdcEvent(resolution.winner);
      }
      
      logger.info(`✅ Conflict resolved: ${job.id}`);
      
    } catch (error) {
      logger.error(`❌ Conflict resolution failed: ${job.id}`, error);
      throw error;
    }
  }

  private async syncToTarget(event: CdcEvent, target: DatabaseSource): Promise<void> {
    const handler = this.handlerRegistry.getHandler(event.source, target);
    
    if (!handler) {
      throw new Error(`No handler found for ${event.source} -> ${target}`);
    }

    if (!handler.validateMapping(event, target)) {
      throw new Error(`Invalid mapping for ${event.source} -> ${target}`);
    }

    await handler.handle(event, target);
  }

  private getTargetSources(source: DatabaseSource): DatabaseSource[] {
    const allSources: DatabaseSource[] = ['postgres', 'mysql', 'mongodb'];
    return allSources.filter(s => s !== source);
  }

  private calculatePriority(event: CdcEvent): number {
    // Higher priority for DELETE operations
    if (event.operation === 'DELETE') return 1;
    if (event.operation === 'UPDATE') return 2;
    return 3; // INSERT
  }

  private isConflictError(error: any): boolean {
    return error.message?.includes('conflict') || 
           error.message?.includes('version') ||
           error.code === 'CONFLICT';
  }

  private async handleConflict(syncJob: SyncJob, error: any): Promise<void> {
    logger.warn(`⚠️ Conflict detected for job ${syncJob.id}: ${error.message}`);
    
    await this.conflictQueue.add('conflict', {
      syncJob,
      error: error.message,
      detectedAt: new Date()
    }, {
      priority: 1,
      attempts: 1
    });
  }

  async getMetrics(): Promise<SyncMetrics> {
    return this.metricsCollector.getMetrics();
  }

  async getHealth(): Promise<{ status: string; details: any }> {
    const connectorHealth = await this.connectorFactory.healthCheck();
    const queueHealth = {
      syncQueue: await this.syncQueue.getWaiting(),
      conflictQueue: await this.conflictQueue.getWaiting()
    };

    return {
      status: this.isRunning ? 'healthy' : 'unhealthy',
      details: {
        connectors: connectorHealth,
        queues: queueHealth,
        metrics: await this.getMetrics()
      }
    };
  }
}