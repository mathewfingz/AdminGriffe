import { SyncMetrics, DatabaseSource } from '../types';
import { logger } from '../utils/logger';

export class MetricsService {
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

  constructor() {
    // Start metrics collection interval
    setInterval(() => {
      this.calculateDerivedMetrics();
      this.cleanupOldSamples();
    }, 5000); // Update every 5 seconds
  }

  recordEvent(source: DatabaseSource, operation: string): void {
    this.metrics.totalEvents++;
    this.eventTimestamps.push(Date.now());
    
    logger.debug(`📊 Event recorded: ${source}.${operation} (Total: ${this.metrics.totalEvents})`);
  }

  recordSyncSuccess(latencyMs: number): void {
    this.metrics.successfulSyncs++;
    this.metrics.lastSyncTimestamp = new Date();
    this.syncLatencies.push(latencyMs);
    
    // Keep only recent latencies
    if (this.syncLatencies.length > this.maxSamples) {
      this.syncLatencies.shift();
    }
    
    logger.debug(`✅ Sync success recorded: ${latencyMs}ms (Total: ${this.metrics.successfulSyncs})`);
  }

  recordSyncFailure(error: Error): void {
    this.metrics.failedSyncs++;
    
    logger.warn(`❌ Sync failure recorded: ${error.message} (Total: ${this.metrics.failedSyncs})`);
  }

  recordConflictDetected(): void {
    this.metrics.conflictsDetected++;
    
    logger.info(`⚠️ Conflict detected (Total: ${this.metrics.conflictsDetected})`);
  }

  recordConflictResolved(): void {
    this.metrics.conflictsResolved++;
    
    logger.info(`✅ Conflict resolved (Total: ${this.metrics.conflictsResolved})`);
  }

  updateQueueDepth(depth: number): void {
    this.metrics.queueDepth = depth;
  }

  getMetrics(): SyncMetrics {
    return { ...this.metrics };
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

  // Prometheus-compatible metrics export
  exportPrometheusMetrics(): string {
    const metrics = this.getDetailedMetrics();
    
    return `
# HELP sync_total_events Total number of CDC events processed
# TYPE sync_total_events counter
sync_total_events ${metrics.totalEvents}

# HELP sync_successful_syncs Total number of successful synchronizations
# TYPE sync_successful_syncs counter
sync_successful_syncs ${metrics.successfulSyncs}

# HELP sync_failed_syncs Total number of failed synchronizations
# TYPE sync_failed_syncs counter
sync_failed_syncs ${metrics.failedSyncs}

# HELP sync_conflicts_detected Total number of conflicts detected
# TYPE sync_conflicts_detected counter
sync_conflicts_detected ${metrics.conflictsDetected}

# HELP sync_conflicts_resolved Total number of conflicts resolved
# TYPE sync_conflicts_resolved counter
sync_conflicts_resolved ${metrics.conflictsResolved}

# HELP sync_avg_latency_ms Average synchronization latency in milliseconds
# TYPE sync_avg_latency_ms gauge
sync_avg_latency_ms ${metrics.avgSyncLatency}

# HELP sync_queue_depth Current queue depth
# TYPE sync_queue_depth gauge
sync_queue_depth ${metrics.queueDepth}

# HELP sync_error_rate Current error rate (0-1)
# TYPE sync_error_rate gauge
sync_error_rate ${metrics.errorRate}

# HELP sync_throughput_per_second Current throughput in events per second
# TYPE sync_throughput_per_second gauge
sync_throughput_per_second ${metrics.throughputPerSecond}

# HELP sync_p95_latency_ms 95th percentile latency in milliseconds
# TYPE sync_p95_latency_ms gauge
sync_p95_latency_ms ${metrics.detailed.p95Latency}

# HELP sync_p99_latency_ms 99th percentile latency in milliseconds
# TYPE sync_p99_latency_ms gauge
sync_p99_latency_ms ${metrics.detailed.p99Latency}

# HELP sync_success_rate Success rate (0-1)
# TYPE sync_success_rate gauge
sync_success_rate ${metrics.detailed.successRate}
`.trim();
  }
}