#!/usr/bin/env node
/**
 * Synchronization status monitoring script
 * Provides real-time status of sync operations and queue health
 */

import { createClient } from 'redis';
import { Pool } from 'pg';

interface SyncMetrics {
  queueDepth: number;
  processingRate: number;
  errorRate: number;
  avgLatency: number;
  lastSyncTime: Date | null;
}

interface QueueStatus {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

class SyncStatusMonitor {
  private redis: ReturnType<typeof createClient>;
  private pool: Pool;

  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL,
    });
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  async connect(): Promise<void> {
    await this.redis.connect();
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect();
    await this.pool.end();
  }

  async getQueueStatus(queueName: string): Promise<QueueStatus> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.redis.lLen(`bull:${queueName}:waiting`),
        this.redis.lLen(`bull:${queueName}:active`),
        this.redis.zCard(`bull:${queueName}:completed`),
        this.redis.zCard(`bull:${queueName}:failed`),
        this.redis.zCard(`bull:${queueName}:delayed`),
      ]);

      return {
        name: queueName,
        waiting,
        active,
        completed,
        failed,
        delayed,
      };
    } catch (error) {
      console.error(`Error getting queue status for ${queueName}:`, error);
      return {
        name: queueName,
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      };
    }
  }

  async getSyncMetrics(): Promise<SyncMetrics> {
    try {
      // Get metrics from Redis
      const [
        queueDepthStr,
        processingRateStr,
        errorRateStr,
        avgLatencyStr,
        lastSyncTimeStr,
      ] = await Promise.all([
        this.redis.get('metrics:sync:queue_depth'),
        this.redis.get('metrics:sync:processing_rate'),
        this.redis.get('metrics:sync:error_rate'),
        this.redis.get('metrics:sync:avg_latency'),
        this.redis.get('metrics:sync:last_sync_time'),
      ]);

      return {
        queueDepth: parseInt(queueDepthStr || '0'),
        processingRate: parseFloat(processingRateStr || '0'),
        errorRate: parseFloat(errorRateStr || '0'),
        avgLatency: parseFloat(avgLatencyStr || '0'),
        lastSyncTime: lastSyncTimeStr ? new Date(lastSyncTimeStr) : null,
      };
    } catch (error) {
      console.error('Error getting sync metrics:', error);
      return {
        queueDepth: 0,
        processingRate: 0,
        errorRate: 0,
        avgLatency: 0,
        lastSyncTime: null,
      };
    }
  }

  async getRecentSyncActivity(limit = 10): Promise<any[]> {
    try {
      const { rows } = await this.pool.query(`
        SELECT 
          al.id,
          al.db_engine,
          al.table_name,
          al.operation,
          al.executed_at,
          al.executed_by
        FROM audit_log al
        WHERE al.executed_at >= NOW() - INTERVAL '1 hour'
        ORDER BY al.executed_at DESC
        LIMIT $1
      `, [limit]);

      return rows;
    } catch (error) {
      console.error('Error getting recent sync activity:', error);
      return [];
    }
  }

  async getSyncLag(): Promise<Record<string, number>> {
    try {
      const engines = ['PostgreSQL', 'MySQL', 'MongoDB'];
      const lag: Record<string, number> = {};

      for (const engine of engines) {
        const lagStr = await this.redis.get(`metrics:sync:lag:${engine.toLowerCase()}`);
        lag[engine] = parseFloat(lagStr || '0');
      }

      return lag;
    } catch (error) {
      console.error('Error getting sync lag:', error);
      return {};
    }
  }

  async getHealthStatus(): Promise<{
    overall: 'healthy' | 'warning' | 'critical';
    checks: Record<string, boolean>;
    issues: string[];
  }> {
    const checks: Record<string, boolean> = {};
    const issues: string[] = [];

    try {
      // Check Redis connectivity
      await this.redis.ping();
      checks.redis = true;
    } catch {
      checks.redis = false;
      issues.push('Redis connection failed');
    }

    try {
      // Check PostgreSQL connectivity
      await this.pool.query('SELECT 1');
      checks.postgresql = true;
    } catch {
      checks.postgresql = false;
      issues.push('PostgreSQL connection failed');
    }

    // Check sync metrics
    const metrics = await this.getSyncMetrics();
    checks.queueHealth = metrics.queueDepth < 1000;
    if (!checks.queueHealth) {
      issues.push(`High queue depth: ${metrics.queueDepth}`);
    }

    checks.errorRate = metrics.errorRate < 0.05;
    if (!checks.errorRate) {
      issues.push(`High error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
    }

    checks.recentActivity = metrics.lastSyncTime 
      ? (Date.now() - metrics.lastSyncTime.getTime()) < 300000 // 5 minutes
      : false;
    if (!checks.recentActivity) {
      issues.push('No recent sync activity detected');
    }

    // Determine overall health
    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;
    
    let overall: 'healthy' | 'warning' | 'critical';
    if (healthyChecks === totalChecks) {
      overall = 'healthy';
    } else if (healthyChecks >= totalChecks * 0.7) {
      overall = 'warning';
    } else {
      overall = 'critical';
    }

    return { overall, checks, issues };
  }
}

async function displayStatus(monitor: SyncStatusMonitor) {
  console.clear();
  console.log('🔄 AdminGriffe Sync Status Monitor');
  console.log('=' .repeat(50));
  console.log(`Last updated: ${new Date().toISOString()}\n`);

  // Health Status
  const health = await monitor.getHealthStatus();
  const healthIcon = health.overall === 'healthy' ? '✅' : 
                    health.overall === 'warning' ? '⚠️' : '❌';
  
  console.log(`${healthIcon} Overall Health: ${health.overall.toUpperCase()}`);
  
  if (health.issues.length > 0) {
    console.log('\n🚨 Issues:');
    for (const issue of health.issues) {
      console.log(`  - ${issue}`);
    }
  }

  // Queue Status
  console.log('\n📊 Queue Status:');
  const queues = ['sync', 'audit', 'conflict'];
  for (const queueName of queues) {
    const status = await monitor.getQueueStatus(queueName);
    console.log(`  ${queueName.padEnd(10)}: ${status.waiting} waiting, ${status.active} active, ${status.failed} failed`);
  }

  // Sync Metrics
  console.log('\n📈 Sync Metrics:');
  const metrics = await monitor.getSyncMetrics();
  console.log(`  Queue Depth:     ${metrics.queueDepth.toLocaleString()}`);
  console.log(`  Processing Rate: ${metrics.processingRate.toFixed(2)} ops/sec`);
  console.log(`  Error Rate:      ${(metrics.errorRate * 100).toFixed(2)}%`);
  console.log(`  Avg Latency:     ${metrics.avgLatency.toFixed(2)}ms`);
  console.log(`  Last Sync:       ${metrics.lastSyncTime?.toISOString() || 'Never'}`);

  // Sync Lag
  console.log('\n⏱️  Sync Lag by Engine:');
  const lag = await monitor.getSyncLag();
  for (const [engine, lagMs] of Object.entries(lag)) {
    const lagIcon = lagMs < 100 ? '✅' : lagMs < 500 ? '⚠️' : '❌';
    console.log(`  ${lagIcon} ${engine.padEnd(12)}: ${lagMs.toFixed(2)}ms`);
  }

  // Recent Activity
  console.log('\n📝 Recent Sync Activity:');
  const activity = await monitor.getRecentSyncActivity(5);
  if (activity.length === 0) {
    console.log('  No recent activity');
  } else {
    for (const record of activity) {
      const time = new Date(record.executed_at).toLocaleTimeString();
      console.log(`  ${time} - ${record.db_engine}:${record.table_name} ${record.operation} by ${record.executed_by}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('Press Ctrl+C to exit');
}

async function main() {
  const monitor = new SyncStatusMonitor();
  
  try {
    await monitor.connect();
    
    // Check if we should run in watch mode
    const watchMode = process.argv.includes('--watch') || process.argv.includes('-w');
    
    if (watchMode) {
      console.log('Starting sync status monitor in watch mode...');
      
      // Display status every 5 seconds
      const interval = setInterval(async () => {
        try {
          await displayStatus(monitor);
        } catch (error) {
          console.error('Error updating status:', error);
        }
      }, 5000);
      
      // Initial display
      await displayStatus(monitor);
      
      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        clearInterval(interval);
        console.log('\n\nShutting down monitor...');
        await monitor.disconnect();
        process.exit(0);
      });
      
    } else {
      // Single status check
      await displayStatus(monitor);
      await monitor.disconnect();
    }
    
  } catch (error) {
    console.error('❌ Sync status check failed:', error);
    await monitor.disconnect();
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}