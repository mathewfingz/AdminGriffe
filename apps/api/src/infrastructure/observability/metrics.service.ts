import { Injectable } from '@nestjs/common';
import { register, Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client';

/**
 * Prometheus Metrics Service
 * Provides comprehensive observability for the audit and sync system
 */
@Injectable()
export class MetricsService {
  // Audit Metrics
  private readonly auditWriteTps = new Counter({
    name: 'audit_write_tps_total',
    help: 'Total number of audit records written per second',
    labelNames: ['database', 'table', 'operation']
  });

  private readonly auditWriteDuration = new Histogram({
    name: 'audit_write_duration_seconds',
    help: 'Duration of audit write operations',
    labelNames: ['database', 'table', 'operation'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
  });

  // Sync Metrics
  private readonly syncLagMs = new Gauge({
    name: 'sync_lag_ms',
    help: 'Synchronization lag in milliseconds between source and destination',
    labelNames: ['source_db', 'target_db', 'table']
  });

  private readonly syncOperationsTotal = new Counter({
    name: 'sync_operations_total',
    help: 'Total number of sync operations',
    labelNames: ['source_db', 'target_db', 'operation', 'status']
  });

  private readonly syncDuration = new Histogram({
    name: 'sync_duration_seconds',
    help: 'Duration of sync operations',
    labelNames: ['source_db', 'target_db', 'operation'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
  });

  // Conflict Resolution Metrics
  private readonly conflictRate = new Counter({
    name: 'conflict_rate_total',
    help: 'Total number of conflicts detected',
    labelNames: ['source_db', 'target_db', 'table', 'resolution_strategy']
  });

  private readonly conflictResolutionDuration = new Histogram({
    name: 'conflict_resolution_duration_seconds',
    help: 'Duration of conflict resolution',
    labelNames: ['strategy', 'outcome'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30]
  });

  // Queue Metrics
  private readonly queueDepth = new Gauge({
    name: 'queue_depth',
    help: 'Number of jobs pending in queues',
    labelNames: ['queue_name', 'job_type']
  });

  private readonly queueProcessingDuration = new Histogram({
    name: 'queue_processing_duration_seconds',
    help: 'Duration of queue job processing',
    labelNames: ['queue_name', 'job_type', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120]
  });

  // Error Metrics
  private readonly errorRatio = new Counter({
    name: 'error_ratio_total',
    help: 'Total number of errors by type',
    labelNames: ['service', 'operation', 'error_type']
  });

  // CDC Metrics
  private readonly cdcEventsProcessed = new Counter({
    name: 'cdc_events_processed_total',
    help: 'Total number of CDC events processed',
    labelNames: ['database', 'table', 'operation']
  });

  private readonly cdcProcessingDuration = new Histogram({
    name: 'cdc_processing_duration_seconds',
    help: 'Duration of CDC event processing',
    labelNames: ['database', 'operation'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
  });

  // Connection Metrics
  private readonly databaseConnections = new Gauge({
    name: 'database_connections_active',
    help: 'Number of active database connections',
    labelNames: ['database', 'engine']
  });

  private readonly connectionPoolUtilization = new Gauge({
    name: 'connection_pool_utilization_ratio',
    help: 'Connection pool utilization ratio (0-1)',
    labelNames: ['database', 'pool_type']
  });

  // Circuit Breaker Metrics
  private readonly circuitBreakerState = new Gauge({
    name: 'circuit_breaker_state',
    help: 'Circuit breaker state (0=closed, 1=open, 2=half-open)',
    labelNames: ['service', 'operation']
  });

  private readonly circuitBreakerFailures = new Counter({
    name: 'circuit_breaker_failures_total',
    help: 'Total number of circuit breaker failures',
    labelNames: ['service', 'operation']
  });

  constructor() {
    // Enable default metrics collection
    collectDefaultMetrics({ register });
  }

  // Audit Metrics Methods
  recordAuditWrite(database: string, table: string, operation: string, duration?: number): void {
    this.auditWriteTps.inc({ database, table, operation });
    
    if (duration !== undefined) {
      this.auditWriteDuration.observe({ database, table, operation }, duration);
    }
  }

  // Sync Metrics Methods
  setSyncLag(sourceDb: string, targetDb: string, table: string, lagMs: number): void {
    this.syncLagMs.set({ source_db: sourceDb, target_db: targetDb, table }, lagMs);
  }

  recordSyncOperation(
    sourceDb: string, 
    targetDb: string, 
    operation: string, 
    status: 'success' | 'failure',
    duration?: number
  ): void {
    this.syncOperationsTotal.inc({ source_db: sourceDb, target_db: targetDb, operation, status });
    
    if (duration !== undefined) {
      this.syncDuration.observe({ source_db: sourceDb, target_db: targetDb, operation }, duration);
    }
  }

  // Conflict Metrics Methods
  recordConflict(
    sourceDb: string, 
    targetDb: string, 
    table: string, 
    resolutionStrategy: string,
    resolutionDuration?: number
  ): void {
    this.conflictRate.inc({ source_db: sourceDb, target_db: targetDb, table, resolution_strategy: resolutionStrategy });
    
    if (resolutionDuration !== undefined) {
      this.conflictResolutionDuration.observe(
        { strategy: resolutionStrategy, outcome: 'resolved' }, 
        resolutionDuration
      );
    }
  }

  // Queue Metrics Methods
  setQueueDepth(queueName: string, jobType: string, depth: number): void {
    this.queueDepth.set({ queue_name: queueName, job_type: jobType }, depth);
  }

  recordQueueProcessing(
    queueName: string, 
    jobType: string, 
    status: 'success' | 'failure',
    duration: number
  ): void {
    this.queueProcessingDuration.observe(
      { queue_name: queueName, job_type: jobType, status }, 
      duration
    );
  }

  // Error Metrics Methods
  recordError(service: string, operation: string, errorType: string): void {
    this.errorRatio.inc({ service, operation, error_type: errorType });
  }

  // CDC Metrics Methods
  recordCdcEvent(database: string, table: string, operation: string, duration?: number): void {
    this.cdcEventsProcessed.inc({ database, table, operation });
    
    if (duration !== undefined) {
      this.cdcProcessingDuration.observe({ database, operation }, duration);
    }
  }

  // Connection Metrics Methods
  setDatabaseConnections(database: string, engine: string, count: number): void {
    this.databaseConnections.set({ database, engine }, count);
  }

  setConnectionPoolUtilization(database: string, poolType: string, ratio: number): void {
    this.connectionPoolUtilization.set({ database, pool_type: poolType }, ratio);
  }

  // Circuit Breaker Metrics Methods
  setCircuitBreakerState(service: string, operation: string, state: 'closed' | 'open' | 'half-open'): void {
    const stateValue = state === 'closed' ? 0 : state === 'open' ? 1 : 2;
    this.circuitBreakerState.set({ service, operation }, stateValue);
  }

  recordCircuitBreakerFailure(service: string, operation: string): void {
    this.circuitBreakerFailures.inc({ service, operation });
  }

  // Utility Methods
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  getContentType(): string {
    return register.contentType;
  }

  clearMetrics(): void {
    register.clear();
  }

  // Batch metrics update for performance
  updateSyncMetrics(metrics: {
    sourceDb: string;
    targetDb: string;
    table: string;
    lagMs: number;
    operation: string;
    status: 'success' | 'failure';
    duration: number;
  }): void {
    this.setSyncLag(metrics.sourceDb, metrics.targetDb, metrics.table, metrics.lagMs);
    this.recordSyncOperation(
      metrics.sourceDb, 
      metrics.targetDb, 
      metrics.operation, 
      metrics.status, 
      metrics.duration
    );
  }

  // Health check metrics
  recordHealthCheck(service: string, status: 'healthy' | 'unhealthy', responseTime: number): void {
    const healthGauge = new Gauge({
      name: 'service_health_status',
      help: 'Service health status (1=healthy, 0=unhealthy)',
      labelNames: ['service']
    });

    const healthResponseTime = new Histogram({
      name: 'service_health_response_time_seconds',
      help: 'Service health check response time',
      labelNames: ['service', 'status'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
    });

    healthGauge.set({ service }, status === 'healthy' ? 1 : 0);
    healthResponseTime.observe({ service, status }, responseTime);
  }

  // Performance monitoring
  recordPerformanceMetric(
    operation: string, 
    value: number, 
    labels: Record<string, string> = {}
  ): void {
    const performanceGauge = new Gauge({
      name: `performance_${operation}`,
      help: `Performance metric for ${operation}`,
      labelNames: Object.keys(labels)
    });

    performanceGauge.set(labels, value);
  }

  // Custom metric creation
  createCustomCounter(name: string, help: string, labelNames: string[] = []): Counter<string> {
    return new Counter({ name, help, labelNames });
  }

  createCustomGauge(name: string, help: string, labelNames: string[] = []): Gauge<string> {
    return new Gauge({ name, help, labelNames });
  }

  createCustomHistogram(
    name: string, 
    help: string, 
    labelNames: string[] = [],
    buckets?: number[]
  ): Histogram<string> {
    return new Histogram({ name, help, labelNames, buckets });
  }
}