#!/usr/bin/env node
/**
 * Comprehensive health check script
 * Verifies all system components are operational
 */

import { Pool } from 'pg';
import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';
import amqp from 'amqplib';

interface HealthCheck {
  component: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  details?: string;
  error?: string;
}

class HealthChecker {
  private results: HealthCheck[] = [];

  async checkPostgreSQL(): Promise<void> {
    const start = Date.now();
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
      });
      
      const client = await pool.connect();
      
      // Test basic connectivity
      await client.query('SELECT 1');
      
      // Test audit table exists
      const auditCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'audit_log'
        );
      `);
      
      client.release();
      await pool.end();
      
      const latency = Date.now() - start;
      
      this.results.push({
        component: 'PostgreSQL',
        status: 'healthy',
        latency,
        details: `Audit table exists: ${auditCheck.rows[0].exists}`,
      });
    } catch (error) {
      this.results.push({
        component: 'PostgreSQL',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async checkMySQL(): Promise<void> {
    if (!process.env.MYSQL_URL) {
      this.results.push({
        component: 'MySQL',
        status: 'degraded',
        details: 'Not configured (optional)',
      });
      return;
    }

    const start = Date.now();
    try {
      const connection = await mysql.createConnection(process.env.MYSQL_URL);
      await connection.execute('SELECT 1');
      await connection.end();
      
      this.results.push({
        component: 'MySQL',
        status: 'healthy',
        latency: Date.now() - start,
      });
    } catch (error) {
      this.results.push({
        component: 'MySQL',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async checkMongoDB(): Promise<void> {
    if (!process.env.MONGODB_URL) {
      this.results.push({
        component: 'MongoDB',
        status: 'degraded',
        details: 'Not configured (optional)',
      });
      return;
    }

    const start = Date.now();
    try {
      const client = new MongoClient(process.env.MONGODB_URL);
      await client.connect();
      await client.db().admin().ping();
      await client.close();
      
      this.results.push({
        component: 'MongoDB',
        status: 'healthy',
        latency: Date.now() - start,
      });
    } catch (error) {
      this.results.push({
        component: 'MongoDB',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async checkRedis(): Promise<void> {
    const start = Date.now();
    try {
      const client = createClient({
        url: process.env.REDIS_URL,
      });
      
      await client.connect();
      await client.ping();
      
      // Test basic operations
      await client.set('health:check', 'ok', { EX: 10 });
      const value = await client.get('health:check');
      
      await client.disconnect();
      
      this.results.push({
        component: 'Redis',
        status: value === 'ok' ? 'healthy' : 'degraded',
        latency: Date.now() - start,
        details: 'Read/write operations successful',
      });
    } catch (error) {
      this.results.push({
        component: 'Redis',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async checkRabbitMQ(): Promise<void> {
    const start = Date.now();
    try {
      const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
      const channel = await connection.createChannel();
      
      // Test queue operations
      await channel.assertQueue('health-check', { durable: false });
      await channel.sendToQueue('health-check', Buffer.from('test'));
      
      await channel.close();
      await connection.close();
      
      this.results.push({
        component: 'RabbitMQ',
        status: 'healthy',
        latency: Date.now() - start,
        details: 'Queue operations successful',
      });
    } catch (error) {
      this.results.push({
        component: 'RabbitMQ',
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async checkEnvironmentVariables(): Promise<void> {
    const requiredVars = [
      'DATABASE_URL',
      'REDIS_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
    ];

    const optionalVars = [
      'MYSQL_URL',
      'MONGODB_URL',
      'KAFKA_BROKERS',
      'AUDIT_SIGNATURE_KEY',
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    const optionalMissing = optionalVars.filter(varName => !process.env[varName]);

    if (missing.length === 0) {
      this.results.push({
        component: 'Environment Variables',
        status: 'healthy',
        details: `All required variables present. Optional missing: ${optionalMissing.join(', ') || 'none'}`,
      });
    } else {
      this.results.push({
        component: 'Environment Variables',
        status: 'unhealthy',
        error: `Missing required variables: ${missing.join(', ')}`,
      });
    }
  }

  async checkAPIEndpoints(): Promise<void> {
    const start = Date.now();
    try {
      const port = process.env.PORT || 3001;
      const response = await fetch(`http://localhost:${port}/health`);
      
      if (response.ok) {
        this.results.push({
          component: 'API Endpoints',
          status: 'healthy',
          latency: Date.now() - start,
          details: `Health endpoint responding on port ${port}`,
        });
      } else {
        this.results.push({
          component: 'API Endpoints',
          status: 'degraded',
          details: `Health endpoint returned ${response.status}`,
        });
      }
    } catch (error) {
      this.results.push({
        component: 'API Endpoints',
        status: 'unhealthy',
        error: 'API not responding or not started',
      });
    }
  }

  async runAllChecks(): Promise<HealthCheck[]> {
    console.log('🏥 Running comprehensive health checks...\n');

    await Promise.all([
      this.checkEnvironmentVariables(),
      this.checkPostgreSQL(),
      this.checkMySQL(),
      this.checkMongoDB(),
      this.checkRedis(),
      this.checkRabbitMQ(),
      this.checkAPIEndpoints(),
    ]);

    return this.results;
  }

  generateReport(): {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    summary: string;
    details: HealthCheck[];
  } {
    const healthy = this.results.filter(r => r.status === 'healthy').length;
    const degraded = this.results.filter(r => r.status === 'degraded').length;
    const unhealthy = this.results.filter(r => r.status === 'unhealthy').length;
    const total = this.results.length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (unhealthy === 0 && degraded === 0) {
      overall = 'healthy';
    } else if (unhealthy === 0) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    const summary = `${healthy}/${total} components healthy, ${degraded} degraded, ${unhealthy} unhealthy`;

    return {
      overall,
      summary,
      details: this.results,
    };
  }
}

function displayResults(report: ReturnType<HealthChecker['generateReport']>) {
  console.log('📊 Health Check Results');
  console.log('=' .repeat(50));
  
  const overallIcon = report.overall === 'healthy' ? '✅' : 
                     report.overall === 'degraded' ? '⚠️' : '❌';
  
  console.log(`${overallIcon} Overall Status: ${report.overall.toUpperCase()}`);
  console.log(`📈 Summary: ${report.summary}\n`);

  console.log('Component Details:');
  console.log('-'.repeat(50));

  for (const check of report.details) {
    const icon = check.status === 'healthy' ? '✅' : 
                check.status === 'degraded' ? '⚠️' : '❌';
    
    const latencyInfo = check.latency ? ` (${check.latency}ms)` : '';
    console.log(`${icon} ${check.component.padEnd(20)} ${check.status}${latencyInfo}`);
    
    if (check.details) {
      console.log(`   ℹ️  ${check.details}`);
    }
    
    if (check.error) {
      console.log(`   ❌ ${check.error}`);
    }
    
    console.log();
  }

  console.log('=' .repeat(50));
  
  if (report.overall === 'healthy') {
    console.log('🎉 All systems operational! Ready for production.');
  } else if (report.overall === 'degraded') {
    console.log('⚠️  System operational with some optional components unavailable.');
  } else {
    console.log('🚨 Critical issues detected. Please resolve before proceeding.');
  }
}

async function main() {
  const checker = new HealthChecker();
  
  try {
    await checker.runAllChecks();
    const report = checker.generateReport();
    
    displayResults(report);
    
    // Exit with appropriate code
    process.exit(report.overall === 'unhealthy' ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}