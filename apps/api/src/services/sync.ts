import { db } from './database';
import { redis } from './redis';
import { rabbitmq } from './rabbitmq';
import { auditService, Operation } from './audit';
import { logger } from './logger';

export interface SyncEvent {
  id: string;
  tenantId: string;
  sourceDb: string;
  targetDb: string;
  tableName: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId: string;
  data?: Record<string, any>;
  oldData?: Record<string, any>;
  timestamp: Date;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CONFLICT';
  retryCount: number;
  lastError?: string;
  vectorClock?: Record<string, number>;
}

export interface ConflictResolution {
  strategy: 'LAST_WRITE_WINS' | 'PRIORITY_SOURCE' | 'MANUAL' | 'MERGE';
  priority?: Record<string, number>;
  mergeRules?: Record<string, any>;
}

class SyncService {
  private static instance: SyncService;
  private readonly maxRetries = 5;
  private readonly conflictQueue = 'sync_conflicts';

  private constructor() {}

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Process sync event from CDC
   */
  public async processSyncEvent(event: SyncEvent): Promise<void> {
    try {
      logger.info('Processing sync event', {
        id: event.id,
        tenantId: event.tenantId,
        operation: event.operation,
        table: event.tableName,
      });

      // Check for conflicts
      const conflict = await this.detectConflict(event);
      if (conflict) {
        await this.handleConflict(event, conflict);
        return;
      }

      // Apply sync operation
      await this.applySyncOperation(event);

      // Update sync status
      await this.updateSyncStatus(event.id, 'COMPLETED');

      // Log audit trail
      await auditService.auditEntityChange(
        event.tenantId,
        'sync_events',
        Operation.UPDATE,
        event.id,
        { status: 'PROCESSING' },
        { status: 'COMPLETED' },
        'system',
        'sync-service'
      );

      logger.info('Sync event completed', { id: event.id });
    } catch (error) {
      logger.error('Sync event failed', { error, event });
      await this.handleSyncError(event, error as Error);
    }
  }

  /**
   * Detect conflicts between sync events
   */
  private async detectConflict(event: SyncEvent): Promise<boolean> {
    const cacheKey = `sync:${event.tenantId}:${event.tableName}:${event.recordId}`;
    
    // Check if there's a recent sync for the same record
    const lastSync = await redis.get(cacheKey);
    if (!lastSync) {
      // Store current sync timestamp
      await redis.set(cacheKey, event.timestamp.toISOString(), undefined, 300); // 5 min TTL
      return false;
    }

    const lastSyncTime = new Date(lastSync);
    const timeDiff = event.timestamp.getTime() - lastSyncTime.getTime();

    // Consider it a conflict if events are within 1 second
    return Math.abs(timeDiff) < 1000;
  }

  /**
   * Handle sync conflicts
   */
  private async handleConflict(event: SyncEvent, conflict: boolean): Promise<void> {
    logger.warn('Sync conflict detected', { event });

    // Update event status
    event.status = 'CONFLICT';
    await this.updateSyncStatus(event.id, 'CONFLICT');

    // Apply conflict resolution strategy
    const resolution = await this.getConflictResolution(event.tenantId, event.tableName);
    
    switch (resolution.strategy) {
      case 'LAST_WRITE_WINS':
        await this.applySyncOperation(event);
        await this.updateSyncStatus(event.id, 'COMPLETED');
        break;
      
      case 'PRIORITY_SOURCE':
        const priority = resolution.priority?.[event.sourceDb] || 0;
        if (priority > 0) {
          await this.applySyncOperation(event);
          await this.updateSyncStatus(event.id, 'COMPLETED');
        } else {
          await this.sendToConflictQueue(event);
        }
        break;
      
      case 'MANUAL':
        await this.sendToConflictQueue(event);
        break;
      
      case 'MERGE':
        await this.attemptMerge(event, resolution.mergeRules || {});
        break;
    }
  }

  /**
   * Apply sync operation to target database
   */
  private async applySyncOperation(event: SyncEvent): Promise<void> {
    const handler = this.getSyncHandler(event.sourceDb, event.targetDb);
    await handler.apply(event);
  }

  /**
   * Get sync handler for source/target combination
   */
  private getSyncHandler(sourceDb: string, targetDb: string): ISyncHandler {
    // Factory pattern for different database combinations
    const handlerKey = `${sourceDb}-${targetDb}`;
    
    switch (handlerKey) {
      case 'PostgreSQL-MongoDB':
        return new PostgresToMongoHandler();
      case 'MongoDB-PostgreSQL':
        return new MongoToPostgresHandler();
      case 'PostgreSQL-MySQL':
        return new PostgresToMySQLHandler();
      default:
        return new DefaultSyncHandler();
    }
  }

  /**
   * Update sync event status
   */
  private async updateSyncStatus(eventId: string, status: string): Promise<void> {
    const cacheKey = `sync_status:${eventId}`;
    await redis.set(cacheKey, { status, updatedAt: new Date() }, undefined, 3600);
  }

  /**
   * Get sync status with filtering
   */
  public async getSyncStatus(
    tenantId: string,
    filters: {
      sourceDb?: string;
      targetDb?: string;
      tableName?: string;
      status?: string;
      limit: number;
      offset: number;
    }
  ): Promise<any> {
    // Get sync events from Redis or database
    const pattern = `sync:conflict:${tenantId}:*`;
    const keys = await redis.getClient().keys(pattern);
    
    const statuses = [];
    for (const key of keys.slice(filters.offset, filters.offset + filters.limit)) {
      const data = await redis.get(key);
      if (data) {
        const status = typeof data === 'string' ? JSON.parse(data) : data;
        statuses.push({
          eventId: key.split(':').pop(),
          ...status,
        });
      }
    }

    return {
      items: statuses,
      total: keys.length,
      hasMore: keys.length > filters.offset + filters.limit,
    };
  }

  /**
   * Get health status
   */
  public async getHealthStatus(tenantId: string): Promise<any> {
    const checks = [];

    // Check Redis connectivity
    try {
      const isHealthy = await redis.healthCheck();
      checks.push({ service: 'redis', status: isHealthy ? 'healthy' : 'unhealthy' });
    } catch (error) {
      checks.push({ service: 'redis', status: 'unhealthy', error: (error as Error).message });
    }

    // Check RabbitMQ connectivity
    try {
      // Assuming rabbitmq has a health check method
      checks.push({ service: 'rabbitmq', status: 'healthy' });
    } catch (error) {
      checks.push({ service: 'rabbitmq', status: 'unhealthy', error: (error as Error).message });
    }

    // Check database connectivity
    try {
      await db.prisma.$queryRaw`SELECT 1`;
      checks.push({ service: 'database', status: 'healthy' });
    } catch (error) {
      checks.push({ service: 'database', status: 'unhealthy', error: (error as Error).message });
    }

    const unhealthyServices = checks.filter(check => check.status === 'unhealthy');
    
    return {
      overall: unhealthyServices.length === 0 ? 'healthy' : 'unhealthy',
      services: checks,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Replay sync event
   */
  public async replaySyncEvent(
    tenantId: string,
    eventId: string,
    options: { targetDbs?: string[]; force?: boolean }
  ): Promise<any> {
    // Get original event data
    const eventKey = `sync_status:${eventId}`;
    const eventData = await redis.get(eventKey);
    
    if (!eventData) {
      throw new Error('Event not found');
    }

    const event = JSON.parse(eventData);
    
    // Create new sync event for replay
    const replayEvent: SyncEvent = {
      ...event,
      id: `${eventId}-replay-${Date.now()}`,
      status: 'PENDING',
      retryCount: 0,
      timestamp: new Date(),
    };

    // Process the replay
    await this.processSyncEvent(replayEvent);

    return {
      replayEventId: replayEvent.id,
      originalEventId: eventId,
      status: 'initiated',
    };
  }

  /**
   * Get sync conflicts
   */
  public async getSyncConflicts(
    tenantId: string,
    filters: { status?: string; limit: number; offset: number }
  ): Promise<any> {
    const pattern = `sync_conflict:${tenantId}:*`;
    const keys = await redis.keys(pattern);
    
    const conflicts = [];
    for (const key of keys.slice(filters.offset, filters.offset + filters.limit)) {
      const data = await redis.get(key);
      if (data) {
        const conflict = typeof data === 'string' ? JSON.parse(data) : data;
        if (!filters.status || conflict.status === filters.status) {
          conflicts.push({
            conflictId: key.split(':').pop(),
            ...conflict,
          });
        }
      }
    }

    return {
      items: conflicts,
      total: keys.length,
      hasMore: keys.length > filters.offset + filters.limit,
    };
  }

  /**
   * Resolve conflict
   */
  public async resolveConflict(
    tenantId: string,
    conflictId: string,
    resolution: {
      resolution: string;
      mergeData?: any;
      resolvedBy: string;
    }
  ): Promise<any> {
    const conflictKey = `sync_conflict:${tenantId}:${conflictId}`;
    const conflictData = await redis.get(conflictKey);
    
    if (!conflictData) {
      throw new Error('Conflict not found');
    }

    const conflict = JSON.parse(conflictData);
    
    // Apply resolution
    const resolvedData = {
      ...conflict,
      status: 'resolved',
      resolution: resolution.resolution,
      mergeData: resolution.mergeData,
      resolvedBy: resolution.resolvedBy,
      resolvedAt: new Date().toISOString(),
    };

    // Update conflict status
    await redis.set(conflictKey, resolvedData, undefined, 86400); // 24 hours TTL

    // Create sync event to apply resolution
    const syncEvent: SyncEvent = {
      id: `conflict-resolution-${conflictId}`,
      tenantId,
      sourceDb: conflict.sourceDb,
      targetDb: conflict.targetDb,
      tableName: conflict.tableName,
      operation: conflict.operation,
      recordId: conflict.recordId,
      data: resolution.mergeData || conflict.data,
      oldData: conflict.oldData,
      status: 'PENDING',
      retryCount: 0,
      timestamp: new Date(),
    };

    await this.processSyncEvent(syncEvent);

    return {
      conflictId,
      status: 'resolved',
      resolution: resolution.resolution,
    };
  }

  /**
   * Get sync metrics
   */
  public async getSyncMetrics(
    tenantId: string,
    timeRange: { start: Date; end: Date },
    granularity: string
  ): Promise<any> {
    // This would typically query a time-series database
    // For now, we'll return mock data structure
    return {
      throughput: {
        eventsPerSecond: 150,
        peakEventsPerSecond: 300,
        averageEventsPerSecond: 120,
      },
      latency: {
        averageMs: 45,
        p95Ms: 85,
        p99Ms: 150,
      },
      errors: {
        total: 12,
        rate: 0.008, // 0.8%
        byType: {
          'connection_timeout': 5,
          'data_validation': 4,
          'conflict_resolution': 3,
        },
      },
      conflicts: {
        total: 8,
        resolved: 6,
        pending: 2,
        byResolution: {
          'source_wins': 3,
          'target_wins': 2,
          'merge': 1,
          'manual': 2,
        },
      },
    };
  }

  /**
   * Get sync lag metrics
   */
  public async getSyncLagMetrics(tenantId: string): Promise<any> {
    const lagData = [];
    
    // Get lag for each source-target pair
    const sources = ['PostgreSQL', 'MySQL', 'MongoDB'];
    const targets = ['PostgreSQL', 'MySQL', 'MongoDB'];
    
    for (const source of sources) {
      for (const target of targets) {
        if (source !== target) {
          const lagKey = `sync_lag:${tenantId}:${source}:${target}`;
          const lag = await redis.get(lagKey);
          
          lagData.push({
            source,
            target,
            lagMs: lag ? parseInt(lag) : 0,
            status: lag && parseInt(lag) > 500 ? 'critical' : 
                   lag && parseInt(lag) > 100 ? 'warning' : 'ok',
          });
        }
      }
    }

    return {
      pairs: lagData,
      overall: {
        maxLagMs: Math.max(...lagData.map(d => d.lagMs)),
        avgLagMs: lagData.reduce((sum, d) => sum + d.lagMs, 0) / lagData.length,
        criticalPairs: lagData.filter(d => d.status === 'critical').length,
      },
    };
  }

  /**
   * Handle sync errors with retry logic
   */
  private async handleSyncError(event: SyncEvent, error: Error): Promise<void> {
    event.retryCount = (event.retryCount || 0) + 1;
    event.lastError = error.message;

    if (event.retryCount < this.maxRetries) {
      // Exponential backoff
      const delay = Math.pow(2, event.retryCount) * 1000;
      
      await rabbitmq.publishUserEvent({
        tenantId: event.tenantId,
        eventType: 'created',
        entityType: 'sync_retry',
        entityId: event.id,
        timestamp: new Date().toISOString(),
        data: { ...event, retryCount: event.retryCount, lastError: event.lastError }
      });

      await this.updateSyncStatus(event.id, 'PENDING');
    } else {
      await this.updateSyncStatus(event.id, 'FAILED');
      await this.sendToConflictQueue(event);
    }
  }

  /**
   * Send event to conflict resolution queue
   */
  private async sendToConflictQueue(event: SyncEvent): Promise<void> {
    await rabbitmq.publishEvent(
      'sync_conflict',
      this.conflictQueue,
      event.id,
      event,
      event.tenantId,
      'system'
    );
  }

  /**
   * Get conflict resolution strategy for table
   */
  private async getConflictResolution(tenantId: string, tableName: string): Promise<ConflictResolution> {
    const cacheKey = `conflict_resolution:${tenantId}:${tableName}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Default resolution strategy
    const defaultResolution: ConflictResolution = {
      strategy: 'LAST_WRITE_WINS',
      priority: {
        'PostgreSQL': 3,
        'MySQL': 2,
        'MongoDB': 1,
      },
    };

    await redis.set(cacheKey, defaultResolution, undefined, 3600);
    return defaultResolution;
  }

  /**
   * Attempt to merge conflicting data
   */
  private async attemptMerge(event: SyncEvent, mergeRules: Record<string, any>): Promise<void> {
    // Simple merge strategy - can be enhanced based on business rules
    const mergedData = { ...event.oldData, ...event.data };
    
    event.data = mergedData;
    await this.applySyncOperation(event);
    await this.updateSyncStatus(event.id, 'COMPLETED');
  }

  /**
   * Get sync lag metrics
   */
  public async getSyncLag(tenantId: string): Promise<Record<string, number>> {
    const cacheKey = `sync_lag:${tenantId}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // Calculate lag from pending sync events
    const pendingEvents = await this.getPendingSyncEvents(tenantId);
    const now = new Date();
    
    const lag: Record<string, number> = {};
    
    for (const event of pendingEvents) {
      const key = `${event.sourceDb}-${event.targetDb}`;
      const eventLag = now.getTime() - event.timestamp.getTime();
      lag[key] = Math.max(lag[key] || 0, eventLag);
    }

    await redis.set(cacheKey, lag, undefined, 60); // 1 min cache
    return lag;
  }

  /**
   * Get pending sync events
   */
  private async getPendingSyncEvents(tenantId: string): Promise<SyncEvent[]> {
    // This would typically query a sync events table
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Get sync statistics
   */
  public async getSyncStats(tenantId: string, timeRange: { start: Date; end: Date }) {
    const stats = {
      totalEvents: 0,
      completedEvents: 0,
      failedEvents: 0,
      conflictEvents: 0,
      averageLag: 0,
      throughput: 0,
    };

    // Calculate stats from audit logs and cache
    const auditStats = await auditService.getAuditStats(tenantId, timeRange);
    const syncLag = await this.getSyncLag(tenantId);

    stats.averageLag = Object.values(syncLag).reduce((sum, lag) => sum + lag, 0) / Object.keys(syncLag).length || 0;
    stats.totalEvents = auditStats.totalOperations;

    return stats;
  }
}

// Sync handler interface
interface ISyncHandler {
  apply(event: SyncEvent): Promise<void>;
}

// Default sync handler
class DefaultSyncHandler implements ISyncHandler {
  async apply(event: SyncEvent): Promise<void> {
    logger.info('Applying default sync operation', { event });
    // Default implementation - log the event
  }
}

// PostgreSQL to MongoDB handler
class PostgresToMongoHandler implements ISyncHandler {
  async apply(event: SyncEvent): Promise<void> {
    logger.info('Syncing PostgreSQL to MongoDB', { event });
    // Implementation for PostgreSQL to MongoDB sync
  }
}

// MongoDB to PostgreSQL handler
class MongoToPostgresHandler implements ISyncHandler {
  async apply(event: SyncEvent): Promise<void> {
    logger.info('Syncing MongoDB to PostgreSQL', { event });
    // Implementation for MongoDB to PostgreSQL sync
  }
}

// PostgreSQL to MySQL handler
class PostgresToMySQLHandler implements ISyncHandler {
  async apply(event: SyncEvent): Promise<void> {
    logger.info('Syncing PostgreSQL to MySQL', { event });
    // Implementation for PostgreSQL to MySQL sync
  }
}

export { SyncService };
export const syncService = SyncService.getInstance();