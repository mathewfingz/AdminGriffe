#!/usr/bin/env node
/**
 * Database connectivity check script
 * Verifies connection to all configured databases
 */

import { Pool } from 'pg';
import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';
import { createClient } from 'redis';

interface DatabaseStatus {
  name: string;
  status: 'connected' | 'error';
  latency?: number;
  error?: string;
}

async function checkPostgreSQL(): Promise<DatabaseStatus> {
  const start = Date.now();
  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    await pool.end();
    
    return {
      name: 'PostgreSQL',
      status: 'connected',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'PostgreSQL',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkMySQL(): Promise<DatabaseStatus> {
  const start = Date.now();
  try {
    if (!process.env.MYSQL_URL) {
      return {
        name: 'MySQL',
        status: 'error',
        error: 'MYSQL_URL not configured',
      };
    }

    const connection = await mysql.createConnection(process.env.MYSQL_URL);
    await connection.execute('SELECT 1');
    await connection.end();
    
    return {
      name: 'MySQL',
      status: 'connected',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'MySQL',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkMongoDB(): Promise<DatabaseStatus> {
  const start = Date.now();
  try {
    if (!process.env.MONGODB_URL) {
      return {
        name: 'MongoDB',
        status: 'error',
        error: 'MONGODB_URL not configured',
      };
    }

    const client = new MongoClient(process.env.MONGODB_URL);
    await client.connect();
    await client.db().admin().ping();
    await client.close();
    
    return {
      name: 'MongoDB',
      status: 'connected',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'MongoDB',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkRedis(): Promise<DatabaseStatus> {
  const start = Date.now();
  try {
    const client = createClient({
      url: process.env.REDIS_URL,
    });
    
    await client.connect();
    await client.ping();
    await client.disconnect();
    
    return {
      name: 'Redis',
      status: 'connected',
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      name: 'Redis',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function main() {
  console.log('🔍 Checking database connectivity...\n');
  
  const checks = await Promise.all([
    checkPostgreSQL(),
    checkMySQL(),
    checkMongoDB(),
    checkRedis(),
  ]);
  
  let allHealthy = true;
  
  for (const check of checks) {
    const statusIcon = check.status === 'connected' ? '✅' : '❌';
    const latencyInfo = check.latency ? ` (${check.latency}ms)` : '';
    const errorInfo = check.error ? ` - ${check.error}` : '';
    
    console.log(`${statusIcon} ${check.name}: ${check.status}${latencyInfo}${errorInfo}`);
    
    if (check.status === 'error') {
      allHealthy = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`Overall Status: ${allHealthy ? '✅ All systems operational' : '❌ Some systems have issues'}`);
  
  process.exit(allHealthy ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Database ping failed:', error);
    process.exit(1);
  });
}