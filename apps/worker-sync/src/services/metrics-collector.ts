import { Redis } from 'ioredis';
import { SyncMetrics, DatabaseSource } from '../types';
import { logger } from '../utils/logger';
import { register, Counter, Gauge, Histogram } from 'prom-client';

export class MetricsCollector {
  private redis: Redis;
  
  // Prometheus metrics
  private syncEventsTotal: Counter<string>;
  private syncLatencyHistogram: Histogram<string>;
  private syncErrorsTotal: Counter<string>;
  private conflictsTotal: Counter<string>;
  private queueDepthGauge: Gauge<string>;
  private syncLagGauge: Gauge<string>;
  
  // Internal metrics
  private metrics: SyncMetrics = {
    totalEvents: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    conflictsDetected: 0,
    conflictsResolved: 0,
    avgSyncLatency: 0,
    lastSyncTimestamp: new Date(),
    queueDepth: 0,
    errorRate: 0,
    throughputPerSecond: 0
  };

  private eventTimestamps: number[] = [];
  private syncLatencies: number[] = [];
  private readonly maxSamples = 1000;
  private readonly metricsWindow = 60000; // 1 minute

  constructor(redis: Redis) {
    this.redis = redis;
    this.initializePrometheusMetrics();
  }

  private initializePrometheusMetrics(): void {
    // Clear existing metrics
    register.clear();

    this.syncEventsTotal = new Counter({
      name: 'sync_events_total',
      help: 'Total number of sync events processed',
      labelNames: ['source', 'target', 'operation', 'status']
    });

    this.syncLatencyHistogram = new Histogram({
      name: 'sync_latency_ms',
      help: 'Sync operation latency in milliseconds',
      labelNames: ['source', 'target'],
      buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
    });

    this.syncErrorsTotal = new Counter({
      name: 'sync_errors_total',
      help: 'Total number of sync errors',
      labelNames: ['source', 'target', 'error_type']
    });

    this.conflictsTotal = new Counter({
      name: 'sync_conflicts_total',
      help: 'Total number of sync conflicts',
      labelNames: ['source', 'target', 'resolution_strategy']
    });

    this.queueDepthGauge = new Gauge({
      name: 'sync_queue_depth',
      help: 'Current depth of sync queue',
      labelNames: ['queue_type']
    });

    this.syncLagGauge = new Gauge({
      name: 'sync_lag_ms',
      help: 'Current sync lag in milliseconds',
      labelNames: ['source', 'target']
    });

    logger.info('📊 Prometheus metrics initialized');
  }

  async start(): Promise<void> {
    // Start metrics collection interval
    setInterval(() => {
      this.calculateDerivedMetrics();
      this.cleanupOldSamples();
      this.updateRedisMetrics();
    }, 5000); // Update every 5 seconds

    logger.info('📊 Metrics collector started');
  }

  recordEvent(source?: DatabaseSource, target?: DatabaseSource, operation?: string): void {
    this.metrics.totalEvents++;
    this.eventTimestamps.push(Date.now());
    
    // Update Prometheus metrics
    this.syncEventsTotal.inc({
      source: source || 'unknown',
      target: target || 'unknown',
      operation: operation || 'unknown',
      status: 'received'
    });
    
    logger.debug(`📊 Event recorded: ${source}->${target}.${operation} (Total: ${this.metrics.totalEvents})`);
  }

  recordSuccess(source?: DatabaseSource, target?: DatabaseSource, latencyMs?: number): void {
    this.metrics.successfulSyncs++;
    this.metrics.lastSyncTimestamp = new Date();
    
    if (latencyMs) {
      this.syncLatencies.push(latencyMs);
      this.syncLatencyHistogram.observe({ source: source || 'unknown', target: target || 'unknown' }, latencyMs);
    }
    
    // Keep only recent latencies
    if (this.syncLatencies.length > this.maxSamples) {
      this.syncLatencies.shift();
    }
    
    this.syncEventsTotal.inc({
      source: source || 'unknown',
      target: target || 'unknown',
      operation: 'sync',
      status: 'success'
    });
    
    logger.debug(`✅ Sync success recorded: ${latencyMs}ms (Total: ${this.metrics.successfulSyncs})`);
  }

  recordFailure(source?: DatabaseSource, target?: DatabaseSource, error?: Error): void {
    this.metrics.failedSyncs++;
    
    this.syncErrorsTotal.inc({
      source: source || 'unknown',
      target: target || 'unknown',
      error_type: error?.constructor.name || 'UnknownError'
    });
    
    this.syncEventsTotal.inc({
      source: source || 'unknown',
      target: target || 'unknown',
      operation: 'sync',
      status: 'failed'
    });
    
    logger.warn(`❌ Sync failure recorded: ${error?.message} (Total: ${this.metrics.failedSyncs})`);
  }

  recordLatency(latencyMs: number, source?: DatabaseSource, target?: DatabaseSource): void {
    this.syncLatencies.push(latencyMs);
    
    if (this.syncLatencies.length > this.maxSamples) {
      this.syncLatencies.shift();
    }
    
    this.syncLatencyHistogram.observe({ 
      source: source || 'unknown', 
      target: target || 'unknown' 
    }, latencyMs);
  }

  recordConflict(source?: DatabaseSource, target?: DatabaseSource, strategy?: string): void {
    this.metrics.conflictsDetected++;
    
    this.conflictsTotal.inc({
      source: source || 'unknown',
      target: target || 'unknown',
      resolution_strategy: strategy || 'unknown'
    });
    
    logger.info(`⚠️ Conflict detected (Total: ${this.metrics.conflictsDetected})`);
  }

  recordConflictResolved(): void {
    this.metrics.conflictsResolved++;
    logger.info(`✅ Conflict resolved (Total: ${this.metrics.conflictsResolved})`);
  }

  updateQueueDepth(depth: number, queueType: string = 'sync'): void {
    this.metrics.queueDepth = depth;
    this.queueDepthGauge.set({ queue_type: queueType }, depth);
  }

  updateSyncLag(lagMs: number, source?: DatabaseSource, target?: DatabaseSource): void {
    this.syncLagGauge.set({
      source: source || 'unknown',
      target: target || 'unknown'
    }, lagMs);
  }

  getMetrics(): SyncMetrics {
    return { ...this.metrics };
  }

  getPrometheusMetrics(): string {
    return register.metrics();
  }

  getDetailedMetrics(): any {
    const now = Date.now();
    const recentEvents = this.eventTimestamps.filter(ts => now - ts < this.metricsWindow);
    
    return {
      ...this.metrics,
      detailed: {
        eventsLastMinute: recentEvents.length,
        avgLatencyLast100: this.calculateAverageLatency(100),
        p95Latency: this.calculatePercentileLatency(95),
        p99Latency: this.calculatePercentileLatency(99),
        successRate: this.calculateSuccessRate(),
        conflictResolutionRate: this.calculateConflictResolutionRate(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };
  }

  private calculateDerivedMetrics(): void {
    // Calculate average sync latency
    if (this.syncLatencies.length > 0) {
      const sum = this.syncLatencies.reduce((a, b) => a + b, 0);
      this.metrics.avgSyncLatency = sum / this.syncLatencies.length;
    }

    // Calculate error rate
    const totalSyncs = this.metrics.successfulSyncs + this.metrics.failedSyncs;
    if (totalSyncs > 0) {
      this.metrics.errorRate = this.metrics.failedSyncs / totalSyncs;
    }

    // Calculate throughput (events per second)
    const now = Date.now();
    const recentEvents = this.eventTimestamps.filter(ts => now - ts < this.metricsWindow);
    this.metrics.throughputPerSecond = recentEvents.length / (this.metricsWindow / 1000);
  }

  private cleanupOldSamples(): void {
    const now = Date.now();
    const cutoff = now - this.metricsWindow;
    
    // Remove old event timestamps
    this.eventTimestamps = this.eventTimestamps.filter(ts => ts > cutoff);
    
    // Keep only recent latencies
    if (this.syncLatencies.length > this.maxSamples) {
      this.syncLatencies.splice(0, this.syncLatencies.length - this.maxSamples);
    }
  }

  private async updateRedisMetrics(): Promise<void> {
    try {
      const metricsKey = 'sync:metrics';
      await this.redis.hset(metricsKey, {
        totalEvents: this.metrics.totalEvents,
        successfulSyncs: this.metrics.successfulSyncs,
        failedSyncs: this.metrics.failedSyncs,
        conflictsDetected: this.metrics.conflictsDetected,
        conflictsResolved: this.metrics.conflictsResolved,
        avgSyncLatency: this.metrics.avgSyncLatency,
        lastSyncTimestamp: this.metrics.lastSyncTimestamp.toISOString(),
        queueDepth: this.metrics.queueDepth,
        errorRate: this.metrics.errorRate,
        throughputPerSecond: this.metrics.throughputPerSecond
      });
      
      await this.redis.expire(metricsKey, 300); // Expire in 5 minutes
    } catch (error) {
      logger.error('Failed to update Redis metrics:', error);
    }
  }

  private calculateAverageLatency(sampleSize: number): number {
    if (this.syncLatencies.length === 0) return 0;
    
    const samples = this.syncLatencies.slice(-sampleSize);
    const sum = samples.reduce((a, b) => a + b, 0);
    return sum / samples.length;
  }

  private calculatePercentileLatency(percentile: number): number {
    if (this.syncLatencies.length === 0) return 0;
    
    const sorted = [...this.syncLatencies].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private calculateSuccessRate(): number {
    const totalSyncs = this.metrics.successfulSyncs + this.metrics.failedSyncs;
    if (totalSyncs === 0) return 1;
    return this.metrics.successfulSyncs / totalSyncs;
  }

  private calculateConflictResolutionRate(): number {
    if (this.metrics.conflictsDetected === 0) return 1;
    return this.metrics.conflictsResolved / this.metrics.conflictsDetected;
  }

  reset(): void {
    this.metrics = {
      totalEvents: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      avgSyncLatency: 0,
      lastSyncTimestamp: new Date(),
      queueDepth: 0,
      errorRate: 0,
      throughputPerSecond: 0
    };
    
    this.eventTimestamps = [];
    this.syncLatencies = [];
    
    logger.info('📊 Metrics reset');
  }
}