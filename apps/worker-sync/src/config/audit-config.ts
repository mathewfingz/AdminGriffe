import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Audit System Configuration Schema
const auditConfigSchema = z.object({
  // Database Connections
  POSTGRES_URL: z.string().min(1, 'PostgreSQL URL is required'),
  MYSQL_URL: z.string().min(1, 'MySQL URL is required'),
  MONGODB_URL: z.string().min(1, 'MongoDB URL is required'),
  
  // Kafka Configuration
  KAFKA_BROKERS: z.string().min(1, 'Kafka brokers are required'),
  KAFKA_CLIENT_ID: z.string().default('audit-system'),
  KAFKA_GROUP_ID: z.string().default('audit-consumers'),
  
  // Redis Configuration
  REDIS_URL: z.string().min(1, 'Redis URL is required'),
  REDIS_CLUSTER_NODES: z.string().optional(),
  
  // RabbitMQ Configuration
  RABBITMQ_URL: z.string().min(1, 'RabbitMQ URL is required'),
  
  // Audit Configuration
  AUDIT_RETENTION_DAYS: z.coerce.number().default(2555), // 7 years
  AUDIT_BATCH_SIZE: z.coerce.number().default(1000),
  AUDIT_FLUSH_INTERVAL_MS: z.coerce.number().default(5000),
  
  // Sync Configuration
  SYNC_LAG_THRESHOLD_MS: z.coerce.number().default(100),
  SYNC_RETRY_ATTEMPTS: z.coerce.number().default(5),
  SYNC_RETRY_DELAY_MS: z.coerce.number().default(500),
  
  // Security Configuration
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),
  SIGNING_KEY: z.string().min(32, 'Signing key must be at least 32 characters'),
  
  // Performance Configuration
  MAX_TPS: z.coerce.number().default(10000),
  CIRCUIT_BREAKER_THRESHOLD: z.coerce.number().default(5),
  CIRCUIT_BREAKER_TIMEOUT_MS: z.coerce.number().default(60000),
  
  // Monitoring Configuration
  PROMETHEUS_PORT: z.coerce.number().default(9090),
  GRAFANA_PORT: z.coerce.number().default(3000),
  HEALTH_CHECK_INTERVAL_MS: z.coerce.number().default(30000),
  
  // Environment
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type AuditConfig = z.infer<typeof auditConfigSchema>;

// Parse and validate configuration
export const auditConfig = auditConfigSchema.parse({
  POSTGRES_URL: process.env.POSTGRES_URL,
  MYSQL_URL: process.env.MYSQL_URL,
  MONGODB_URL: process.env.MONGODB_URL,
  KAFKA_BROKERS: process.env.KAFKA_BROKERS,
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID,
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID,
  REDIS_URL: process.env.REDIS_URL,
  REDIS_CLUSTER_NODES: process.env.REDIS_CLUSTER_NODES,
  RABBITMQ_URL: process.env.RABBITMQ_URL,
  AUDIT_RETENTION_DAYS: process.env.AUDIT_RETENTION_DAYS,
  AUDIT_BATCH_SIZE: process.env.AUDIT_BATCH_SIZE,
  AUDIT_FLUSH_INTERVAL_MS: process.env.AUDIT_FLUSH_INTERVAL_MS,
  SYNC_LAG_THRESHOLD_MS: process.env.SYNC_LAG_THRESHOLD_MS,
  SYNC_RETRY_ATTEMPTS: process.env.SYNC_RETRY_ATTEMPTS,
  SYNC_RETRY_DELAY_MS: process.env.SYNC_RETRY_DELAY_MS,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  SIGNING_KEY: process.env.SIGNING_KEY,
  MAX_TPS: process.env.MAX_TPS,
  CIRCUIT_BREAKER_THRESHOLD: process.env.CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_TIMEOUT_MS: process.env.CIRCUIT_BREAKER_TIMEOUT_MS,
  PROMETHEUS_PORT: process.env.PROMETHEUS_PORT,
  GRAFANA_PORT: process.env.GRAFANA_PORT,
  HEALTH_CHECK_INTERVAL_MS: process.env.HEALTH_CHECK_INTERVAL_MS,
  NODE_ENV: process.env.NODE_ENV,
  LOG_LEVEL: process.env.LOG_LEVEL,
});

// Database Engine Types
export enum DatabaseEngine {
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  MONGODB = 'mongodb',
}

// Audit Operation Types
export enum AuditOperation {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  SELECT = 'SELECT',
}

// Sync Status Types
export enum SyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CONFLICT = 'CONFLICT',
}

// Conflict Resolution Strategies
export enum ConflictResolution {
  SOURCE_WINS = 'SOURCE_WINS',
  DESTINATION_WINS = 'DESTINATION_WINS',
  TIMESTAMP_WINS = 'TIMESTAMP_WINS',
  MANUAL = 'MANUAL',
}

export default auditConfig;